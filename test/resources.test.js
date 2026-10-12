'use strict';

// Coal, iron and beer sourcing and the coal/iron markets.

const test = require('node:test');
const assert = require('node:assert/strict');
const { newGame, loc, setHand, placeIndustry, placeLink, emptyHands } = require('./helpers/scenario');

function setup(players = 3) {
    const g = newGame({ players, seed: 11 });
    emptyHands(g.state);
    return g;
}

test('Coal for a build comes from the closest connected mine first', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    const near = placeIndustry(E, state, 'dudley_0', 1, T.COAL_MINE, 2);          // distance 0
    const far = placeIndustry(E, state, 'wolverhampton_1', 2, T.COAL_MINE, 2);    // distance 1
    placeLink(state, 'dudley-wolverhampton', 2);
    setHand(state, 0, [loc('dudley')]);
    const r = logic.executeBuild(0, 'dudley', 1, T.IRON_WORKS, 0);
    assert.equal(r.success, true, r.message);
    assert.equal(near.resourceCubes, 2);
    assert.equal(far.resourceCubes, 3);
    // Iron Works I sells 2 of its 4 cubes into the two empty £1 iron spaces
    assert.equal(state.ironMarket, 10);
    assert.equal(state.boardIndustries.dudley_1.resourceCubes, 2);
    assert.equal(state.players[0].money, 17 - 5 + 2);
});

test('Market coal needs a merchant connection; an empty market sells at £8', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    setHand(state, 0, [loc('redditch')]);
    const ironAtRedditch = () => logic.getValidBuildTargets(0)
        .filter(t => t.cityId === 'redditch' && t.industryType === T.IRON_WORKS);
    assert.equal(ironAtRedditch().length, 0, 'no coal without a merchant connection');

    placeLink(state, 'gloucester-redditch', 1);
    assert.equal(ironAtRedditch()[0].cost.coalCost, 1);
    state.coalMarket = 0;
    assert.equal(ironAtRedditch()[0].cost.coalCost, 8);
});

test('A merchant space with no tiles still counts as a merchant connection (rulebook p.8-9)', () => {
    const { E, state, logic } = setup(3); // Nottingham has no tiles at 3 players
    assert.ok(!state.merchantTiles.some(m => m.location === 'nottingham'));
    placeLink(state, 'derby-nottingham', 1);
    setHand(state, 0, [loc('derby')]);
    const t = logic.getValidBuildTargets(0).find(x => x.cityId === 'derby' && x.industryType === E.INDUSTRY_TYPES.IRON_WORKS);
    assert.ok(t, 'market coal reachable through Nottingham');
});

test('Iron: Iron Works anywhere (no connection) first, then market; empty market sells at £6', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    setHand(state, 0, [loc('leek'), loc('leek')]);
    state.ironMarket = 0;
    let r = logic.executeDevelop(0, T.COTTON_MILL, null, 0);
    assert.equal(r.success, true, r.message);
    assert.equal(state.players[0].money, 17 - 6);

    const works = placeIndustry(E, state, 'coalbrookdale_1', 2, T.IRON_WORKS, 2, { cubes: 1 });
    r = logic.executeDevelop(0, T.COTTON_MILL, null, 0);
    assert.equal(r.success, true, r.message);
    assert.equal(state.players[0].money, 11, 'works iron is free');
    assert.equal(works.flipped, true, 'emptied works flips');
    assert.equal(state.players[2].incomeSpace, 10 + 3, "works owner's income rises");
});

test('A Coal Mine sells to the market only when connected to a merchant', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    setHand(state, 0, [loc('dudley')]);
    let r = logic.executeBuild(0, 'dudley', 0, T.COAL_MINE, 0);
    assert.equal(r.success, true, r.message);
    assert.equal(state.boardIndustries.dudley_0.resourceCubes, 2);
    assert.equal(state.coalMarket, 13);

    setHand(state, 1, [loc('redditch')]);
    placeLink(state, 'gloucester-redditch', 2);
    r = logic.executeBuild(1, 'redditch', 0, T.COAL_MINE, 0);
    assert.equal(r.success, true, r.message);
    // Only one coal space (£1) is empty, filled first-most-expensive
    assert.equal(state.coalMarket, 14);
    assert.equal(state.boardIndustries.redditch_0.resourceCubes, 1);
    assert.equal(state.players[1].money, 17 - 5 + 1);
});

test('An Iron Works that sells all its cubes flips at once and raises income', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    state.ironMarket = 6; // empty spaces: £2, £2, £1, £1
    placeLink(state, 'gloucester-redditch', 2);
    setHand(state, 0, [loc('redditch')]);
    const r = logic.executeBuild(0, 'redditch', 1, T.IRON_WORKS, 0);
    assert.equal(r.success, true, r.message);
    const tile = state.boardIndustries.redditch_1;
    assert.equal(tile.flipped, true);
    assert.equal(tile.resourceCubes, 0);
    assert.equal(state.players[0].money, 17 - 5 - 1 + 6);
    assert.equal(state.players[0].incomeSpace, 13);
});

test('Breweries hold 1 barrel when built in the Canal Era and 2 in the Rail Era', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    state.players[0].money = 50;
    setHand(state, 0, [loc('uttoxeter')]);
    assert.equal(logic.executeBuild(0, 'uttoxeter', 0, T.BREWERY, 0).success, true);
    assert.equal(state.boardIndustries.uttoxeter_0.resourceCubes, 1);

    state.era = E.ERA.RAIL;
    setHand(state, 1, [loc('uttoxeter')]);
    state.players[1].industryTiles[T.BREWERY][0].used = true; // Brewery I is Canal-only
    state.players[1].industryTiles[T.BREWERY][1].used = true;
    assert.equal(logic.executeBuild(1, 'uttoxeter', 1, T.BREWERY, 0).success, true);
    assert.equal(state.boardIndustries.uttoxeter_1.resourceCubes, 2);
});

test('Overbuilding: own tiles with a higher level; opponent mines only when coal is exhausted', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    // Player 0 overbuilds their own Coal Mine I
    placeIndustry(E, state, 'dudley_0', 0, T.COAL_MINE, 1, { flipped: true });
    setHand(state, 0, [loc('dudley')]);
    assert.ok(logic.getValidBuildTargets(0).some(t => t.cityId === 'dudley' && t.slotIndex === 0));

    // Player 1 may not overbuild it while any coal exists (market has 13)
    setHand(state, 1, [loc('dudley')]);
    state.players[1].industryTiles[T.COAL_MINE][0].used = true; // next is Level II
    const canOverbuild = () => logic.getValidBuildTargets(1).some(t => t.cityId === 'dudley' && t.slotIndex === 0);
    assert.equal(canOverbuild(), false);
    state.coalMarket = 0;
    assert.equal(canOverbuild(), true, 'no coal on the board or in the market');

    // Never an opponent's non-resource industry
    placeIndustry(E, state, 'birmingham_1', 0, T.MANUFACTURER, 1, { flipped: true });
    setHand(state, 1, [loc('birmingham')]);
    state.players[1].industryTiles[T.MANUFACTURER][0].used = true;
    assert.equal(logic.getValidBuildTargets(1).some(t => t.cityId === 'birmingham' && t.slotIndex === 1), false);
});
