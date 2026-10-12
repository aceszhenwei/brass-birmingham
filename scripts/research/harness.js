// Research harness for the Assignment 5 AI audit (docs/research/).
//
// Plays complete games through the engine (getCurrentDecision / play) with a
// chosen policy at each seat, and records per-player statistics. It never
// changes the AI: the existing AIPlayer.chooseAction is called exactly as the
// UI calls it. The two "hard" variants only change what the AI is shown
// while it decides (see POLICIES), and the real state is restored before the
// move is played.
//
//   const { playMatch } = require('./harness');
//   playMatch(E, { players: 3, seed: 7, seats: ['easy', 'normal', 'hard'] });

'use strict';

const { checkInvariants } = require('../../test/helpers/invariants');

const aiSeedFor = (seed) => (seed ^ 0x9E3779B9) >>> 0;
const isWild = (E, c) => c.type === E.CARD_TYPES.WILD_LOCATION || c.type === E.CARD_TYPES.WILD_INDUSTRY;

// ---------------------------------------------------------------------------
// Hidden-information views
// ---------------------------------------------------------------------------

// Run fn() while every opponent's hand is replaced: 'empty' (no cards) or
// 'resample' (the same number of cards drawn at random from the cards this
// player cannot see: the draw deck plus the opponents' non-wild cards).
// Wild cards stay where they are, because taking one (Scout) is public.
// The real hands are always restored.
function withOpponentHands(E, state, playerId, mode, rng, fn) {
    const saved = state.players.map(p => p.hand);
    try {
        const opponents = state.players.filter(p => p.id !== playerId);
        if (mode === 'empty') {
            for (const p of opponents) p.hand = [];
        } else {
            const pool = [...state.drawDeck, ...opponents.flatMap(p => p.hand.filter(c => !isWild(E, c)))];
            for (let i = pool.length - 1; i > 0; i--) {
                const j = rng.int(i + 1);
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            for (const p of opponents) {
                const wild = p.hand.filter(c => isWild(E, c));
                p.hand = [...wild, ...pool.splice(0, p.hand.length - wild.length)];
            }
        }
        return fn();
    } finally {
        state.players.forEach((p, i) => { p.hand = saved[i]; });
    }
}

// ---------------------------------------------------------------------------
// Policies: (ctx, decision) -> move
// ---------------------------------------------------------------------------

// variant: AIPlayer.chooseAction options (null = the current AI)
function aiPolicy(level, variant = null, handMode = null) {
    return (ctx, d) => {
        const { E, state, logic, aiRng, viewRng } = ctx;
        const opts = typeof variant === 'function' ? variant(E) : variant;
        const choose = () => E.AIPlayer.chooseAction(state, logic, d.playerId, level, aiRng, opts);
        const decision = handMode ? withOpponentHands(E, state, d.playerId, handMode, viewRng, choose) : choose();
        return logic.moveFromDecision(decision);
    };
}

// Uniform over move TYPES, then uniform over the legal moves of that type
// (choices completed by the engine's defaults). A floor, not an opponent.
function randomPolicy(ctx, d) {
    const moves = ctx.logic.getLegalMoves(d.playerId);
    const types = [...new Set(moves.map(m => m.type))];
    const type = types[ctx.viewRng.int(types.length)];
    const ofType = moves.filter(m => m.type === type);
    return ofType[ctx.viewRng.int(ofType.length)];
}

// AI variants. For each level:
//   <level>           the current production AI
//   <level>~a6        the AI of Assignments 6-7 (AIPlayer.LEGACY_A6)
//   <level>-a5        the Assignment 5 baseline, AIPlayer.LEGACY_A5: reads
//                     opponents' hands (Hard) and uses the old rounds estimate
//   <level>-fairinfo  the baseline with ONLY the information correction
//   <level>-rounds    the baseline with ONLY the rounds correction
const LEGACY = (E) => E.AIPlayer.LEGACY_A5;
// (Assignment 6 variants keep the overbuild scoring of their time)
const FAIR_INFO_ONLY = { information: 'player', rounds: 'deck-estimate', overbuild: 'a6' };
const ROUNDS_ONLY = { information: 'full', rounds: 'engine', overbuild: 'a6' };

const POLICIES = { random: randomPolicy };
for (const level of ['easy', 'normal', 'hard']) {
    POLICIES[level] = aiPolicy(level);
    POLICIES[`${level}-a5`] = aiPolicy(level, LEGACY);
    POLICIES[`${level}-fairinfo`] = aiPolicy(level, FAIR_INFO_ONLY);
    POLICIES[`${level}-rounds`] = aiPolicy(level, ROUNDS_ONLY);
}
// Assignment 5 ablations of the baseline Hard (what it is SHOWN changes, not
// its code): every opponent hand hidden, so its denial bonus sees no cards...
POLICIES['hard-blind'] = aiPolicy('hard', LEGACY, 'empty');
// ...or a plausible (resampled) opponent hand instead of the real one
POLICIES['hard-fair'] = aiPolicy('hard', LEGACY, 'resample');
// Loan-scoring variants (Assignment 7, js/aiPlayer.js options.loan), on the
// AI of that time (Assignment 6 overbuild scoring): <level>+a6 (the
// Assignment 6 loan heuristic), +cashflow, +enabling, +cashflow+enabling,
// and +never (a no-loan ablation)
for (const level of ['easy', 'normal', 'hard']) {
    for (const loan of ['a6', 'cashflow', 'enabling', 'cashflow+enabling', 'never']) {
        POLICIES[`${level}+${loan}`] = aiPolicy(level, { loan, overbuild: 'a6' });
    }
}
// Overbuild-scoring variants (Assignment 8, options.overbuild): <level>~a6
// (the AI of Assignments 6-7), ~opportunity (adopted: the production AI
// since Assignment 8), ~opportunity-unflipped, ~no-unflipped
for (const level of ['easy', 'normal', 'hard']) {
    for (const overbuild of ['a6', 'opportunity', 'opportunity-unflipped', 'no-unflipped']) {
        POLICIES[`${level}~${overbuild}`] = aiPolicy(level, { overbuild });
    }
}
const levelOf = (policy) => {
    const level = policy.split(/[-+~]/)[0];
    return ['easy', 'normal', 'hard'].includes(level) ? level : 'hard';
};

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

function newStats() {
    return {
        actions: { build: 0, network: 0, develop: 0, sell: 0, loan: 0, scout: 0, pass: 0 },
        builds: { canal: {}, rail: {} },
        buildLevelSum: 0,
        overbuildOwn: 0,               // builds replacing one of the player's own tiles...
        overbuildOwnUnflipped: 0,      // ...that had not yet been flipped (scored nothing)
        overbuildOpponent: 0,
        developTiles: 0,
        tilesSold: 0,
        merchantBonuses: 0,
        links: { canal: 0, rail: 0 },
        shortfallSales: 0,
        shortfallFlippedSold: 0,       // flipped (scoring) tiles sold to cover a shortfall
        shortfallVPLost: 0,            // VP lost when no tiles were left to sell
        coal: { own: 0, opponent: 0, market: 0 },
        iron: { own: 0, opponent: 0, market: 0 },
        beer: { own: 0, opponent: 0 },
        passWithOptions: 0,            // passed although Build/Network/Develop/Sell was legal
        nonBuildDiscards: 0,
        playableDiscards: 0,           // ...that threw away a card playable for a build now,
                                       //    while holding a non-wild card playable for none
        canal: null,
        rail: null,
    };
}

// Snapshot of one player's tiles and money just before an era is scored
function eraSnapshot(state, playerId) {
    const tiles = [...Object.values(state.boardIndustries), ...Object.values(state.breweryFarmTiles)]
        .filter(t => t && t.playerId === playerId);
    return {
        money: state.players[playerId].money,
        tiles: tiles.length,
        unflipped: tiles.filter(t => !t.flipped).length,
        unflippedSellable: tiles.filter(t => !t.flipped && ['cottonMill', 'manufacturer', 'pottery'].includes(t.type)).length,
        level1: tiles.filter(t => t.tileData.level === 1).length,
    };
}

function sourceOwner(state, playerId, src) {
    if (src === 'market') return 'market';
    const key = src.slice(src.indexOf(':') + 1);
    const tile = key.startsWith('farm_') ? state.breweryFarmTiles[key.slice(5)] : state.boardIndustries[key];
    return tile && tile.playerId === playerId ? 'own' : 'opponent';
}

// Cards in hand that could pay for at least one legal build right now
function playableBuildCards(E, logic, playerId) {
    const playable = new Set();
    for (const t of logic.getValidBuildTargets(playerId)) {
        for (const i of logic.getValidCardsForAction(playerId, E.ACTIONS.BUILD, t)) playable.add(i);
    }
    return playable;
}

// Record what a move did, BEFORE it is played (sources are still on the board)
function recordMove(E, state, logic, playerId, move, s, { detailed }) {
    const A = E.ACTIONS;
    if (move.type === 'shortfall') {
        s.shortfallSales++;
        const tile = state.boardIndustries[move.tile] || state.breweryFarmTiles[move.tile];
        if (tile && tile.flipped) s.shortfallFlippedSold++;
        return;
    }
    s.actions[move.type]++;
    const hand = state.players[playerId].hand;
    if (detailed && move.type !== A.BUILD && move.type !== A.SCOUT) {
        const playable = playableBuildCards(E, logic, playerId);
        s.nonBuildDiscards++;
        const deadCard = hand.some((c, i) => !isWild(E, c) && !playable.has(i));
        if (playable.has(move.card) && deadCard) s.playableDiscards++;
    }
    if (move.type === A.PASS && detailed) {
        if ([A.BUILD, A.NETWORK, A.DEVELOP, A.SELL].some(a => logic.canPerformAction(a, playerId))) s.passWithOptions++;
    }
    if (move.type === A.BUILD) {
        const era = state.era;
        s.builds[era][move.industry] = (s.builds[era][move.industry] || 0) + 1;
        const next = state.getNextTile(playerId, move.industry);
        s.buildLevelSum += next ? next.level : 0;
        const existing = E.isBreweryFarm(move.location) ? state.breweryFarmTiles[move.location]
            : state.boardIndustries[`${move.location}_${move.slot}`];
        if (existing && existing.playerId === playerId) {
            s.overbuildOwn++;
            if (!existing.flipped) s.overbuildOwnUnflipped++;
        } else if (existing) {
            s.overbuildOpponent++;
        }
    }
    if (move.type === A.NETWORK) s.links[state.era === 'canal' ? 'canal' : 'rail'] += move.links.length;
    if (move.type === A.DEVELOP) s.developTiles += move.industries.length;
    if (move.type === A.SELL) {
        s.tilesSold += move.sales.length;
        for (const sale of move.sales) {
            if (sale.merchant !== undefined && sale.merchant !== 'none') s.merchantBonuses++;
            for (const b of sale.beer || []) {
                s.beer[sourceOwner(state, playerId, b)]++;
            }
        }
    }
    for (const kind of ['coal', 'iron']) {
        for (const src of move[kind] || []) s[kind][sourceOwner(state, playerId, src)]++;
    }
}

// ---------------------------------------------------------------------------
// One game
// ---------------------------------------------------------------------------

// seats: one policy name per seat. detailed: also collect the per-decision
// probes (slower). Returns { players, seed, seats, startPosition, stats,
// final, ranking, moves }.
function playMatch(E, { players, seed, seats, detailed = true, checkInvariantsEveryMove = false, trace = null }) {
    const names = ['A', 'B', 'C', 'D'].slice(0, players);
    if (seats.some(p => !POLICIES[p])) throw new Error(`unknown policy in ${seats.join(',')}`);
    const aiConfig = seats.map(p => ({ isAI: true, difficulty: levelOf(p) }));
    const state = new E.GameState(players, names, aiConfig, { seed });
    const logic = new E.GameLogic(state);
    const ctx = {
        E, state, logic,
        aiRng: new E.SeededRandom(aiSeedFor(seed)),      // as the UI seeds it
        viewRng: new E.SeededRandom((seed * 2654435761 + 12345) >>> 0),
    };
    const stats = seats.map(() => newStats());
    const startPosition = seats.map((_, id) => state.turnOrder.indexOf(id));

    // Snapshot each era just before it is scored
    for (const [method, key] of [['endCanalEra', 'canal'], ['endGame', 'rail']]) {
        const original = state[method].bind(state);
        state[method] = () => {
            state.players.forEach(p => { stats[p.id][key] = eraSnapshot(state, p.id); });
            const scores = original();
            for (const sc of scores) Object.assign(stats[sc.playerId][key], { linkVP: sc.linkVP, industryVP: sc.industryVP, vpAfter: sc.totalVP });
            return scores;
        };
    }

    const loseVP = state.loseVPForShortfall.bind(state);
    state.loseVPForShortfall = (player) => {
        const before = player.vp;
        const message = loseVP(player);
        stats[player.id].shortfallVPLost += before - player.vp;
        return message;
    };

    let moves = 0;
    for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
        if (++moves > 5000) throw new Error(`game did not finish (seed ${seed})`);
        const move = d.type === 'shortfall' ? logic.defaultShortfallMove(d.playerId) : POLICIES[seats[d.playerId]](ctx, d);
        const resolved = logic.resolveMove(d.playerId, move);
        if (!resolved.ok) throw new Error(`${seats[d.playerId]} chose an illegal move (seed ${seed}): ${resolved.message} ${JSON.stringify(move)}`);
        recordMove(E, state, logic, d.playerId, resolved.resolved, stats[d.playerId], { detailed });
        if (trace) trace({ state, logic, decision: d, move: resolved.resolved, seat: seats[d.playerId] });
        const result = logic.play(d.playerId, move);
        if (!result.success) throw new Error(`move rejected (seed ${seed}): ${result.message}`);
        if (checkInvariantsEveryMove) {
            const problems = checkInvariants(E, state);
            if (problems.length) throw new Error(`invariant broken (seed ${seed}): ${problems.join('; ')}`);
        }
    }
    const ranking = state.getFinalRanking();
    const winners = ranking.filter(r => r.rank === 1).length;
    const final = state.players.map(p => {
        const r = ranking.find(x => x.playerId === p.id);
        return { vp: p.vp, income: state.getIncomeLevel(p.id), money: p.money, rank: r.rank, win: r.rank === 1 ? 1 / winners : 0 };
    });
    return { players, seed, seats, startPosition, stats, final, ranking, moves };
}

module.exports = { POLICIES, playMatch, withOpponentHands, aiSeedFor, playableBuildCards };
