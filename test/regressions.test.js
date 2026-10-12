'use strict';

// Regression tests for the defects confirmed in docs/brass-review-findings.md.
// Each test reproduces the reported failure; all of them fail on the code
// before the Assignment 1 fixes.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { makeDom } = require('./helpers/dom');
const { playGame, AIActionError } = require('./helpers/headless');
const { newGame, plain, loc, setHand, placeIndustry, placeLink, emptyHands } = require('./helpers/scenario');

const snapshot = (state) => JSON.stringify({
    players: state.players, board: state.boardIndustries, farms: state.breweryFarmTiles,
    links: state.boardLinks, coal: state.coalMarket, iron: state.ironMarket, merchants: state.merchantTiles,
});

// ===================================================================== A1

// Player 0 owns tiles in Birmingham and Coventry, both connected to Oxford,
// whose two merchant tiles buy anything and both hold a beer barrel.
function oxfordSetup() {
    const g = newGame({ players: 3, seed: 31 });
    const { E, state } = g;
    emptyHands(state);
    state.merchantTiles = [
        { location: 'oxford', buys: 'any', hasBeer: true },
        { location: 'oxford', buys: 'any', hasBeer: true },
    ];
    placeLink(state, 'birmingham-oxford', 0);
    placeLink(state, 'birmingham-coventry', 0);
    setHand(state, 0, [loc('leek')]);
    return g;
}

test('A1: a 2-beer tile is not sellable with two merchant barrels and no brewery beer', () => {
    const { E, state, logic } = oxfordSetup();
    placeIndustry(E, state, 'coventry_0', 0, E.INDUSTRY_TYPES.POTTERY, 3); // needs 2 beer
    // Only ONE merchant barrel (beside the tile sold to) may be used per tile
    assert.equal(logic.getValidSellTargets(0).length, 0, 'eligibility must agree with execution');

    const before = snapshot(state);
    const r = logic.executeSell(0, [{ key: 'coventry_0', useMerchantBeer: true }], 0);
    assert.equal(r.success, false);
    assert.equal(snapshot(state), before, 'no barrel consumed, no bonus, card kept');
});

test('A1: one merchant barrel + one brewery barrel sells a 2-beer tile, using exactly one merchant barrel', () => {
    const { E, state, logic } = oxfordSetup();
    const T = E.INDUSTRY_TYPES;
    placeIndustry(E, state, 'coventry_0', 0, T.POTTERY, 3);
    const brewery = placeIndustry(E, state, 'walsall_1', 0, T.BREWERY, 1);
    assert.equal(logic.getValidSellTargets(0).length, 1);
    const r = logic.executeSell(0, [{ key: 'coventry_0', useMerchantBeer: true }], 0);
    assert.equal(r.success, true, r.message);
    assert.equal(state.merchantTiles.filter(m => m.hasBeer).length, 1);
    assert.equal(brewery.flipped, true);
    // +5 (Pottery III) +2 (Oxford bonus) +4 (Brewery I flipped) spaces
    assert.equal(state.players[0].incomeSpace, 10 + 5 + 2 + 4);
});

test('A1: a multi-tile sale that cannot sell every tile changes nothing', () => {
    const { E, state, logic } = oxfordSetup();
    const T = E.INDUSTRY_TYPES;
    for (const mt of state.merchantTiles) mt.hasBeer = false;
    placeIndustry(E, state, 'birmingham_0', 0, T.COTTON_MILL, 1);
    placeIndustry(E, state, 'coventry_1', 0, T.MANUFACTURER, 2);
    placeIndustry(E, state, 'walsall_1', 0, T.BREWERY, 1); // ONE barrel for two tiles
    assert.equal(logic.getValidSellTargets(0).length, 2, 'each tile alone is sellable');

    const plan = [{ key: 'birmingham_0', useMerchantBeer: false }, { key: 'coventry_1', useMerchantBeer: false }];
    assert.equal(logic.planSell(0, plan).ok, false);
    const before = snapshot(state);
    const r = logic.executeSell(0, plan, 0);
    assert.equal(r.success, false);
    assert.equal(snapshot(state), before);
});

