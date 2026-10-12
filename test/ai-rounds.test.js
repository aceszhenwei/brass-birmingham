'use strict';

// Rounds remaining (Assignment 6). The engine reports how many rounds are
// left in the current era, counting the round in progress; the AI uses it.
// Ground truth is what actually happens: the number of round ends of the
// same era still to come when the decision is made.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { createGame, aiSeedFor } = require('./helpers/headless');

const E = loadEngine();
const ROUNDS = { 2: 10, 3: 9, 4: 8 };

// Play a complete AI game; for every turn decision record what the engine
// and the AI (current and legacy) report, and afterwards the true count.
function playAndMeasure(players, seed) {
    const { state, logic } = createGame(E, { players, seed });
    const aiRng = new E.SeededRandom(aiSeedFor(seed));
    const rows = [];
    const roundEnds = [];       // [moveIndex, era]
    let i = 0;
    for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision(), i++) {
        let move;
        if (d.type === 'shortfall') {
            move = logic.defaultShortfallMove(d.playerId);
        } else {
            rows.push({ i, era: state.era, round: state.round, engine: state.getRoundsRemaining(),
                ai: E.AIPlayer.roundsRemaining(state), legacy: E.AIPlayer.roundsRemaining(state, E.AIPlayer.LEGACY_A5),
                legacyFormula: Math.max(1, Math.min(10, state.drawDeck.length / players)),
                observation: state.getObservation(d.playerId).getRoundsRemaining() });
            move = logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng));
        }
        const r = logic.play(d.playerId, move);
        assert.ok(r.success, r.message);
        for (const ev of r.events) if (ev.type === 'roundEnd') roundEnds.push([i, ev.era]);
    }
    for (const row of rows) row.truth = roundEnds.filter(([j, era]) => j >= row.i && era === row.era).length;
    return { state, rows };
}

for (const players of [2, 3, 4]) {
    test(`${players} players: the engine's rounds remaining is exact at every decision of both eras`, () => {
        for (const seed of [71, 72]) {
            const { state, rows } = playAndMeasure(players, seed);
            for (const r of rows) {
                assert.equal(r.engine, r.truth, `${r.era} round ${r.round}: engine ${r.engine}, actually ${r.truth}`);
                assert.equal(r.observation, r.engine, 'the observation reports the same');
            }
            // Boundaries: the first and last round of each era
            for (const era of ['canal', 'rail']) {
                const inEra = rows.filter(r => r.era === era);
                assert.equal(inEra[0].round, 1);
                assert.equal(inEra[0].engine, ROUNDS[players], `${era} round 1`);
                assert.equal(inEra[inEra.length - 1].engine, 1, `${era} last round`);
            }
            assert.equal(state.getRoundsRemaining(), 0, 'game over');
        }
    });

    test(`${players} players: the AI uses the engine's count; the legacy baseline keeps the old estimate`, () => {
        const { rows } = playAndMeasure(players, 73);
        for (const r of rows) {
            assert.equal(r.ai, r.engine);
            assert.equal(r.legacy, r.legacyFormula);
        }
        // The defect the legacy estimate documents: once the deck is empty it
        // reports a single round while several remain
        assert.ok(rows.some(r => r.legacy === 1 && r.truth >= 3), 'legacy underestimate not reproduced');
    });
}

test('rounds remaining across the era transition and at the end of an era', () => {
    const state = new E.GameState(3, ['A', 'B', 'C'], [], { seed: 4 });
    assert.equal(state.getRoundsRemaining(), 9);
    state.round = 9;
    assert.equal(state.getRoundsRemaining(), 1);
    // All cards played: the era is over (scoring due), nothing remains
    state.drawDeck = [];
    for (const p of state.players) p.hand = [];
    assert.equal(state.isEraOver(), true);
    assert.equal(state.getRoundsRemaining(), 0);
    // The Rail Era starts with its full length again
    state.endCanalEra();
    assert.equal(state.era, 'rail');
    assert.equal(state.getRoundsRemaining(), 9);
});
