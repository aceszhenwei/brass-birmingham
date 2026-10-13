'use strict';

// Assignment 11: the experimental short-horizon planner
// (scripts/research/planner.js). It is research code, outside the production
// decision path; these tests pin that it plays legal moves, never changes the
// real game, is reproducible, and decides only on what the player may know.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { createGame, aiSeedFor } = require('./helpers/headless');
const { checkInvariants } = require('./helpers/invariants');
const { createPlanner } = require('../scripts/research/planner');

const E = loadEngine();
const ser = (s) => JSON.stringify(s.serialize());
const isWild = (c) => c.type === E.CARD_TYPES.WILD_LOCATION || c.type === E.CARD_TYPES.WILD_INDUSTRY;

// A copy of the game the viewer cannot tell apart from the real one (as in
// test/ai-fairness.test.js): hidden cards reshuffled, random generator replaced
function alternateWorld(state, viewerId, rng) {
    const alt = state.clone();
    const slots = [];
    alt.drawDeck.forEach((c, i) => slots.push([alt.drawDeck, i]));
    for (const p of alt.players) {
        if (p.id !== viewerId) p.hand.forEach((c, i) => { if (!isWild(c)) slots.push([p.hand, i]); });
        p.discardPile.forEach((c, i) => { if (c.faceDown) slots.push([p.discardPile, i]); });
    }
    const cards = rng.shuffle(slots.map(([arr, i]) => {
        const { faceDown, ...card } = arr[i];
        return card;
    }));
    slots.forEach(([arr, i], k) => { arr[i] = arr[i].faceDown ? { ...cards[k], faceDown: true } : cards[k]; });
    alt.rng = new E.SeededRandom(rng.int(1e9));
    return alt;
}

// Play a game with the planner in seat 0 (production Normal elsewhere);
// visit(state, logic, id, planner) runs before each planner decision
function play(players, seed, cfg, visit = null) {
    const planner = createPlanner(E, cfg);
    const { state, logic } = createGame(E, { players, seed });
    const aiRng = new E.SeededRandom(aiSeedFor(seed));
    const moves = [];
    for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
        const id = d.playerId;
        if (d.type === 'shortfall') { assert.ok(logic.play(id, logic.defaultShortfallMove(id)).success); continue; }
        let move;
        if (id === 0) {
            if (visit) visit(state, logic, id, planner);
            const before = ser(state);
            const r = planner.choose(state, id);
            assert.equal(ser(state), before, 'planning changed the real game');
            move = r.move;
            assert.ok(r.plan.length >= 1 && r.plan.length <= cfg.depth);
            moves.push(JSON.stringify(move));
        } else {
            move = logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, id, 'normal', aiRng));
        }
        const res = logic.play(id, move);
        assert.ok(res.success, res.message);
        assert.deepEqual(checkInvariants(E, state), []);
    }
    return { moves, state };
}

for (const cfg of [{ depth: 2, evaluate: 'sum' }, { depth: 3, evaluate: 'sum' }, { depth: 2, evaluate: 'state' }]) {
    test(`planner ${JSON.stringify(cfg)}: legal moves, no change to the real game, reproducible`, () => {
        const a = play(3, 131, cfg);
        const b = play(3, 131, cfg);
        assert.deepEqual(a.moves, b.moves, 'same seed, same decisions');
        assert.equal(ser(a.state), ser(b.state));
    });
}

test('planner decisions depend only on what the player may know (alternate worlds)', () => {
    let checked = 0;
    for (const cfg of [{ depth: 2, evaluate: 'sum' }, { depth: 3, evaluate: 'state' }]) {
        const worldRng = new E.SeededRandom(97);
        const elsewhere = createPlanner(E, cfg);
        play(2, 132, cfg, (state, logic, id, planner) => {
            const alt = alternateWorld(state, id, worldRng);
            const real = planner.choose(state, id);
            const other = elsewhere.choose(alt, id);
            assert.deepEqual(other.plan, real.plan, `plans differ with hidden cards changed (${state.era} round ${state.round})`);
            checked++;
        });
    }
    assert.ok(checked > 40);
});

test('the production AI is unchanged by the research helpers (explain-only additions)', () => {
    const { state, logic } = createGame(E, { players: 3, seed: 133 });
    const aiRng = new E.SeededRandom(aiSeedFor(133));
    for (let k = 0; k < 40; k++) {
        const d = logic.getCurrentDecision();
        if (d.type === 'gameOver') break;
        if (d.type === 'shortfall') { logic.play(d.playerId, logic.defaultShortfallMove(d.playerId)); continue; }
        const key = (opts) => JSON.stringify(logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, d.playerId, 'hard', aiRng.clone(), opts)));
        assert.equal(key({ explain: true }), key(null));
        logic.play(d.playerId, logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng)));
    }
});
