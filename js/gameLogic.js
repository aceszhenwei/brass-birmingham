// ============================================================================
// Brass: Birmingham - Game Logic
// ============================================================================
// Rules queries (legal targets, costs, sources) and the legacy execute*
// entry points. Every action is validated and executed by the move engine
// in js/moves.js (applyMove / getLegalMoves), which is mixed into this class.

class GameLogic {
    constructor(gameState) {
        this.state = gameState;
    }

    // ========================================================================
    // Action Validation
    // ========================================================================

    canPerformAction(action, playerId) {
        const player = this.state.players[playerId];
        if (player.hand.length === 0) return false;
        if (this.state.getPendingShortfalls().length > 0) return false;

        switch (action) {
            case ACTIONS.BUILD: return this.getValidBuildTargets(playerId).length > 0;
            case ACTIONS.NETWORK: return this.getValidNetworkTargets(playerId).length > 0;
            case ACTIONS.DEVELOP: return this.canDevelop(playerId);
            case ACTIONS.SELL: return this.getValidSellTargets(playerId).length > 0;
            case ACTIONS.LOAN: return this.state.canTakeLoan(playerId);
            case ACTIONS.SCOUT: return this.canScout(playerId);
            case ACTIONS.PASS: return true; // Can always pass
            default: return false;
        }
    }

    // ========================================================================
    // BUILD Action
    // ========================================================================

    getValidBuildTargets(playerId) {
        const targets = [];
        for (const [cityId, city] of Object.entries(CITIES)) {
            city.slots.forEach((allowedTypes, slotIndex) => {
                for (const indType of allowedTypes) {
                    const target = this.checkBuildTargetAt(playerId, cityId, slotIndex, indType);
                    if (target) targets.push(target);
                }
            });
        }
        // Farm Breweries: standalone locations with a single brewery space,
        // buildable only via a Brewery Industry card or Wild Industry card
        for (const farmId of Object.keys(BREWERY_FARMS)) {
            const target = this.checkBuildTargetAt(playerId, farmId, 0, INDUSTRY_TYPES.BREWERY);
            if (target) targets.push(target);
        }
        return targets;
    }

    // Full legality check for ONE (location, slot, industry) build candidate:
    // the space exists and shows that industry, the slot-preference rule,
    // era, Canal-Era one-tile-per-location, overbuilding, cost and having a
    // usable card. Returns a target object or null.
    checkBuildTargetAt(playerId, cityId, slotIndex, indType) {
        if (isBreweryFarm(cityId)) {
            if (indType !== INDUSTRY_TYPES.BREWERY || slotIndex !== 0) return null;
            return this.checkBuildTarget(playerId, cityId, 0, indType, this.state.breweryFarmTiles[cityId]);
        }
        const city = CITIES[cityId];
        const allowedTypes = city && city.slots[slotIndex];
        if (!allowedTypes || !allowedTypes.includes(indType)) return null;
        const existing = this.state.boardIndustries[`${cityId}_${slotIndex}`];

        // Rulebook slot preference: a tile must go on a vacant space showing
        // ONLY its icon if one exists; multi-icon spaces are only legal once
        // no vacant single-icon space matches. (Overbuilding is exempt.)
        if (!existing && allowedTypes.length > 1) {
            const singleIconVacant = city.slots.some((types, i) => types.length === 1 && types[0] === indType &&
                !this.state.boardIndustries[`${cityId}_${i}`]);
            if (singleIconVacant) return null;
        }
        return this.checkBuildTarget(playerId, cityId, slotIndex, indType, existing);
    }

    // Shared validation for one (location, slot, industry) build candidate.
    // Returns a target object or null.
    checkBuildTarget(playerId, cityId, slotIndex, indType, existing) {
        const nextTile = this.state.getNextTile(playerId, indType);
        if (!nextTile) return null;

        // Era restrictions
        if (this.state.era === ERA.CANAL && !nextTile.canalEra) return null;
        if (this.state.era === ERA.RAIL && !nextTile.railEra) return null;

        // Canal era: only one tile per location per player.
        // Exclude the current slot from the check: overbuilding it
        // would replace the existing tile, keeping the count at 1.
        if (this.state.era === ERA.CANAL && isCity(cityId)) {
            const city = CITIES[cityId];
            for (let i = 0; i < city.slots.length; i++) {
                if (i === slotIndex) continue;
                const t = this.state.boardIndustries[`${cityId}_${i}`];
                if (t && t.playerId === playerId) return null;
            }
        }

        // Overbuilding: always requires a higher-level tile of the SAME industry
        if (existing) {
            if (existing.type !== indType) return null;
            if (nextTile.level <= existing.tileData.level) return null;
            if (existing.playerId !== playerId) {
                // Opponent tiles: only Coal Mines / Iron Works, and only when
                // no cubes of that resource exist anywhere (board + market)
                if (existing.type !== INDUSTRY_TYPES.COAL_MINE &&
                    existing.type !== INDUSTRY_TYPES.IRON_WORKS) return null;
                if (!this.isResourceDepleted(existing.type)) return null;
            }
        }

        const cost = this.calculateBuildCost(playerId, indType, cityId);
        if (cost === null) return null;

        if (!this.hasCardForBuild(playerId, cityId, indType)) return null;

        return {
            cityId,
            slotIndex,
            industryType: indType,
            tileData: nextTile,
            cost,
        };
    }

