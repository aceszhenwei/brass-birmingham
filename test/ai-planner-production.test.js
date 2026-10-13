'use strict';

// The production AI since Assignment 12: AIPlanner.chooseAction (js/aiPlanner.js).
// Normal and Hard plan four actions ahead; Easy plays the heuristic. These
// tests pin the recorded games, the planner's integration with turn
// progression, its search budget, and its information fairness.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { createGame, aiSeedFor, playGame } = require('./helpers/headless');
const { fingerprint } = require('./helpers/fingerprint');
const { checkInvariants } = require('./helpers/invariants');
const { createPlanner } = require('../scripts/research/planner');
const baseline = require('./fixtures/assignment12-baseline.json');

const E = loadEngine();
// The production plan configuration without its wall-clock budget, so the
// tests do not depend on the machine's speed (the recorded games use it too)
const DETERMINISTIC = { planner: { ...E.AIPlanner.PRODUCTION, maxMs: Infinity } };
const ser = (s) => JSON.stringify(s.serialize());
const isWild = (c) => c.type === E.CARD_TYPES.WILD_LOCATION || c.type === E.CARD_TYPES.WILD_INDUSTRY;

for (const players of [2, 3, 4]) {
    test(`${players} players: the production AI replays its recorded games exactly`, () => {
        for (const g of baseline.games[players]) {
            const r = playGame({ players, seed: g.seed, difficulty: g.difficulty, chooseAction: E.AIPlanner.chooseAction, aiOptions: DETERMINISTIC, E });
            assert.equal(fingerprint(r.state, { steps: r.steps, actions: r.actions }), g.fingerprint,
                `seed ${g.seed} (${g.difficulty}) no longer plays as recorded`);
        }
    });
}

test('Easy plays the heuristic; Normal and Hard play the four-action planner', () => {
    const p4 = createPlanner(E, { depth: 4, evaluate: 'state', widths: [6, 3, 3] });
    const { state, logic } = createGame(E, { players: 3, seed: 141 });
    const aiRng = new E.SeededRandom(aiSeedFor(141));
    for (let k = 0; k < 30; k++) {
        const d = logic.getCurrentDecision();
        if (d.type === 'shortfall') { logic.play(d.playerId, logic.defaultShortfallMove(d.playerId)); continue; }
        const key = (x) => JSON.stringify(logic.moveFromDecision(x));
        assert.equal(key(E.AIPlanner.chooseAction(state, logic, d.playerId, 'easy', aiRng.clone())),
            key(E.AIPlayer.chooseAction(state, logic, d.playerId, 'easy', aiRng.clone())));
        const research = JSON.stringify(p4.choose(state, d.playerId).move);
        assert.equal(key(E.AIPlanner.chooseAction(state, logic, d.playerId, 'normal', aiRng.clone(), DETERMINISTIC)), research);
        assert.equal(key(E.AIPlanner.chooseAction(state, logic, d.playerId, 'hard', aiRng.clone(), DETERMINISTIC)), research);
        assert.equal(key(E.AIPlanner.chooseAction(state, logic, d.playerId, 'normal', aiRng.clone(), { planner: 'none' })),
            key(E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng.clone())));
        logic.play(d.playerId, logic.moveFromDecision(E.AIPlanner.chooseAction(state, logic, d.playerId, 'normal', aiRng, DETERMINISTIC)));
    }
});

test('one legal action per decision, re-planned every action, never changing the real game', () => {
    const { state, logic } = createGame(E, { players: 2, seed: 142 });
    const aiRng = new E.SeededRandom(aiSeedFor(142));
    let decisions = 0, planBeyondAction = 0;
    for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
        if (d.type === 'shortfall') { assert.ok(logic.play(d.playerId, logic.defaultShortfallMove(d.playerId)).success); continue; }
        const before = ser(state);
        const turnBefore = [state.currentPlayerId, state.actionsThisTurn];
        const decision = E.AIPlanner.chooseAction(state, logic, d.playerId, 'normal', aiRng, DETERMINISTIC);
        assert.equal(ser(state), before, 'planning changed the real game');
        assert.deepEqual([state.currentPlayerId, state.actionsThisTurn], turnBefore);
        assert.ok(decision.plan.length >= 1 && decision.plan.length <= 4);
        if (decision.plan.length > 1) planBeyondAction++;
        const r = logic.play(d.playerId, logic.moveFromDecision(decision));
        assert.ok(r.success, r.message);
        assert.deepEqual(checkInvariants(E, state), []);
        decisions++;
    }
    assert.ok(planBeyondAction > decisions / 2, 'plans look beyond the action played');
});

test('search budget: an exhausted budget still returns a legal move, and a state budget is deterministic', () => {
    const { state, logic } = createGame(E, { players: 3, seed: 143 });
    const aiRng = new E.SeededRandom(aiSeedFor(143));
    let checked = 0;
    for (let d = logic.getCurrentDecision(); d.type !== 'gameOver' && checked < 60; d = logic.getCurrentDecision()) {
        if (d.type === 'shortfall') { logic.play(d.playerId, logic.defaultShortfallMove(d.playerId)); continue; }
        const before = ser(state);
        // No time at all: the heuristic's best move, flagged as timed out
        const none = E.AIPlanner.plan(state, d.playerId, { ...E.AIPlanner.PRODUCTION, maxMs: 0 });
        assert.ok(none.timedOut);
        assert.ok(logic.resolveMove(d.playerId, none.move).ok, 'timed-out move is legal');
        // A small state budget: legal, within budget (+1 candidate evaluation), and reproducible
        const small = E.AIPlanner.plan(state, d.playerId, { ...E.AIPlanner.PRODUCTION, maxMs: Infinity, maxStates: 4 });
        const again = E.AIPlanner.plan(state, d.playerId, { ...E.AIPlanner.PRODUCTION, maxMs: Infinity, maxStates: 4 });
        assert.ok(logic.resolveMove(d.playerId, small.move).ok);
        assert.ok(small.states <= 5);
        assert.deepEqual(small.plan, again.plan);
        assert.equal(ser(state), before);
        logic.play(d.playerId, logic.moveFromDecision(E.AIPlanner.chooseAction(state, logic, d.playerId, 'normal', aiRng,
            { planner: { ...E.AIPlanner.PRODUCTION, maxMs: Infinity, maxStates: 4 } })));
        checked++;
    }
    assert.ok(checked === 60);
});

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

test('the production AI decides only on what the player may know (alternate worlds)', () => {
    const worldRng = new E.SeededRandom(144);
    const { state, logic } = createGame(E, { players: 2, seed: 144 });
    const aiRng = new E.SeededRandom(aiSeedFor(144));
    let checked = 0;
    for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
        if (d.type === 'shortfall') { logic.play(d.playerId, logic.defaultShortfallMove(d.playerId)); continue; }
        const alt = alternateWorld(state, d.playerId, worldRng);
        const elsewhere = E.AIPlanner.chooseAction(alt, new E.GameLogic(alt), d.playerId, 'hard', aiRng.clone(), DETERMINISTIC);
        const decision = E.AIPlanner.chooseAction(state, logic, d.playerId, 'hard', aiRng, DETERMINISTIC);
        assert.deepEqual(elsewhere.plan, decision.plan, `plans differ with hidden cards changed (${state.era} round ${state.round})`);
        logic.play(d.playerId, logic.moveFromDecision(decision));
        checked++;
    }
    assert.ok(checked > 60);
});
