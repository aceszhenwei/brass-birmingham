'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { descendants, setup } = require('./helpers/svg');

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
        const beer = oxford.children.filter(n => n.attrs.class === 'merchant-beer');
        assert.deepEqual(beer.map(n => n.attrs['data-beer']), [buys === 'blank' ? 'none' : 'available', 'consumed']);
        // Spending beer does not remove the demand tile on the next redraw.
        renderer.state.merchantTiles[0].hasBeer = false;
        svg.children = [];
        renderer.drawMerchants();
        const redrawn = descendants(svg).find(n => n.attrs['data-merchant'] === 'oxford');
        assert.equal(redrawn.children.filter(n => n.attrs.class === 'merchant-goods').length, 2);
        assert.deepEqual(redrawn.children.filter(n => n.attrs.class === 'merchant-beer').map(n => n.attrs['data-beer']),
            [buys === 'blank' ? 'none' : 'consumed', 'consumed']);
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
