'use strict';

// Loan decision-making (Assignment 7). The production AI keeps the
// Assignment 6 loan heuristic (the candidates were rejected; see
// docs/research/ai-loans-a7.md). These tests pin the AI of Assignments 6-7
// (AIPlayer.LEGACY_A6 since Assignment 8 changed overbuild scoring), keep the
// research variants reproducible and well behaved, and check that the
// diagnostics never change play.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { playGame, createGame, aiSeedFor } = require('./helpers/headless');
const { fingerprint } = require('./helpers/fingerprint');
const { checkInvariants } = require('./helpers/invariants');
const baseline = require('./fixtures/assignment6-baseline.json');

const E = loadEngine();
const ser = (s) => JSON.stringify(s.serialize());

for (const players of [2, 3, 4]) {
    test(`${players} players: the Assignment 6-7 AI (LEGACY_A6) replays its recorded games exactly`, () => {
        for (const g of baseline.games[players]) {
            const r = playGame({ players, seed: g.seed, difficulty: g.difficulty, aiOptions: E.AIPlayer.LEGACY_A6, E });
            assert.equal(fingerprint(r.state, { steps: r.steps, actions: r.actions }), g.fingerprint,
                `seed ${g.seed} (${g.difficulty}) no longer plays as recorded`);
        }
    });
}

test("the default loan heuristic is the Assignment 6 one, and diagnostics don't change decisions", () => {
    for (const [players, seed] of [[2, 81], [3, 82], [4, 83]]) {
        const { state, logic } = createGame(E, { players, seed });
        const aiRng = new E.SeededRandom(aiSeedFor(seed));
        let loans = 0;
        for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
            if (d.type === 'shortfall') { logic.play(d.playerId, logic.defaultShortfallMove(d.playerId)); continue; }
            const key = (opts) => JSON.stringify(logic.moveFromDecision(
                E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng.clone(), opts)));
            const explained = E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng.clone(), { explain: true });
            assert.equal(key({ loan: 'a6' }), key(null));
            assert.equal(JSON.stringify(logic.moveFromDecision(explained)), key(null));
            assert.ok(explained.explain.candidates.some(c => c.action === explained.action));
            const move = logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng));
            if (move.type === 'loan') loans++;
            assert.ok(logic.play(d.playerId, move).success);
        }
        assert.ok(loans > 0, 'the game exercised the loan heuristic');
    }
});

for (const loan of ['cashflow', 'enabling', 'cashflow+enabling', 'never']) {
    test(`research loan variant "${loan}": legal, pure and reproducible complete games`, () => {
        const play = (seed) => {
            const { state, logic } = createGame(E, { players: 3, seed, difficulty: 'normal' });
            const aiRng = new E.SeededRandom(aiSeedFor(seed));
            let loans = 0;
            for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
                if (d.type === 'shortfall') { logic.play(d.playerId, logic.defaultShortfallMove(d.playerId)); continue; }
                const before = ser(state);
                const move = logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng, { loan }));
                assert.equal(ser(state), before, 'choosing changed the state');
                if (move.type === 'loan') loans++;
                const r = logic.play(d.playerId, move);
                assert.ok(r.success, r.message);
                assert.deepEqual(checkInvariants(E, state), []);
            }
            return { final: ser(state), loans };
        };
        const a = play(91);
        assert.equal(play(91).final, a.final, 'same seed, same game');
        if (loan === 'never') assert.equal(a.loans, 0);
    });
}
