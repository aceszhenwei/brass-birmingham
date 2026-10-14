// Assignment 15: experimental opponent models for the four-action planner
// (docs/research/ai-opponent-modelling-a15.md). Research only: the game never
// loads this file, and no production configuration uses a model.
//
// A model plugs into AIPlanner.plan through cfg.opponentModel (see
// js/aiPlanner.js). It only ever sees the planning player's observation
// (state.getObservation): opponents' hands, the deck order and face-down
// discards are placeholders there. Where a model needs opponents' cards it
// samples them from the cards the player cannot see, which are derived from
// public information only: the deck list for the player count, minus the
// player's own hand and every face-up discard of the era. The sampling seed is
// built from public information too, so the model's choices cannot depend on
// hidden cards.
//
// Steps of the player's plan inside the current turn are never touched: no
// opponent can act before them. Only steps after the current turn (planned
// for the player's next turn) are affected, and only by the opponents' turns
// that come first: the opponents still to play this round, then those ahead
// of the player in the projected next-round order (getNextRoundTurnOrder).
//
//   M1 'contest'   Each next-turn Build or Network step is weighted by the
//                  chance that no opponent takes its space or link first:
//                  the product over the opponent turns before the player's
//                  next one of (1 - q * e), where e is that opponent's
//                  exposure: 0 if the target is not legal for them ignoring
//                  cards (network, money, tiles, era), else the chance that a
//                  hand of their size drawn from the unseen cards holds a card
//                  that allows it (any card for a link; for a build a location
//                  card for that place, or an industry card for the slot's
//                  industries when the place is in their network). q is fitted
//                  per step type on diagnostic self-play.
//   M2 'simulate'  Before the player's next turn, each opponent turn in order
//                  is played out by the heuristic AI (Normal) on a copy of the
//                  observation with sampled hands. The player's next-turn
//                  steps are then planned on the resulting board (opponent
//                  moves that the player's own actions this turn made illegal
//                  are skipped).
//   M3 'robust'    As M2 with K independent hand samples (K scenarios); a
//                  plan's next-turn value is the mean of the scenario values
//                  averaged with their minimum, favouring plans that keep their
//                  value whichever scenario happens.

'use strict';

// Per-opponent-turn take rates of M1, fitted by maximum likelihood on the
// stage 1 diagnostic games (ai-opponents.js; the report, section 3) and then
// frozen. Builds: exposure did not predict takes (q = 0). Overridable with
// options.q.
const DEFAULT_Q = { build: 0, network: 0.29 };

