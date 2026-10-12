'use strict';

// GameState.clone(): complete, independent copies suitable for hypothetical
// simulations.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { createGame, playActions, aiSeedFor } = require('./helpers/headless');
const { checkInvariants } = require('./helpers/invariants');

const E = loadEngine();
const ser = (state) => JSON.stringify(state.serialize());

// A game part-way through the Rail Era: every kind of state is populated
// (hands, deck, discards, tiles with cubes, links, spent money, wild cards…)
function midGame(players = 4, seed = 21, actions = 80) {
    const { state, logic } = createGame(E, { players, seed });
    const aiRng = new E.SeededRandom(aiSeedFor(seed));
    playActions(E, state, logic, { aiRng, maxActions: actions });
    return { state, logic, aiRng };
}

// Every object reachable from root (arrays and plain/class objects)
function reachableObjects(root) {
    const seen = new Set();
    const stack = [root];
    while (stack.length) {
        const o = stack.pop();
        if (o === null || typeof o !== 'object' || seen.has(o)) continue;
        seen.add(o);
        for (const v of Object.values(o)) stack.push(v);
    }
    return seen;
}

test('a clone serializes identically and preserves every component', () => {
    const { state } = midGame();
    assert.equal(state.era, E.ERA.RAIL, 'fixture should reach the Rail Era');
    const copy = state.clone();
    assert.equal(ser(copy), ser(state));

    // Spot-check the components explicitly
    assert.equal(copy.era, state.era);
    assert.equal(copy.round, state.round);
    assert.equal(copy.currentPlayerId, state.currentPlayerId);
    assert.equal(copy.actionsThisTurn, state.actionsThisTurn);
    assert.deepEqual(copy.turnOrder, state.turnOrder);
    assert.deepEqual(copy.moneySpentThisRound, state.moneySpentThisRound);
    assert.deepEqual(copy.rng.getState(), state.rng.getState());
    assert.deepEqual(copy.drawDeck, state.drawDeck);
    assert.equal(copy.coalMarket, state.coalMarket);
    assert.equal(copy.ironMarket, state.ironMarket);
    assert.deepEqual(copy.merchantTiles, state.merchantTiles);
    assert.deepEqual(copy.boardLinks, state.boardLinks);
    assert.equal(copy.wildLocationPile, state.wildLocationPile);
    for (const [i, p] of state.players.entries()) {
        const q = copy.players[i];
        for (const k of ['name', 'money', 'vp', 'incomeSpace', 'isAI', 'aiDifficulty', 'color']) assert.equal(q[k], p[k], k);
        assert.deepEqual(q.hand, p.hand);
        assert.deepEqual(q.discardPile, p.discardPile);
        assert.deepEqual(q.linksRemaining, p.linksRemaining);
        assert.deepEqual(q.industryTiles, p.industryTiles);
    }
    for (const [key, t] of Object.entries(state.boardIndustries)) {
        const u = copy.boardIndustries[key];
        assert.equal(u.playerId, t.playerId);
        assert.equal(u.flipped, t.flipped);
        assert.equal(u.resourceCubes, t.resourceCubes);
        for (const k of ['level', 'vp', 'income', 'linkVP', 'cost', 'beersToSell']) assert.equal(u.tileData[k], t.tileData[k], k);
    }
    assert.deepEqual(checkInvariants(E, copy), []);
});

test('a clone shares no mutable object with the original', () => {
    const { state } = midGame();
    const copy = state.clone();
    const originalObjects = reachableObjects(state);
    for (const o of reachableObjects(copy)) {
        assert.ok(!originalObjects.has(o), 'clone references an object of the original');
    }
});

