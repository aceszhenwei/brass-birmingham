'use strict';

// Legal and illegal examples of each of the seven actions. Illegal attempts
// must be rejected by the action itself (not only hidden by the UI) and must
// leave the state untouched.

const test = require('node:test');
const assert = require('node:assert/strict');
const { newGame, plain, loc, ind, wildLoc, wildInd, setHand, placeIndustry, placeLink, emptyHands } = require('./helpers/scenario');

function setup(players = 3) {
    const g = newGame({ players, seed: 7 });
    emptyHands(g.state);
    return g;
}
const snapshot = (state) => JSON.stringify({
    players: state.players, board: state.boardIndustries, farms: state.breweryFarmTiles,
    links: state.boardLinks, coal: state.coalMarket, iron: state.ironMarket,
    merchants: state.merchantTiles, wl: state.wildLocationPile, wi: state.wildIndustryPile,
});
function assertRejected(state, fn) {
    const before = snapshot(state);
    const result = fn();
    assert.equal(result.success, false, `expected rejection, got: ${result.message}`);
    assert.equal(snapshot(state), before, 'a rejected action changed the state');
    return result;
}
const targetsAt = (logic, pid, cityId, type) =>
    logic.getValidBuildTargets(pid).filter(t => t.cityId === cityId && (!type || t.industryType === type));

// ---------------------------------------------------------------- BUILD

test('Build: a Location card builds at that location and pays the tile cost', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    setHand(state, 0, [loc('birmingham')]);
    const r = logic.executeBuild(0, 'birmingham', 0, T.COTTON_MILL, 0);
    assert.equal(r.success, true, r.message);
    const tile = state.boardIndustries.birmingham_0;
    assert.equal(tile.type, T.COTTON_MILL);
    assert.equal(tile.tileData.level, 1);
    assert.equal(tile.playerId, 0);
    assert.equal(state.players[0].money, 17 - 12);
    assert.equal(state.players[0].hand.length, 0);
    assert.equal(state.moneySpentThisRound[0], 12);
});

test('Build: rejects a card for another location and a slot of the wrong type', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    setHand(state, 0, [loc('worcester')]);
    assertRejected(state, () => logic.executeBuild(0, 'birmingham', 0, T.COTTON_MILL, 0));
    setHand(state, 0, [loc('birmingham')]);
    assertRejected(state, () => logic.executeBuild(0, 'birmingham', 1, T.COTTON_MILL, 0)); // Manufacturer-only slot
});

test('Build: a single-icon space must be used before a two-icon space', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    placeLink(state, 'birmingham-oxford', 2); // market coal for Manufacturer I
    setHand(state, 0, [loc('birmingham')]);
    const slots = () => targetsAt(logic, 0, 'birmingham', T.MANUFACTURER).map(t => t.slotIndex).sort();
    assert.deepEqual(plain(slots()), [1, 3]);
    assertRejected(state, () => logic.executeBuild(0, 'birmingham', 0, T.MANUFACTURER, 0));
    // Once the Manufacturer-only spaces are taken, the shared space opens up
    placeIndustry(E, state, 'birmingham_1', 1, T.MANUFACTURER, 1);
    placeIndustry(E, state, 'birmingham_3', 2, T.MANUFACTURER, 1);
    assert.deepEqual(plain(slots()), [0]);
});

test('Build: Industry cards need the location in your network, unless you have no tiles at all', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    setHand(state, 0, [ind(T.COTTON_MILL, T.MANUFACTURER)]);
    assert.ok(targetsAt(logic, 0, 'worcester', T.COTTON_MILL).length > 0, 'empty-board exception');

    placeLink(state, 'redditch-oxford', 0); // now on the board, far from Worcester
    assert.equal(targetsAt(logic, 0, 'worcester').length, 0);
    assertRejected(state, () => logic.executeBuild(0, 'worcester', 0, T.COTTON_MILL, 0));
    // Redditch is adjacent to the link, so it is in the network
    setHand(state, 0, [ind(T.IRON_WORKS)]);
    assert.ok(targetsAt(logic, 0, 'redditch', T.IRON_WORKS).length > 0);
});

