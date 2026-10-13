'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { descendants, setup } = require('./helpers/svg');
const { loadEngine } = require('./helpers/engine');
const { makeDom } = require('./helpers/dom');

function market(svg, type) {
    return descendants(svg).find(n => n.attrs['data-resource'] === type);
}
function checkMarket(svg, type, count, price) {
    const nodes = descendants(market(svg, type));
    const spaces = nodes.filter(n => n.attrs.class === 'board-market-space');
    assert.equal(spaces.filter(n => n.attrs['data-filled'] === 'true').length, count);
    const next = spaces.filter(n => n.attrs['data-next'] === 'true');
    assert.equal(next.length, count > 0 ? 1 : 0);
    if (count) assert.equal(Number(next[0].attrs['data-price']), price);
    assert.ok(nodes.some(n => n.attrs.class === 'board-market-price' && n.textContent.endsWith(`£${price}`)));
}
for (const artwork of [true, false]) {
    test(`markets show every supply level and empty-market prices (${artwork ? 'artwork' : 'fallback'})`, () => {
        const { renderer, svg, E } = setup(4, artwork);
        for (const [type, prices] of [['coal', E.COAL_MARKET_PRICES], ['iron', E.IRON_MARKET_PRICES]]) {
            for (let count = 0; count <= prices.length; count++) {
                renderer.state[`${type}Market`] = count;
                renderer.updateBoardStatus();
                checkMarket(svg, type, count, type === 'coal' ? renderer.state.getCoalPrice() : renderer.state.getIronPrice());
                assert.equal(descendants(svg).filter(n => n.attrs.id === 'markets-layer').length, 1);
            }
        }
    });
    test(`market purchase and automatic restock refresh correctly (${artwork ? 'artwork' : 'fallback'})`, () => {
        const { renderer, svg, E } = setup(3, artwork);
        const state = renderer.state;
        state.coalMarket = 1;
        state.ironMarket = 1;
        state.takeMarketCoal(); state.takeMarketIron();
        renderer.updateBoardStatus();
        checkMarket(svg, 'coal', 0, 8); checkMarket(svg, 'iron', 0, 6);
        const tile = { type: E.INDUSTRY_TYPES.COAL_MINE, resourceCubes: 4, flipped: false, playerId: 0, tileData: { income: 1 } };
        state.autoSellToMarket('test', tile);
        renderer.updateBoardStatus();
        checkMarket(svg, 'coal', 4, 6);
        // All dynamic update paths replace, rather than stack, status layers.
        for (const name of ['updateIndustrySlots', 'updateLinks', 'updateMerchantBeer',
            'drawFrame', 'drawConnections', 'drawBreweryFarms', 'drawMerchants', 'drawCities', 'drawBuiltLinks']) renderer[name] = () => {};
        renderer.update(state);
        renderer.fullUpdate(state);
        for (const id of ['markets-layer', 'turn-order-layer']) assert.equal(descendants(svg).filter(n => n.attrs.id === id).length, 1);
    });
}

test('turn projection preserves current order, uses gross action spending and matches committed order', () => {
    const { renderer, svg } = setup();
    const state = renderer.state;
    state.turnOrder = [2, 0, 3, 1];
    state.moneySpentThisRound = { 2: 15, 0: 5, 3: 5, 1: 10 };
    state.players[2].money += 30; // loans and sales cannot erase money already spent
    assert.deepEqual([...state.getNextRoundTurnOrder()], [0, 3, 1, 2]);
    assert.deepEqual([...state.turnOrder], [2, 0, 3, 1]);
    renderer.drawTurnOrder();
    const rows = descendants(svg).filter(n => n.attrs.class === 'board-turn-player');
    assert.deepEqual(rows.map(n => Number(n.attrs['data-player'])), [2, 0, 3, 1]);
    assert.deepEqual(rows.map(n => Number(n.attrs['data-next-rank'])), [4, 1, 2, 3]);
    assert.deepEqual(rows.map(n => Number(n.attrs['data-spent'])), [15, 5, 5, 10]);
    assert.equal(rows.filter(n => n.attrs['data-active'] === 'true').length, 1);
    state.endRound();
    renderer.updateBoardStatus();
    const nextRows = descendants(svg).filter(n => n.attrs.class === 'board-turn-player');
    assert.deepEqual(nextRows.map(n => Number(n.attrs['data-player'])), [0, 3, 1, 2]);
    assert.ok(nextRows.every(n => n.attrs['data-spent'] === '0'));
});

test('merchant availability distinguishes spent and blank beer and resets for Rail', () => {
    const { renderer, svg } = setup();
    const tiles = renderer.state.merchantTiles.filter(t => t.location === 'oxford');
    tiles[0].buys = 'cottonMill'; tiles[0].hasBeer = false;
    tiles[1].buys = 'blank'; tiles[1].hasBeer = false;
    renderer.drawMerchants();
    let oxford = descendants(svg).find(n => n.attrs['data-merchant'] === 'oxford');
    assert.deepEqual(descendants(oxford).filter(n => n.attrs.class === 'merchant-beer').map(n => n.attrs['data-beer']), ['consumed', 'none']);
    renderer.state.endCanalEra();
    renderer.updateMerchantBeer();
    oxford = descendants(svg).find(n => n.attrs['data-merchant'] === 'oxford');
    assert.deepEqual(descendants(oxford).filter(n => n.attrs.class === 'merchant-beer').map(n => n.attrs['data-beer']), ['available', 'none']);
});

test('sidebar shows current and provisional order, prices on occupied spaces, and spending', () => {
    const dom = makeDom();
    const E = loadEngine({ extraFiles: ['industryIcons.js', 'uiManager.js'], globals: dom });
    const state = new E.GameState(3, ['Alice', 'Bob', 'Carol'], [], { seed: 91 });
    state.turnOrder = [2, 0, 1]; state.moneySpentThisRound = { 2: 20, 0: 5, 1: 5 };
    const ui = new E.UIManager(); ui.state = state;
    ui.updateTurnOrder(); ui.updatePlayerPanels(); ui.updateMarkets();
    const content = dom.document.getElementById('turn-order-summary');
    assert.deepEqual(content.children.filter(n => n.tagName === 'OL').map(n => n.children.map(r => Number(r.dataset.player))), [[2, 0, 1], [0, 1, 2]]);
    assert.ok(content.children.some(n => n.textContent === 'Next round · provisional'));
    assert.ok(dom.document.getElementById('player-panels').children.every(n => /Spent £/.test(n.innerHTML)));
    assert.ok(dom.document.getElementById('coal-track').children.every(n => /market-price-label/.test(n.innerHTML)));
    state.coalMarket = 0; state.ironMarket = 0; ui.updateMarkets();
    assert.equal(dom.document.getElementById('coal-current-price').textContent, 'Next: £8 (supply)');
    assert.equal(dom.document.getElementById('iron-current-price').textContent, 'Next: £6 (supply)');
    state.gameOver = true; ui.updateTurnOrder();
    assert.equal(content.children.filter(n => n.tagName === 'OL').length, 1);
    assert.ok(content.children.some(n => n.textContent === 'Game over.'));
});