    // Does the player have no presence on the board at all? (Enables the
    // "build anywhere with an Industry card" exception.)
    playerHasNoTilesOnBoard(playerId) {
        const hasIndustry = Object.values(this.state.boardIndustries).some(t => t.playerId === playerId) ||
            Object.values(this.state.breweryFarmTiles).some(t => t && t.playerId === playerId);
        if (hasIndustry) return false;
        const hasLink = Object.values(this.state.boardLinks).some(l => l.playerId === playerId);
        return !hasLink;
    }

    hasCardForBuild(playerId, cityId, industryType) {
        const player = this.state.players[playerId];
        const isFarm = isBreweryFarm(cityId);
        const inNetwork = this.state.isInNetwork(playerId, cityId);
        // Industry cards normally require the location to be in your network,
        // but a player with nothing on the board may build anywhere with one
        const industryCardOk = inNetwork || this.playerHasNoTilesOnBoard(playerId);

        for (const card of player.hand) {
            if (card.type === CARD_TYPES.LOCATION) {
                // Location card: build at that location (no network needed).
                // No location cards exist for the farm breweries.
                if (!isFarm && card.location === cityId) return true;
            } else if (card.type === CARD_TYPES.INDUSTRY) {
                if (card.industryTypes.includes(industryType) && industryCardOk) return true;
            } else if (card.type === CARD_TYPES.WILD_LOCATION) {
                // Wild location: any location EXCEPT the farm breweries
                if (!isFarm) return true;
            } else if (card.type === CARD_TYPES.WILD_INDUSTRY) {
                if (industryCardOk) return true;
            }
        }
        return false;
    }

    // Cost of building the player's next tile of `industryType` at `cityId`,
    // with coal and iron sourced as the rules require (the cost is the same
    // for every legal choice of sources). Null if it can't be paid for.
    calculateBuildCost(playerId, industryType, cityId) {
        const tile = this.state.getNextTile(playerId, industryType);
        if (!tile) return null;
        const run = this.newPlanRun();
        let coalCost = 0;
        let ironCost = 0;
        try {
            for (let i = 0; i < tile.costCoal; i++) coalCost += this.takeCoal(run, playerId, [cityId], ['coal', i]).price;
            for (let i = 0; i < tile.costIron; i++) ironCost += this.takeIron(run, ['iron', i]).price;
        } catch (err) {
            if (err instanceof MoveError) return null; // no coal / iron available
            throw err;
        }
        const total = tile.cost + coalCost + ironCost;
        if (total > this.state.players[playerId].money) return null;
        return { money: tile.cost, coal: tile.costCoal, coalCost, iron: tile.costIron, ironCost, total };
    }

    // Legacy entry point: a Build move (see js/moves.js)
    executeBuild(playerId, cityId, slotIndex, industryType, cardIndex, choices = {}) {
        return this.applyMove(playerId, { type: ACTIONS.BUILD, card: cardIndex, location: cityId, slot: slotIndex,
            industry: industryType, coal: choices.coal, iron: choices.iron });
    }

