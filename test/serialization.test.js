'use strict';

// serialize() / GameState.deserialize(): complete JSON round trips, exact
// continuation, version checks, validation, and hidden information.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { createGame, playActions, aiSeedFor } = require('./helpers/headless');
const { checkInvariants } = require('./helpers/invariants');
const { plain } = require('./helpers/scenario');

const E = loadEngine();
const ser = (state) => JSON.stringify(state.serialize());

function midGame(players = 3, seed = 41, actions = 30) {
    const { state, logic } = createGame(E, { players, seed });
    const aiRng = new E.SeededRandom(aiSeedFor(seed));
    playActions(E, state, logic, { aiRng, maxActions: actions });
    return { state, logic, aiRng };
}

test('serialize() is plain JSON with a format and version', () => {
    const { state } = midGame();
    const data = state.serialize();
    assert.equal(data.format, 'brass-birmingham/game-state');
    assert.equal(data.version, E.GAME_STATE_VERSION);
    assert.equal(data.version, 1);
    // JSON-compatible: survives a JSON round trip unchanged (no undefined,
    // functions, class instances or shared references)
    assert.deepEqual(JSON.parse(JSON.stringify(data)), plain(data));
});

test('round trip: deserialize(serialize()) reproduces the state exactly', () => {
    for (const [players, seed, actions] of [[2, 1, 0], [3, 2, 25], [4, 3, 90]]) {
        const { state } = midGame(players, seed, actions);
        const json = JSON.stringify(state.serialize());
        const restored = E.GameState.deserialize(json);         // from a string
        const restored2 = E.GameState.deserialize(JSON.parse(json)); // from an object
        assert.ok(restored instanceof E.GameState);
        assert.equal(ser(restored), json);
        assert.equal(ser(restored2), json);
        assert.deepEqual(checkInvariants(E, restored), []);
        // Derived data is rebuilt from the tile tables, not stored
        for (const t of Object.values(restored.boardIndustries)) {
            const printed = E.INDUSTRY_DATA[t.type].find(d => d.level === t.tileData.level);
            for (const k of ['cost', 'vp', 'income', 'linkVP', 'beersToSell', 'canalEra', 'railEra']) {
                assert.equal(t.tileData[k], printed[k]);
            }
        }
        assert.equal(restored.players[0].color, state.players[0].color);
    }
});

test('a restored game continues exactly like the original (AI with a restored stream)', () => {
    for (const [players, seed, actions] of [[2, 11, 15], [3, 12, 50], [4, 13, 100]]) {
        const { state, logic, aiRng } = midGame(players, seed, actions);
        const saved = JSON.stringify({ game: state.serialize(), ai: aiRng.getState() });

        playActions(E, state, logic, { aiRng });

        const loaded = JSON.parse(saved);
        const restored = E.GameState.deserialize(loaded.game);
        playActions(E, restored, new E.GameLogic(restored), { aiRng: E.SeededRandom.fromState(loaded.ai) });
        assert.equal(restored.gameOver, true);
        assert.equal(ser(restored), ser(state), `${players}p seed ${seed}`);
    }
});

test('the RNG sequence continues correctly after restoring (Rail Era reshuffle)', () => {
    // Save during the Canal Era; the Rail Era deck is shuffled later from
    // the saved generator state and must come out identical.
    const { state, logic, aiRng } = midGame(3, 51, 20);
    assert.equal(state.era, E.ERA.CANAL);
    const restored = E.GameState.deserialize(JSON.stringify(state.serialize()));
    const record = [];
    const toRail = (s, l, opts) => { while (s.era === E.ERA.CANAL) playActions(E, s, l, { ...opts, maxActions: 1 }); };
    toRail(state, logic, { aiRng, record });
    toRail(restored, new E.GameLogic(restored), { replay: [...record] });
    assert.equal(JSON.stringify(restored.drawDeck), JSON.stringify(state.drawDeck));
    assert.equal(JSON.stringify(restored.players.map(p => p.hand)), JSON.stringify(state.players.map(p => p.hand)));

    // And directly: the generator resumes mid-sequence
    const r = E.GameState.deserialize(state.serialize()).rng;
    assert.deepEqual(Array.from({ length: 25 }, () => r.next()), Array.from({ length: 25 }, () => state.rng.next()));
});