function createOpponentModel(E, options = {}) {
    const kind = options.kind;
    if (!['contest', 'simulate', 'robust'].includes(kind)) throw new Error(`unknown opponent model ${kind}`);
    const q = { ...DEFAULT_Q, ...(options.q || {}) };
    const K = kind === 'robust' ? (options.scenarios || 3) : 1;
    const isWild = (c) => c.type === E.CARD_TYPES.WILD_LOCATION || c.type === E.CARD_TYPES.WILD_INDUSTRY;

    const model = {
        kind,
        prepare(obs, logic, playerId) {
            const ctx = { playerId, turns: opponentTurns(obs, playerId) };
            if (kind === 'contest') {
                ctx.root = obs;
                ctx.rootLogic = logic;
                ctx.cache = new Map();
                ctx.unseen = unseenCards(obs, playerId);
            } else {
                ctx.worlds = [];
                const rng = new E.SeededRandom(publicSeed(obs, playerId));
                for (let k = 0; k < K; k++) ctx.worlds.push(predictWorld(obs, playerId, ctx.turns, rng));
            }
            return ctx;
        },
    };
    if (kind === 'contest') {
        model.stepWeight = (move, ctx) => {
            const key = targetKey(move);
            if (!key) return 1;
            if (!ctx.cache.has(key)) ctx.cache.set(key, exposures(ctx, move));
            const qt = q[move.type === E.ACTIONS.BUILD ? 'build' : 'network'];
            return ctx.cache.get(key).reduce((w, e) => w * (1 - qt * e), 1);
        };
    } else {
        model.scenarios = (state, ctx) => ctx.worlds.map(w => applyWorld(state, w));
        model.combine = (values) => {
            if (values.length === 1) return values[0];
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            return (mean + Math.min(...values)) / 2;
        };
    }

    // ------------------------------------------------------------------
    // Public information
    // ------------------------------------------------------------------

    // The opponents' turns before the player's next one, in order: those still
    // to play this round, then those ahead in the projected next-round order.
    // Next-round order follows money spent this round (least first); players
    // still to act this round, the player included, are assumed to spend the
    // mean of those who have acted (ties keep the current order, as the engine
    // does). (In the era's last round the planner does not look beyond the
    // turn, so the next round is always in the same era.)
    function opponentTurns(obs, playerId) {
        const order = obs.turnOrder;
        const me = order.indexOf(playerId);
        const rest = order.slice(me + 1);
        const acted = order.slice(0, me);
        const spent = (id) => obs.moneySpentThisRound[id] || 0;
        const assumed = acted.length ? acted.reduce((a, id) => a + spent(id), 0) / acted.length : 0;
        const projected = (id) => (acted.includes(id) ? spent(id) : assumed);
        const next = [...order].sort((a, b) => projected(a) - projected(b));
        return [...rest, ...next.slice(0, next.indexOf(playerId))];
    }

    // A seed from what every player can see, so hidden cards cannot change it
    function publicSeed(obs, playerId) {
        let h = 2166136261;
        const mix = (x) => { h = Math.imul(h ^ (x & 0xffffffff), 16777619) >>> 0; };
        mix(playerId); mix(obs.round); mix(obs.era === E.ERA.RAIL ? 1 : 0); mix(obs.actionsThisTurn); mix(obs.drawDeck.length);
        for (const p of obs.players) { mix(p.money); mix(p.vp); mix(p.hand.length); mix(p.discardPile.length); }
        mix(Object.keys(obs.boardIndustries).length); mix(Object.keys(obs.boardLinks).length);
        return h;
    }

    // The non-wild cards the player cannot see: the deck list for the player
    // count, minus the player's hand and the face-up discards of the era
    function unseenCards(obs, playerId) {
        const deck = E.CARD_DECK[obs.numPlayers];
        const cards = [];
        for (const [location, n] of Object.entries(deck.locations)) for (let i = 0; i < n; i++) cards.push({ type: E.CARD_TYPES.LOCATION, location, name: E.CITIES[location] ? E.CITIES[location].name : location });
        for (const [t, n] of Object.entries(deck.industries)) for (let i = 0; i < n; i++) cards.push({ type: E.CARD_TYPES.INDUSTRY, industryTypes: [t], name: t });
        for (let i = 0; i < (deck.dualCottonManufacturer || 0); i++) cards.push({ type: E.CARD_TYPES.INDUSTRY, industryTypes: [E.INDUSTRY_TYPES.COTTON_MILL, E.INDUSTRY_TYPES.MANUFACTURER], name: 'dual' });
        const key = (c) => (c.type === E.CARD_TYPES.LOCATION ? `l:${c.location}` : `i:${(c.industryTypes || []).join('/')}`);
        const seen = [...obs.players[playerId].hand.filter(c => !isWild(c)),
            ...obs.players.flatMap(p => p.discardPile.filter(c => c.type !== 'hidden' && !isWild(c)))];
        for (const c of seen) {
            const i = cards.findIndex(x => key(x) === key(c));
            if (i >= 0) cards.splice(i, 1);
        }
        return cards;
    }

    // ------------------------------------------------------------------
    // M1: opponent turns that could take a step's target
    // ------------------------------------------------------------------

    function targetKey(move) {
        if (move.type === E.ACTIONS.BUILD) return `b:${move.location}:${move.slot}`;
        if (move.type === E.ACTIONS.NETWORK) return `n:${move.links.join('+')}`;
        return null;
    }

    // One exposure per opponent turn before the player's next one
    function exposures(ctx, move) {
        const each = new Map();
        return ctx.turns.map(opp => {
            if (!each.has(opp)) each.set(opp, exposure(ctx, opp, move));
            return each.get(opp);
        });
    }

    function exposure(ctx, opp, move) {
        const { root: state, rootLogic: logic, unseen } = ctx;
        const handSize = state.players[opp].hand.length;
        if (handSize === 0) return 0;
        if (move.type === E.ACTIONS.NETWORK) {
            const targets = new Set(logic.getValidNetworkTargets(opp).map(t => t.connectionId));
            return move.links.some(l => targets.has(l)) ? 1 : 0;
        }
        const types = E.isBreweryFarm(move.location) ? [E.INDUSTRY_TYPES.BREWERY] : E.CITIES[move.location].slots[move.slot];
        // Legal ignoring cards: on a copy where the opponent holds only a wild
        // location card (their real hand is hidden: placeholders here)
        const copy = state.clone();
        copy.players[opp].hand = [{ type: E.CARD_TYPES.WILD_LOCATION, name: 'wild' }];
        const copyLogic = new E.GameLogic(copy);
        const legal = types.filter(t => copyLogic.resolveMove(opp, { type: E.ACTIONS.BUILD, location: move.location, slot: move.slot, industry: t }, { requireCard: false }).ok);
        if (!legal.length) return 0;
        const industryOk = state.isInNetwork(opp, move.location) || logic.playerHasNoTilesOnBoard(opp);
        const fits = (c) => (c.type === E.CARD_TYPES.LOCATION ? c.location === move.location
            : industryOk && (c.industryTypes || []).some(t => legal.includes(t)));
        const m = unseen.filter(fits).length;
        return 1 - noneDrawn(unseen.length, m, handSize);
    }

    // Chance that none of m marked cards is among h drawn from u
    function noneDrawn(u, m, h) {
        if (m <= 0) return 1;
        let p = 1;
        for (let i = 0; i < Math.min(h, u); i++) p *= Math.max(0, (u - m - i) / (u - i));
        return p;
    }

    // ------------------------------------------------------------------
    // M2 / M3: predicted opponent turns on a sampled world
    // ------------------------------------------------------------------

    // Sample the opponents' hands from the unseen cards and let each opponent
    // turn in order be played by the heuristic. Returns the sampled hands and
    // the moves, to be replayed onto the player's hypothetical positions.
    function predictWorld(obs, playerId, turns, rng) {
        const pool = unseenCards(obs, playerId);
        for (let i = pool.length - 1; i > 0; i--) {
            const j = rng.int(i + 1);
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        const world = obs.clone();
        const hands = {};
        for (const p of world.players) {
            if (p.id === playerId) continue;
            p.hand = pool.splice(0, p.hand.length);
            hands[p.id] = p.hand.map(c => ({ ...c }));
        }
        const logic = new E.GameLogic(world);
        const moves = [];
        const actions = world.actionsPerTurn;
        for (const opp of turns) {
            for (let a = 0; a < actions && world.players[opp].hand.length > 0; a++) {
                const d = E.AIPlayer.chooseAction(world, logic, opp, 'normal', new E.SeededRandom(rng.int(1 << 30)));
                if (!d) break;
                const move = logic.moveFromDecision(d);
                if (!logic.applyMove(opp, move).success) break;
                moves.push({ opp, move });
            }
        }
        return { hands, moves };
    }

    // The player's hypothetical position with the predicted opponent turns
    // played on it. A move the player's own actions made illegal is skipped
    // (its card is set aside so later card indices still match).
    function applyWorld(state, world) {
        const s = state.clone();
        for (const [id, hand] of Object.entries(world.hands)) s.players[id].hand = hand.map(c => ({ ...c }));
        const l = new E.GameLogic(s);
        for (const { opp, move } of world.moves) {
            if (l.applyMove(opp, move).success) continue;
            const used = move.cards ? [...move.cards] : (move.card !== undefined ? [move.card] : []);
            for (const i of used.sort((a, b) => b - a)) s.players[opp].hand.splice(i, 1);
        }
        return { state: s, logic: l };
    }

    model.research = { opponentTurns, unseenCards, publicSeed, predictWorld, applyWorld, targetKey,
        exposures: (obs, logic, playerId, move) => exposures({ root: obs, rootLogic: logic, unseen: unseenCards(obs, playerId), turns: opponentTurns(obs, playerId) }, move) };
    return model;
}

module.exports = { createOpponentModel, DEFAULT_Q };