test('Build: Canal Era allows one tile per location per player', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    placeIndustry(E, state, 'birmingham_2', 0, T.IRON_WORKS, 1, { flipped: true });
    setHand(state, 0, [loc('birmingham')]);
    assert.equal(targetsAt(logic, 0, 'birmingham', T.COTTON_MILL).length, 0);
    assertRejected(state, () => logic.executeBuild(0, 'birmingham', 0, T.COTTON_MILL, 0));
    // ...but other players may still build there
    setHand(state, 1, [loc('birmingham')]);
    assert.ok(targetsAt(logic, 1, 'birmingham', T.COTTON_MILL).length > 0);
});

test('Build: rejects unaffordable builds', () => {
    const { E, state, logic } = setup();
    state.players[0].money = 11;
    setHand(state, 0, [loc('birmingham')]);
    assertRejected(state, () => logic.executeBuild(0, 'birmingham', 0, E.INDUSTRY_TYPES.COTTON_MILL, 0));
});

test('Build: era restrictions — no Level I in the Rail Era, no Rail-only tiles in the Canal Era', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    setHand(state, 0, [loc('worcester')]);
    state.era = E.ERA.RAIL;
    assert.equal(targetsAt(logic, 0, 'worcester', T.COTTON_MILL).length, 0, 'Cotton I is Canal-only');

    state.era = E.ERA.CANAL;
    for (const t of state.players[0].industryTiles[T.BREWERY]) if (t.level < 4) t.used = true;
    setHand(state, 0, [loc('uttoxeter')]);
    assert.equal(targetsAt(logic, 0, 'uttoxeter', T.BREWERY).length, 0, 'Brewery IV is Rail-only');
});

test('Build: Pottery I may be built in the Rail Era (rulebook p.12)', () => {
    const { E, state, logic } = setup();
    state.era = E.ERA.RAIL;
    state.players[0].money = 30; // £17 + 1 market iron
    setHand(state, 0, [loc('stafford')]);
    assert.ok(targetsAt(logic, 0, 'stafford', E.INDUSTRY_TYPES.POTTERY).length > 0);
});

test('Build: Farm Breweries take Brewery/Wild Industry cards, never a Wild Location', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    setHand(state, 0, [wildLoc()]);
    assert.equal(targetsAt(logic, 0, 'northern').length, 0);
    setHand(state, 0, [ind(T.BREWERY)]);
    assert.ok(targetsAt(logic, 0, 'northern', T.BREWERY).length > 0);
    const r = logic.executeBuild(0, 'northern', 0, T.BREWERY, 0);
    assert.equal(r.success, true, r.message);
    assert.equal(state.breweryFarmTiles.northern.resourceCubes, 1);
});

test('Build: a played wild card returns to its pile', () => {
    const { E, state, logic } = setup();
    setHand(state, 0, [wildLoc()]);
    state.wildLocationPile = 3;
    const r = logic.executeBuild(0, 'worcester', 0, E.INDUSTRY_TYPES.COTTON_MILL, 0);
    assert.equal(r.success, true, r.message);
    assert.equal(state.wildLocationPile, 4);
    assert.equal(state.playerHasWildCard(0), false);
});

// ---------------------------------------------------------------- NETWORK

test('Network: a canal link adjacent to your network costs £3', () => {
    const { E, state, logic } = setup();
    placeIndustry(E, state, 'birmingham_0', 0, E.INDUSTRY_TYPES.COTTON_MILL, 1);
    setHand(state, 0, [loc('leek')]);
    const r = logic.executeNetwork(0, 'birmingham-coventry', 0);
    assert.equal(r.success, true, r.message);
    assert.equal(state.players[0].money, 14);
    assert.equal(state.players[0].linksRemaining.canal, 13);
    assert.equal(state.boardLinks['birmingham-coventry'].type, 'canal');
});

