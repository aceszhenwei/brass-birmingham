// Structural checks that must hold for every reachable game state. Returns a
// list of human-readable violations (empty when the state is valid).

'use strict';

function checkInvariants(E, state) {
    const problems = [];
    const bad = (msg) => problems.push(msg);
    const T = E.INDUSTRY_TYPES;
    const LINKS_PER_PLAYER = 14;

    // Turn bookkeeping
    const order = [...state.turnOrder].sort((a, b) => a - b);
    if (order.join() !== state.players.map(p => p.id).join()) bad(`turn order is not a permutation: ${state.turnOrder}`);
    if (!state.gameOver && (state.currentPlayerIndex < 0 || state.currentPlayerIndex >= state.numPlayers)) {
        bad(`currentPlayerIndex out of range: ${state.currentPlayerIndex}`);
    }

    // Markets
    if (state.coalMarket < 0 || state.coalMarket > E.COAL_MARKET_PRICES.length) bad(`coal market count ${state.coalMarket}`);
    if (state.ironMarket < 0 || state.ironMarket > E.IRON_MARKET_PRICES.length) bad(`iron market count ${state.ironMarket}`);

    // Players
    let wildLoc = state.wildLocationPile;
    let wildInd = state.wildIndustryPile;
    for (const p of state.players) {
        if (p.money < 0) bad(`player ${p.id} has negative money ${p.money}`);
        if (p.vp < 0) bad(`player ${p.id} has negative VP ${p.vp}`);
        if (p.incomeSpace < 0 || p.incomeSpace > E.MAX_INCOME_SPACE) bad(`player ${p.id} income space ${p.incomeSpace}`);
        if (p.hand.length > E.HAND_SIZE) bad(`player ${p.id} holds ${p.hand.length} cards`);
        const wl = p.hand.filter(c => c.type === E.CARD_TYPES.WILD_LOCATION).length;
        const wi = p.hand.filter(c => c.type === E.CARD_TYPES.WILD_INDUSTRY).length;
        wildLoc += wl;
        wildInd += wi;
        if (wl > 1 || wi > 1) bad(`player ${p.id} holds more than one wild card of a kind`);
        if (p.discardPile.some(c => c.type === E.CARD_TYPES.WILD_LOCATION || c.type === E.CARD_TYPES.WILD_INDUSTRY)) {
            bad(`player ${p.id} has a wild card in their discard pile`);
        }

        // Link tiles: placed (current era type) + remaining = 14
        const type = state.era === E.ERA.CANAL ? 'canal' : 'rail';
        const placed = Object.values(state.boardLinks).filter(l => l.playerId === p.id && l.type === type).length;
        if (placed + p.linksRemaining[type] !== LINKS_PER_PLAYER) {
            bad(`player ${p.id} ${type} links: ${placed} placed + ${p.linksRemaining[type]} remaining != 14`);
        }
    }
    if (wildLoc !== 4 || wildInd !== 4) bad(`wild cards not conserved (location ${wildLoc}, industry ${wildInd})`);

    // Card conservation: draw deck + hands + discard piles always hold exactly
    // the deck for this player count (wild cards aside)
    const cardKey = (c) => c.type === E.CARD_TYPES.LOCATION ? `L:${c.location}` : `I:${[...c.industryTypes].join('/')}`;
    const expected = {};
    const deckData = E.CARD_DECK[state.numPlayers];
    for (const [loc, n] of Object.entries(deckData.locations)) expected[`L:${loc}`] = n;
    for (const [type, n] of Object.entries(deckData.industries)) expected[`I:${type}`] = n;
    if (deckData.dualCottonManufacturer) {
        expected[`I:${E.INDUSTRY_TYPES.COTTON_MILL}/${E.INDUSTRY_TYPES.MANUFACTURER}`] = deckData.dualCottonManufacturer;
    }
    const actual = {};
    const isWild = (c) => c.type === E.CARD_TYPES.WILD_LOCATION || c.type === E.CARD_TYPES.WILD_INDUSTRY;
    for (const c of [...state.drawDeck, ...state.players.flatMap(p => [...p.hand, ...p.discardPile])]) {
        if (!isWild(c)) actual[cardKey(c)] = (actual[cardKey(c)] || 0) + 1;
    }
    const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    for (const k of keys) {
        if ((expected[k] || 0) !== (actual[k] || 0)) bad(`card ${k}: ${actual[k] || 0} in play, expected ${expected[k] || 0}`);
    }
    if (state.era === E.ERA.RAIL && Object.values(state.boardLinks).some(l => l.type === 'canal')) {
        bad('canal link on the board during the Rail Era');
    }

    // Industry tiles
    const allTiles = [
        ...Object.entries(state.boardIndustries).map(([key, tile]) => ({ key, tile, farm: false })),
        ...Object.entries(state.breweryFarmTiles).filter(([, t]) => t).map(([key, tile]) => ({ key, tile, farm: true })),
    ];
    const onBoardCount = {};
    const perLocation = {};
    for (const { key, tile, farm } of allTiles) {
        const where = farm ? key : key.split('_')[0];
        if (farm) {
            if (tile.type !== T.BREWERY) bad(`${key}: non-brewery on a farm brewery`);
        } else {
            const [cityId, slot] = key.split('_');
            const allowed = E.CITIES[cityId] && E.CITIES[cityId].slots[Number(slot)];
            if (!allowed || !allowed.includes(tile.type)) bad(`${key}: ${tile.type} not allowed in this slot`);
        }
        if (tile.resourceCubes < 0) bad(`${key}: negative cubes`);
        const isResource = tile.type === T.COAL_MINE || tile.type === T.IRON_WORKS || tile.type === T.BREWERY;
        if (isResource) {
            if (tile.flipped && tile.resourceCubes !== 0) bad(`${key}: flipped ${tile.type} still holds cubes`);
            if (!tile.flipped && tile.resourceCubes === 0) bad(`${key}: empty ${tile.type} not flipped`);
        } else if (tile.resourceCubes !== 0) {
            bad(`${key}: ${tile.type} holds resource cubes`);
        }
        const eraOk = state.era === E.ERA.CANAL ? tile.tileData.canalEra : tile.tileData.railEra;
        if (!eraOk) bad(`${key}: ${tile.type} Lv${tile.tileData.level} not legal in the ${state.era} era`);

        const countKey = `${tile.playerId}:${tile.type}`;
        onBoardCount[countKey] = (onBoardCount[countKey] || 0) + 1;
        const locKey = `${tile.playerId}:${where}`;
        perLocation[locKey] = (perLocation[locKey] || 0) + 1;
    }
    if (state.era === E.ERA.CANAL) {
        for (const [k, n] of Object.entries(perLocation)) {
            if (n > 1) bad(`Canal Era: player:location ${k} has ${n} tiles`);
        }
    }
    for (const [k, n] of Object.entries(onBoardCount)) {
        const [pid, type] = k.split(':');
        const used = state.players[Number(pid)].industryTiles[type].filter(t => t.used).length;
        if (n > used) bad(`player ${pid} has ${n} ${type} on the board but only ${used} used from the mat`);
    }

    // Merchants
    for (const mt of state.merchantTiles) {
        if (mt.buys === 'blank' && mt.hasBeer) bad(`blank merchant tile at ${mt.location} holds beer`);
    }

    return problems;
}

module.exports = { checkInvariants };
