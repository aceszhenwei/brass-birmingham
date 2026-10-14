// ============================================================================
// Brass: Birmingham - Game State Management
// ============================================================================

// Saved-state format identifiers. Bump GAME_STATE_VERSION whenever the
// serialize() layout changes incompatibly (and teach deserialize to migrate).
const GAME_STATE_FORMAT = 'brass-birmingham/game-state';
const GAME_STATE_VIEW_FORMAT = 'brass-birmingham/player-view';
const GAME_STATE_VERSION = 1;

class GameStateError extends Error {
    constructor(message) {
        super(message);
        this.name = 'GameStateError';
    }
}

// Copy of a card with no shared references
function copyCard(card) {
    const out = { type: card.type, name: card.name };
    if (card.location !== undefined) out.location = card.location;
    if (card.industryTypes !== undefined) out.industryTypes = [...card.industryTypes];
    if (card.faceDown) out.faceDown = true;
    return out;
}

class GameState {
    // options.seed: 32-bit integer seed for all gameplay randomness. The same
    // seed and the same actions always reproduce the same game; without a
    // seed a fresh random one is chosen (normal play).
    constructor(numPlayers, playerNames, playerIsAI = [], options = {}) {
        const seed = options.seed !== undefined && options.seed !== null
            ? options.seed : SeededRandom.randomSeed();
        this.rng = new SeededRandom(seed);

        this.numPlayers = numPlayers;
        this.playerNames = playerNames;
        this.era = ERA.CANAL;
        this.round = 1;
        this.currentPlayerIndex = 0;
        this.actionsThisTurn = 0;
        this.actionsPerTurn = FIRST_ROUND_ACTIONS; // First round: 1 action
        this.isFirstRound = true;
        this.gameOver = false;
        this.turnOrder = []; // player indices in turn order
        this.moneySpentThisRound = {}; // playerId -> amount spent this round

        // Initialize players
        this.players = [];
        for (let i = 0; i < numPlayers; i++) {
            const aiConfig = playerIsAI[i] || {};
            this.players.push(this.createPlayer(i, playerNames[i], !!aiConfig.isAI, aiConfig.difficulty || 'normal'));
        }

        // Initial turn order is random (rulebook: character tiles are shuffled
        // onto the Turn Order Track during setup)
        this.turnOrder = this.players.map((_, i) => i);
        this.shuffleArray(this.turnOrder);

        // Events generated during end-of-round upkeep (shortfall tile sales
        // etc.), for the UI layer to surface in the game log.
        this.lastRoundEvents = [];

        // Board state
        this.boardIndustries = {}; // cityId_slotIndex -> { playerId, type, level, tileData, flipped, resourceCubes }
        this.boardLinks = {}; // connectionId -> { playerId, type: 'canal'|'rail' }
        this.breweryFarmTiles = {}; // 'northern'|'southern' -> { playerId, type, level, tileData, flipped, resourceCubes }

        // Markets
        this.coalMarket = COAL_MARKET_INITIAL; // number of cubes remaining
        this.ironMarket = IRON_MARKET_INITIAL;

        // Merchant state
        this.merchantTiles = []; // { location, buys: 'any'|'blank'|industryType, hasBeer }
        this.initMerchants();

        // Card draw deck and discard
        this.drawDeck = [];
        this.wildLocationPile = 4; // 4 wild location cards
        this.wildIndustryPile = 4; // 4 wild industry cards
        this.initDeck();

        // Deal cards, then seed each player's discard pile with 1 card
        // (rulebook: Player Area Setup step 9) — this makes the era last
        // exactly 10/9/8 rounds at 2/3/4 players.
        this.dealCards();
        this.seedDiscardPiles();
    }

    createPlayer(index, name, isAI = false, aiDifficulty = 'normal') {
        // Create industry tile stacks for this player
        const industryTiles = {};
        for (const [type, levels] of Object.entries(INDUSTRY_DATA)) {
            industryTiles[type] = [];
            for (const tileData of levels) {
                for (let i = 0; i < tileData.count; i++) {
                    industryTiles[type].push({
                        ...tileData,
                        type: type,
                        used: false
                    });
                }
            }
        }

        return {
            id: index,
            name: name,
            color: PLAYER_COLORS[index],
            bgColor: PLAYER_BG_COLORS[index],
            colorName: PLAYER_NAMES[index],
            money: INITIAL_MONEY,
            incomeSpace: INITIAL_INCOME_SPACE, // progress track space (level 0)
            vp: 0,
            hand: [],
            // Cards discarded this era, oldest first. The setup card is
            // face down (faceDown: true); action cards are face up. Wild
            // cards never go here — they return to their piles.
            discardPile: [],
            industryTiles: industryTiles,
            linksRemaining: { canal: 14, rail: 14 },
            isAI: isAI,
            aiDifficulty: aiDifficulty,
        };
    }

    initMerchants() {
        // Shuffle the tile deck for this player count and deal one to each
        // active merchant slot (rulebook: Board Setup step 5).
        const mix = [...(MERCHANT_TILE_MIX[this.numPlayers] || [])];
        this.shuffleArray(mix);

        const tiles = [];
        for (const [merchId, merch] of Object.entries(MERCHANTS)) {
            if (merch.minPlayers > this.numPlayers) continue;
            for (let s = 0; s < merch.slots; s++) {
                const buys = mix.pop();
                tiles.push({
                    location: merchId,
                    buys, // 'any' | 'blank' | industry type
                    hasBeer: buys !== 'blank', // no beer beside blank tiles
                });
            }
        }
        this.merchantTiles = tiles;
    }

    // Does this merchant tile accept the given (sellable) industry type?
    merchantTileAccepts(mt, industryType) {
        return mt.buys === 'any' || mt.buys === industryType;
    }

    initDeck() {
        const deck = [];
        const deckData = CARD_DECK[this.numPlayers];
        if (!deckData) return;

        // Location cards
        for (const [cityId, count] of Object.entries(deckData.locations)) {
            for (let i = 0; i < count; i++) {
                deck.push({
                    type: CARD_TYPES.LOCATION,
                    location: cityId,
                    name: CITIES[cityId] ? CITIES[cityId].name : cityId,
                });
            }
        }

        // Industry cards. Every industry card carries an industryTypes array;
        // the physical deck includes dual "Cotton Mill or Manufacturer" cards
        // that can be built as either industry.
        for (const [industryType, count] of Object.entries(deckData.industries)) {
            for (let i = 0; i < count; i++) {
                deck.push({
                    type: CARD_TYPES.INDUSTRY,
                    industryTypes: [industryType],
                    name: INDUSTRY_DISPLAY[industryType].name,
                });
            }
        }
        for (let i = 0; i < (deckData.dualCottonManufacturer || 0); i++) {
            deck.push({
                type: CARD_TYPES.INDUSTRY,
                industryTypes: [INDUSTRY_TYPES.COTTON_MILL, INDUSTRY_TYPES.MANUFACTURER],
                name: 'Cotton Mill / Manufacturer',
            });
        }

        this.shuffleArray(deck);
        this.drawDeck = deck;
    }