test('restoring does not keep references to the saved data', () => {
    const { state } = midGame();
    const data = state.serialize();
    const restored = E.GameState.deserialize(data);
    const before = ser(restored);
    data.players[0].hand.length = 0;
    data.drawDeck.reverse();
    for (const t of Object.values(data.boardIndustries)) t.resourceCubes = 9;
    data.rng.state = 1;
    assert.equal(ser(restored), before);
});

// ---------------------------------------------------------------- hidden information

test('player views hide other hands, the deck order, face-down discards and the RNG', () => {
    const { state } = midGame(3, 61, 7);
    const viewer = 1;
    const view = JSON.parse(JSON.stringify(state.getPlayerView(viewer)));
    assert.equal(view.format, 'brass-birmingham/player-view');
    assert.equal(view.rng, undefined);
    assert.equal(view.drawDeck, undefined);
    assert.equal(view.drawDeckCount, state.drawDeck.length);
    view.players.forEach((p, i) => {
        assert.equal(p.handCount, state.players[i].hand.length);
        if (i === viewer) assert.deepEqual(p.hand, plain(state.players[i].hand));
        else assert.equal(p.hand, undefined);
        // The setup card stays face down — for everyone, its owner included
        assert.deepEqual(p.discardPile[0], { faceDown: true });
        p.discardPile.slice(1).forEach(c => assert.notEqual(c.faceDown, true));
    });
    // Spectator view: no hands at all
    const spectator = JSON.parse(JSON.stringify(state.getPlayerView()));
    assert.ok(spectator.players.every(p => p.hand === undefined));
    // Public info is still there
    assert.equal(Object.keys(view.boardIndustries).length, Object.keys(state.boardIndustries).length);
    assert.equal(view.coalMarket, state.coalMarket);
});

test('a player view cannot be loaded as a saved game', () => {
    const { state } = midGame();
    assert.throws(() => E.GameState.deserialize(state.getPlayerView(0)), { name: 'GameStateError' });
});

test('the existing player-facing text view (toJSON / render_game_to_text) carries no hidden information', () => {
    const { state } = midGame();
    const text = JSON.stringify(state); // JSON.stringify uses toJSON()
    const data = JSON.parse(text);
    assert.equal(data.drawDeckSize, state.drawDeck.length);
    for (const key of ['rng', 'drawDeck', 'hand', 'discardPile', 'seed']) assert.ok(!text.includes(`"${key}"`), key);
});

test('the full serialization does contain the hidden information it needs', () => {
    const { state } = midGame();
    const data = state.serialize();
    assert.equal(data.drawDeck.length, state.drawDeck.length);
    assert.ok(data.players.every((p, i) => p.hand.length === state.players[i].hand.length));
    assert.ok(data.players.every(p => p.discardPile[0].faceDown === true));
    assert.deepEqual(plain(data.rng), plain(state.rng.getState()));
});

// ---------------------------------------------------------------- validation