test('Network: rejects non-adjacent links and rail-only lines in the Canal Era', () => {
    const { E, state, logic } = setup();
    placeIndustry(E, state, 'birmingham_0', 0, E.INDUSTRY_TYPES.COTTON_MILL, 1);
    setHand(state, 0, [loc('leek')]);
    assertRejected(state, () => logic.executeNetwork(0, 'leek-stokeOnTrent', 0));
    assertRejected(state, () => logic.executeNetwork(0, 'birmingham-nuneaton', 0));
});

test('Network: a rail link costs £5 plus 1 coal, and needs a coal source', () => {
    const { E, state, logic } = setup();
    state.era = E.ERA.RAIL;
    placeIndustry(E, state, 'birmingham_1', 0, E.INDUSTRY_TYPES.MANUFACTURER, 2);
    setHand(state, 0, [loc('leek')]);
    // Coventry: no mine and no merchant connection -> no coal
    const offered = logic.getValidNetworkTargets(0).map(t => t.connectionId);
    assert.ok(!offered.includes('birmingham-coventry'));
    assertRejected(state, () => logic.executeNetwork(0, 'birmingham-coventry', 0));
    // Oxford is a merchant, so market coal (£1) is available
    const r = logic.executeNetwork(0, 'birmingham-oxford', 0);
    assert.equal(r.success, true, r.message);
    assert.equal(state.players[0].money, 17 - 5 - 1);
    assert.equal(state.coalMarket, 12);
    assert.equal(state.boardLinks['birmingham-oxford'].type, 'rail');
});

test('Network: double rail link costs £15 + 2 coal + 1 brewery beer', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    state.era = E.ERA.RAIL;
    placeIndustry(E, state, 'birmingham_1', 0, T.MANUFACTURER, 2);
    const brewery = placeIndustry(E, state, 'walsall_1', 0, T.BREWERY, 2); // 2 barrels (Rail)
    setHand(state, 0, [loc('leek')]);
    state.players[0].money = 18;

    // Market coal: the first cube costs £1, the next £2 (13 -> 12 -> 11 cubes)
    const seconds = logic.getValidSecondRailLinks(0, 'birmingham-oxford');
    const second = seconds.find(s => s.connectionId === 'redditch-oxford');
    assert.ok(second, 'Redditch-Oxford should be offered');
    assert.equal(second.totalCost, 15 + 1 + 2);

    const r = logic.executeNetworkDouble(0, 'birmingham-oxford', 'redditch-oxford', 0);
    assert.equal(r.success, true, r.message);
    assert.equal(state.players[0].money, 0);
    assert.equal(state.players[0].linksRemaining.rail, 12);
    assert.equal(state.coalMarket, 11);
    assert.equal(brewery.resourceCubes, 1);
});

test('Network: double rail link is rejected without brewery beer (merchant beer does not count)', () => {
    const { E, state, logic } = setup();
    state.era = E.ERA.RAIL;
    placeIndustry(E, state, 'birmingham_1', 0, E.INDUSTRY_TYPES.MANUFACTURER, 2);
    setHand(state, 0, [loc('leek')]);
    assert.equal(logic.getValidSecondRailLinks(0, 'birmingham-oxford').length, 0);
    assertRejected(state, () => logic.executeNetworkDouble(0, 'birmingham-oxford', 'redditch-oxford', 0));
});

// ---------------------------------------------------------------- DEVELOP

test('Develop: removes the lowest tile for 1 iron (market iron starts at £2)', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    setHand(state, 0, [loc('leek')]);
    const r = logic.executeDevelop(0, T.COTTON_MILL, null, 0);
    assert.equal(r.success, true, r.message);
    assert.equal(state.getCurrentLevel(0, T.COTTON_MILL), 1, 'Cotton has 3 Level I tiles');
    assert.equal(state.players[0].industryTiles[T.COTTON_MILL].filter(t => t.used).length, 1);
    assert.equal(state.players[0].money, 15);
    assert.equal(state.ironMarket, 7);
});