    dealCards() {
        for (const player of this.players) {
            while (player.hand.length < HAND_SIZE && this.drawDeck.length > 0) {
                player.hand.push(this.drawDeck.pop());
            }
        }
    }

    // Each player places 1 card from the deck face down as their discard pile
    // at setup (the Rail Era does not repeat this).
    seedDiscardPiles() {
        for (const player of this.players) {
            if (this.drawDeck.length > 0) {
                player.discardPile.push({ ...this.drawDeck.pop(), faceDown: true });
            }
        }
    }

    // Does the player hold a wild card? (Derived from the hand, so it can
    // never disagree with it.) type: CARD_TYPES.WILD_LOCATION /
    // WILD_INDUSTRY, or omitted for either.
    playerHasWildCard(playerId, type = null) {
        return this.players[playerId].hand.some(c => type
            ? c.type === type
            : c.type === CARD_TYPES.WILD_LOCATION || c.type === CARD_TYPES.WILD_INDUSTRY);
    }

    drawCards(playerId) {
        const player = this.players[playerId];
        while (player.hand.length < HAND_SIZE && this.drawDeck.length > 0) {
            player.hand.push(this.drawDeck.pop());
        }
    }

    // Every gameplay shuffle draws from the game's seeded generator
    shuffleArray(arr) {
        this.rng.shuffle(arr);
    }

    // ========================================================================
    // Spending tracker (for turn order)
    // ========================================================================

    spendMoney(playerId, amount) {
        const player = this.players[playerId];
        player.money -= amount;
        this.moneySpentThisRound[playerId] = (this.moneySpentThisRound[playerId] || 0) + amount;
    }

    // A projection during the round; also used when committing the new order.
    // Sorting a copy preserves the current order and stable ties.
    getNextRoundTurnOrder() {
        return [...this.turnOrder].sort((a, b) =>
            (this.moneySpentThisRound[a] || 0) - (this.moneySpentThisRound[b] || 0));
    }

    // ========================================================================
    // Current player helpers
    // ========================================================================

    get currentPlayer() {
        return this.players[this.turnOrder[this.currentPlayerIndex]];
    }

    get currentPlayerId() {
        return this.turnOrder[this.currentPlayerIndex];
    }

    // ========================================================================
    // Income track helpers
    // ========================================================================
    // The income marker sits on a Progress Track SPACE (0-99); the income
    // LEVEL (-10..30) is derived from the space. Tile flips and bonuses
    // advance the marker by spaces; loans drop it by levels.

    getIncomeLevel(playerId) {
        return incomeLevelFromSpace(this.players[playerId].incomeSpace);
    }

    advanceIncomeSpaces(playerId, spaces) {
        const player = this.players[playerId];
        player.incomeSpace = Math.min(MAX_INCOME_SPACE, Math.max(0, player.incomeSpace + spaces));
    }

    canTakeLoan(playerId) {
        // A loan may not take the income level below -10
        return this.getIncomeLevel(playerId) - LOAN_INCOME_PENALTY >= MIN_INCOME;
    }

    applyLoanIncomeDrop(playerId) {
        // Drop 3 income LEVELS, placing the marker on the highest space
        // within the lower level.
        const player = this.players[playerId];
        const newLevel = Math.max(MIN_INCOME, this.getIncomeLevel(playerId) - LOAN_INCOME_PENALTY);
        player.incomeSpace = incomeHighestSpaceOfLevel(newLevel);
    }

    // ========================================================================
    // Market helpers
    // ========================================================================

    getCoalPrice() {
        // When the market is empty, coal can still be bought for £8 each
        if (this.coalMarket <= 0) return COAL_EMPTY_PRICE;
        const spaceIndex = COAL_MARKET_PRICES.length - this.coalMarket;
        return COAL_MARKET_PRICES[spaceIndex] ?? COAL_EMPTY_PRICE;
    }

    getIronPrice() {
        // When the market is empty, iron can still be bought for £6 each
        if (this.ironMarket <= 0) return IRON_EMPTY_PRICE;
        const spaceIndex = IRON_MARKET_PRICES.length - this.ironMarket;
        return IRON_MARKET_PRICES[spaceIndex] ?? IRON_EMPTY_PRICE;
    }

    // Consume one cube of market coal/iron. The market may be empty — cubes
    // are then bought from the General Supply at the flat empty price.
    takeMarketCoal() {
        if (this.coalMarket > 0) this.coalMarket--;
    }

    takeMarketIron() {
        if (this.ironMarket > 0) this.ironMarket--;
    }

    // When a Coal Mine / Iron Works is built, as many cubes as possible are
    // immediately moved from the tile to empty spaces in its market, filling
    // the most expensive spaces first; the builder collects the price of each
    // space filled. If the tile is emptied it flips at once.
    // (Caller is responsible for the coal mine's merchant-connection check.)
    autoSellToMarket(key, tile) {
        const isCoal = tile.type === INDUSTRY_TYPES.COAL_MINE;
        const prices = isCoal ? COAL_MARKET_PRICES : IRON_MARKET_PRICES;
        let moneyGained = 0;
        let cubesMoved = 0;

        while (tile.resourceCubes > 0) {
            const cubesInMarket = isCoal ? this.coalMarket : this.ironMarket;
            if (cubesInMarket >= prices.length) break; // market full
            // Most expensive empty space is just below the cheapest filled cube
            moneyGained += prices[prices.length - cubesInMarket - 1];
            if (isCoal) this.coalMarket++; else this.ironMarket++;
            tile.resourceCubes--;
            cubesMoved++;
        }

        if (cubesMoved > 0 && tile.resourceCubes === 0) {
            this.flipTile(key, tile);
        }
        return { moneyGained, cubesMoved, flipped: tile.flipped };
    }

    // ========================================================================
    // Network helpers
    // ========================================================================

    // Check if a location is in a player's network
    isInNetwork(playerId, locationId) {
        // A location is in your network if:
        // 1. It contains one of your industry tiles, OR
        // 2. It is adjacent to one of your link tiles

        // Check for own industry at location
        if (isCity(locationId)) {
            const city = CITIES[locationId];
            for (let i = 0; i < city.slots.length; i++) {
                const key = `${locationId}_${i}`;
                const tile = this.boardIndustries[key];
                if (tile && tile.playerId === playerId) return true;
            }
        }

        // Check brewery farms
        if (isBreweryFarm(locationId)) {
            const tile = this.breweryFarmTiles[locationId];
            if (tile && tile.playerId === playerId) return true;
        }

        // Check for adjacent links
        for (const conn of CONNECTIONS) {
            const link = this.boardLinks[conn.id];
            if (link && link.playerId === playerId) {
                if (conn.cities.includes(locationId)) return true;
                // Check if locationId is the brewery farm that this link passes through
                if (conn.viaBrewery && conn.viaBrewery === locationId) {
                    return true;
                }
            }
        }

        return false;
    }

