'use strict';

// Income shortfalls, era scoring and the end of the game.

const test = require('node:test');
const assert = require('node:assert/strict');
const { newGame, placeIndustry, placeLink } = require('./helpers/scenario');

test('Link VP: 1 per link icon on FLIPPED adjacent tiles, 2 per adjacent merchant', () => {
    const { E, state } = newGame({ players: 3, seed: 8 });
    const T = E.INDUSTRY_TYPES;
    placeIndustry(E, state, 'birmingham_0', 0, T.COTTON_MILL, 1, { flipped: true }); // 1 link icon, 5 VP
    placeIndustry(E, state, 'coventry_1', 1, T.MANUFACTURER, 1);                    // unflipped: nothing
    placeLink(state, 'birmingham-coventry', 0);
    placeLink(state, 'birmingham-oxford', 1);

    const scores = state.calculateEraScore();
    const s0 = scores.find(s => s.playerId === 0);
    const s1 = scores.find(s => s.playerId === 1);
    assert.equal(s0.linkVP, 1);
    assert.equal(s0.industryVP, 5);
    assert.equal(s1.linkVP, 1 + 2);
    assert.equal(s1.industryVP, 0, 'unflipped tiles do not score');
    assert.equal(state.players[0].vp, 6);
    assert.equal(state.players[1].vp, 3);
});

test('The Kidderminster-Worcester link also scores the southern Farm Brewery', () => {
    const { E, state } = newGame({ players: 3, seed: 9 });
    placeIndustry(E, state, 'southern', 1, E.INDUSTRY_TYPES.BREWERY, 1, { flipped: true }); // 2 link icons, 4 VP
    placeLink(state, 'kidderminster-worcester', 0);
    const scores = state.calculateEraScore();
    assert.equal(scores.find(s => s.playerId === 0).linkVP, 2);
    assert.equal(scores.find(s => s.playerId === 1).industryVP, 4);
});

test('Level II+ tiles score in both eras', () => {
    const { E, state } = newGame({ players: 2, seed: 10 });
    placeIndustry(E, state, 'birmingham_1', 0, E.INDUSTRY_TYPES.MANUFACTURER, 2, { flipped: true }); // 5 VP
    state.endCanalEra();
    assert.equal(state.players[0].vp, 5);
    const scores = state.endGame();
    assert.equal(state.players[0].vp, 10);
    assert.equal(scores.find(s => s.playerId === 0).totalVP, 10);
    assert.equal(state.gameOver, true);
});

test('Shortfall: sell tiles for half their cost, stopping once covered', () => {
    const { E, state } = newGame({ players: 2, seed: 12 });
    const T = E.INDUSTRY_TYPES;
    placeIndustry(E, state, 'birmingham_0', 0, T.COTTON_MILL, 1);   // cost 12 -> £6
    placeIndustry(E, state, 'coventry_0', 0, T.POTTERY, 1);         // cost 17 -> £8
    state.players[0].money = 1;
    state.players[0].incomeSpace = 5; // level -5
    state.endRound();
    assert.equal(state.players[0].money, 1 - 5 + 6);
    assert.equal(Object.values(state.boardIndustries).filter(t => t.playerId === 0).length, 1);
    assert.ok(state.lastRoundEvents.some(e => e.type === 'shortfall-sale'));
});

test('Shortfall with no tiles to sell costs 1 VP per £1 (never below 0 VP)', () => {
    const { state } = newGame({ players: 2, seed: 13 });
    state.players[0].money = 0;
    state.players[0].vp = 3;
    state.players[0].incomeSpace = 5; // level -5
    state.endRound();
    assert.equal(state.players[0].money, 0);
    assert.equal(state.players[0].vp, 0);
});

test('Income track: spaces map to levels; flips advance by spaces; capped at space 99 (level 30)', () => {
    const { E, state } = newGame({ players: 2, seed: 14 });
    const level = E.incomeLevelFromSpace;
    assert.equal(level(0), -10);
    assert.equal(level(10), 0);
    assert.equal(level(12), 1);
    assert.equal(level(30), 10);
    assert.equal(level(33), 11);
    assert.equal(level(64), 21);
    assert.equal(level(99), 30);
    state.advanceIncomeSpaces(0, 500);
    assert.equal(state.players[0].incomeSpace, 99);
    assert.equal(state.getIncomeLevel(0), 30);
});