test('Develop: two tiles in one action cost one iron each', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    setHand(state, 0, [loc('leek')]);
    const r = logic.executeDevelop(0, T.COAL_MINE, T.IRON_WORKS, 0);
    assert.equal(r.success, true, r.message);
    assert.equal(state.getCurrentLevel(0, T.COAL_MINE), 2);
    assert.equal(state.getCurrentLevel(0, T.IRON_WORKS), 2);
    assert.equal(state.players[0].money, 17 - 2 - 2);
});

test('Develop: iron from any Iron Works is free and needs no connection', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    const works = placeIndustry(E, state, 'dudley_1', 1, T.IRON_WORKS, 2, { cubes: 3 });
    setHand(state, 0, [loc('leek')]);
    const r = logic.executeDevelop(0, T.COTTON_MILL, null, 0);
    assert.equal(r.success, true, r.message);
    assert.equal(works.resourceCubes, 2);
    assert.equal(state.players[0].money, 17);
});

test('Develop: rejects lightbulb Pottery tiles and unaffordable iron', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    setHand(state, 0, [loc('leek')]);
    assertRejected(state, () => logic.executeDevelop(0, T.POTTERY, null, 0)); // Pottery I
    state.players[0].money = 1;
    assertRejected(state, () => logic.executeDevelop(0, T.COTTON_MILL, null, 0));
});

// ---------------------------------------------------------------- SELL

function sellSetup() {
    const g = setup();
    const { E, state } = g;
    state.merchantTiles = [
        { location: 'oxford', buys: 'any', hasBeer: true },
        { location: 'oxford', buys: 'blank', hasBeer: false },
    ];
    placeIndustry(E, state, 'birmingham_0', 0, E.INDUSTRY_TYPES.COTTON_MILL, 1);
    placeLink(state, 'birmingham-oxford', 0);
    setHand(state, 0, [loc('leek')]);
    return g;
}

test('Sell: flips the tile, consumes brewery beer and advances income', () => {
    const { E, state, logic } = sellSetup();
    const brewery = placeIndustry(E, state, 'walsall_1', 0, E.INDUSTRY_TYPES.BREWERY, 1);
    const r = logic.executeSell(0, [{ key: 'birmingham_0', useMerchantBeer: false }], 0);
    assert.equal(r.success, true, r.message);
    assert.equal(state.boardIndustries.birmingham_0.flipped, true);
    assert.equal(brewery.flipped, true, 'emptied brewery flips');
    // +5 spaces (Cotton I) +4 spaces (Brewery I flipped), both owned by player 0
    assert.equal(state.players[0].incomeSpace, 10 + 5 + 4);
    assert.equal(state.merchantTiles[0].hasBeer, true, 'merchant beer untouched');
});

test('Sell: merchant beer grants the merchant bonus (Oxford: +2 income spaces)', () => {
    const { state, logic } = sellSetup();
    const r = logic.executeSell(0, [{ key: 'birmingham_0', useMerchantBeer: true }], 0);
    assert.equal(r.success, true, r.message);
    assert.equal(state.merchantTiles[0].hasBeer, false);
    assert.equal(state.players[0].incomeSpace, 10 + 5 + 2);
});

test('Sell: rejected without a connected merchant that buys the good', () => {
    const { state, logic } = sellSetup();
    state.merchantTiles[0].buys = 'pottery';
    assertRejected(state, () => logic.executeSell(0, [{ key: 'birmingham_0', useMerchantBeer: true }], 0));
    state.merchantTiles[0].buys = 'any';
    delete state.boardLinks['birmingham-oxford'];
    assert.equal(logic.getValidSellTargets(0).length, 0);
    assertRejected(state, () => logic.executeSell(0, [{ key: 'birmingham_0', useMerchantBeer: true }], 0));
});

