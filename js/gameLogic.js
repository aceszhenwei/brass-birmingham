// ============================================================================
// Brass: Birmingham - Game Logic
// ============================================================================

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
            // Rulebook slot preference: a tile must go on a vacant space
            // showing ONLY its icon if one exists; multi-icon spaces are only
            // legal once no vacant single-icon space matches. (Overbuilding
            // occupied slots is exempt.)
            const vacantSingleIconTypes = new Set();
            city.slots.forEach((slotTypes, slotIndex) => {
                const key = `${cityId}_${slotIndex}`;
                const allowed = Array.isArray(slotTypes) ? slotTypes : [slotTypes];
                if (!this.state.boardIndustries[key] && allowed.length === 1) {
                    vacantSingleIconTypes.add(allowed[0]);
                }
            });

            city.slots.forEach((slotTypes, slotIndex) => {
                const key = `${cityId}_${slotIndex}`;
                const existing = this.state.boardIndustries[key];

                // Check each industry type allowed in this slot
                const allowedTypes = Array.isArray(slotTypes) ? slotTypes : [slotTypes];

                for (const indType of allowedTypes) {
                    // Slot preference: skip multi-icon vacant slots when a
                    // vacant single-icon slot exists for this industry
                    if (!existing && allowedTypes.length > 1 && vacantSingleIconTypes.has(indType)) {
                        continue;
                    }

                    const target = this.checkBuildTarget(playerId, cityId, slotIndex, indType, existing);
                    if (target) targets.push(target);
                }
            });
        }

        // Farm Breweries: standalone locations with a single brewery space,
        // buildable only via a Brewery Industry card or Wild Industry card
        for (const farmId of Object.keys(BREWERY_FARMS)) {
            const existing = this.state.breweryFarmTiles[farmId];
            const target = this.checkBuildTarget(playerId, farmId, 0, INDUSTRY_TYPES.BREWERY, existing);
            if (target) targets.push(target);
        }

        return targets;
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

    calculateBuildCost(playerId, industryType, cityId) {
        const player = this.state.players[playerId];
        const tile = this.state.getNextTile(playerId, industryType);
        if (!tile) return null;

        let moneyCost = tile.cost;
        let coalNeeded = tile.costCoal;
        let ironNeeded = tile.costIron;

        // Find cheapest coal sources
        let coalCost = 0;
        if (coalNeeded > 0) {
            const sources = this.state.findCoalSource(cityId, playerId);
            let remaining = coalNeeded;
            for (const src of sources) {
                if (remaining <= 0) break;
                if (src.free) {
                    remaining--;
                } else {
                    coalCost += src.price;
                    remaining--;
                }
            }
            if (remaining > 0) return null; // Not enough coal
        }

        // Find cheapest iron sources
        let ironCost = 0;
        if (ironNeeded > 0) {
            const sources = this.state.findIronSource(playerId);
            let remaining = ironNeeded;
            for (const src of sources) {
                if (remaining <= 0) break;
                if (src.free) {
                    remaining--;
                } else {
                    ironCost += src.price;
                    remaining--;
                }
            }
            if (remaining > 0) return null; // Not enough iron
        }

        const totalCost = moneyCost + coalCost + ironCost;
        if (totalCost > player.money) return null;

        return {
            money: moneyCost,
            coal: coalNeeded,
            coalCost,
            iron: ironNeeded,
            ironCost,
            total: totalCost,
        };
    }

    executeBuild(playerId, cityId, slotIndex, industryType, cardIndex) {
        const isFarm = isBreweryFarm(cityId);

        // The target must be one the Build action actually offers (slot type,
        // era, network, overbuild and slot-preference rules), and the card
        // must be one that can pay for it.
        const target = { cityId, slotIndex, industryType };
        const legal = this.getValidBuildTargets(playerId).some(t =>
            t.cityId === cityId && t.slotIndex === slotIndex && t.industryType === industryType);
        if (!legal) return { success: false, message: 'You cannot build that there' };
        if (!this.getValidCardsForAction(playerId, ACTIONS.BUILD, target).includes(cardIndex)) {
            return { success: false, message: 'That card cannot be used for this build' };
        }

        // Validate cost before consuming the tile — calculateBuildCost uses getNextTile
        // internally, so calling useNextTile first would advance the tile pointer and
        // compute cost for the wrong (next-level) tile.
        const cost = this.calculateBuildCost(playerId, industryType, cityId);
        if (!cost) return { success: false, message: 'Cannot afford this build' };

        const tileData = this.state.useNextTile(playerId, industryType);
        if (!tileData) return { success: false, message: 'No tile available' };

        this.state.spendMoney(playerId, cost.total);

        // Consume coal
        if (cost.coal > 0) {
            let remaining = cost.coal;
            const sources = this.state.findCoalSource(cityId, playerId);
            for (const src of sources) {
                if (remaining <= 0) break;
                if (src.type === 'mine') {
                    this.state.consumeResource(src.key);
                    remaining--;
                } else if (src.type === 'market') {
                    this.state.takeMarketCoal();
                    remaining--;
                }
            }
        }

        // Consume iron
        if (cost.iron > 0) {
            let remaining = cost.iron;
            const sources = this.state.findIronSource(playerId);
            for (const src of sources) {
                if (remaining <= 0) break;
                if (src.type === 'works') {
                    this.state.consumeResource(src.key);
                    remaining--;
                } else if (src.type === 'market') {
                    this.state.takeMarketIron();
                    remaining--;
                }
            }
        }

        // Overbuilt tiles (own or opponent's) are removed from the game along
        // with any cubes on them; placement below simply overwrites the slot.

        // Breweries produce 1 beer when built in the Canal Era, 2 in the Rail
        // Era; coal mines / iron works use the cube count printed on the tile.
        let cubes = tileData.resourceCubes || 0;
        if (industryType === INDUSTRY_TYPES.BREWERY) {
            cubes = this.state.era === ERA.RAIL ? 2 : 1;
        }

        const placedTile = {
            playerId,
            type: industryType,
            tileData: tileData,
            flipped: false,
            resourceCubes: cubes,
        };

        let key;
        if (isFarm) {
            key = cityId; // farm tiles live in breweryFarmTiles by farm id
            this.state.breweryFarmTiles[cityId] = placedTile;
        } else {
            key = `${cityId}_${slotIndex}`;
            this.state.boardIndustries[key] = placedTile;
        }

        // Moving coal/iron to the market: iron works always sell their cubes
        // into empty market spaces immediately; coal mines only if connected
        // to a merchant location. Collected money goes straight to the player
        // (it is not "spent", so it doesn't affect turn order).
        let marketSale = null;
        if (industryType === INDUSTRY_TYPES.IRON_WORKS) {
            marketSale = this.state.autoSellToMarket(key, placedTile);
        } else if (industryType === INDUSTRY_TYPES.COAL_MINE) {
            const connected = this.state.getConnectedLocations(cityId);
            const merchantConnected = [...connected].some(loc => isMerchantLocation(loc));
            if (merchantConnected) {
                marketSale = this.state.autoSellToMarket(key, placedTile);
            }
        }
        if (marketSale && marketSale.moneyGained > 0) {
            this.state.players[playerId].money += marketSale.moneyGained;
        }

        // Discard the used card
        this.discardCard(playerId, cardIndex);

        const locName = isFarm ? BREWERY_FARMS[cityId].name : CITIES[cityId].name;
        let message = `Built ${INDUSTRY_DISPLAY[industryType].name} Level ${tileData.level} in ${locName}`;
        if (marketSale && marketSale.cubesMoved > 0) {
            message += ` — sold ${marketSale.cubesMoved} to market for £${marketSale.moneyGained}`;
            if (marketSale.flipped) message += ' (tile flipped!)';
        }
        return { success: true, message };
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
        const player = this.state.players[playerId];
        const targets = [];
        const era = this.state.era;

        for (const conn of CONNECTIONS) {
            if (this.state.boardLinks[conn.id]) continue; // Already built

            // Check era
            if (era === ERA.CANAL && !conn.canal) continue;
            if (era === ERA.RAIL && !conn.rail) continue;

            // Check if player has link tiles remaining
            if (era === ERA.CANAL && player.linksRemaining.canal <= 0) continue;
            if (era === ERA.RAIL && player.linksRemaining.rail <= 0) continue;

            // Check network connection (at least one end must be in network)
            // Exception: a player with nothing on the board may link anywhere
            if (!this.playerHasNoTilesOnBoard(playerId)) {
                const end1InNetwork = this.state.isInNetwork(playerId, conn.cities[0]);
                const end2InNetwork = this.state.isInNetwork(playerId, conn.cities[1]);
                if (!end1InNetwork && !end2InNetwork) continue;
            }

            // Check cost
            let cost;
            if (era === ERA.CANAL) {
                cost = CANAL_LINK_COST;
            } else {
                cost = RAIL_LINK_COST;
                // Rail also needs coal — check both endpoints, pick cheapest source
                const coalSource = this.findCheapestCoalForLink(conn, playerId);
                if (!coalSource) continue; // No coal available from either end
                cost += coalSource.free ? 0 : coalSource.price;
            }

            if (cost > player.money) continue;

            targets.push({
                connectionId: conn.id,
                cities: conn.cities,
                cost,
                type: era === ERA.CANAL ? 'canal' : 'rail',
            });
        }

        return targets;
    }

    // options.coalMineKey: which of several equally close mines supplies the
    // rail link's coal (see getRailCoalOptions); defaults to the first.
    executeNetwork(playerId, connectionId, cardIndex, options = {}) {
        const player = this.state.players[playerId];
        const conn = CONNECTIONS.find(c => c.id === connectionId);
        if (!conn) return { success: false, message: 'Invalid connection' };

        if (!this.isValidCardIndex(playerId, cardIndex)) {
            return { success: false, message: 'Select a card to discard' };
        }
        if (!this.getValidNetworkTargets(playerId).some(t => t.connectionId === connectionId)) {
            return { success: false, message: 'You cannot build that link' };
        }

        const era = this.state.era;
        const linkType = era === ERA.CANAL ? 'canal' : 'rail';

        // Pay cost
        if (era === ERA.CANAL) {
            this.state.spendMoney(playerId, CANAL_LINK_COST);
        } else {
            let totalCost = RAIL_LINK_COST;
            // Consume coal from the closest mine to either end of the link
            // (options.coalMineKey picks between equally close mines)
            const src = this.findCheapestCoalForLink(conn, playerId, options.coalMineKey);
            if (!src) return { success: false, message: 'No coal available for this rail link' };
            if (src.type === 'mine') {
                this.state.consumeResource(src.key);
            } else {
                totalCost += src.price;
                this.state.takeMarketCoal();
            }
            this.state.spendMoney(playerId, totalCost);
        }

        // Place link
        this.state.boardLinks[connectionId] = {
            playerId,
            type: linkType,
        };

        // Reduce remaining links
        if (linkType === 'canal') {
            player.linksRemaining.canal--;
        } else {
            player.linksRemaining.rail--;
        }

        // Discard card
        this.discardCard(playerId, cardIndex);

        const city1 = CITIES[conn.cities[0]]?.name || MERCHANTS[conn.cities[0]]?.name || conn.cities[0];
        const city2 = CITIES[conn.cities[1]]?.name || MERCHANTS[conn.cities[1]]?.name || conn.cities[1];

        return { success: true, message: `Built ${linkType} link: ${city1} - ${city2}` };
    }

    // ------------------------------------------------------------------
    // Double rail link (Rail Era only): 2 links for £15 total, 1 coal per
    // link (each sourced after its link is placed), plus 1 beer consumed
    // from a Brewery — merchant beer is NOT allowed, and an opponent's
    // brewery must be connected to the SECOND link.
    // ------------------------------------------------------------------

    // Candidate second links for firstConnId. Each candidate is fully
    // dry-run (adjacency, both coals in order, beer and the £15 + coal total)
    // so the UI only ever offers a second link the player can actually build.
    getValidSecondRailLinks(playerId, firstConnId) {
        if (this.state.era !== ERA.RAIL) return [];
        if (this.state.players[playerId].linksRemaining.rail < 2) return [];
        if (!CONNECTIONS.some(c => c.id === firstConnId)) return [];

        const targets = [];
        for (const conn of CONNECTIONS) {
            if (conn.id === firstConnId || !conn.rail || this.state.boardLinks[conn.id]) continue;
            const plan = this.runDoubleRail(playerId, firstConnId, conn.id, false);
            if (!plan.ok) continue;
            targets.push({
                connectionId: conn.id,
                cities: conn.cities,
                coalCost: plan.coalCost2,
                totalCost: plan.totalCost,
            });
        }
        return targets;
    }

    // Find a beer barrel usable for a double-rail action on `conn`.
    findBeerForLink(playerId, conn) {
        // Own unflipped breweries: anywhere on the board
        for (const [key, tile] of Object.entries(this.state.boardIndustries)) {
            if (tile.type === INDUSTRY_TYPES.BREWERY && tile.playerId === playerId &&
                !tile.flipped && tile.resourceCubes > 0) {
                return { key };
            }
        }
        for (const [farmId, tile] of Object.entries(this.state.breweryFarmTiles)) {
            if (tile && tile.playerId === playerId && !tile.flipped && tile.resourceCubes > 0) {
                return { key: `farm_${farmId}` };
            }
        }
        // Opponent breweries: must be connected to the second link
        for (const endpoint of conn.cities) {
            const connected = this.state.getConnectedLocations(endpoint);
            for (const loc of connected) {
                if (isCity(loc)) {
                    const city = CITIES[loc];
                    for (let i = 0; i < city.slots.length; i++) {
                        const key = `${loc}_${i}`;
                        const tile = this.state.boardIndustries[key];
                        if (tile && tile.type === INDUSTRY_TYPES.BREWERY &&
                            tile.playerId !== playerId && !tile.flipped && tile.resourceCubes > 0) {
                            return { key };
                        }
                    }
                }
                if (isBreweryFarm(loc)) {
                    const tile = this.state.breweryFarmTiles[loc];
                    if (tile && tile.playerId !== playerId && !tile.flipped && tile.resourceCubes > 0) {
                        return { key: `farm_${loc}` };
                    }
                }
            }
        }
        return null;
    }

    executeNetworkDouble(playerId, connectionId1, connectionId2, cardIndex, options = {}) {
        if (!this.isValidCardIndex(playerId, cardIndex)) {
            return { success: false, message: 'Select a card to discard' };
        }
        const result = this.runDoubleRail(playerId, connectionId1, connectionId2, true, options);
        if (!result.ok) return { success: false, message: result.message };

        this.discardCard(playerId, cardIndex);
        const conn1 = CONNECTIONS.find(c => c.id === connectionId1);
        const conn2 = CONNECTIONS.find(c => c.id === connectionId2);
        const name = id => CITIES[id]?.name || MERCHANTS[id]?.name || id;
        return {
            success: true,
            message: `Built 2 rail links: ${name(conn1.cities[0])} - ${name(conn1.cities[1])} and ${name(conn2.cities[0])} - ${name(conn2.cities[1])} (1 beer consumed)`,
        };
    }

    // Shared double-rail procedure. Each link is placed in turn and its coal
    // sourced with it on the board (mine cubes are decremented without
    // flipping, so the second link sees the first link's consumption). With
    // commit=false, or on any failure, every change is undone. With
    // commit=true the action is applied: emptied mines flip, the beer is
    // consumed and money/link tiles are spent.
    // options.coalMineKey1 / coalMineKey2 choose between equally close mines.
    // Returns { ok, message, totalCost, coalCost2 }.
    runDoubleRail(playerId, connectionId1, connectionId2, commit, options = {}) {
        const player = this.state.players[playerId];
        const conn1 = CONNECTIONS.find(c => c.id === connectionId1);
        const conn2 = CONNECTIONS.find(c => c.id === connectionId2);
        if (!conn1 || !conn2 || connectionId1 === connectionId2) return { ok: false, message: 'Invalid connection' };
        if (this.state.era !== ERA.RAIL) return { ok: false, message: 'Double links are Rail Era only' };
        if (!conn1.rail || !conn2.rail) return { ok: false, message: 'Not a railway line' };
        if (player.linksRemaining.rail < 2) return { ok: false, message: 'Not enough rail links' };
        if (this.state.boardLinks[connectionId1] || this.state.boardLinks[connectionId2]) {
            return { ok: false, message: 'Connection already built' };
        }

        const undo = [];
        const consumedMines = [];
        const dryConsumeCoal = (src) => {
            if (src.type === 'mine') {
                const tile = this.state.boardIndustries[src.key];
                tile.resourceCubes--;
                consumedMines.push({ key: src.key, tile });
                undo.push(() => tile.resourceCubes++);
            } else if (this.state.coalMarket > 0) {
                this.state.coalMarket--;
                undo.push(() => this.state.coalMarket++);
            }
        };
        const rollback = () => { while (undo.length) undo.pop()(); };
        const fail = (message) => { rollback(); return { ok: false, message }; };

        // Link 1: adjacency (or the empty-board exception), then coal
        if (!this.playerHasNoTilesOnBoard(playerId) &&
            !this.state.isInNetwork(playerId, conn1.cities[0]) &&
            !this.state.isInNetwork(playerId, conn1.cities[1])) {
            return fail('First link is not adjacent to your network');
        }
        this.state.boardLinks[connectionId1] = { playerId, type: 'rail' };
        undo.push(() => delete this.state.boardLinks[connectionId1]);

        const coalSrc1 = this.findCheapestCoalForLink(conn1, playerId, options.coalMineKey1);
        if (!coalSrc1) return fail('No coal for first link');
        const coalCost1 = coalSrc1.free ? 0 : coalSrc1.price;
        dryConsumeCoal(coalSrc1);

        // Link 2: adjacency with link 1 on the board, then coal + beer
        if (!this.state.isInNetwork(playerId, conn2.cities[0]) &&
            !this.state.isInNetwork(playerId, conn2.cities[1])) {
            return fail('Second link is not adjacent to your network');
        }
        this.state.boardLinks[connectionId2] = { playerId, type: 'rail' };
        undo.push(() => delete this.state.boardLinks[connectionId2]);

        const coalSrc2 = this.findCheapestCoalForLink(conn2, playerId, options.coalMineKey2);
        if (!coalSrc2) return fail('No coal for second link');
        const coalCost2 = coalSrc2.free ? 0 : coalSrc2.price;
        dryConsumeCoal(coalSrc2);

        // Beer: own breweries anywhere, or opponents' connected to link 2.
        // Merchant beer is not allowed.
        const beer = this.findBeerForLink(playerId, conn2);
        if (!beer) return fail('No beer available for the second link');

        const totalCost = RAIL_DOUBLE_LINK_COST + coalCost1 + coalCost2;
        if (totalCost > player.money) return fail('Cannot afford both links');

        if (!commit) {
            rollback();
            return { ok: true, message: '', totalCost, coalCost2 };
        }

        // --- Commit ---
        // Flip any mines the dry-run emptied (grants their owner income)
        for (const { key, tile } of consumedMines) {
            if (tile.resourceCubes <= 0) this.state.flipTile(key, tile);
        }
        this.state.consumeResource(beer.key);
        this.state.spendMoney(playerId, totalCost);
        player.linksRemaining.rail -= 2;
        return { ok: true, message: '', totalCost, coalCost2 };
    }

    // Coal options for a rail link. Rulebook: coal comes from the closest
    // connected unflipped mine (fewest links distant), with the link counted
    // as already placed — so distance is measured from whichever endpoint is
    // nearer, and a mine AT either endpoint is distance 0. Market coal is only
    // an option when no mine is reachable (and an endpoint reaches a merchant).
    // Returns { mines: [{ key, distance }] — the equally-closest mines, among
    // which the player may choose — and market: source or null }.
    getRailCoalOptions(conn, playerId) {
        const mineDistance = new Map(); // mine key -> nearest distance
        let market = null;

        for (const cityId of conn.cities) {
            for (const src of this.state.findCoalSource(cityId, playerId)) {
                if (src.type === 'mine') {
                    const prev = mineDistance.get(src.key);
                    if (prev === undefined || src.distance < prev) mineDistance.set(src.key, src.distance);
                } else if (!market || src.price < market.price) {
                    market = src;
                }
            }
        }

        if (mineDistance.size === 0) return { mines: [], market };
        const closest = Math.min(...mineDistance.values());
        const mines = [...mineDistance.entries()]
            .filter(([, d]) => d === closest)
            .map(([key, distance]) => ({ key, distance }));
        return { mines, market: null };
    }

    // The coal source a rail link will consume: the closest mine (or the
    // preferred one, if it is among the equally-closest), else market coal.
    // Returns a source object ({ type: 'mine', key, free } or a market entry)
    // or null if no coal is available.
    findCheapestCoalForLink(conn, playerId, preferredMineKey = null) {
        const { mines, market } = this.getRailCoalOptions(conn, playerId);
        if (mines.length > 0) {
            const pick = mines.find(m => m.key === preferredMineKey) || mines[0];
            return { type: 'mine', key: pick.key, distance: pick.distance, free: true };
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
    // and the player must be able to pay for 1 iron per tile.
    canDevelopTypes(playerId, type1, type2 = null) {
        const tile1 = this.peekDevelopTile(playerId, type1, 0);
        if (!tile1 || !tile1.canDevelop) {
            return { ok: false, message: 'That tile cannot be developed' };
        }
        if (type2) {
            const tile2 = this.peekDevelopTile(playerId, type2, type2 === type1 ? 1 : 0);
            if (!tile2 || !tile2.canDevelop) {
                return { ok: false, message: 'The second tile cannot be developed' };
            }
        }
        const count = type2 ? 2 : 1;
        const ironSources = this.state.findIronSource(playerId);
        if (ironSources.length < count) return { ok: false, message: 'Not enough iron available' };
        const ironCost = ironSources.slice(0, count).reduce((sum, src) => sum + (src.free ? 0 : src.price), 0);
        if (ironCost > this.state.players[playerId].money) {
            return { ok: false, message: 'Cannot afford market iron' };
        }
        return { ok: true, message: '', ironCost };
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

    executeDevelop(playerId, industryType1, industryType2, cardIndex) {
        // Develop removes 1 or 2 tiles from player mat (uses iron)
        // industryType2 can be null for single develop
        if (!this.isValidCardIndex(playerId, cardIndex)) {
            return { success: false, message: 'Select a card to discard' };
        }
        const check = this.canDevelopTypes(playerId, industryType1, industryType2 || null);
        if (!check.ok) return { success: false, message: check.message };

        const tilesToDevelop = industryType2 ? 2 : 1;
        const ironSources = this.state.findIronSource(playerId);

        // Consume iron (1 per tile developed)
        for (let i = 0; i < tilesToDevelop; i++) {
            const src = ironSources[i];
            if (src.type === 'works') {
                this.state.consumeResource(src.key);
            } else {
                // Buy from market (or the General Supply at £6 when empty)
                const price = this.state.getIronPrice();
                this.state.spendMoney(playerId, price);
                this.state.takeMarketIron();
            }
        }

        // Remove tiles from player mat
        const tile1 = this.state.developTile(playerId, industryType1);
        let tile2 = null;
        if (industryType2) {
            tile2 = this.state.developTile(playerId, industryType2);
        }

        // Discard card
        this.discardCard(playerId, cardIndex);

        let msg = `Developed ${INDUSTRY_DISPLAY[industryType1].name}`;
        if (tile2) msg += ` and ${INDUSTRY_DISPLAY[industryType2].name}`;

        return { success: true, message: msg };
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

    // Resolve a sell plan WITHOUT changing any state. Tiles are resolved in
    // order against a running ledger of the barrels earlier tiles in the plan
    // have already claimed, so a plan is accepted only if every tile in it can
    // really be sold. Returns { ok, message, steps } where each step is
    // { key, tile, merchantIndex (barrel used, or null), beerKeys }.
    planSell(playerId, sellPlan) {
        if (!Array.isArray(sellPlan) || sellPlan.length === 0) {
            return { ok: false, message: 'Nothing selected to sell' };
        }
        const claimedBeer = {};            // brewery key -> barrels claimed
        const claimedMerchant = new Set(); // merchant tile indices claimed
        const seenKeys = new Set();
        const steps = [];

        for (const entry of sellPlan) {
            const key = entry && entry.key;
            const tile = this.state.boardIndustries[key];
            if (!tile || seenKeys.has(key) || tile.playerId !== playerId ||
                tile.flipped || !isSellableIndustry(tile.type)) {
                return { ok: false, message: 'That industry cannot be sold' };
            }
            seenKeys.add(key);
            const name = `${INDUSTRY_DISPLAY[tile.type].name} Lv${tile.tileData.level}`;

            const [cityId] = key.split('_');
            const merchantIndices = this.getSellMerchantsFor(playerId, cityId, tile.type);
            if (merchantIndices.length === 0) {
                return { ok: false, message: `No connected merchant buys the ${name}` };
            }

            let beerNeeded = tile.tileData.beersToSell || 0;

            // Merchant beer, if requested: only the barrel beside the merchant
            // tile this good is sold to — so at most one per tile. Pick the
            // best-bonus merchant tile that still has an unclaimed barrel.
            let merchantIndex = null;
            if (beerNeeded > 0 && entry.useMerchantBeer) {
                const withBeer = merchantIndices
                    .filter(i => this.state.merchantTiles[i].hasBeer && !claimedMerchant.has(i))
                    .sort((a, b) => this.merchantBonusValue(this.state.merchantTiles[b]) -
                                    this.merchantBonusValue(this.state.merchantTiles[a]));
                if (withBeer.length > 0) {
                    merchantIndex = withBeer[0];
                    claimedMerchant.add(merchantIndex);
                    beerNeeded--;
                }
            }

            // Remaining beer from breweries (own anywhere, opponents' connected).
            // findBeerSources lists one entry per barrel, so skip the barrels
            // earlier tiles in this plan have already claimed.
            const beerKeys = [];
            if (beerNeeded > 0) {
                const seenPerKey = {};
                for (const src of this.state.findBeerSources(cityId, playerId, null)) {
                    if (beerKeys.length >= beerNeeded) break;
                    seenPerKey[src.key] = (seenPerKey[src.key] || 0) + 1;
                    if (seenPerKey[src.key] <= (claimedBeer[src.key] || 0)) continue;
                    beerKeys.push(src.key);
                    claimedBeer[src.key] = (claimedBeer[src.key] || 0) + 1;
                }
                if (beerKeys.length < beerNeeded) {
                    return { ok: false, message: `Not enough beer to sell the ${name}` };
                }
            }

            steps.push({ key, tile, merchantIndex, beerKeys });
        }

        return { ok: true, message: '', steps };
    }

    // sellPlan: array of { key, useMerchantBeer } — tiles are sold in order.
    // The whole plan is validated by planSell() first, so a failed sale
    // never consumes beer or awards a merchant bonus.
    // options.autoResolveDevelop: AI resolves Gloucester develop bonuses
    // immediately; for humans the count is returned for the UI to resolve.
    executeSell(playerId, sellPlan, cardIndex, options = {}) {
        const player = this.state.players[playerId];
        if (!this.isValidCardIndex(playerId, cardIndex)) {
            return { success: false, message: 'Select a card to discard' };
        }
        const plan = this.planSell(playerId, sellPlan);
        if (!plan.ok) return { success: false, message: plan.message };

        const results = [];
        let pendingDevelopBonuses = 0;

        for (const step of plan.steps) {
            const { key, tile } = step;
            const notes = [];

            if (step.merchantIndex !== null) {
                const mt = this.state.merchantTiles[step.merchantIndex];
                mt.hasBeer = false;

                // Consuming a merchant's beer grants that location's bonus
                const merchData = MERCHANTS[mt.location];
                switch (merchData.bonusType) {
                    case 'vp':
                        player.vp += merchData.bonusAmount;
                        notes.push(`+${merchData.bonusAmount} VP (${merchData.name})`);
                        break;
                    case 'money':
                        player.money += merchData.bonusAmount;
                        notes.push(`+£${merchData.bonusAmount} (${merchData.name})`);
                        break;
                    case 'income':
                        this.state.advanceIncomeSpaces(playerId, merchData.bonusAmount);
                        notes.push(`+${merchData.bonusAmount} income spaces (${merchData.name})`);
                        break;
                    case 'develop':
                        if (options.autoResolveDevelop) {
                            const removed = this.applyFreeDevelop(playerId, merchData.bonusAmount);
                            if (removed.length) notes.push(`free develop: ${removed.join(', ')}`);
                        } else {
                            pendingDevelopBonuses += merchData.bonusAmount;
                            notes.push(`free develop earned (${merchData.name})`);
                        }
                        break;
                }
            }

            // Brewery beer claimed by planSell (own anywhere, opponents connected)
            for (const beerKey of step.beerKeys) {
                this.state.consumeResource(beerKey);
            }

            // Flip the tile (advances income by the tile's spaces)
            this.state.flipTile(key, tile);

            let line = `Sold ${INDUSTRY_DISPLAY[tile.type].name} Lv${tile.tileData.level}`;
            if (notes.length) line += ` [${notes.join('; ')}]`;
            results.push(line);
        }

        // Discard card
        this.discardCard(playerId, cardIndex);

        return {
            success: true,
            message: results.join(', '),
            pendingDevelopBonuses,
        };
    }

    // ========================================================================
    // LOAN Action
    // ========================================================================

    executeLoan(playerId, cardIndex) {
        if (!this.isValidCardIndex(playerId, cardIndex)) {
            return { success: false, message: 'Select a card to discard' };
        }
        if (!this.state.canTakeLoan(playerId)) {
            return { success: false, message: 'A loan cannot take your income below -10' };
        }
        const player = this.state.players[playerId];
        player.money += LOAN_AMOUNT;
        this.state.applyLoanIncomeDrop(playerId);

        this.discardCard(playerId, cardIndex);

        return { success: true, message: `Took £${LOAN_AMOUNT} loan (income -${LOAN_INCOME_PENALTY} levels)` };
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

    executeScout(playerId, cardIndices) {
        // cardIndices: [actionCard, extraCard1, extraCard2] (3 cards total)
        const player = this.state.players[playerId];

        if (!this.canScout(playerId)) {
            return { success: false, message: 'You cannot scout right now' };
        }
        if (!Array.isArray(cardIndices) || cardIndices.length !== 3 ||
            new Set(cardIndices).size !== 3 ||
            !cardIndices.every(i => this.isValidCardIndex(playerId, i))) {
            return { success: false, message: 'Must discard exactly 3 different cards' };
        }

        // Discard the 3 cards face up (in the order chosen), then remove
        // them from the hand in reverse index order to keep indices valid
        for (const idx of cardIndices) player.discardPile.push(player.hand[idx]);
        const sorted = [...cardIndices].sort((a, b) => b - a);
        for (const idx of sorted) {
            player.hand.splice(idx, 1);
        }

        // Give wild cards
        player.hand.push({
            type: CARD_TYPES.WILD_LOCATION,
            name: 'Wild Location',
        });
        player.hand.push({
            type: CARD_TYPES.WILD_INDUSTRY,
            name: 'Wild Industry',
        });

        this.state.wildLocationPile--;
        this.state.wildIndustryPile--;

        return { success: true, message: 'Scouted: gained Wild Location + Wild Industry' };
    }

    // ========================================================================
    // PASS Action
    // ========================================================================

    executePass(playerId, cardIndex) {
        if (!this.isValidCardIndex(playerId, cardIndex)) {
            return { success: false, message: 'Select a card to discard' };
        }
        this.discardCard(playerId, cardIndex);
        return { success: true, message: 'Passed' };
    }

    // ========================================================================
    // Free Develop (merchant bonus)
    // ========================================================================

    // Gloucester bonus: remove tile(s) from the mat with no iron cost.
    // Auto-picks for the AI (canal-only tiles are most urgent to clear);
    // humans choose via the UI instead. Returns names of removed tiles.
    applyFreeDevelop(playerId, count, chosenType = null) {
        const removed = [];
        for (let i = 0; i < count; i++) {
            const types = this.getDevelopableTypes(playerId);
            if (types.length === 0) break;
            let pick;
            if (chosenType && types.some(t => t.type === chosenType)) {
                pick = types.find(t => t.type === chosenType);
            } else {
                // Prefer clearing canal-only (level 1) tiles, then lowest level
                types.sort((a, b) =>
                    (Number(b.tile.railEra === false) - Number(a.tile.railEra === false)) ||
                    (a.level - b.level));
                pick = types[0];
            }
            this.state.developTile(playerId, pick.type);
            removed.push(`${INDUSTRY_DISPLAY[pick.type].name} Lv${pick.level}`);
        }
        return removed;
    }

    // ========================================================================
    // Disabled Reason for Action Buttons
    // ========================================================================

    getDisabledReason(action, playerId) {
        const player = this.state.players[playerId];
        if (player.hand.length === 0) return 'Hand is empty';

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
