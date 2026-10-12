'use strict';

// Engine-controlled game progression (Assignment 4): the engine decides whose
// decision is next, enforces it, and runs turns, rounds, income, shortfalls,
// era transitions and final scoring by itself.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { createGame, playActions, aiSeedFor } = require('./helpers/headless');
const { checkInvariants } = require('./helpers/invariants');
const { fingerprint } = require('./helpers/fingerprint');
const { plain, placeIndustry } = require('./helpers/scenario');

const E = loadEngine();
const ROUNDS = { 2: 10, 3: 9, 4: 8 };
const ser = (state) => JSON.stringify(state.serialize());
const pass = () => ({ type: 'pass', card: 0 });

function newGame(players = 3, seed = 5, ai = false) {
    const names = ['A', 'B', 'C', 'D'].slice(0, players);
    const state = new E.GameState(players, names, names.map(() => ({ isAI: ai })), { seed });
    return { state, logic: new E.GameLogic(state) };
}

test('the engine reports the decision that is due', () => {
    const { state, logic } = newGame(3);
    assert.deepEqual(plain(logic.getCurrentDecision()),
        { type: 'action', playerId: state.currentPlayerId, actionsLeft: 1, era: 'canal', round: 1 });
    assert.ok(logic.getCurrentLegalMoves().length > 0);
});

test('play() enforces whose decision it is; rejected moves change nothing', () => {
    const { state, logic } = newGame(3);
    const current = state.currentPlayerId;
    const other = (current + 1) % 3;
    const before = ser(state);
    let r = logic.play(other, pass());
    assert.equal(r.success, false);
    assert.match(r.message, /turn/);
    r = logic.play(current, { type: 'shortfall', tile: 'birmingham_0' });
    assert.equal(r.success, false);
    r = logic.play(current, { type: 'pass', card: 42 });
    assert.equal(r.success, false);
    assert.deepEqual(plain(r.events), []);
    assert.equal(ser(state), before);
});

test('events: moves, turn starts and round ends with income and the new turn order', () => {
    const { state, logic } = newGame(3, 6);
    state.players[0].incomeSpace = 16; // level 3
    const events = [];
    for (let i = 0; i < 3; i++) events.push(...logic.play(state.currentPlayerId, pass()).events);
    const types = events.map(e => e.type);
    assert.deepEqual(types.filter(t => t === 'move').length, 3);
    const roundEnd = events.find(e => e.type === 'roundEnd');
    assert.equal(roundEnd.round, 1);
    assert.equal(roundEnd.era, 'canal');
    assert.equal(roundEnd.income[0], 3);
    assert.deepEqual(plain(roundEnd.turnOrder), plain(state.turnOrder));
    assert.equal(events[events.length - 1].type, 'turnStart');
    assert.equal(state.players[0].money, 17 + 3);
});

for (const players of [2, 3, 4]) {
    test(`${players} players: a complete game runs through the engine alone`, () => {
        const { state, logic } = newGame(players, 40 + players);
        const counts = {};
        const actionsByRound = {};
        let lastEra = null;
        const result = logic.runGame((d) => {
            assert.equal(d.type, 'action');
            const key = `${d.era}-${d.round}-${d.playerId}`;
            actionsByRound[key] = (actionsByRound[key] || 0) + 1;
            return pass();
        }, {
            onMove: (r) => {
                for (const ev of r.events) {
                    counts[ev.type] = (counts[ev.type] || 0) + 1;
                    if (ev.type === 'eraEnd') lastEra = ev;
                }
                assert.deepEqual(checkInvariants(E, state), []);
            },
        });
        assert.equal(state.gameOver, true);
        assert.equal(counts.roundEnd, 2 * ROUNDS[players]);
        assert.equal(counts.eraEnd, 1);
        assert.equal(counts.gameEnd, 1);
        assert.equal(lastEra.era, 'canal');
        // Canal round 1: one action each; every other round: two each
        for (const [key, n] of Object.entries(actionsByRound)) {
            const [era, round] = key.split('-');
            assert.equal(n, era === 'canal' && round === '1' ? 1 : 2, key);
        }
        // Total actions = all cards dealt (passes only)
        const total = Object.values(actionsByRound).reduce((a, b) => a + b, 0);
        assert.equal(total, result.moves);
        assert.deepEqual(plain(logic.getCurrentDecision().ranking), plain(state.getFinalRanking()));
        assert.equal(logic.play(state.turnOrder[0], pass()).success, false, 'no moves after the game ends');
        assert.deepEqual(plain(logic.getCurrentLegalMoves()), []);
    });
}

test('no income is collected after the final round of the game', () => {
    const { state, logic } = newGame(2, 7);
    let finalRound = null;
    logic.runGame(() => pass(), {
        onMove: (r) => { for (const ev of r.events) if (ev.type === 'roundEnd') finalRound = ev; },
    });
    assert.equal(finalRound.era, 'rail');
    assert.equal(finalRound.round, ROUNDS[2]);
    assert.equal(finalRound.income, null);
    assert.equal(state.gameOver, true);
});

// Play passes until only the very last action of the Canal Era is left
function toLastCanalAction(players = 3, seed = 8) {
    const g = newGame(players, seed);
    const { state, logic } = g;
    while (!(state.drawDeck.length === 0 && state.players.reduce((n, p) => n + p.hand.length, 0) === 1)) {
        assert.equal(logic.play(state.currentPlayerId, pass()).success, true);
    }
    return g;
}

