'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');

// Record SVG attributes and descendants while exercising the real renderer
// and industry icons, without a browser dependency.
function element(tag) {
    return {
        tag, attrs: {}, children: [], textContent: '',
        setAttribute(key, value) { this.attrs[key] = String(value); },
        appendChild(child) { this.children.push(child); return child; },
    };
}
function descendants(node) {
    return [node, ...node.children.flatMap(descendants)];
}
function setup(numPlayers = 4, artwork = true) {
    const E = loadEngine({
        extraFiles: ['industryIcons.js', 'boardAssets.js', 'boardRenderer.js'],
        globals: {
            document: { createElementNS: (_, tag) => element(tag) },
            location: { search: '' },
        },
    });
    const svg = element('svg');
    const renderer = new E.BoardRenderer(svg);
    renderer.state = new E.GameState(numPlayers, ['A', 'B', 'C', 'D'].slice(0, numPlayers), [], { seed: 91 });
    if (artwork) {
        renderer.assetURL = 'assets/board.jpg';
        renderer.layout = E.BoardAssets.OFFICIAL_LAYOUT;
        renderer.citySlotSize = 39;
        renderer.citySlotH = 36;
    }
    return { E, svg, renderer };
}

for (const buys of ['cottonMill', 'manufacturer', 'pottery', 'any', 'blank']) {
    test(`artwork merchant displays ${buys} in each Oxford space`, () => {
        const { svg, renderer } = setup();
        renderer.state.merchantTiles = [
            { location: 'oxford', buys, hasBeer: buys !== 'blank' },
            { location: 'oxford', buys: 'pottery', hasBeer: false },
        ];
        renderer.drawMerchants();
        const oxford = descendants(svg).find(n => n.attrs['data-merchant'] === 'oxford');
        const goods = oxford.children.filter(n => n.attrs.class === 'merchant-goods');
        assert.equal(goods.length, 2);
        assert.equal(goods[0].attrs['data-buys'], buys);
        assert.equal(goods[1].attrs['data-buys'], 'pottery');
        assert.notEqual(goods[0].attrs.transform, goods[1].attrs.transform);
        assert.ok(goods.every(n => descendants(n).some(c => c.tag === 'text' && c.textContent)));
        assert.ok(goods.every(n => descendants(n).some(c => c.tag === 'title' && /Buys|No demand/.test(c.textContent))));
        assert.equal(oxford.children.filter(n => n.tag === 'ellipse').length, buys === 'blank' ? 0 : 2);
        // Spending beer does not remove the demand tile on the next redraw.
        renderer.state.merchantTiles[0].hasBeer = false;
        svg.children = [];
        renderer.drawMerchants();
        const redrawn = descendants(svg).find(n => n.attrs['data-merchant'] === 'oxford');
        assert.equal(redrawn.children.filter(n => n.attrs.class === 'merchant-goods').length, 2);
        assert.equal(redrawn.children.filter(n => n.tag === 'ellipse').length, 0);
    });
}

for (const numPlayers of [2, 3, 4]) {
    test(`artwork shows every active merchant tile for ${numPlayers} players`, () => {
        const { svg, renderer } = setup(numPlayers);
        renderer.drawMerchants();
        const nodes = descendants(svg);
        assert.equal(nodes.filter(n => n.attrs.class === 'merchant-goods').length, renderer.state.merchantTiles.length);
        assert.equal(nodes.some(n => n.attrs['data-merchant'] === 'warrington'), numPlayers >= 3);
        assert.equal(nodes.some(n => n.attrs['data-merchant'] === 'nottingham'), numPlayers >= 4);
    });
}

test('merchants can render before game setup and on the fallback board', () => {
    const { renderer } = setup();
    renderer.state = null;
    assert.doesNotThrow(() => renderer.drawMerchants());
    const fallback = setup(2, false);
    assert.doesNotThrow(() => fallback.renderer.drawMerchants());
    assert.ok(descendants(fallback.svg).some(n => n.tag === 'text' && n.textContent === 'OXFORD'));
});
