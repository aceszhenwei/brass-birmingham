'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, descendants } = require('./helpers/svg');
const { loadEngine } = require('./helpers/engine');
const { makeDom } = require('./helpers/dom');

function textTree(node) { return [node.textContent, ...node.children.flatMap(textTree)]; }

test('every printed route has a calibrated tile and selection target, including one token for the farm link', () => {
    const { E, renderer, svg } = setup();
    assert.equal(Object.keys(E.BoardAssets.LINK_PLACEMENTS).length, E.CONNECTIONS.length);
    for (const conn of E.CONNECTIONS) renderer.state.boardLinks[conn.id] = { playerId: 0, type: conn.canal ? 'canal' : 'rail' };
    renderer.drawConnections(); renderer.drawBuiltLinks();
    const tokens = descendants(svg).filter(n => n.attrs.class === 'connection-line built' && n.attrs['data-connection']);
    assert.equal(tokens.length, E.CONNECTIONS.length);
    assert.equal(tokens.filter(n => n.attrs['data-connection'] === 'kidderminster-worcester').length, 1);
    for (const token of tokens) {
        const id = token.attrs['data-connection'], p = E.BoardAssets.linkPlacement(id, renderer.layout);
        assert.ok(p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1);
        assert.equal(token.attrs.transform, `rotate(${p.angle.toFixed(1)} ${(p.x * renderer.W).toFixed(1)} ${(p.y * renderer.H).toFixed(1)})`);
        const hit = descendants(svg).find(n => n.attrs.class === 'connection-line' && n.attrs['data-connection'] === id);
        assert.ok(Math.abs((Number(hit.attrs.x1) + Number(hit.attrs.x2)) / 2 - p.x * renderer.W) < 0.001);
        assert.ok(Math.abs((Number(hit.attrs.y1) + Number(hit.attrs.y2)) / 2 - p.y * renderer.H) < 0.001);
    }
    const original = E.BoardAssets.linkPlacement('birmingham-oxford');
    const layout = { ...E.BoardAssets.OFFICIAL_LAYOUT, birmingham: [0.7299, 0.8015] };
    const moved = E.BoardAssets.linkPlacement('birmingham-oxford', layout);
    assert.ok(Math.abs(moved.x - original.x - 0.05) < 0.001);
    assert.ok(Math.abs(moved.y - original.y - 0.05) < 0.001);
    assert.equal(E.BoardAssets.linkPlacement('missing'), null);
});

for (const color of ['#c0392b', '#f39c12', '#8e44ad', '#d9d0c2']) {
    test(`art ground is recoloured for ${color} while neutral detail and alpha survive`, () => {
        const { E } = setup();
        for (const [kind, pixel] of [['industry', [130, 80, 160, 255]], ['link', [190, 155, 45, 255]]]) {
            const data = Uint8ClampedArray.from([...pixel, 12, 12, 12, 255, 240, 238, 220, 255, 200, 65, 50, 255]);
            E.BoardAssets.recolorPixels(data, color, kind);
            assert.notDeepEqual([...data.slice(0, 3)], pixel.slice(0, 3));
            assert.equal(data[3], 255);
            assert.deepEqual([...data.slice(4)], [12,12,12,255,240,238,220,255,200,65,50,255]);
        }
    });
}

test('expanded industry sheet is read-only, shows inventory, era gates and the engine beer counts', () => {
    const dom = makeDom();
    const E = loadEngine({ extraFiles: ['industryIcons.js', 'uiManager.js'], globals: dom });
    const state = new E.GameState(3, ['Alice', 'Bob', 'Carol'], [], { seed: 91 });
    const ui = new E.UIManager(); ui.state = state;
    const dialog = dom.document.getElementById('industries-dialog');
    dialog.showModal = () => { dialog.open = true; };
    const player = state.currentPlayer;
    player.industryTiles.cottonMill[0].used = true;
    const before = JSON.stringify(state.serialize());
    ui.showIndustries();
    assert.equal(dialog.open, true);
    assert.equal(JSON.stringify(state.serialize()), before);
    const body = dom.document.getElementById('industries-body');
    let texts = textTree(body).join('\n');
    assert.match(texts, /Build: £/);
    assert.match(texts, /income spaces/);
    assert.match(texts, /1\/3 remaining|2\/3 remaining/);
    assert.match(texts, /Next level to build/);
    assert.match(texts, /Unavailable this era/);
    assert.match(texts, /Cannot develop/);
    assert.match(texts, /1 beer produced/);
    state.era = E.ERA.RAIL; ui.renderIndustrySheet();
    texts = textTree(body).join('\n');
    assert.match(texts, /2 beer produced/);
    assert.doesNotMatch(texts, /4 beer produced/);
    dom.document.getElementById('industries-player').value = (player.id + 1) % 3;
    ui.renderIndustrySheet();
    assert.match(textTree(body).join('\n'), /3\/3 remaining/);
});

test('player artwork warms from local assets, caches variants and falls back when Canvas cannot read pixels', async () => {
    let canvases = 0, fail = false;
    class Image {
        constructor() { this.naturalWidth = 2; this.naturalHeight = 1; }
        set src(url) { this.url = url; Promise.resolve().then(() => this.onload()); }
    }
    const E = loadEngine({ extraFiles: ['boardAssets.js'], globals: {
        Image,
        document: { createElement() {
            canvases++;
            let pixels;
            return { getContext() { return {
                drawImage() {},
                getImageData() {
                    if (fail) throw new Error('Canvas unavailable');
                    return { data: Uint8ClampedArray.from([130,80,160,255,190,155,45,255]) };
                },
                putImageData(value) { pixels = value.data; },
            }; }, toDataURL() { return 'data:image/png,' + [...pixels].join(','); } };
        } },
    } });
    assert.equal(await E.BoardAssets.probeTiles(), true);
    const red = E.BoardAssets.tileUrl('cottonMill', 2, false, '#c0392b');
    assert.match(red, /^data:image\/png/);
    assert.equal(E.BoardAssets.tileUrl('cottonMill', 2, false, '#c0392b'), red);
    assert.equal(canvases, 1);
    assert.notEqual(E.BoardAssets.tileUrl('cottonMill', 2, false, '#d9d0c2'), red);
    assert.match(E.BoardAssets.linkUrl('canal', '#8e44ad'), /^data:image\/png/);
    fail = true;
    assert.equal(E.BoardAssets.linkUrl('rail', '#c0392b'), 'assets/tiles/rail.jpg');
    const afterFailure = canvases;
    assert.equal(E.BoardAssets.linkUrl('rail', '#c0392b'), 'assets/tiles/rail.jpg');
    assert.equal(canvases, afterFailure);
});
