// A compact, order-independent fingerprint of a finished (or in-progress)
// game, built only from fields that exist in both the Assignment 1 and the
// current state model, so games can be compared across versions.

'use strict';

function canonicalSummary(state, extra = {}) {
    const tile = ([key, t]) => [key, t.playerId, t.type, t.tileData.level, t.flipped, t.resourceCubes];
    const byKey = (a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
    return {
        era: state.era,
        round: state.round,
        gameOver: state.gameOver,
        turnOrder: [...state.turnOrder],
        players: state.players.map(p => ({
            money: p.money, vp: p.vp, incomeSpace: p.incomeSpace,
            hand: p.hand.length, links: { ...p.linksRemaining },
            used: Object.fromEntries(Object.entries(p.industryTiles).map(([k, ts]) => [k, ts.filter(t => t.used).length])),
        })),
        coal: state.coalMarket,
        iron: state.ironMarket,
        board: Object.entries(state.boardIndustries).map(tile).sort(byKey),
        farms: Object.entries(state.breweryFarmTiles).filter(([, t]) => t).map(tile).sort(byKey),
        links: Object.entries(state.boardLinks).map(([k, l]) => [k, l.playerId, l.type]).sort(byKey),
        merchants: state.merchantTiles.map(m => [m.location, m.buys, m.hasBeer]),
        deck: state.drawDeck.length,
        ...extra,
    };
}

// 32-bit FNV-1a, hex
function hash(str) {
    let h = 0x811C9DC5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
}

function fingerprint(state, extra = {}) {
    return hash(JSON.stringify(canonicalSummary(state, extra)));
}

module.exports = { canonicalSummary, fingerprint, hash };
