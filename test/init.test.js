'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { newGame, plain } = require('./helpers/scenario');
const { checkInvariants } = require('./helpers/invariants');

// Rulebook: 64 Location and Industry cards in the full (4-player) deck;
// lower player counts remove cards marked for more players.
const DECK_TOTAL = { 2: 40, 3: 54, 4: 64 };
const MERCHANT_TILES = { 2: 5, 3: 7, 4: 9 };

for (const players of [2, 3, 4]) {
    test(`${players}-player setup follows the rulebook`, () => {
        const { E, state } = newGame({ players, seed: players });

        // Cards: 8 per hand + 1 face-down discard per player, rest in the deck
        const total = DECK_TOTAL[players];
        assert.equal(state.drawDeck.length, total - 9 * players);
        for (const p of state.players) assert.equal(p.hand.length, 8);
        const deckData = E.CARD_DECK[players];
        const counted = Object.values(deckData.locations).reduce((a, b) => a + b, 0) +
            Object.values(deckData.industries).reduce((a, b) => a + b, 0) +
            (deckData.dualCottonManufacturer || 0);
        assert.equal(counted, total);

        // Player area: £17, income marker on space 10 (level 0), 14 links
        for (const p of state.players) {
            assert.equal(p.money, 17);
            assert.equal(p.incomeSpace, 10);
            assert.equal(state.getIncomeLevel(p.id), 0);
            assert.equal(p.vp, 0);
            assert.deepEqual({ ...p.linksRemaining }, { canal: 14, rail: 14 });
        }

        // Markets: coal 13 cubes (one £1 open), iron 8 (both £1 open)
        assert.equal(state.coalMarket, 13);
        assert.equal(state.ironMarket, 8);
        assert.equal(state.getCoalPrice(), 1);
        assert.equal(state.getIronPrice(), 2);

        // Merchants: 2p none at Warrington/Nottingham, 3p none at Nottingham
        assert.equal(state.merchantTiles.length, MERCHANT_TILES[players]);
        const locations = new Set(state.merchantTiles.map(m => m.location));
        assert.equal(locations.has('warrington'), players >= 3);
        assert.equal(locations.has('nottingham'), players >= 4);
        for (const mt of state.merchantTiles) assert.equal(mt.hasBeer, mt.buys !== 'blank');

        // Turn structure: Canal Era, round 1 has a single action
        assert.equal(state.era, E.ERA.CANAL);
        assert.equal(state.round, 1);
        assert.equal(state.actionsPerTurn, 1);
        assert.deepEqual(plain(state.turnOrder).sort(), plain(state.players.map(p => p.id)));
        assert.equal(state.wildLocationPile, 4);
        assert.equal(state.wildIndustryPile, 4);

        assert.deepEqual(plain(checkInvariants(E, state)), []);
    });
}

test('location banners: 2p deck has no blue/teal towns, 3p no teal towns', () => {
    const towns = (players) => {
        const { E } = newGame({ players });
        return new Set(Object.keys(E.CARD_DECK[players].locations));
    };
    const teal = ['belper', 'derby'];
    const blue = ['leek', 'stokeOnTrent', 'stone', 'uttoxeter'];
    for (const t of [...teal, ...blue]) assert.ok(!towns(2).has(t), `2p deck contains ${t}`);
    for (const t of teal) assert.ok(!towns(3).has(t), `3p deck contains ${t}`);
    for (const t of blue) assert.ok(towns(3).has(t), `3p deck lacks ${t}`);
    for (const t of [...teal, ...blue]) assert.ok(towns(4).has(t), `4p deck lacks ${t}`);
});