    // Get all locations connected to a given location via links
    getConnectedLocations(locationId, visitedConnections = new Set()) {
        const connected = new Set([locationId]);
        for (const conn of CONNECTIONS) {
            if (visitedConnections.has(conn.id)) continue;
            const link = this.boardLinks[conn.id];
            if (!link) continue;

            // Determine the other endpoint(s) reachable from locationId
            const endpoints = [];
            if (conn.cities[0] === locationId) {
                endpoints.push(conn.cities[1]);
                if (conn.viaBrewery) endpoints.push(conn.viaBrewery);
            } else if (conn.cities[1] === locationId) {
                endpoints.push(conn.cities[0]);
                if (conn.viaBrewery) endpoints.push(conn.viaBrewery);
            } else if (conn.viaBrewery === locationId) {
                // When at the brewery farm, both city endpoints are reachable
                endpoints.push(conn.cities[0], conn.cities[1]);
            }

            if (endpoints.length > 0) {
                visitedConnections.add(conn.id);
                for (const otherEnd of endpoints) {
                    if (!connected.has(otherEnd)) {
                        connected.add(otherEnd);
                        const further = this.getConnectedLocations(otherEnd, visitedConnections);
                        for (const loc of further) connected.add(loc);
                    }
                }
            }
        }
        return connected;
    }

    // Find coal source: nearest connected unflipped coal mine, or market
    findCoalSource(locationId, playerId) {
        const sources = [];

        // BFS through connected network to find coal mines
        const visited = new Set();
        const queue = [{ loc: locationId, distance: 0 }];

        while (queue.length > 0) {
            const { loc, distance } = queue.shift();
            if (visited.has(loc)) continue;
            visited.add(loc);

            // Check for coal mines at this location (one entry per cube, so
            // callers needing several coal can draw repeatedly from one mine)
            if (isCity(loc)) {
                const city = CITIES[loc];
                for (let i = 0; i < city.slots.length; i++) {
                    const key = `${loc}_${i}`;
                    const tile = this.boardIndustries[key];
                    if (tile && tile.type === INDUSTRY_TYPES.COAL_MINE &&
                        !tile.flipped && tile.resourceCubes > 0) {
                        for (let c = 0; c < tile.resourceCubes; c++) {
                            sources.push({ type: 'mine', key, distance, free: true });
                        }
                    }
                }
            }

            // Follow links to adjacent locations
            for (const conn of CONNECTIONS) {
                const link = this.boardLinks[conn.id];
                if (!link) continue;

                const neighbors = [];
                if (conn.cities[0] === loc) {
                    neighbors.push(conn.cities[1]);
                    if (conn.viaBrewery) neighbors.push(conn.viaBrewery);
                } else if (conn.cities[1] === loc) {
                    neighbors.push(conn.cities[0]);
                    if (conn.viaBrewery) neighbors.push(conn.viaBrewery);
                } else if (conn.viaBrewery === loc) {
                    neighbors.push(conn.cities[0], conn.cities[1]);
                }

                for (const n of neighbors) {
                    if (!visited.has(n)) queue.push({ loc: n, distance: distance + 1 });
                }
            }
        }

        // Sort by distance (nearest first) — coal MUST come from the closest
        // connected mine before farther mines or the market
        sources.sort((a, b) => a.distance - b.distance);

        // Market coal requires a connection to a merchant location. The
        // `visited` set from the BFS above is exactly the connected set.
        const merchantConnected = [...visited].some(loc => isMerchantLocation(loc));
        if (merchantConnected) {
            // One entry per market cube (cheapest first)...
            for (let i = 0; i < this.coalMarket; i++) {
                const spaceIndex = COAL_MARKET_PRICES.length - this.coalMarket + i;
                sources.push({ type: 'market', price: COAL_MARKET_PRICES[spaceIndex] ?? COAL_EMPTY_PRICE, free: false });
            }
            // ...then unlimited General Supply coal at £8 once the market is empty
            for (let i = 0; i < 6; i++) {
                sources.push({ type: 'market', price: COAL_EMPTY_PRICE, free: false });
            }
        }

        return sources;
    }

    // Find iron source: any unflipped iron works (no connection needed), or market
    findIronSource(playerId) {
        const sources = [];

        // Iron doesn't need connection - any iron works on the board
        // Add one entry per available cube so callers needing 2+ iron see enough entries
        for (const [key, tile] of Object.entries(this.boardIndustries)) {
            if (tile.type === INDUSTRY_TYPES.IRON_WORKS &&
                !tile.flipped && tile.resourceCubes > 0) {
                for (let c = 0; c < tile.resourceCubes; c++) {
                    sources.push({ type: 'works', key, free: true });
                }
            }
        }

        // One market entry per cube (cheapest first), then unlimited General
        // Supply iron at £6. No connection is ever required for iron.
        for (let i = 0; i < this.ironMarket; i++) {
            const spaceIndex = IRON_MARKET_PRICES.length - this.ironMarket + i;
            sources.push({ type: 'market', price: IRON_MARKET_PRICES[spaceIndex] ?? IRON_EMPTY_PRICE, free: false });
        }
        for (let i = 0; i < 6; i++) {
            sources.push({ type: 'market', price: IRON_EMPTY_PRICE, free: false });
        }

        return sources;
    }

    // Find beer sources for a location where beer is required.
    // - Own unflipped breweries: usable anywhere, no connection needed.
    // - Opponents' unflipped breweries: must be connected to locationId.
    // - Merchant beer: ONLY usable when selling to that merchant. Callers pass
    //   allowedMerchantIndices (indices into merchantTiles) for the merchant(s)
    //   the sale is going to; pass nothing for non-sell uses (e.g. rail links).
    findBeerSources(locationId, playerId, allowedMerchantIndices = null) {
        const sources = [];

        // Own breweries anywhere (no connection needed)
        // Add one entry per available cube so callers needing 2+ beer see enough entries
        for (const [key, tile] of Object.entries(this.boardIndustries)) {
            if (tile.type === INDUSTRY_TYPES.BREWERY && tile.playerId === playerId &&
                !tile.flipped && tile.resourceCubes > 0) {
                for (let c = 0; c < tile.resourceCubes; c++) {
                    sources.push({ type: 'own', key });
                }
            }
        }
        // Own brewery farms
        for (const [farmId, tile] of Object.entries(this.breweryFarmTiles)) {
            if (tile && tile.type === INDUSTRY_TYPES.BREWERY && tile.playerId === playerId &&
                !tile.flipped && tile.resourceCubes > 0) {
                for (let c = 0; c < tile.resourceCubes; c++) {
                    sources.push({ type: 'own', key: `farm_${farmId}` });
                }
            }
        }

        // Connected opponent breweries
        const connected = this.getConnectedLocations(locationId);
        for (const loc of connected) {
            if (isCity(loc)) {
                const city = CITIES[loc];
                for (let i = 0; i < city.slots.length; i++) {
                    const key = `${loc}_${i}`;
                    const tile = this.boardIndustries[key];
                    if (tile && tile.type === INDUSTRY_TYPES.BREWERY &&
                        tile.playerId !== playerId &&
                        !tile.flipped && tile.resourceCubes > 0) {
                        for (let c = 0; c < tile.resourceCubes; c++) {
                            sources.push({ type: 'opponent', key });
                        }
                    }
                }
            }
            if (isBreweryFarm(loc)) {
                const tile = this.breweryFarmTiles[loc];
                if (tile && tile.type === INDUSTRY_TYPES.BREWERY &&
                    tile.playerId !== playerId &&
                    !tile.flipped && tile.resourceCubes > 0) {
                    for (let c = 0; c < tile.resourceCubes; c++) {
                        sources.push({ type: 'opponent', key: `farm_${loc}` });
                    }
                }
            }
        }

        // Merchant beer — only from the merchant(s) this sale is going to
        if (allowedMerchantIndices) {
            for (const i of allowedMerchantIndices) {
                const mt = this.merchantTiles[i];
                if (mt && mt.hasBeer && connected.has(mt.location)) {
                    sources.push({ type: 'merchant', index: i });
                }
            }
        }

        return sources;
    }