    isResourceDepleted(industryType) {
        // Check if there are 0 resource cubes of this type anywhere on the board
        if (industryType === INDUSTRY_TYPES.COAL_MINE) {
            if (this.state.coalMarket > 0) return false;
            for (const tile of Object.values(this.state.boardIndustries)) {
                if (tile.type === INDUSTRY_TYPES.COAL_MINE && !tile.flipped && tile.resourceCubes > 0) {
                    return false;
                }
            }
            return true;
        }
        if (industryType === INDUSTRY_TYPES.IRON_WORKS) {
            if (this.state.ironMarket > 0) return false;
            for (const tile of Object.values(this.state.boardIndustries)) {
                if (tile.type === INDUSTRY_TYPES.IRON_WORKS && !tile.flipped && tile.resourceCubes > 0) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    // ========================================================================
    // NETWORK Action
    // ========================================================================

    getValidNetworkTargets(playerId) {
        const targets = [];
        for (const conn of CONNECTIONS) {
            const target = this.checkNetworkTarget(playerId, conn);
            if (target) targets.push(target);
        }
        return targets;
    }

    // Legality of building ONE link on `conn` as a single-link Network
    // action: unbuilt, right era, link tiles left, adjacent to the network
    // (unless the player has nothing on the board), coal for rail, and
    // affordable. Returns a target object or null.
    checkNetworkTarget(playerId, conn) {
        const player = this.state.players[playerId];
        const era = this.state.era;
        if (!conn || this.state.boardLinks[conn.id]) return null;
        if (era === ERA.CANAL && !conn.canal) return null;
        if (era === ERA.RAIL && !conn.rail) return null;
        if (player.linksRemaining[era === ERA.CANAL ? 'canal' : 'rail'] <= 0) return null;

        // At least one end must be in the network — except for a player
        // with nothing on the board, who may link anywhere
        if (!this.playerHasNoTilesOnBoard(playerId) &&
            !this.state.isInNetwork(playerId, conn.cities[0]) &&
            !this.state.isInNetwork(playerId, conn.cities[1])) return null;

        let cost;
        if (era === ERA.CANAL) {
            cost = CANAL_LINK_COST;
        } else {
            // Rail also needs coal from the closest mine to either end
            const coalSource = this.findCheapestCoalForLink(conn, playerId);
            if (!coalSource) return null;
            cost = RAIL_LINK_COST + (coalSource.free ? 0 : coalSource.price);
        }
        if (cost > player.money) return null;

        return { connectionId: conn.id, cities: conn.cities, cost, type: era === ERA.CANAL ? 'canal' : 'rail' };
    }

    // Legacy entry point: a single-link Network move. options.coalMineKey
    // picks between equally close mines (an illegal pick is rejected).
    executeNetwork(playerId, connectionId, cardIndex, options = {}) {
        return this.applyMove(playerId, { type: ACTIONS.NETWORK, card: cardIndex, links: [connectionId],
            coal: options.coalMineKey ? [`mine:${options.coalMineKey}`] : undefined });
    }

    // Double rail link (Rail Era only): 2 links for £15 total, 1 coal per
    // link (each sourced after its link is placed), plus 1 beer consumed
    // from a Brewery — merchant beer is NOT allowed, and an opponent's
    // brewery must be connected to the SECOND link.

    // Candidate second links for firstConnId: each candidate is fully
    // validated by the Network planner (adjacency, both coals in order, beer
    // and the £15 + coal total), so only buildable pairs are offered.
    getValidSecondRailLinks(playerId, firstConnId) {
        if (this.state.era !== ERA.RAIL) return [];
        if (this.state.players[playerId].linksRemaining.rail < 2) return [];
        if (!CONNECTIONS.some(c => c.id === firstConnId)) return [];

        const targets = [];
        for (const conn of CONNECTIONS) {
            if (conn.id === firstConnId || !conn.rail || this.state.boardLinks[conn.id]) continue;
            const r = this.resolveMove(playerId, { type: ACTIONS.NETWORK, links: [firstConnId, conn.id] },
                { requireCard: false });
            if (!r.ok) continue;
            targets.push({ connectionId: conn.id, cities: conn.cities, coalCost: r.plan.coalCost2, totalCost: r.plan.cost });
        }
        return targets;
    }

    // Legacy entry point: a double-link Network move.
    // options.coalMineKey1 / coalMineKey2 pick between equally close mines.
    executeNetworkDouble(playerId, connectionId1, connectionId2, cardIndex, options = {}) {
        const coal = (options.coalMineKey1 || options.coalMineKey2)
            ? [options.coalMineKey1 ? `mine:${options.coalMineKey1}` : undefined,
                options.coalMineKey2 ? `mine:${options.coalMineKey2}` : undefined]
            : undefined;
        return this.applyMove(playerId, { type: ACTIONS.NETWORK, card: cardIndex,
            links: [connectionId1, connectionId2], coal, beer: options.beer });
    }

    // Coal options for a rail link. Rulebook: coal comes from the closest
    // connected unflipped mine (fewest links distant), with the link counted
    // as already placed — so distance is measured from whichever endpoint is
    // nearer, and a mine AT either endpoint is distance 0. Market coal is only
    // an option when no mine is reachable (and an endpoint reaches a merchant).
    // Returns { mines: [{ key, distance }] — the equally-closest mines, among
    // which the player may choose — and market: source or null }.
    getRailCoalOptions(conn, playerId) {
        const run = this.newPlanRun();
        const options = this.coalOptions(conn.cities, playerId, run);
        if (options[0] === 'market') {
            return { mines: [], market: { type: 'market', price: this.marketPrice('coal', 0), free: false } };
        }
        return { mines: options.map(src => ({ key: src.slice('mine:'.length) })), market: null };
    }

    // The coal source a rail link will consume: the closest mine (or the
    // preferred one, if it is among the equally-closest), else market coal.
    // Returns a source object ({ type: 'mine', key, free } or a market entry)
    // or null if no coal is available.
    findCheapestCoalForLink(conn, playerId, preferredMineKey = null) {
        const { mines, market } = this.getRailCoalOptions(conn, playerId);
        if (mines.length > 0) {
            const pick = mines.find(m => m.key === preferredMineKey) || mines[0];
            return { type: 'mine', key: pick.key, free: true };
        }
        return market;
    }

    // ========================================================================
    // DEVELOP Action
    // ========================================================================

    canDevelop(playerId) {
        const player = this.state.players[playerId];
        // Need iron to develop (1 iron per tile removed)
        const ironSources = this.state.findIronSource(playerId);
        if (ironSources.length === 0) return false;

        // If the only iron available is from the market, player must be able to afford it
        const firstSource = ironSources[0];
        if (!firstSource.free && firstSource.price > player.money) return false;

        // Need at least one developable tile
        for (const [type, tiles] of Object.entries(player.industryTiles)) {
            const nextTile = tiles.find(t => !t.used);
            if (nextTile && nextTile.canDevelop) return true;
        }
        return false;
    }

    getDevelopableTypes(playerId) {
        const player = this.state.players[playerId];
        const types = [];
        for (const [type, tiles] of Object.entries(player.industryTiles)) {
            const nextTile = tiles.find(t => !t.used);
            if (nextTile && nextTile.canDevelop) {
                types.push({
                    type,
                    tile: nextTile,
                    name: INDUSTRY_DISPLAY[type].name,
                    level: nextTile.level,
                });
            }
        }
        return types;
    }

    // The tile a Develop would remove from `type`, `skip` tiles further down
    // the stack (skip=1 when the same industry is developed twice in one
    // action: the second removal takes the tile under the first).
    peekDevelopTile(playerId, type, skip = 0) {
        const tiles = this.state.players[playerId].industryTiles[type];
        if (!tiles) return null;
        return tiles.filter(t => !t.used)[skip] || null;
    }

    // Can the player develop type1 (and optionally type2) in one action?
    // Each removed tile must be the lowest of its industry at the moment it
    // is removed and must not carry the "cannot develop" (lightbulb) icon,
    // and the player must be able to pay for 1 iron per tile. (Delegates to
    // the Develop planner, so the UI, AI and engine share one rule.)
    canDevelopTypes(playerId, type1, type2 = null) {
        const r = this.resolveMove(playerId, { type: ACTIONS.DEVELOP, industries: type2 ? [type1, type2] : [type1] },
            { requireCard: false });
        return r.ok ? { ok: true, message: '', ironCost: r.plan.cost } : { ok: false, message: r.message };
    }

    // Industries that may be developed as the SECOND tile after firstType
    // (legal and affordable), for the UI and AI.
    getSecondDevelopOptions(playerId, firstType) {
        const options = [];
        for (const type of Object.keys(this.state.players[playerId].industryTiles)) {
            if (!this.canDevelopTypes(playerId, firstType, type).ok) continue;
            const tile = this.peekDevelopTile(playerId, type, type === firstType ? 1 : 0);
            options.push({ type, tile, name: INDUSTRY_DISPLAY[type].name, level: tile.level });
        }
        return options;
    }

    // Legacy entry point: a Develop move
    executeDevelop(playerId, industryType1, industryType2, cardIndex, choices = {}) {
        return this.applyMove(playerId, { type: ACTIONS.DEVELOP, card: cardIndex,
            industries: industryType2 ? [industryType1, industryType2] : [industryType1], iron: choices.iron });
    }

    // ========================================================================
    // SELL Action
    // ========================================================================

    // The merchant tiles (by index) that a tile at cityId could sell to:
    // non-blank, accepting the industry type, and connected to the city.
    getSellMerchantsFor(playerId, cityId, industryType) {
        const connected = this.state.getConnectedLocations(cityId);
        const indices = [];
        for (let i = 0; i < this.state.merchantTiles.length; i++) {
            const mt = this.state.merchantTiles[i];
            if (mt.buys === 'blank') continue;
            if (!this.state.merchantTileAccepts(mt, industryType)) continue;
            if (!connected.has(mt.location)) continue;
            indices.push(i);
        }
        return indices;
    }

    getValidSellTargets(playerId) {
        const targets = [];

        for (const [key, tile] of Object.entries(this.state.boardIndustries)) {
            if (tile.playerId !== playerId) continue;
            if (tile.flipped) continue;
            if (!isSellableIndustry(tile.type)) continue;

            const [cityId] = key.split('_');

            // Every sale — even for tiles needing 0 beer — requires a
            // connected merchant tile that accepts this industry
            const merchantIndices = this.getSellMerchantsFor(playerId, cityId, tile.type);
            if (merchantIndices.length === 0) continue;

            // Beer requirement. A tile is sold to ONE merchant tile, so at most
            // one merchant barrel (the one beside that tile) can count; the
            // rest must come from breweries.
            const beerNeeded = tile.tileData.beersToSell || 0;
            const merchantBeerAvailable = merchantIndices.some(i => this.state.merchantTiles[i].hasBeer);
            if (beerNeeded > 0) {
                const breweryBeer = this.state.findBeerSources(cityId, playerId, null).length;
                if (breweryBeer + (merchantBeerAvailable ? 1 : 0) < beerNeeded) continue;
            }

            targets.push({
                key,
                cityId,
                tile,
                beerNeeded,
                merchantIndices,
                merchantBeerAvailable,
            });
        }

        return targets;
    }

    // Rough value ordering used to pick which merchant's beer to drink when
    // several are available (human UI offers a toggle, not a full picker).
    merchantBonusValue(mt) {
        const merchData = MERCHANTS[mt.location];
        if (!merchData) return 0;
        switch (merchData.bonusType) {
            case 'vp': return merchData.bonusAmount;
            case 'money': return merchData.bonusAmount * 0.4;
            case 'income': return 1.5;
            case 'develop': return 1.5;
            default: return 0;
        }
    }

    // Legacy check for a sell plan ([{ key, useMerchantBeer }]): can every
    // tile in it be sold together? (Delegates to the Sell planner.)
    planSell(playerId, sellPlan) {
        const r = this.resolveMove(playerId, { type: ACTIONS.SELL, sales: legacySales(sellPlan) }, { requireCard: false });
        return { ok: r.ok, message: r.message, move: r.resolved };
    }

    // Legacy entry point: a Sell move. sellPlan entries are
    // { key, useMerchantBeer } (or move-style { tile, merchant, beer,
    // freeDevelop }). The Gloucester free develop is part of the move.
    executeSell(playerId, sellPlan, cardIndex) {
        const result = this.applyMove(playerId, { type: ACTIONS.SELL, card: cardIndex, sales: legacySales(sellPlan) });
        return { ...result, pendingDevelopBonuses: 0 };
    }

    // ========================================================================
    // LOAN Action
    // ========================================================================

    // Legacy entry point: a Loan move
    executeLoan(playerId, cardIndex) {
        return this.applyMove(playerId, { type: ACTIONS.LOAN, card: cardIndex });
    }

    // ========================================================================
    // SCOUT Action
    // ========================================================================

    canScout(playerId) {
        const player = this.state.players[playerId];
        // Need at least 3 cards in hand (1 for action + 2 additional)
        if (player.hand.length < 3) return false;
        // Cannot have wild cards already
        if (this.state.playerHasWildCard(playerId)) return false;
        // Must have wild cards available
        if (this.state.wildLocationPile <= 0 || this.state.wildIndustryPile <= 0) return false;
        return true;
    }

    // Legacy entry point: a Scout move (cardIndices: the 3 cards to discard)
    executeScout(playerId, cardIndices) {
        return this.applyMove(playerId, { type: ACTIONS.SCOUT, cards: cardIndices });
    }

    // ========================================================================
    // PASS Action
    // ========================================================================

    // Legacy entry point: a Pass move
    executePass(playerId, cardIndex) {
        return this.applyMove(playerId, { type: ACTIONS.PASS, card: cardIndex });
    }

    // ========================================================================
    // Disabled Reason for Action Buttons
    // ========================================================================

    getDisabledReason(action, playerId) {
        const player = this.state.players[playerId];
        if (player.hand.length === 0) return 'Hand is empty';
        if (this.state.getPendingShortfalls().length > 0) return 'An income shortfall must be covered first';

        switch (action) {
            case ACTIONS.BUILD:
                if (this.getValidBuildTargets(playerId).length === 0) {
                    return 'No valid build locations';
                }
                return null;
            case ACTIONS.NETWORK: {
                const era = this.state.era;
                if (era === ERA.CANAL && player.linksRemaining.canal <= 0) return 'No canal links remaining';
                if (era === ERA.RAIL && player.linksRemaining.rail <= 0) return 'No rail links remaining';
                if (this.getValidNetworkTargets(playerId).length === 0) return 'No valid connections available';
                return null;
            }
            case ACTIONS.DEVELOP: {
                const ironSources = this.state.findIronSource(playerId);
                if (ironSources.length === 0) return 'No iron available';
                if (!this.canDevelop(playerId)) return 'No developable tiles on your mat';
                return null;
            }
            case ACTIONS.SELL:
                if (this.getValidSellTargets(playerId).length === 0) return 'No industries ready to sell';
                return null;
            case ACTIONS.LOAN:
                if (!this.state.canTakeLoan(playerId)) return 'Income too low — a loan cannot drop it below -10';
                return null;
            case ACTIONS.SCOUT:
                if (player.hand.length < 3) return 'Need at least 3 cards';
                if (this.state.playerHasWildCard(playerId)) return 'Already have wild cards';
                if (this.state.wildLocationPile <= 0 || this.state.wildIndustryPile <= 0) return 'No wild cards available';
                return null;
            case ACTIONS.PASS:
                return null;
            default:
                return 'Unknown action';
        }
    }

    // ========================================================================
    // Card Management
    // ========================================================================

    // Is cardIndex a real card in the player's hand?
    isValidCardIndex(playerId, cardIndex) {
        const player = this.state.players[playerId];
        return Number.isInteger(cardIndex) && cardIndex >= 0 && cardIndex < player.hand.length;
    }

    discardCard(playerId, cardIndex) {
        const player = this.state.players[playerId];
        if (cardIndex < 0 || cardIndex >= player.hand.length) return;

        const card = player.hand[cardIndex];

        // Wild cards go back to their piles; all others onto the discard pile
        if (card.type === CARD_TYPES.WILD_LOCATION) {
            this.state.wildLocationPile++;
        } else if (card.type === CARD_TYPES.WILD_INDUSTRY) {
            this.state.wildIndustryPile++;
        } else {
            player.discardPile.push(card);
        }

        player.hand.splice(cardIndex, 1);
    }

    // ========================================================================
    // Get valid cards for an action
    // ========================================================================

    getValidCardsForAction(playerId, action, target = null) {
        const player = this.state.players[playerId];
        const validIndices = [];

        player.hand.forEach((card, idx) => {
            switch (action) {
                case ACTIONS.BUILD:
                    if (target) {
                        const isFarm = isBreweryFarm(target.cityId);
                        const industryCardOk = this.state.isInNetwork(playerId, target.cityId) ||
                            this.playerHasNoTilesOnBoard(playerId);
                        // Check if card matches the build target
                        if (card.type === CARD_TYPES.LOCATION && !isFarm && card.location === target.cityId) {
                            validIndices.push(idx);
                        } else if (card.type === CARD_TYPES.INDUSTRY &&
                                   card.industryTypes.includes(target.industryType)) {
                            if (industryCardOk) {
                                validIndices.push(idx);
                            }
                        } else if (card.type === CARD_TYPES.WILD_LOCATION && !isFarm) {
                            validIndices.push(idx);
                        } else if (card.type === CARD_TYPES.WILD_INDUSTRY) {
                            if (industryCardOk) {
                                validIndices.push(idx);
                            }
                        }
                    } else {
                        // Any card can potentially be used for build
                        validIndices.push(idx);
                    }
                    break;

                case ACTIONS.NETWORK:
                case ACTIONS.DEVELOP:
                case ACTIONS.SELL:
                case ACTIONS.LOAN:
                case ACTIONS.PASS:
                    // Any card can be discarded for these actions
                    validIndices.push(idx);
                    break;

                case ACTIONS.SCOUT:
                    // All cards are candidates for scout discard
                    validIndices.push(idx);
                    break;
            }
        });

        return validIndices;
    }
}
