'use strict';

// Seeded randomness: same seed + same actions => same game; different seeds
// => different setups; nothing in the engine uses Math.random.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { createGame, playGame, playActions, aiSeedFor } = require('./helpers/headless');
const { fingerprint } = require('./helpers/fingerprint');
const { plain } = require('./helpers/scenario');
const baseline = require('./fixtures/assignment1-baseline.json');

const E = loadEngine(); // Math.random throws inside this engine
const GAMES = Number(process.env.BRASS_SIM_GAMES || 10);
const ser = (state) => JSON.stringify(state.serialize());

test('SeededRandom: same seed -> same sequence; state can be saved and resumed', () => {
    const a = new E.SeededRandom(12345);
    const b = new E.SeededRandom(12345);
    const seqA = Array.from({ length: 50 }, () => a.next());
    assert.deepEqual(seqA, Array.from({ length: 50 }, () => b.next()));
    for (const x of seqA) assert.ok(x >= 0 && x < 1);

    const saved = a.getState();
    const next = Array.from({ length: 20 }, () => a.next());
    const resumed = E.SeededRandom.fromState(saved);
    assert.deepEqual(Array.from({ length: 20 }, () => resumed.next()), next);

    const c = new E.SeededRandom(54321);
    assert.notDeepEqual(Array.from({ length: 5 }, () => c.next()), seqA.slice(0, 5));
    assert.throws(() => E.SeededRandom.fromState({ seed: -1, state: 0 }));
});

for (const players of [2, 3, 4]) {
    test(`${players} players: identical seeds give identical initial states`, () => {
        const a = new E.GameState(players, ['A', 'B', 'C', 'D'].slice(0, players), [], { seed: 99 });
        const b = new E.GameState(players, ['A', 'B', 'C', 'D'].slice(0, players), [], { seed: 99 });
        assert.equal(ser(a), ser(b));
    });
}

test('different seeds give varied decks, hands, merchant tiles and turn orders', () => {
    const decks = new Set();
    const merchants = new Set();
    const orders = new Set();
    for (let seed = 1; seed <= 40; seed++) {
        const s = new E.GameState(4, ['A', 'B', 'C', 'D'], [], { seed });
        decks.add(JSON.stringify([s.drawDeck, s.players.map(p => p.hand)]));
        merchants.add(JSON.stringify(s.merchantTiles));
        orders.add(s.turnOrder.join());
    }
    assert.equal(decks.size, 40, 'every seed deals a different deck');
    assert.ok(merchants.size > 30, `merchant layouts vary (${merchants.size} distinct)`);
    assert.ok(orders.size > 10, `turn orders vary (${orders.size} distinct of 24)`);
});

test('a game created without a seed picks one and plays normally', () => {
    const a = new E.GameState(3, ['A', 'B', 'C']);
    const b = new E.GameState(3, ['A', 'B', 'C']);
    assert.ok(E.SeededRandom.isUint32(a.rng.seed));
    assert.notEqual(ser(a), ser(b), 'two unseeded games differ');
    // ...and the chosen seed reproduces it
    const again = new E.GameState(3, ['A', 'B', 'C'], [], { seed: a.rng.seed });
    assert.equal(ser(again), ser(a));
});

test('the engine never calls Math.random (it throws inside the test engine)', () => {
    assert.throws(() => E.Math.random(), /SeededRandom/);
    // A complete AI game, including the Rail Era reshuffle, runs regardless
    const g = playGame({ players: 4, seed: 4242, E });
    assert.equal(g.state.gameOver, true);
});

test('the AI noise uses its own stream: choosing a move never advances the game RNG', () => {
    const { state, logic } = createGame(E, { players: 3, seed: 5 });
    const before = state.rng.getState();
    for (const difficulty of ['easy', 'normal', 'hard']) {
        E.AIPlayer.chooseAction(state, logic, state.currentPlayerId, difficulty, new E.SeededRandom(1));
    }
    assert.deepEqual(state.rng.getState(), before);
});

for (const players of [2, 3, 4]) {
    test(`${players} players: the same seed reproduces a complete AI game exactly`, () => {
        const recA = [];
        const recB = [];
        const a = playGame({ players, seed: 777, record: recA, E });
        const b = playGame({ players, seed: 777, record: recB, E });
        assert.deepEqual(recA, recB, 'same decisions');
        assert.equal(ser(a.state), ser(b.state), 'same final state');
        const c = playGame({ players, seed: 778, E });
        assert.notEqual(ser(c.state), ser(a.state), 'a different seed plays differently');
    });
}

test('identical seed + identical action sequence reproduces the game without the AI', () => {
    const record = [];
    const original = playGame({ players: 3, seed: 31337, record, E });
    const { state, logic } = createGame(E, { players: 3, seed: 31337 });
    playActions(E, state, logic, { replay: [...record] });
    assert.equal(ser(state), ser(original.state));
    assert.equal(state.gameOver, true);
});

test('the Rail Era reshuffle is drawn from the game RNG (deterministic per seed)', () => {
    const railDeck = (seed) => {
        const s = new E.GameState(2, ['A', 'B'], [], { seed });
        s.endCanalEra();
        return JSON.stringify(s.drawDeck);
    };
    assert.equal(railDeck(8), railDeck(8));
    assert.notEqual(railDeck(8), railDeck(9));
});

// Equivalent initial conditions to Assignment 1: same seeds and, with the AI
// sharing the game's stream (as the A1 harness's single seeded Math.random
// did), the same random draws in the same order. The recorded games were
// played by the AI as it was before Assignment 6, preserved as
// AIPlayer.LEGACY_A5; this pins that baseline (and the engine) exactly.
for (const players of [2, 3, 4]) {
    test(`${players} players: the legacy AI baseline replays Assignment 1 games bit-for-bit (${GAMES} games)`, () => {
        for (const g of baseline.games[players].slice(0, GAMES)) {
            const r = playGame({ players, seed: g.seed, difficulty: g.difficulty, sharedRng: true, aiOptions: E.AIPlayer.LEGACY_A5, E });
            assert.equal(fingerprint(r.state, { steps: r.steps, actions: r.actions }), g.fingerprint,
                `seed ${g.seed}: differs from Assignment 1 (A1 VP ${g.vp}, now ${plain(r.vp)})`);
        }
    });
}

test('aiSeedFor derives a distinct but fixed AI stream from the game seed', () => {
    assert.equal(aiSeedFor(1), aiSeedFor(1));
    assert.notEqual(aiSeedFor(1), 1);
});