    // Consume a resource from a tile
    consumeResource(key) {
        let tile;
        if (key.startsWith('farm_')) {
            const farmId = key.substring(5);
            tile = this.breweryFarmTiles[farmId];
        } else {
            tile = this.boardIndustries[key];
        }
        if (!tile || tile.resourceCubes <= 0) return false;
        tile.resourceCubes--;

        // If depleted, flip the tile
        if (tile.resourceCubes <= 0) {
            this.flipTile(key, tile);
        }
        return true;
    }

    flipTile(key, tile) {
        if (tile.flipped) return;
        tile.flipped = true;
        // Advance income marker by the tile's income icon count (SPACES)
        this.advanceIncomeSpaces(tile.playerId, tile.tileData.income);
    }

    // ========================================================================
    // Turn management
    // ========================================================================

    advanceTurn() {
        this.actionsThisTurn++;

        // Check if era should end mid-turn (all hands empty, deck exhausted).
        // Call endRound to distribute income before signaling era end.
        const allHandsEmpty = this.players.every(p => p.hand.length === 0);
        if (allHandsEmpty && this.drawDeck.length === 0) {
            // The last card of the era has been played: no turn is in
            // progress any more (era scoring follows, after any shortfalls)
            this.actionsThisTurn = 0;
            return this.endRound(); // returns 'endCanalEra' or 'endGame'
        }

        if (this.actionsThisTurn >= this.actionsPerTurn) {
            // Draw cards for current player
            this.drawCards(this.currentPlayerId);

            // Move to next player
            this.actionsThisTurn = 0;
            this.currentPlayerIndex++;

            if (this.currentPlayerIndex >= this.numPlayers) {
                this.currentPlayerIndex = 0;
                const roundResult = this.endRound();
                if (roundResult !== 'continue') return roundResult;
            }

            // Skip players with no cards
            const skipResult = this.skipEmptyHandPlayers();
            if (skipResult) return skipResult;
        } else {
            // If current player has no cards left, end their turn early
            if (this.currentPlayer.hand.length === 0) {
                this.drawCards(this.currentPlayerId);
                if (this.currentPlayer.hand.length === 0) {
                    // Still no cards - skip remaining actions
                    this.actionsThisTurn = 0;
                    this.currentPlayerIndex++;
                    if (this.currentPlayerIndex >= this.numPlayers) {
                        this.currentPlayerIndex = 0;
                        const roundResult = this.endRound();
                        if (roundResult !== 'continue') return roundResult;
                    }
                    const skipResult = this.skipEmptyHandPlayers();
                    if (skipResult) return skipResult;
                }
            }
        }

        return 'continue';
    }

    skipEmptyHandPlayers() {
        let safety = 0;
        while (this.currentPlayer.hand.length === 0 && this.drawDeck.length === 0 && safety < this.numPlayers) {
            this.currentPlayerIndex++;
            safety++;
            if (this.currentPlayerIndex >= this.numPlayers) {
                this.currentPlayerIndex = 0;
                const roundResult = this.endRound(); // handles income, era-end detection
                if (roundResult !== 'continue') return roundResult;
            }
        }
        return null; // No special event
    }

    endRound() {
        this.lastRoundEvents = [];

        // The era ends following the round in which all cards are played
        const allHandsEmpty = this.players.every(p => p.hand.length === 0);
        const eraEnding = allHandsEmpty && this.drawDeck.length === 0;
        const isFinalRoundOfGame = eraEnding && this.era === ERA.RAIL;

        // Income phase — not collected at the end of the final round of the game
        if (!isFinalRoundOfGame) {
            for (const player of this.players) {
                const level = incomeLevelFromSpace(player.incomeSpace);
                player.money += level;
                // A player who can't pay must sell industry tiles of their
                // choice (a pending 'shortfall' decision, see
                // getPendingShortfalls); with no tiles, they lose VP at once.
                if (player.money < 0 && this.ownedTileKeys(player.id).length === 0) {
                    this.loseVPForShortfall(player);
                }
            }
        }

        // Determine turn order: player who spent LEAST goes first next round
        // Ties broken by current turn order (earlier player goes first)
        this.turnOrder = this.getNextRoundTurnOrder();

        // Reset spending tracker for next round
        this.moneySpentThisRound = {};

        this.round++;
        if (this.isFirstRound) {
            this.isFirstRound = false;
            this.actionsPerTurn = ACTIONS_PER_TURN;
        }

        if (eraEnding) {
            return this.era === ERA.CANAL ? 'endCanalEra' : 'endGame';
        }

        return 'continue';
    }

    // ========================================================================
    // Income shortfall (rulebook p.6)
    // ========================================================================
    // A player who cannot pay negative income must remove industry tiles of
    // THEIR CHOICE from the board for half their cost (rounded down), one at
    // a time, stopping as soon as the shortfall is covered; if they run out of
    // tiles they lose 1 VP per £1 still owed. While a player's money is below
    // zero they owe a 'shortfall' decision (GameLogic move { type:
    // 'shortfall', tile }) and no other move may be played.

    // Players who still owe a shortfall decision
    getPendingShortfalls() {
        return this.players.filter(p => p.money < 0).map(p => p.id);
    }

    // Keys of every industry tile a player owns (board 'city_slot', or a
    // farm id), in board order
    ownedTileKeys(playerId) {
        const keys = [];
        for (const [key, tile] of Object.entries(this.boardIndustries)) {
            if (tile.playerId === playerId) keys.push(key);
        }
        for (const [farmId, tile] of Object.entries(this.breweryFarmTiles)) {
            if (tile && tile.playerId === playerId) keys.push(farmId);
        }
        return keys;
    }