test('A1: a merchant barrel and bonus are never spent on a tile that then fails to sell', () => {
    const { E, state, logic } = oxfordSetup();
    const T = E.INDUSTRY_TYPES;
    state.merchantTiles[1].hasBeer = false;
    placeIndustry(E, state, 'birmingham_0', 0, T.COTTON_MILL, 1);   // 1 beer
    placeIndustry(E, state, 'coventry_0', 0, T.POTTERY, 3);         // 2 beer
    placeIndustry(E, state, 'walsall_1', 0, T.BREWERY, 1);          // 1 barrel
    // Cotton takes the brewery barrel; Pottery gets the merchant barrel but
    // has no second beer -> the whole plan must be rejected untouched.
    const plan = [{ key: 'birmingham_0', useMerchantBeer: false }, { key: 'coventry_0', useMerchantBeer: true }];
    const before = snapshot(state);
    assert.equal(logic.executeSell(0, plan, 0).success, false);
    assert.equal(snapshot(state), before);
    // Selling only what the beer supports works
    assert.equal(logic.executeSell(0, [plan[0]], 0).success, true);
});

// ===================================================================== A2

function uiSetup({ ai = true } = {}) {
    const dom = makeDom();
    const E = loadEngine({ seed: 41, extraFiles: ['industryIcons.js', 'uiManager.js'], globals: dom });
    const names = ['A', 'B', 'C'];
    const state = new E.GameState(3, names, names.map(() => ({ isAI: ai, difficulty: 'normal' })));
    const logic = new E.GameLogic(state);
    const ui = new E.UIManager();
    ui.state = state;
    ui.logic = logic;
    ui.renderer = { fullUpdate() {}, clearHighlights() {}, highlightSlots() {}, highlightConnections() {} };
    return { E, dom, state, logic, ui };
}

function silenceConsoleError(fn) {
    const original = console.error;
    console.error = () => {};
    try { return fn(); } finally { console.error = original; }
}

test('A2: a failed AI action passes instead of stalling the interactive game', () => {
    const { dom, state, ui } = uiSetup();
    const aiPlayer = state.currentPlayerId;
    silenceConsoleError(() => {
        ui.selectedAction = 'sell';
        ui.completeAction({ success: false, message: 'Nothing could be sold' });
    });
    assert.notEqual(state.currentPlayerId, aiPlayer, 'turn moved on (round 1 has one action)');
    assert.ok(ui.gameLog.some(e => /AI action failed/.test(e.message)), 'failure is logged');
    assert.ok(dom.timers.length > 0, 'next AI turn scheduled');
});

test('A2: an exception thrown while the AI chooses is recovered the same way', () => {
    const { E, state, ui } = uiSetup();
    const aiPlayer = state.currentPlayerId;
    const original = E.AIPlayer.chooseAction;
    E.AIPlayer.chooseAction = () => { throw new Error('boom'); };
    try {
        silenceConsoleError(() => ui.executeOneAITurn());
    } finally {
        E.AIPlayer.chooseAction = original;
    }
    assert.notEqual(state.currentPlayerId, aiPlayer);
});

test('A2: a failed HUMAN action is cancelled, not auto-passed', () => {
    const { state, ui } = uiSetup({ ai: false });
    const player = state.currentPlayerId;
    const hand = state.currentPlayer.hand.length;
    ui.selectedAction = 'sell';
    ui.completeAction({ success: false, message: 'nope' });
    assert.equal(state.currentPlayerId, player);
    assert.equal(state.currentPlayer.hand.length, hand);
    assert.equal(ui.selectedAction, null);
});

test('A2: the headless test driver fails loudly instead of passing', () => {
    assert.throws(
        () => playGame({ players: 2, seed: 1, chooseAction: () => ({ action: 'sell', pendingData: { sellPlan: [] }, cardIndex: 0 }) }),
        AIActionError);
});

// ===================================================================== A3