test("Sell: rejected without beer; an opponent's brewery only counts when connected", () => {
    const { E, state, logic } = sellSetup();
    state.merchantTiles[0].hasBeer = false;
    assertRejected(state, () => logic.executeSell(0, [{ key: 'birmingham_0', useMerchantBeer: false }], 0));

    placeIndustry(E, state, 'walsall_1', 1, E.INDUSTRY_TYPES.BREWERY, 1);
    assertRejected(state, () => logic.executeSell(0, [{ key: 'birmingham_0', useMerchantBeer: false }], 0));

    placeLink(state, 'birmingham-walsall', 1);
    const r = logic.executeSell(0, [{ key: 'birmingham_0', useMerchantBeer: false }], 0);
    assert.equal(r.success, true, r.message);
    assert.equal(state.boardIndustries.walsall_1.flipped, true);
    // The brewery's owner gets the brewery's income
    assert.equal(state.players[1].incomeSpace, 10 + 4);
});

// ---------------------------------------------------------------- LOAN

test('Loan: £30 and income drops 3 levels to the top space of the new level', () => {
    const { state, logic } = setup();
    setHand(state, 0, [loc('leek'), loc('leek')]);
    state.players[0].incomeSpace = 20; // level 5
    let r = logic.executeLoan(0, 0);
    assert.equal(r.success, true, r.message);
    assert.equal(state.players[0].money, 47);
    assert.equal(state.getIncomeLevel(0), 2);
    assert.equal(state.players[0].incomeSpace, 14);
    assert.equal(state.moneySpentThisRound[0] || 0, 0, 'a loan is not money spent');

    state.players[0].incomeSpace = 10; // level 0
    r = logic.executeLoan(0, 0);
    assert.equal(r.success, true, r.message);
    assert.equal(state.players[0].incomeSpace, 7); // level -3
});

test('Loan: rejected if it would take income below -10', () => {
    const { state, logic } = setup();
    setHand(state, 0, [loc('leek')]);
    state.players[0].incomeSpace = 2; // level -8
    assertRejected(state, () => logic.executeLoan(0, 0));
});

// ---------------------------------------------------------------- SCOUT

test('Scout: discard 3 cards for a Wild Location and a Wild Industry', () => {
    const { state, logic } = setup();
    setHand(state, 0, [loc('leek'), loc('stone'), loc('derby'), loc('stafford')]);
    const r = logic.executeScout(0, [0, 1, 2]);
    assert.equal(r.success, true, r.message);
    assert.deepEqual(plain(state.players[0].hand.map(c => c.type)), ['location', 'wildLocation', 'wildIndustry']);
    assert.equal(state.wildLocationPile, 3);
    assert.equal(state.wildIndustryPile, 3);
});

test('Scout: rejected while holding a wild card, with too few cards, or with repeated cards', () => {
    const { state, logic } = setup();
    setHand(state, 0, [loc('leek'), loc('stone'), wildInd()]);
    assertRejected(state, () => logic.executeScout(0, [0, 1, 2]));

    setHand(state, 0, [loc('leek'), loc('stone')]);
    assertRejected(state, () => logic.executeScout(0, [0, 1, 1]));

    setHand(state, 0, [loc('leek'), loc('stone'), loc('derby')]);
    assertRejected(state, () => logic.executeScout(0, [0, 0, 1]));
});

// ---------------------------------------------------------------- PASS

test('Pass: discards the chosen card; rejected without a real card', () => {
    const { state, logic } = setup();
    setHand(state, 0, [loc('leek'), loc('stone')]);
    const r = logic.executePass(0, 1);
    assert.equal(r.success, true);
    assert.deepEqual(plain(state.players[0].hand.map(c => c.location)), ['leek']);
    assertRejected(state, () => logic.executePass(0, 3));
});

test('Every action is rejected with an empty hand', () => {
    const { E, state, logic } = setup();
    for (const action of Object.values(E.ACTIONS)) {
        assert.equal(logic.canPerformAction(action, 0), false, action);
    }
});