    // Sell one tile to cover a shortfall (the move has been validated).
    // Returns a log message.
    sellTileForShortfall(playerId, key) {
        const player = this.players[playerId];
        const farm = !!BREWERY_FARMS[key];
        const tile = farm ? this.breweryFarmTiles[key] : this.boardIndustries[key];
        const refund = Math.floor(tile.tileData.cost / 2);
        if (farm) delete this.breweryFarmTiles[key];
        else delete this.boardIndustries[key];
        player.money += refund;
        let message = `sold ${INDUSTRY_DISPLAY[tile.type].name} Lv${tile.tileData.level} for £${refund} to cover income shortfall`;
        if (player.money < 0 && this.ownedTileKeys(playerId).length === 0) {
            message += `; ${this.loseVPForShortfall(player)}`;
        }
        return message;
    }

    // No tiles left: lose 1 VP per £1 still owed (never below 0 VP)
    loseVPForShortfall(player) {
        const vpLoss = Math.min(player.vp, -player.money);
        player.vp -= vpLoss;
        player.money = 0;
        const message = `could not pay income shortfall — lost ${vpLoss} VP`;
        this.lastRoundEvents.push({ type: 'shortfall-vp', playerId: player.id, message });
        return message;
    }

    // The tile the automatic policy would sell (used for AI players): unflipped
    // tiles before flipped ones, then the lowest VP
    defaultShortfallTile(playerId) {
        const keys = this.ownedTileKeys(playerId);
        const tileOf = (key) => (BREWERY_FARMS[key] ? this.breweryFarmTiles[key] : this.boardIndustries[key]);
        const sorted = [...keys].sort((a, b) =>
            (Number(tileOf(a).flipped) - Number(tileOf(b).flipped)) ||
            (tileOf(a).tileData.vp - tileOf(b).tileData.vp));
        return sorted[0];
    }

    endCanalEra() {
        if (this.getPendingShortfalls().length > 0) {
            throw new Error('Income shortfalls must be covered before the Canal Era is scored');
        }
        // Score canal era
        const scores = this.calculateEraScore();

        // Remove all canal links
        for (const [connId, link] of Object.entries(this.boardLinks)) {
            if (link.type === 'canal') {
                delete this.boardLinks[connId];
                this.players[link.playerId].linksRemaining.canal++;
            }
        }

        // Remove ALL level 1 industry tiles from the board (including the
        // rail-era-buildable Pottery I); level 2+ tiles persist into the
        // Rail Era and score again at game end (per the rulebook).
        for (const [key, tile] of Object.entries(this.boardIndustries)) {
            if (tile.tileData.level === 1) {
                delete this.boardIndustries[key];
            }
        }

        // Same rule for brewery farm tiles
        for (const [farmId, tile] of Object.entries(this.breweryFarmTiles)) {
            if (tile && tile.tileData.level === 1) {
                delete this.breweryFarmTiles[farmId];
            }
        }

        // Transition to rail era. The 1-action restriction applies only to
        // the first round of the CANAL era — every Rail Era round is 2 actions.
        this.era = ERA.RAIL;
        this.round = 1;
        this.isFirstRound = false;
        this.actionsPerTurn = ACTIONS_PER_TURN;
        this.currentPlayerIndex = 0;
        this.actionsThisTurn = 0;

        // Reset merchant beer (blank tiles never hold beer)
        for (const mt of this.merchantTiles) {
            mt.hasBeer = mt.buys !== 'blank';
        }

        // Return any wild cards from player hands before clearing
        for (const player of this.players) {
            for (const card of player.hand) {
                if (card.type === CARD_TYPES.WILD_LOCATION) this.wildLocationPile++;
                else if (card.type === CARD_TYPES.WILD_INDUSTRY) this.wildIndustryPile++;
            }
            player.hand = [];
            player.discardPile = [];
        }

        // Reshuffle all cards into draw deck and deal new hands.
        // The discard piles hold exactly the full deck at this point (every
        // non-wild card has been played), so rebuilding the deck from the
        // card list is equivalent to shuffling the piles together.
        // Rulebook: the rail era does NOT start with seeded discard piles.
        this.initDeck();
        this.dealCards();

        return scores;
    }

    // The era is over once every card has been played: all hands and the
    // draw deck are empty. (Between that moment and the era's scoring, only
    // pending income-shortfall decisions can be outstanding.)
    isEraOver() {
        return this.drawDeck.length === 0 && this.players.every(p => p.hand.length === 0);
    }

    // Final standings (rulebook p.7): most VP wins; ties are broken by the
    // highest income level, then the most money; players still tied share
    // the rank (a draw).
    getFinalRanking() {
        const key = (p) => [p.vp, this.getIncomeLevel(p.id), p.money];
        const sorted = [...this.players].sort((a, b) => {
            const ka = key(a);
            const kb = key(b);
            return (kb[0] - ka[0]) || (kb[1] - ka[1]) || (kb[2] - ka[2]);
        });
        let rank = 0;
        let previous = null;
        return sorted.map((p, i) => {
            const k = key(p).join();
            if (k !== previous) rank = i + 1;
            previous = k;
            return { playerId: p.id, name: p.name, vp: p.vp, incomeLevel: this.getIncomeLevel(p.id), money: p.money, rank };
        });
    }

    endGame() {
        if (this.getPendingShortfalls().length > 0) {
            throw new Error('Income shortfalls must be covered before final scoring');
        }
        // Score rail era
        const scores = this.calculateEraScore();
        this.gameOver = true;

        return scores;
    }

    // VP a link on `connId` scores at an era's end in the current position:
    // 1 VP per link icon in adjacent locations. Link icons are printed only
    // on the FLIPPED face of industry tiles; unflipped tiles contribute
    // nothing. Merchant locations count 2 each regardless of tile state.
    linkValue(connId) {
        const conn = CONNECTIONS.find(c => c.id === connId);
        if (!conn) return 0;
        let linkValue = 0;
        for (const cityId of conn.cities) {
            if (isCity(cityId)) {
                const city = CITIES[cityId];
                for (let i = 0; i < city.slots.length; i++) {
                    const tile = this.boardIndustries[`${cityId}_${i}`];
                    if (tile && tile.flipped) {
                        linkValue += tile.tileData.linkVP;
                    }
                }
            }
            if (isMerchantLocation(cityId)) {
                linkValue += 2;
            }
            if (isBreweryFarm(cityId)) {
                const tile = this.breweryFarmTiles[cityId];
                if (tile && tile.flipped) {
                    linkValue += tile.tileData.linkVP;
                }
            }
        }
        // Also score brewery farms that this link passes through (e.g. kidderminster-worcester via southern)
        if (conn.viaBrewery) {
            const tile = this.breweryFarmTiles[conn.viaBrewery];
            if (tile && tile.flipped) {
                linkValue += tile.tileData.linkVP;
            }
        }
        return linkValue;
    }