test('malformed or incompatible saves are rejected with GameStateError', () => {
    const { state } = midGame(3, 71, 40);
    const good = () => JSON.parse(JSON.stringify(state.serialize()));
    const firstKey = (o) => Object.keys(o)[0];
    const cases = {
        'not JSON': () => '{"format": ',
        'not an object': () => [1, 2, 3],
        'null': () => null,
        'wrong format': () => ({ ...good(), format: 'something-else' }),
        'missing version': () => { const d = good(); delete d.version; return d; },
        'newer version': () => ({ ...good(), version: 2 }),
        'bad player count': () => ({ ...good(), numPlayers: 5 }),
        'player list mismatch': () => { const d = good(); d.players.pop(); return d; },
        'bad era': () => ({ ...good(), era: 'steam' }),
        'bad current player': () => ({ ...good(), currentPlayerIndex: 3 }),
        'turn order not a permutation': () => ({ ...good(), turnOrder: [0, 0, 1] }),
        'bad rng': () => ({ ...good(), rng: { seed: 1, state: -5 } }),
        'negative money without tiles': () => { const d = good(); d.players[0].money = -1;
            for (const k of Object.keys(d.boardIndustries)) if (d.boardIndustries[k].playerId === 0) delete d.boardIndustries[k];
            for (const k of Object.keys(d.breweryFarmTiles)) if (d.breweryFarmTiles[k].playerId === 0) delete d.breweryFarmTiles[k];
            return d; },
        'income out of range': () => { const d = good(); d.players[1].incomeSpace = 120; return d; },
        'too many cards': () => { const d = good(); while (d.players[0].hand.length < 9) d.players[0].hand.push(d.drawDeck[0] || { type: 'location', location: 'leek', name: 'Leek' }); return d; },
        'unknown location card': () => { const d = good(); d.drawDeck.push({ type: 'location', location: 'london', name: 'London' }); return d; },
        'wild card in the deck': () => { const d = good(); d.drawDeck.push({ type: 'wildLocation', name: 'Wild' }); return d; },
        'bad player mat': () => { const d = good(); d.players[0].mat.coalMine.pop(); return d; },
        'unknown industry space': () => { const d = good(); d.boardIndustries.london_0 = d.boardIndustries[firstKey(d.boardIndustries)]; return d; },
        'industry in the wrong slot': () => { const d = good(); d.boardIndustries.worcester_0 = { playerId: 0, type: 'coalMine', level: 2, flipped: false, resourceCubes: 1 }; return d; },
        'invalid level': () => { const d = good(); d.boardIndustries.worcester_0 = { playerId: 0, type: 'cottonMill', level: 9, flipped: false, resourceCubes: 0 }; return d; },
        'unknown owner': () => { const d = good(); d.boardIndustries.worcester_0 = { playerId: 7, type: 'cottonMill', level: 2, flipped: false, resourceCubes: 0 }; return d; },
        'unknown connection': () => { const d = good(); d.boardLinks['leek-london'] = { playerId: 0, type: 'canal' }; return d; },
        'canal on a rail-only line': () => { const d = good(); d.boardLinks['birmingham-nuneaton'] = { playerId: 0, type: 'canal' }; return d; },
        'coal market overflow': () => ({ ...good(), coalMarket: 15 }),
        'bad merchant tile': () => { const d = good(); d.merchantTiles[0].buys = 'coalMine'; return d; },
        'bad wild pile': () => ({ ...good(), wildLocationPile: 5 }),
        'missing board': () => { const d = good(); delete d.boardIndustries; return d; },
    };
    for (const [name, make] of Object.entries(cases)) {
        assert.throws(() => E.GameState.deserialize(make()), (err) => {
            assert.equal(err.name, 'GameStateError', `${name}: ${err.message}`);
            return true;
        }, name);
    }
    // The untouched save still loads
    assert.equal(ser(E.GameState.deserialize(good())), ser(state));
});

test('a game saved while an income shortfall is pending restores and continues', () => {
    const { state } = midGame(3, 81, 40);
    const pid = state.players.findIndex(p => state.ownedTileKeys(p.id).length > 0);
    assert.ok(pid >= 0, 'fixture needs a player with tiles');
    state.players[pid].money = -3;
    const restored = E.GameState.deserialize(JSON.stringify(state.serialize()));
    assert.deepEqual(plain(restored.getPendingShortfalls()), [pid]);
    const logic = new E.GameLogic(restored);
    const moves = logic.getLegalMoves(pid);
    assert.ok(moves.length > 0 && moves.every(m => m.type === 'shortfall'));
    assert.equal(logic.applyMove(pid, moves[0]).success, true);
});