test('A3: developing twice from Pottery cannot remove the lightbulb Pottery III', () => {
    const { E, state, logic } = newGame({ players: 3, seed: 51 });
    const T = E.INDUSTRY_TYPES;
    state.players[0].industryTiles[T.POTTERY][0].used = true; // Pottery I built earlier
    // Engine
    const before = snapshot(state);
    assert.equal(logic.executeDevelop(0, T.POTTERY, T.POTTERY, 0).success, false);
    assert.equal(snapshot(state), before);
    // UI / AI option list for the second tile
    assert.ok(!logic.getSecondDevelopOptions(0, T.POTTERY).some(o => o.type === T.POTTERY));
    // A single develop of Pottery II is still legal
    assert.equal(logic.executeDevelop(0, T.POTTERY, null, 0).success, true);
    assert.equal(state.getCurrentLevel(0, T.POTTERY), 3);
});

test('A3: a same-industry double develop is allowed when the second tile is developable', () => {
    const { E, state, logic } = newGame({ players: 3, seed: 52 });
    const T = E.INDUSTRY_TYPES;
    assert.ok(logic.getSecondDevelopOptions(0, T.COTTON_MILL).some(o => o.type === T.COTTON_MILL));
    assert.equal(logic.executeDevelop(0, T.COTTON_MILL, T.COTTON_MILL, 0).success, true);
    assert.equal(state.players[0].industryTiles[T.COTTON_MILL].filter(t => t.used).length, 2);
});

// ===================================================================== A4

function railSetup() {
    const g = newGame({ players: 3, seed: 61 });
    const { E, state } = g;
    emptyHands(state);
    state.era = E.ERA.RAIL;
    placeIndustry(E, state, 'stokeOnTrent_0', 0, E.INDUSTRY_TYPES.MANUFACTURER, 2); // player 0's network
    setHand(state, 0, [loc('leek')]);
    return g;
}

test('A4: rail coal comes from the mine closest to EITHER end of the new link', () => {
    const { E, state, logic } = railSetup();
    const T = E.INDUSTRY_TYPES;
    const leek = placeIndustry(E, state, 'leek_1', 1, T.COAL_MINE, 2);                  // 1 link from Stoke
    const stone = placeIndustry(E, state, 'stone_1', 2, T.COAL_MINE, 2, { cubes: 1 });  // AT Stone
    placeLink(state, 'leek-stokeOnTrent', 1);

    const r = logic.executeNetwork(0, 'stokeOnTrent-stone', 0);
    assert.equal(r.success, true, r.message);
    assert.equal(leek.resourceCubes, 3, 'farther mine untouched');
    assert.equal(stone.resourceCubes, 0);
    assert.equal(stone.flipped, true);
    assert.equal(state.players[2].incomeSpace, 10 + 7, "the emptied mine's owner gets its income");
    assert.equal(state.players[1].incomeSpace, 10);
});

test('A4: a farther mine cannot be chosen over the closest one (the choice is rejected)', () => {
    const { E, state, logic } = railSetup();
    const T = E.INDUSTRY_TYPES;
    placeIndustry(E, state, 'stone_1', 1, T.COAL_MINE, 2);                 // distance 0
    const leek = placeIndustry(E, state, 'leek_1', 2, T.COAL_MINE, 2);     // distance 1
    placeLink(state, 'leek-stokeOnTrent', 2);
    const conn = E.CONNECTIONS.find(c => c.id === 'stokeOnTrent-stone');
    assert.deepEqual(plain(logic.getRailCoalOptions(conn, 0).mines.map(m => m.key)), ['stone_1']);
    // Choices are validated, not silently replaced: a farther mine is
    // rejected and nothing changes
    const before = JSON.stringify(state.serialize());
    const bad = logic.executeNetwork(0, 'stokeOnTrent-stone', 0, { coalMineKey: 'leek_1' });
    assert.equal(bad.success, false);
    assert.equal(JSON.stringify(state.serialize()), before);
    const r = logic.executeNetwork(0, 'stokeOnTrent-stone', 0, { coalMineKey: 'stone_1' });
    assert.equal(r.success, true, r.message);
    assert.equal(leek.resourceCubes, 3);
    assert.equal(state.boardIndustries.stone_1.resourceCubes, 2);
});