test('mutating a clone never affects the original (and vice versa)', () => {
    const { state } = midGame();
    const before = ser(state);
    const copy = state.clone();

    // Change every part of the clone
    copy.players[0].hand.pop();
    copy.players[1].hand[0].location = 'nowhere';
    copy.players[0].discardPile.push({ type: 'location', location: 'leek', name: 'Leek' });
    copy.players[2].money += 100;
    copy.players[2].linksRemaining.rail = 0;
    copy.players[3].industryTiles.coalMine.forEach(t => { t.used = !t.used; });
    copy.drawDeck.reverse();
    for (const t of Object.values(copy.boardIndustries)) { t.resourceCubes += 3; t.flipped = !t.flipped; t.tileData.vp = 99; }
    for (const l of Object.values(copy.boardLinks)) l.playerId = 0;
    copy.merchantTiles.forEach(m => { m.hasBeer = !m.hasBeer; });
    copy.turnOrder.reverse();
    copy.moneySpentThisRound[0] = 1234;
    copy.coalMarket = 0;
    copy.rng.next();
    copy.era = E.ERA.CANAL;

    assert.equal(ser(state), before, 'original changed by mutating the clone');

    // ...and the other direction
    const copy2 = state.clone();
    const copy2Before = ser(copy2);
    state.players[0].hand.length = 0;
    state.rng.next();
    for (const t of Object.values(state.boardIndustries)) t.resourceCubes = 0;
    assert.equal(ser(copy2), copy2Before);
});

test('the clone carries the RNG position: both produce the same future draws independently', () => {
    const { state } = midGame(3, 22, 30);
    const copy = state.clone();
    const a = Array.from({ length: 10 }, () => state.rng.next());
    const b = Array.from({ length: 10 }, () => copy.rng.next());
    assert.deepEqual(b, a);
});

test('original and clone continue identically under identical decisions', () => {
    for (const [players, seed, actions] of [[2, 1, 10], [3, 2, 40], [4, 3, 120]]) {
        const { state, logic, aiRng } = midGame(players, seed, actions);
        const copy = state.clone();
        const copyRng = aiRng.clone();
        // Original: the AI decides; clone: the AI decides with a cloned stream
        playActions(E, state, logic, { aiRng });
        playActions(E, copy, new E.GameLogic(copy), { aiRng: copyRng });
        assert.equal(copy.gameOver, true);
        assert.equal(ser(copy), ser(state), `${players}p seed ${seed}`);
    }
});

test('simulating futures on clones never mutates the original', () => {
    const { state, logic } = midGame(4, 23, 50);
    const before = ser(state);
    // 8 rollouts to the end of the game, each with different AI noise
    for (let i = 0; i < 8; i++) {
        const sim = state.clone();
        playActions(E, sim, new E.GameLogic(sim), { aiRng: new E.SeededRandom(1000 + i), difficulty: 'easy' });
        assert.equal(sim.gameOver, true);
    }
    // Read-only queries (including dry runs that place links temporarily)
    const pid = state.currentPlayerId;
    for (const action of Object.values(E.ACTIONS)) logic.canPerformAction(action, pid);
    logic.getValidBuildTargets(pid);
    for (const t of logic.getValidNetworkTargets(pid)) logic.getValidSecondRailLinks(pid, t.connectionId);
    logic.getValidSellTargets(pid);
    E.AIPlayer.chooseAction(state, logic, pid, 'hard', new E.SeededRandom(5));
    assert.equal(ser(state), before);
});

test('clones of special positions: game start, era boundary and game over', () => {
    const start = createGame(E, { players: 2, seed: 9 }).state;
    assert.equal(ser(start.clone()), ser(start));

    const { state, logic, aiRng } = midGame(2, 9, 0);
    // Play until just after the Canal Era ends
    while (state.era === E.ERA.CANAL) playActions(E, state, logic, { aiRng, maxActions: 1 });
    assert.equal(ser(state.clone()), ser(state));
    playActions(E, state, logic, { aiRng });
    assert.equal(state.gameOver, true);
    const finished = state.clone();
    assert.equal(finished.gameOver, true);
    assert.equal(ser(finished), ser(state));
});