test('a shortfall in the last Canal round is settled before the era is scored — and survives save/restore', () => {
    const { state, logic } = toLastCanalAction(3, 8);
    const owner = (state.currentPlayerId + 1) % 3;
    // The owner will be short at the final income: level -10, no money,
    // two flipped tiles (5 and 10 VP)
    placeIndustry(E, state, 'birmingham_0', owner, E.INDUSTRY_TYPES.COTTON_MILL, 1, { flipped: true }); // £6, 5 VP
    placeIndustry(E, state, 'stafford_1', owner, E.INDUSTRY_TYPES.POTTERY, 1, { flipped: true });       // £8, 10 VP
    state.players[owner].money = 0;
    state.players[owner].incomeSpace = 0;

    const r = logic.play(state.currentPlayerId, pass());
    assert.equal(r.success, true);
    const types = r.events.map(e => e.type);
    assert.ok(types.includes('roundEnd'));
    assert.ok(types.includes('shortfall'));
    assert.ok(!types.includes('eraEnd'), 'era scoring waits for the shortfall');
    assert.equal(state.era, 'canal');
    assert.deepEqual(plain(logic.getCurrentDecision()), { type: 'shortfall', playerId: owner, owed: 10 });
    assert.deepEqual(checkInvariants(E, state), []);

    // Save now; the restored game knows it still owes the decision and the era end
    const restored = E.GameState.deserialize(JSON.stringify(state.serialize()));
    const rlogic = new E.GameLogic(restored);
    assert.deepEqual(plain(rlogic.getCurrentDecision()), { type: 'shortfall', playerId: owner, owed: 10 });

    for (const [g, lg] of [[state, logic], [restored, rlogic]]) {
        // The owner sells the Pottery (£8) — still £2 short — then the Cotton Mill
        let s = lg.play(owner, { type: 'shortfall', tile: 'stafford_1' });
        assert.equal(s.success, true, s.message);
        assert.ok(!s.events.some(e => e.type === 'eraEnd'));
        s = lg.play(owner, { type: 'shortfall', tile: 'birmingham_0' });
        assert.equal(s.success, true, s.message);
        const eraEnd = s.events.find(e => e.type === 'eraEnd');
        assert.ok(eraEnd, 'the era is scored once the shortfall is covered');
        assert.equal(g.era, 'rail');
        // Sold tiles were not scored
        assert.equal(eraEnd.scores.find(x => x.playerId === owner).industryVP, 0);
        assert.ok(s.events.some(e => e.type === 'turnStart'));
        assert.equal(lg.getCurrentDecision().type, 'action');
    }
    assert.equal(ser(restored), ser(state));
});

test('final ranking: VP, then income level, then money; full ties share a rank', () => {
    const { state } = newGame(4, 9);
    const set = (id, vp, incomeSpace, money) => Object.assign(state.players[id], { vp, incomeSpace, money });
    set(0, 50, 20, 10); // income level 5
    set(1, 50, 20, 30); // same VP and income, more money
    set(2, 50, 30, 0);  // same VP, income level 10
    set(3, 60, 0, 0);
    const ranking = plain(state.getFinalRanking());
    assert.deepEqual(ranking.map(r => [r.playerId, r.rank]), [[3, 1], [2, 2], [1, 3], [0, 4]]);
    set(0, 50, 20, 30); // now identical to player 1
    const tied = plain(state.getFinalRanking());
    assert.deepEqual(tied.map(r => r.rank), [1, 2, 3, 3]);
});

test('human and AI seats get identical engine behaviour', () => {
    // The same seed and the same chooser, with every seat flagged AI vs human
    const run = (ai) => {
        const { state, logic } = newGame(3, 10, ai);
        const aiRng = new E.SeededRandom(aiSeedFor(10));
        playActions(E, state, logic, { aiRng });
        return state;
    };
    const asAI = run(true);
    const asHuman = run(false);
    assert.equal(fingerprint(asHuman), fingerprint(asAI));
    assert.deepEqual(plain(asHuman.getFinalRanking()), plain(asAI.getFinalRanking()));
});

test('saves taken at every lifecycle boundary continue identically', () => {
    for (const [players, seed] of [[2, 501], [3, 502], [4, 503]]) {
        const { state, logic } = createGame(E, { players, seed });
        const aiRng = new E.SeededRandom(aiSeedFor(seed));
        const saves = [];
        const moves = [];
        // Play the whole game, saving after every move that ended a round,
        // raised a shortfall, ended the era, or was a shortfall move
        for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
            const move = d.type === 'shortfall'
                ? logic.defaultShortfallMove(d.playerId)
                : logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng));
            const r = logic.play(d.playerId, move);
            assert.equal(r.success, true, r.message);
            moves.push(move);
            if (move.type === 'shortfall' || r.events.some(e => ['roundEnd', 'shortfall', 'eraEnd'].includes(e.type))) {
                saves.push({ at: moves.length, json: JSON.stringify(state.serialize()) });
            }
        }
        const final = ser(state);
        assert.ok(saves.length >= 2 * ROUNDS[players]);
        for (const save of saves) {
            const restored = E.GameState.deserialize(save.json);
            const rl = new E.GameLogic(restored);
            for (const move of moves.slice(save.at)) {
                const d = rl.getCurrentDecision();
                assert.equal(rl.play(d.playerId, move).success, true);
            }
            assert.equal(ser(restored), final, `${players}p seed ${seed}: restore after move ${save.at}`);
        }
    }
});

test('runGame stops at maxMoves and reports an unfinished game', () => {
    const { state, logic } = newGame(2, 11);
    const r = logic.runGame(() => pass(), { maxMoves: 5 });
    assert.equal(r.moves, 5);
    assert.equal(r.ranking, null);
    assert.equal(state.gameOver, false);
    assert.throws(() => logic.runGame(() => ({ type: 'pass', card: 99 })), /move rejected/);
});
