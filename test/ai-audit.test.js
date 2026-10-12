'use strict';

// Fairness properties of the existing AI (Assignment 5 audit,
// docs/research/ai-baseline-audit.md). At every decision of a complete game,
// the AI's choice is compared with the choice it makes, from the same random
// stream position, when the hidden information is changed:
//   - opponents' hands replaced by a random sample of the unseen cards;
//   - the draw deck reshuffled.
// A fair AI decides the same either way. Choosing must also never change the
// game state.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { withOpponentHands, aiSeedFor } = require('../scripts/research/harness');

const E = loadEngine();

// Play one all-AI game; return how many decisions changed under each what-if
function probeGame(difficulty, players, seed) {
    const names = ['A', 'B', 'C', 'D'].slice(0, players);
    const state = new E.GameState(players, names, names.map(() => ({ isAI: true, difficulty })), { seed });
    const logic = new E.GameLogic(state);
    const aiRng = new E.SeededRandom(aiSeedFor(seed));
    const viewRng = new E.SeededRandom(seed + 99);
    const counts = { decisions: 0, hands: 0, deck: 0, impure: 0 };
    const key = (dec) => JSON.stringify(logic.moveFromDecision(dec));

    for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
        if (d.type === 'shortfall') {
            logic.play(d.playerId, logic.defaultShortfallMove(d.playerId));
            continue;
        }
        const choose = (rng) => E.AIPlayer.chooseAction(state, logic, d.playerId, difficulty, rng);
        const withHands = key(withOpponentHands(E, state, d.playerId, 'resample', viewRng, () => choose(aiRng.clone())));
        const deck = state.drawDeck;
        state.drawDeck = viewRng.shuffle([...deck]);
        const withDeck = key(choose(aiRng.clone()));
        state.drawDeck = deck;

        const before = JSON.stringify(state.serialize());
        const decision = choose(aiRng);
        if (JSON.stringify(state.serialize()) !== before) counts.impure++;
        const real = key(decision);
        counts.decisions++;
        if (withHands !== real) counts.hands++;
        if (withDeck !== real) counts.deck++;
        assert.ok(logic.play(d.playerId, logic.moveFromDecision(decision)).success);
    }
    return counts;
}

const results = {};
for (const difficulty of ['easy', 'normal', 'hard']) {
    results[difficulty] = probeGame(difficulty, 3, 3001);
}

test('choosing a move never changes the game state, at every difficulty', () => {
    for (const [difficulty, c] of Object.entries(results)) {
        assert.ok(c.decisions > 50, difficulty);
        assert.equal(c.impure, 0, difficulty);
    }
});

test('no difficulty depends on the order of the draw deck', () => {
    for (const [difficulty, c] of Object.entries(results)) assert.equal(c.deck, 0, difficulty);
});

test('Easy and Normal never depend on opponents\' hidden hands', () => {
    assert.equal(results.easy.hands, 0);
    assert.equal(results.normal.hands, 0);
});

test('Hard does not depend on opponents\' hidden hands', {
    todo: 'Known defect: Hard\'s denial bonus reads opponents\' hands (docs/research/ai-baseline-audit.md, F1)',
}, () => {
    assert.equal(results.hard.hands, 0);
});
