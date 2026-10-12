'use strict';

// Turn progression, turn order, round counts and era transitions.

const test = require('node:test');
const assert = require('node:assert/strict');
const { newGame, plain, loc, setHand, placeIndustry, placeLink } = require('./helpers/scenario');

const ROUNDS = { 2: 10, 3: 9, 4: 8 };

test('Round 1 of the Canal Era has one action per player, later rounds two', () => {
    const { state, logic } = newGame({ players: 3, seed: 3 });
    for (let i = 0; i < 3; i++) {
        assert.equal(state.round, 1);
        assert.equal(logic.getCurrentDecision().actionsLeft, 1);
        assert.equal(logic.play(state.currentPlayerId, { type: 'pass', card: 0 }).success, true);
    }
    assert.equal(state.round, 2);
    assert.equal(state.actionsPerTurn, 2);
    const first = state.currentPlayerId;
    assert.equal(logic.getCurrentDecision().actionsLeft, 2);
    logic.play(first, { type: 'pass', card: 0 });
    assert.equal(state.currentPlayerId, first, 'same player takes a second action');
    assert.equal(state.players[first].hand.length, 7);
    logic.play(first, { type: 'pass', card: 0 });
    assert.notEqual(state.currentPlayerId, first);
    assert.equal(state.players[first].hand.length, 8, 'hand refilled after the turn');
});

test('Turn order: least money spent goes first; ties keep their relative order', () => {
    const { state } = newGame({ players: 4, seed: 4 });
    state.turnOrder = [2, 0, 3, 1];
    state.moneySpentThisRound = { 2: 10, 0: 0, 3: 10, 1: 4 };
    state.endRound();
    assert.deepEqual(plain(state.turnOrder), [0, 1, 2, 3]);
    assert.deepEqual(plain(state.moneySpentThisRound), {});
});

for (const players of [2, 3, 4]) {
    test(`${players} players: each era lasts exactly ${ROUNDS[players]} rounds`, () => {
        const { state, logic } = newGame({ players, seed: 20 + players });
        const lastRound = {};
        logic.runGame(() => ({ type: 'pass', card: 0 }), {
            onMove: (r) => { for (const ev of r.events) if (ev.type === 'roundEnd') lastRound[ev.era] = ev.round; },
        });
        assert.equal(state.gameOver, true);
        assert.equal(lastRound.canal, ROUNDS[players]);
        assert.equal(lastRound.rail, ROUNDS[players]);
    });
}

test('Canal Era end: scores, removes canal links and Level I tiles, resets beer, deals new hands', () => {
    const { E, state } = newGame({ players: 3, seed: 5 });
    const T = E.INDUSTRY_TYPES;
    placeIndustry(E, state, 'birmingham_0', 0, T.COTTON_MILL, 1, { flipped: true });
    placeIndustry(E, state, 'birmingham_1', 1, T.MANUFACTURER, 2, { flipped: true });
    placeIndustry(E, state, 'northern', 2, T.BREWERY, 1);
    placeLink(state, 'birmingham-coventry', 0);
    for (const mt of state.merchantTiles) mt.hasBeer = false;
    state.players[1].hand.push({ type: 'wildLocation', name: 'Wild Location' });
    state.wildLocationPile = 3;

    state.endCanalEra();

    assert.equal(state.era, E.ERA.RAIL);
    assert.equal(state.round, 1);
    assert.equal(state.actionsPerTurn, 2);
    assert.equal(Object.keys(state.boardLinks).length, 0);
    assert.equal(state.players[0].linksRemaining.canal, 14);
    assert.equal(state.boardIndustries.birmingham_0, undefined, 'Level I removed');
    assert.equal(state.breweryFarmTiles.northern, undefined, 'Level I farm brewery removed');
    assert.ok(state.boardIndustries.birmingham_1, 'Level II stays');
    for (const mt of state.merchantTiles) assert.equal(mt.hasBeer, mt.buys !== 'blank');
    assert.equal(state.wildLocationPile, 4);
    for (const p of state.players) assert.equal(p.hand.length, 8);
    assert.equal(state.drawDeck.length, 54 - 3 * 8, 'Rail Era deck has no seeded discards');
});

test('Income is collected every round, including the last Canal round, but not after the final Rail round', () => {
    const { E, state } = newGame({ players: 2, seed: 6 });
    state.players[0].incomeSpace = 16; // level 3
    state.players[1].incomeSpace = 8;  // level -2
    assert.equal(state.endRound(), 'continue');
    assert.equal(state.players[0].money, 20);
    assert.equal(state.players[1].money, 15);

    for (const p of state.players) p.hand = [];
    state.drawDeck = [];
    assert.equal(state.endRound(), 'endCanalEra');
    assert.equal(state.players[0].money, 23, 'final Canal round still pays income');

    state.era = E.ERA.RAIL;
    assert.equal(state.endRound(), 'endGame');
    assert.equal(state.players[0].money, 23, 'no income after the final round of the game');
});
