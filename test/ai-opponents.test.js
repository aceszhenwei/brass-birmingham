'use strict';

// Assignment 15: the experimental opponent models (scripts/research/opponents.js,
// docs/research/ai-opponent-modelling-a15.md) plugged into the production
// planner. They must decide only on what the player may know, never change the
// real game, leave steps inside the current turn alone, and simulate only
// legal opponent moves.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { createGame } = require('./helpers/headless');
const { createOpponentModel } = require('../scripts/research/opponents');

const E = loadEngine();
const KINDS = ['contest', 'simulate', 'robust'];
const MODELS = Object.fromEntries(KINDS.map(k => [k, createOpponentModel(E, { kind: k })]));
const config = (kind) => ({ ...E.AIPlanner.PRODUCTION, maxMs: Infinity, opponentModel: kind ? MODELS[kind] : null });
const isWild = (c) => c.type === E.CARD_TYPES.WILD_LOCATION || c.type === E.CARD_TYPES.WILD_INDUSTRY;
const ser = (s) => JSON.stringify(s.serialize());

// Hidden cards reshuffled (deck, opponents' non-wild cards, face-down discards)
function alternateWorld(state, viewerId, rng) {
    const alt = state.clone();
    const slots = [];
    alt.drawDeck.forEach((c, i) => slots.push([alt.drawDeck, i]));
    for (const p of alt.players) {
        if (p.id !== viewerId) p.hand.forEach((c, i) => { if (!isWild(c)) slots.push([p.hand, i]); });
        p.discardPile.forEach((c, i) => { if (c.faceDown) slots.push([p.discardPile, i]); });
    }
    const cards = rng.shuffle(slots.map(([arr, i]) => { const { faceDown, ...card } = arr[i]; return card; }));
    slots.forEach(([arr, i], k) => { arr[i] = arr[i].faceDown ? { ...cards[k], faceDown: true } : cards[k]; });
    alt.rng = new E.SeededRandom(rng.int(1e9));
    return alt;
}

// Positions at the start of a turn (so steps after the turn exist), reached
// with the fast heuristic: a few in the Canal Era and a few in the Rail Era
function positions(players, seed, every) {
    const { state, logic } = createGame(E, { players, seed });
    const rng = new E.SeededRandom(seed);
    const out = [];
    let k = 0;
    for (let d = logic.getCurrentDecision(); d.type !== 'gameOver' && out.length < 4; d = logic.getCurrentDecision()) {
        if (d.type === 'shortfall') { logic.play(d.playerId, logic.defaultShortfallMove(d.playerId)); continue; }
        if (state.actionsThisTurn === 0 && state.actionsPerTurn === 2 && state.getRoundsRemaining() > 1 && k++ % every === every - 1) out.push(state.clone());
        logic.play(d.playerId, logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, d.playerId, 'easy', rng)));
    }
    return out;
}
const POSITIONS = [...positions(3, 151, 9), ...positions(4, 152, 13)];

test('the test positions cover both eras', () => {
    assert.ok(POSITIONS.some(s => s.era === E.ERA.CANAL));
    assert.ok(POSITIONS.some(s => s.era === E.ERA.RAIL));
});

test('every model plans identically when hidden cards change, and never changes the real game', () => {
    const rng = new E.SeededRandom(153);
    for (const state of POSITIONS) {
        const id = state.currentPlayerId;
        const alt = alternateWorld(state, id, rng);
        for (const kind of KINDS) {
            const before = ser(state);
            const plan = E.AIPlanner.plan(state, id, config(kind)).plan;
            assert.equal(ser(state), before, `${kind} changed the real game`);
            assert.equal(JSON.stringify(E.AIPlanner.plan(alt, id, config(kind)).plan), JSON.stringify(plan),
                `${kind}: plan differs with hidden cards changed (${state.era} round ${state.round})`);
        }
    }
});

test('steps inside the current turn are not affected: a two-action plan at the start of a turn is unchanged', () => {
    for (const state of POSITIONS) {
        const id = state.currentPlayerId;
        const base = JSON.stringify(E.AIPlanner.plan(state, id, { ...config(null), depth: 2, widths: [6, 3] }).plan);
        for (const kind of KINDS) {
            assert.equal(JSON.stringify(E.AIPlanner.plan(state, id, { ...config(kind), depth: 2, widths: [6, 3] }).plan), base, kind);
        }
    }
});

test('the unseen cards are exactly the cards the player cannot see', () => {
    const r = MODELS.robust.research;
    for (const state of POSITIONS) {
        const id = state.currentPlayerId;
        const obs = state.getObservation(id);
        const hidden = state.drawDeck.length +
            state.players.filter(p => p.id !== id).reduce((a, p) => a + p.hand.filter(c => !isWild(c)).length, 0) +
            state.players.reduce((a, p) => a + p.discardPile.filter(c => c.faceDown).length, 0);
        assert.equal(r.unseenCards(obs, id).length, hidden);
    }
});

test('simulated opponent turns: the right opponents, legal moves, and the real game untouched', () => {
    const r = MODELS.simulate.research;
    for (const state of POSITIONS) {
        const id = state.currentPlayerId;
        const obs = state.getObservation(id);
        const turns = r.opponentTurns(obs, id);
        assert.ok(turns.length >= 1 && turns.length <= 2 * (state.numPlayers - 1));
        assert.ok(!turns.includes(id));
        const before = ser(state);
        const ctx = MODELS.simulate.prepare(obs, new E.GameLogic(obs), id);
        const world = ctx.worlds[0];
        assert.ok(world.moves.every(m => turns.includes(m.opp)));
        // Replayed on the observation itself, every predicted move is legal
        const s = obs.clone();
        for (const [pid, hand] of Object.entries(world.hands)) s.players[pid].hand = hand.map(c => ({ ...c }));
        const l = new E.GameLogic(s);
        for (const { opp, move } of world.moves) assert.ok(l.applyMove(opp, move).success, JSON.stringify(move));
        assert.equal(ser(state), before);
    }
});

test('contest weights: 1 outside Build and Network, and lower for a target opponents can take', () => {
    const r = MODELS.contest.research;
    let exposed = 0;
    for (const state of POSITIONS) {
        const id = state.currentPlayerId;
        const obs = state.getObservation(id);
        const logic = new E.GameLogic(obs);
        const ctx = MODELS.contest.prepare(obs, logic, id);
        assert.equal(MODELS.contest.stepWeight({ type: E.ACTIONS.LOAN, card: 0 }, ctx), 1);
        for (const t of logic.getValidNetworkTargets(id)) {
            const move = { type: E.ACTIONS.NETWORK, card: 0, links: [t.connectionId] };
            const ex = r.exposures(obs, logic, id, move);
            const w = MODELS.contest.stepWeight(move, ctx);
            assert.ok(w > 0 && w <= 1);
            if (ex.some(e => e > 0)) { exposed++; assert.ok(w < 1); } else assert.equal(w, 1);
        }
    }
    assert.ok(exposed > 0);
});