    calculateEraScore() {
        const scores = this.players.map(p => ({
            playerId: p.id,
            name: p.name,
            linkVP: 0,
            industryVP: 0,
            incomeVP: 0,
            totalVP: p.vp,
        }));

        // Score links
        for (const [connId, link] of Object.entries(this.boardLinks)) {
            if (!CONNECTIONS.find(c => c.id === connId)) continue;
            const playerScore = scores.find(s => s.playerId === link.playerId);
            if (playerScore) {
                playerScore.linkVP += this.linkValue(connId);
            }
        }

        // Score flipped industries
        for (const [key, tile] of Object.entries(this.boardIndustries)) {
            if (tile.flipped) {
                const playerScore = scores.find(s => s.playerId === tile.playerId);
                if (playerScore) {
                    playerScore.industryVP += tile.tileData.vp;
                }
            }
        }

        // Score brewery farm tiles
        for (const [farmId, tile] of Object.entries(this.breweryFarmTiles)) {
            if (tile && tile.flipped) {
                const playerScore = scores.find(s => s.playerId === tile.playerId);
                if (playerScore) {
                    playerScore.industryVP += tile.tileData.vp;
                }
            }
        }

        // Apply scores
        for (const score of scores) {
            const player = this.players[score.playerId];
            player.vp += score.linkVP + score.industryVP;
            score.totalVP = player.vp;
        }

        return scores;
    }

    // ========================================================================
    // Player tile stack helpers
    // ========================================================================

    // Get the next available tile of a type for a player
    getNextTile(playerId, industryType) {
        const player = this.players[playerId];
        const tiles = player.industryTiles[industryType];
        if (!tiles) return null;
        return tiles.find(t => !t.used);
    }

    // Get the current level a player can build for a type
    getCurrentLevel(playerId, industryType) {
        const tile = this.getNextTile(playerId, industryType);
        return tile ? tile.level : null;
    }

    // Remove (use) the next tile from a player's stack
    useNextTile(playerId, industryType) {
        const player = this.players[playerId];
        const tiles = player.industryTiles[industryType];
        if (!tiles) return null;
        const tile = tiles.find(t => !t.used);
        if (tile) {
            tile.used = true;
            return tile;
        }
        return null;
    }

    // For development: remove tiles without building them
    developTile(playerId, industryType) {
        const player = this.players[playerId];
        const tiles = player.industryTiles[industryType];
        if (!tiles) return null;
        const tile = tiles.find(t => !t.used);
        if (tile) {
            tile.used = true;
            return tile;
        }
        return null;
    }

    // Get all remaining tile counts for a player
    getRemainingTiles(playerId) {
        const player = this.players[playerId];
        const result = {};
        for (const [type, tiles] of Object.entries(player.industryTiles)) {
            const remaining = tiles.filter(t => !t.used);
            result[type] = {
                count: remaining.length,
                nextLevel: remaining.length > 0 ? remaining[0].level : null,
                tiles: remaining,
            };
        }
        return result;
    }

    // ========================================================================
    // Cloning and serialization
    // ========================================================================
    // serialize() captures EVERYTHING needed to continue the game exactly,
    // including hidden information: every hand, the draw deck order, the
    // face-down discards and the random generator state (which determines
    // future shuffles). It is an engine/AI facility — never show it to
    // players; getPlayerView() and toJSON() are the player-facing views.
    //
    // Board tiles and player mats are stored compactly (industry type + level
    // / used flags) and their printed data is rebuilt from INDUSTRY_DATA on
    // load, so a saved game can't carry stale or tampered tile values.

    serialize() {
        const tileOut = (t) => ({
            playerId: t.playerId,
            type: t.type,
            level: t.tileData.level,
            flipped: t.flipped,
            resourceCubes: t.resourceCubes,
        });
        const mapValues = (obj, fn) => {
            const out = {};
            for (const [k, v] of Object.entries(obj)) if (v) out[k] = fn(v);
            return out;
        };
        const mat = (player) => {
            const out = {};
            for (const [type, tiles] of Object.entries(player.industryTiles)) out[type] = tiles.map(t => t.used);
            return out;
        };

        return {
            format: GAME_STATE_FORMAT,
            version: GAME_STATE_VERSION,
            numPlayers: this.numPlayers,
            era: this.era,
            round: this.round,
            currentPlayerIndex: this.currentPlayerIndex,
            actionsThisTurn: this.actionsThisTurn,
            actionsPerTurn: this.actionsPerTurn,
            isFirstRound: this.isFirstRound,
            gameOver: this.gameOver,
            turnOrder: [...this.turnOrder],
            moneySpentThisRound: { ...this.moneySpentThisRound },
            rng: this.rng.getState(),
            players: this.players.map(p => ({
                name: p.name,
                isAI: p.isAI,
                aiDifficulty: p.aiDifficulty,
                money: p.money,
                incomeSpace: p.incomeSpace,
                vp: p.vp,
                hand: p.hand.map(copyCard),
                discardPile: p.discardPile.map(copyCard),
                linksRemaining: { canal: p.linksRemaining.canal, rail: p.linksRemaining.rail },
                mat: mat(p),
            })),
            boardIndustries: mapValues(this.boardIndustries, tileOut),
            breweryFarmTiles: mapValues(this.breweryFarmTiles, tileOut),
            boardLinks: mapValues(this.boardLinks, l => ({ playerId: l.playerId, type: l.type })),
            coalMarket: this.coalMarket,
            ironMarket: this.ironMarket,
            merchantTiles: this.merchantTiles.map(m => ({ location: m.location, buys: m.buys, hasBeer: m.hasBeer })),
            drawDeck: this.drawDeck.map(copyCard),
            wildLocationPile: this.wildLocationPile,
            wildIndustryPile: this.wildIndustryPile,
            lastRoundEvents: this.lastRoundEvents.map(e => ({ ...e })),
        };
    }

