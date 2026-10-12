'use strict';

// AI information fairness (Assignment 6). Every AI difficulty must decide
// using only what a human in the same seat could know: the public game, its
// own hand, and its own random stream. Opponents' hands, the order of the
// draw deck, face-down discards and the game's random generator must make no
// difference, and choosing a move must never change the game.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { createGame, aiSeedFor } = require('./helpers/headless');

const E = loadEngine();
const ser = (s) => JSON.stringify(s.serialize());
const plain = (x) => JSON.parse(JSON.stringify(x));
const isWild = (c) => c.type === E.CARD_TYPES.WILD_LOCATION || c.type === E.CARD_TYPES.WILD_INDUSTRY;

// A copy of the game that `viewerId` cannot tell apart from the real one:
// every card it cannot see (draw deck, opponents' non-wild cards, face-down
// discards) is shuffled and dealt back into the same places, and the game's
// random generator is replaced.
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

// Play complete games at each player count; at every AI decision compare the
// real decision with the decision in an alternate world (same AI random
// stream position). Returns per-difficulty counts.
function probe(difficulty, aiOptions = null) {
    const counts = { decisions: 0, differ: 0, impure: 0, viewsDiffer: 0, observationsDiffer: 0 };
    for (const [players, seed] of [[2, 61], [3, 62], [4, 63]]) {
        const { state, logic } = createGame(E, { players, seed, difficulty });
        const aiRng = new E.SeededRandom(aiSeedFor(seed));
        const worldRng = new E.SeededRandom(seed * 31);
        for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
            if (d.type === 'shortfall') {
                logic.play(d.playerId, logic.defaultShortfallMove(d.playerId));
                continue;
            }
            const id = d.playerId;
            const alt = alternateWorld(state, id, worldRng);
            if (JSON.stringify(alt.getPlayerView(id)) !== JSON.stringify(state.getPlayerView(id))) counts.viewsDiffer++;
            if (ser(alt.getObservation(id)) !== ser(state.getObservation(id))) counts.observationsDiffer++;
            const elsewhere = E.AIPlayer.chooseAction(alt, new E.GameLogic(alt), id, difficulty, aiRng.clone(), aiOptions);

            const before = ser(state);
            const decision = E.AIPlayer.chooseAction(state, logic, id, difficulty, aiRng, aiOptions);
            if (ser(state) !== before) counts.impure++;
            const move = logic.moveFromDecision(decision);
            if (JSON.stringify(logic.moveFromDecision(elsewhere)) !== JSON.stringify(move)) counts.differ++;
            counts.decisions++;
            assert.ok(logic.play(id, move).success);
        }
    }
    return counts;
}

test('an observation holds exactly what the player view shows, as a playable GameState', () => {
    const { state, logic } = createGame(E, { players: 3, seed: 5 });
    // Play into the game so discards and the board are populated
    for (let i = 0; i < 20; i++) {
        const d = logic.getCurrentDecision();
        logic.play(d.playerId, logic.getCurrentLegalMoves()[0]);
    }
    for (const viewer of [0, 1, 2]) {
        const obs = state.getObservation(viewer);
        assert.ok(obs instanceof E.GameState);
        assert.deepEqual(plain(obs.getPlayerView(viewer)), plain(state.getPlayerView(viewer)));
        assert.deepEqual(plain(obs.players[viewer].hand), plain(state.players[viewer].hand), 'own hand kept');
        for (const p of obs.players) {
            if (p.id !== viewer) assert.ok(p.hand.every(c => c.type === 'hidden'), 'opponent hands hidden');
            assert.ok(p.discardPile.every(c => !c.faceDown || c.type === 'hidden'), 'face-down discards hidden');
        }
        assert.equal(obs.drawDeck.length, state.drawDeck.length);
        assert.ok(obs.drawDeck.every(c => c.type === 'hidden'), 'deck order hidden');
        assert.notDeepEqual(plain(obs.rng.getState()), plain(state.rng.getState()), 'game RNG not revealed');
        assert.equal(obs.getRoundsRemaining(), state.getRoundsRemaining());
        // Rules queries run on it, and changing it leaves the game untouched
        const before = ser(state);
        new E.GameLogic(obs).getValidBuildTargets(viewer);
        obs.players[viewer].money = 999;
        obs.drawDeck.length = 0;
        assert.equal(ser(state), before);
    }
});

const results = {};
for (const difficulty of ['easy', 'normal', 'hard']) results[difficulty] = probe(difficulty);

test('the alternate worlds really are indistinguishable to the deciding player', () => {
    for (const [difficulty, c] of Object.entries(results)) {
        assert.ok(c.decisions > 200, difficulty);
        assert.equal(c.viewsDiffer, 0, `${difficulty}: player views differ`);
        assert.equal(c.observationsDiffer, 0, `${difficulty}: observations differ`);
    }
});

for (const difficulty of ['easy', 'normal', 'hard']) {
    test(`${difficulty}: decisions do not depend on hidden information (opponents' hands, deck order, face-down cards, game RNG)`, () => {
        assert.equal(results[difficulty].differ, 0);
    });
}

test('choosing a move never changes the game state, at every difficulty', () => {
    for (const [difficulty, c] of Object.entries(results)) assert.equal(c.impure, 0, difficulty);
});

test('the Assignment 5 baseline (AIPlayer.LEGACY_A5) keeps its documented defect: Hard reads opponents\' hands', () => {
    const legacy = probe('hard', E.AIPlayer.LEGACY_A5);
    assert.ok(legacy.differ > 0, 'the legacy Hard should depend on hidden hands');
    assert.equal(legacy.impure, 0);
});
