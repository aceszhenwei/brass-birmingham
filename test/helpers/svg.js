'use strict';
const { loadEngine } = require('./engine');

// Record SVG attributes and descendants while exercising the real renderer
// and industry icons, without a browser dependency.
function element(tag) {
    return {
        tag, attrs: {}, children: [], textContent: '',
        setAttribute(key, value) { this.attrs[key] = String(value); },
        appendChild(child) { child.parent = this; this.children.push(child); return child; },
        remove() { if (this.parent) this.parent.children = this.parent.children.filter(n => n !== this); },
        querySelector(selector) { return descendants(this).find(n => n.attrs.id === selector.slice(1)) || null; },
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

module.exports = { element, descendants, setup };