    // Rebuild a fully working GameState from serialize() output (an object or
    // its JSON string). Throws GameStateError for malformed, incompatible or
    // inconsistent data. options.validate=false skips validation (used by
    // clone(), whose input is known-good).
    static deserialize(data, options = {}) {
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                throw new GameStateError('Saved game is not valid JSON');
            }
        }
        if (options.validate !== false) GameState.validateSaved(data);

        const state = Object.create(GameState.prototype);
        state.rng = SeededRandom.fromState(data.rng);
        state.numPlayers = data.numPlayers;
        state.playerNames = data.players.map(p => p.name);
        state.era = data.era;
        state.round = data.round;
        state.currentPlayerIndex = data.currentPlayerIndex;
        state.actionsThisTurn = data.actionsThisTurn;
        state.actionsPerTurn = data.actionsPerTurn;
        state.isFirstRound = data.isFirstRound;
        state.gameOver = data.gameOver;
        state.turnOrder = [...data.turnOrder];
        state.moneySpentThisRound = {};
        for (const [k, v] of Object.entries(data.moneySpentThisRound)) state.moneySpentThisRound[k] = v;

        state.players = data.players.map((p, i) => {
            const player = state.createPlayer(i, p.name, p.isAI, p.aiDifficulty);
            player.money = p.money;
            player.incomeSpace = p.incomeSpace;
            player.vp = p.vp;
            player.hand = p.hand.map(copyCard);
            player.discardPile = p.discardPile.map(copyCard);
            player.linksRemaining = { canal: p.linksRemaining.canal, rail: p.linksRemaining.rail };
            for (const [type, used] of Object.entries(p.mat)) {
                player.industryTiles[type].forEach((t, j) => { t.used = used[j]; });
            }
            return player;
        });

        const tileIn = (t) => ({
            playerId: t.playerId,
            type: t.type,
            tileData: { ...INDUSTRY_DATA[t.type].find(d => d.level === t.level), type: t.type, used: true },
            flipped: t.flipped,
            resourceCubes: t.resourceCubes,
        });
        state.boardIndustries = {};
        for (const [k, t] of Object.entries(data.boardIndustries)) state.boardIndustries[k] = tileIn(t);
        state.breweryFarmTiles = {};
        for (const [k, t] of Object.entries(data.breweryFarmTiles)) state.breweryFarmTiles[k] = tileIn(t);
        state.boardLinks = {};
        for (const [k, l] of Object.entries(data.boardLinks)) state.boardLinks[k] = { playerId: l.playerId, type: l.type };

        state.coalMarket = data.coalMarket;
        state.ironMarket = data.ironMarket;
        state.merchantTiles = data.merchantTiles.map(m => ({ location: m.location, buys: m.buys, hasBeer: m.hasBeer }));
        state.drawDeck = data.drawDeck.map(copyCard);
        state.wildLocationPile = data.wildLocationPile;
        state.wildIndustryPile = data.wildIndustryPile;
        state.lastRoundEvents = (data.lastRoundEvents || []).map(e => ({ ...e }));
        return state;
    }

    // A fully independent copy: no shared mutable objects, same RNG position.
    clone() {
        return GameState.deserialize(this.serialize(), { validate: false });
    }

    // Structural validation of serialize() output. Throws GameStateError
    // listing what is wrong.
    static validateSaved(data) {
        const errors = [];
        const err = (msg) => { if (errors.length < 10) errors.push(msg); };
        const isInt = Number.isInteger;
        const isObj = (o) => o !== null && typeof o === 'object' && !Array.isArray(o);
        const intIn = (v, lo, hi) => isInt(v) && v >= lo && v <= hi;

        if (!isObj(data)) throw new GameStateError('Saved game must be an object');
        if (data.format !== GAME_STATE_FORMAT) {
            throw new GameStateError(`Not a Brass: Birmingham saved game (format "${data.format}")`);
        }
        if (!isInt(data.version) || data.version < 1) throw new GameStateError(`Invalid saved game version: ${data.version}`);
        if (data.version > GAME_STATE_VERSION) {
            throw new GameStateError(`Saved game version ${data.version} is newer than this game supports (${GAME_STATE_VERSION})`);
        }

        const n = data.numPlayers;
        if (![2, 3, 4].includes(n)) throw new GameStateError(`Invalid player count: ${n}`);
        if (!Array.isArray(data.players) || data.players.length !== n) {
            throw new GameStateError('Player list does not match the player count');
        }
        const isPlayer = (id) => isInt(id) && id >= 0 && id < n;

        const validCard = (c, where, allowWild) => {
            if (!isObj(c) || typeof c.type !== 'string') return err(`${where}: malformed card`);
            if (c.type === CARD_TYPES.LOCATION) {
                if (!CITIES[c.location]) err(`${where}: unknown location card "${c.location}"`);
            } else if (c.type === CARD_TYPES.INDUSTRY) {
                if (!Array.isArray(c.industryTypes) || c.industryTypes.length === 0 ||
                    !c.industryTypes.every(t => INDUSTRY_DATA[t])) err(`${where}: invalid industry card`);
            } else if (c.type === CARD_TYPES.WILD_LOCATION || c.type === CARD_TYPES.WILD_INDUSTRY) {
                if (!allowWild) err(`${where}: wild card not allowed here`);
            } else {
                err(`${where}: unknown card type "${c.type}"`);
            }
        };
        const validCards = (arr, where, allowWild) => {
            if (!Array.isArray(arr)) return err(`${where}: must be a list of cards`);
            arr.forEach((c, i) => validCard(c, `${where}[${i}]`, allowWild));
        };

        // Turn / era bookkeeping
        if (data.era !== ERA.CANAL && data.era !== ERA.RAIL) err(`invalid era "${data.era}"`);
        if (!intIn(data.round, 1, 100)) err(`invalid round ${data.round}`);
        if (!intIn(data.currentPlayerIndex, 0, n - 1)) err(`invalid currentPlayerIndex ${data.currentPlayerIndex}`);
        if (!intIn(data.actionsPerTurn, 1, 2)) err(`invalid actionsPerTurn ${data.actionsPerTurn}`);
        if (!intIn(data.actionsThisTurn, 0, 2)) err(`invalid actionsThisTurn ${data.actionsThisTurn}`);
        if (typeof data.isFirstRound !== 'boolean' || typeof data.gameOver !== 'boolean') err('invalid round flags');
        if (!Array.isArray(data.turnOrder) ||
            [...data.turnOrder].sort().join() !== [...Array(n).keys()].join()) err('turn order is not a permutation of the players');
        if (!isObj(data.moneySpentThisRound) || !Object.entries(data.moneySpentThisRound)
            .every(([k, v]) => isPlayer(Number(k)) && isInt(v) && v >= 0)) err('invalid money-spent record');
        if (!isObj(data.rng) || !SeededRandom.isUint32(data.rng.seed) || !SeededRandom.isUint32(data.rng.state)) {
            err('invalid random generator state');
        }

        // Players
        data.players.forEach((p, i) => {
            const at = `players[${i}]`;
            if (!isObj(p)) return err(`${at}: malformed player`);
            if (typeof p.name !== 'string') err(`${at}: invalid name`);
            if (typeof p.isAI !== 'boolean') err(`${at}: invalid isAI`);
            if (!['easy', 'normal', 'hard'].includes(p.aiDifficulty)) err(`${at}: invalid AI difficulty`);
            // Negative money only while an income shortfall is pending, which
            // requires tiles to sell (checked against the board below)
            if (!isInt(p.money)) err(`${at}: invalid money ${p.money}`);
            if (!intIn(p.incomeSpace, 0, MAX_INCOME_SPACE)) err(`${at}: invalid income space ${p.incomeSpace}`);
            if (!isInt(p.vp) || p.vp < 0) err(`${at}: invalid VP ${p.vp}`);
            validCards(p.hand, `${at}.hand`, true);
            if (Array.isArray(p.hand) && p.hand.length > HAND_SIZE) err(`${at}: more than ${HAND_SIZE} cards in hand`);
            validCards(p.discardPile, `${at}.discardPile`, false);
            if (!isObj(p.linksRemaining) || !intIn(p.linksRemaining.canal, 0, 14) || !intIn(p.linksRemaining.rail, 0, 14)) {
                err(`${at}: invalid link tiles`);
            }
            if (!isObj(p.mat)) {
                err(`${at}: missing player mat`);
            } else {
                for (const [type, levels] of Object.entries(INDUSTRY_DATA)) {
                    const count = levels.reduce((sum, l) => sum + l.count, 0);
                    const used = p.mat[type];
                    if (!Array.isArray(used) || used.length !== count || !used.every(u => typeof u === 'boolean')) {
                        err(`${at}: invalid ${type} tiles on the player mat`);
                    }
                }
            }
        });

        // Board
        const validTile = (t, at, allowedTypes) => {
            if (!isObj(t)) return err(`${at}: malformed tile`);
            if (!isPlayer(t.playerId)) err(`${at}: invalid owner`);
            if (!allowedTypes.includes(t.type)) return err(`${at}: ${t.type} not allowed here`);
            if (!INDUSTRY_DATA[t.type].some(d => d.level === t.level)) err(`${at}: invalid level ${t.level}`);
            if (typeof t.flipped !== 'boolean') err(`${at}: invalid flipped flag`);
            if (!isInt(t.resourceCubes) || t.resourceCubes < 0) err(`${at}: invalid resource cubes`);
        };
        if (!isObj(data.boardIndustries)) {
            err('missing board industries');
        } else {
            for (const [key, t] of Object.entries(data.boardIndustries)) {
                const [cityId, slot, extra] = key.split('_');
                const slots = CITIES[cityId] && CITIES[cityId].slots;
                if (!slots || extra !== undefined || !isInt(Number(slot)) || !slots[Number(slot)]) {
                    err(`unknown industry space "${key}"`);
                    continue;
                }
                validTile(t, key, slots[Number(slot)]);
            }
        }
        if (!isObj(data.breweryFarmTiles)) {
            err('missing farm breweries');
        } else {
            for (const [key, t] of Object.entries(data.breweryFarmTiles)) {
                if (!BREWERY_FARMS[key]) err(`unknown farm brewery "${key}"`);
                else validTile(t, key, [INDUSTRY_TYPES.BREWERY]);
            }
        }
        if (!isObj(data.boardLinks)) {
            err('missing links');
        } else {
            for (const [id, l] of Object.entries(data.boardLinks)) {
                const conn = CONNECTIONS.find(c => c.id === id);
                if (!conn) { err(`unknown connection "${id}"`); continue; }
                if (!isObj(l) || !isPlayer(l.playerId) || (l.type !== 'canal' && l.type !== 'rail') || !conn[l.type]) {
                    err(`invalid link on "${id}"`);
                }
            }
        }

        // Markets, merchants, cards
        if (!intIn(data.coalMarket, 0, COAL_MARKET_PRICES.length)) err(`invalid coal market ${data.coalMarket}`);
        if (!intIn(data.ironMarket, 0, IRON_MARKET_PRICES.length)) err(`invalid iron market ${data.ironMarket}`);
        if (!Array.isArray(data.merchantTiles) || !data.merchantTiles.every(m => isObj(m) && MERCHANTS[m.location] &&
            (m.buys === 'any' || m.buys === 'blank' || isSellableIndustry(m.buys)) && typeof m.hasBeer === 'boolean')) {
            err('invalid merchant tiles');
        }
        validCards(data.drawDeck, 'drawDeck', false);
        if (!intIn(data.wildLocationPile, 0, 4) || !intIn(data.wildIndustryPile, 0, 4)) err('invalid wild card piles');
        if (data.lastRoundEvents !== undefined && !Array.isArray(data.lastRoundEvents)) err('invalid round events');

        if (isObj(data.boardIndustries) && isObj(data.breweryFarmTiles)) {
            const owners = new Set([...Object.values(data.boardIndustries), ...Object.values(data.breweryFarmTiles)]
                .map(t => t && t.playerId));
            data.players.forEach((p, i) => {
                if (isObj(p) && isInt(p.money) && p.money < 0 && !owners.has(i)) {
                    err(`players[${i}]: negative money with no tiles to sell`);
                }
            });
        }

        if (errors.length) throw new GameStateError(`Invalid saved game: ${errors.join('; ')}`);
    }

    // Rounds left in the current era, counting the round in progress: the
    // first round of an era reports ROUNDS_PER_ERA (10 / 9 / 8 at 2 / 3 / 4
    // players) and the last reports 1. 0 once the era's cards are all played
    // (scoring is due, possibly after a pending shortfall) or the game is over.
    getRoundsRemaining() {
        if (this.gameOver || this.isEraOver()) return 0;
        return Math.max(1, ROUNDS_PER_ERA[this.numPlayers] - this.round + 1);
    }

    // A playable copy of the game holding only what `viewerId` may know: the
    // same information as getPlayerView(viewerId), as a GameState that rules
    // queries can run on. Other players' hands, the draw deck and face-down
    // discards become placeholder cards (counts kept, contents and order
    // gone), and the random generator is replaced by a fixed one, so the copy
    // cannot reveal future shuffles. Two games that differ only in what the
    // viewer cannot see give identical observations. Changes to the copy never
    // affect this game.
    getObservation(viewerId) {
        const obs = this.clone();
        const hidden = (c) => (c && c.faceDown ? { type: 'hidden', faceDown: true } : { type: 'hidden' });
        obs.drawDeck = obs.drawDeck.map(hidden);
        for (const p of obs.players) {
            if (p.id !== viewerId) p.hand = p.hand.map(hidden);
            p.discardPile = p.discardPile.map(c => (c.faceDown ? hidden(c) : c));
        }
        obs.rng = new SeededRandom(0);
        return obs;
    }

    // What one player may see (viewerId), or what everyone may see (null):
    // other players' hands, the draw deck, face-down discards and the random
    // generator are reduced to counts / placeholders. Not restorable.
    getPlayerView(viewerId = null) {
        const full = this.serialize();
        const hiddenCard = (c) => (c.faceDown ? { faceDown: true } : c);
        return {
            ...full,
            format: GAME_STATE_VIEW_FORMAT,
            viewerId,
            rng: undefined,
            drawDeck: undefined,
            drawDeckCount: full.drawDeck.length,
            players: full.players.map((p, i) => ({
                ...p,
                hand: i === viewerId ? p.hand : undefined,
                handCount: p.hand.length,
                discardPile: p.discardPile.map(hiddenCard),
            })),
        };
    }

    // ========================================================================
    // State inspection for window.render_game_to_text
    // ========================================================================

    toJSON() {
        return {
            era: this.era,
            round: this.round,
            currentPlayer: this.currentPlayerId,
            actionsRemaining: this.actionsPerTurn - this.actionsThisTurn,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                money: p.money,
                incomeLevel: incomeLevelFromSpace(p.incomeSpace),
                incomeSpace: p.incomeSpace,
                vp: p.vp,
                handSize: p.hand.length,
                linksRemaining: p.linksRemaining,
            })),
            coalMarket: this.coalMarket,
            ironMarket: this.ironMarket,
            boardIndustries: Object.keys(this.boardIndustries).length,
            boardLinks: Object.keys(this.boardLinks).length,
            drawDeckSize: this.drawDeck.length,
        };
    }
}