test('A4: equally close mines (one at each end of the link) remain the player\'s choice', () => {
    const tie = () => {
        const g = newGame({ players: 3, seed: 62 });
        const { E, state } = g;
        const T = E.INDUSTRY_TYPES;
        emptyHands(state);
        state.era = E.ERA.RAIL;
        placeIndustry(E, state, 'dudley_1', 0, T.IRON_WORKS, 2, { flipped: true });
        g.dudley = placeIndustry(E, state, 'dudley_0', 1, T.COAL_MINE, 2);
        g.wolves = placeIndustry(E, state, 'wolverhampton_1', 2, T.COAL_MINE, 2);
        setHand(state, 0, [loc('leek')]);
        return g;
    };
    let g = tie();
    const conn = g.E.CONNECTIONS.find(c => c.id === 'dudley-wolverhampton');
    assert.deepEqual(plain(g.logic.getRailCoalOptions(conn, 0).mines.map(m => m.key)).sort(), ['dudley_0', 'wolverhampton_1']);

    let r = g.logic.executeNetwork(0, 'dudley-wolverhampton', 0, { coalMineKey: 'wolverhampton_1' });
    assert.equal(r.success, true, r.message);
    assert.equal(g.wolves.resourceCubes, 2);
    assert.equal(g.dudley.resourceCubes, 3);

    g = tie();
    r = g.logic.executeNetwork(0, 'dudley-wolverhampton', 0, { coalMineKey: 'dudley_0' });
    assert.equal(r.success, true, r.message);
    assert.equal(g.dudley.resourceCubes, 2);
    assert.equal(g.wolves.resourceCubes, 3);
});

// ===================================================================== A6

test('A6: a second develop is not offered when the second iron is unaffordable', () => {
    const { E, state, logic } = newGame({ players: 3, seed: 71 });
    const T = E.INDUSTRY_TYPES;
    state.players[0].money = 2; // market iron: £2 then £2
    assert.equal(logic.canDevelopTypes(0, T.COTTON_MILL).ok, true);
    assert.equal(logic.getSecondDevelopOptions(0, T.COTTON_MILL).length, 0);
    assert.equal(logic.executeDevelop(0, T.COTTON_MILL, T.COAL_MINE, 0).success, false);
    state.players[0].money = 4;
    assert.ok(logic.getSecondDevelopOptions(0, T.COTTON_MILL).length > 0);
});

test('A6: a second rail link is only offered when £15 plus both coals is affordable', () => {
    const { E, state, logic } = newGame({ players: 3, seed: 72 });
    const T = E.INDUSTRY_TYPES;
    emptyHands(state);
    state.era = E.ERA.RAIL;
    placeIndustry(E, state, 'birmingham_1', 0, T.MANUFACTURER, 2);
    placeIndustry(E, state, 'walsall_1', 0, T.BREWERY, 2);
    setHand(state, 0, [loc('leek')]);
    // Market coal £1 then £2: £15 + £1 + £2 = £18
    state.players[0].money = 17;
    const offered = () => logic.getValidSecondRailLinks(0, 'birmingham-oxford').map(s => s.connectionId);
    assert.ok(!offered().includes('redditch-oxford'));
    const before = snapshot(state);
    assert.equal(logic.executeNetworkDouble(0, 'birmingham-oxford', 'redditch-oxford', 0).success, false);
    assert.equal(snapshot(state), before, 'rejected double link leaves no trace');
    state.players[0].money = 18;
    assert.ok(offered().includes('redditch-oxford'));
});

test("A6: an AI opponent's hand is shown face down", () => {
    const { dom, state, ui } = uiSetup();
    assert.equal(state.currentPlayer.isAI, true);
    ui.updateHand();
    const cards = dom.document.getElementById('player-hand').children;
    assert.equal(cards.length, state.currentPlayer.hand.length);
    for (const el of cards) {
        assert.ok(el.className.includes('card-back'));
        for (const card of state.currentPlayer.hand) {
            if (card.name) assert.ok(!el.innerHTML.includes(card.name), 'card face leaked');
        }
    }
});

test("A6: a human player's own hand is still shown face up", () => {
    const { dom, state, ui } = uiSetup({ ai: false });
    ui.updateHand();
    const cards = dom.document.getElementById('player-hand').children;
    assert.equal(cards.length, state.currentPlayer.hand.length);
    assert.ok(cards.every(el => !el.className.includes('card-back')));
});
