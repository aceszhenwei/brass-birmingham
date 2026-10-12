// ============================================================================
// Brass: Birmingham - AI Opponent
// ============================================================================
// Stateless decision engine. Returns a decision shaped to drop directly into
// UIManager's existing action pipeline: { action, pendingData, cardIndex }.
//
// Information (Assignment 6): the AI decides on state.getObservation(playerId),
// a copy of the game holding only what that player may know. Opponents'
// hands, the deck order, face-down discards and the game's random generator
// are not in it, and nothing the AI does can change the real game.
//
// Overbuilding (Assignment 8): replacing one of the player's own tiles is
// charged for the future value of the tile it replaces.
//
// Research baselines: chooseAction(..., options) with AIPlayer.LEGACY_A5
// reproduces the AI exactly as audited in Assignment 5, including its two
// known defects (Hard reads opponents' hands; the rounds-remaining estimate
// is wrong for half of each era). AIPlayer.LEGACY_A6 reproduces the AI of
// Assignments 6-7 (overbuilds scored as if the space were empty). They exist
// only so experiments can compare against them (docs/research/); the game
// never uses them.
// ============================================================================

const AIPlayer = (() => {

    // Scoring weights — tunable constants, converting every candidate move
    // onto one VP-equivalent scalar so different action types can be compared.
    const VP_WEIGHT = 1.0;
    const MONEY_WEIGHT = 0.12;
    const BASE_INCOME_WEIGHT = 0.35;
    const FLEX_WEIGHT = 0.8;

    // Per-call options (see chooseAction)
    const DEFAULT_OPTIONS = Object.freeze({ information: 'player', rounds: 'engine', loan: 'a6', overbuild: 'opportunity' });
    const LEGACY_A5 = Object.freeze({ information: 'full', rounds: 'deck-estimate', overbuild: 'a6' });
    const LEGACY_A6 = Object.freeze({ overbuild: 'a6' });
    let options = DEFAULT_OPTIONS;

    // ------------------------------------------------------------------
    // Shared helpers
    // ------------------------------------------------------------------

    // Rounds left in the era, counting the current one. The engine knows this
    // exactly. (The Assignment 5 baseline used drawDeck.length / numPlayers,
    // which ignores the cards in hand and counts one card per round instead
    // of two: once the deck runs out it reads 1 while up to 4 rounds remain.)
    function estimateRoundsRemaining(state) {
        if (options.rounds === 'deck-estimate') {
            const proxy = state.drawDeck.length / state.numPlayers;
            return Math.max(1, Math.min(10, proxy));
        }
        return Math.max(1, state.getRoundsRemaining());
    }

    function incomeWeight(state) {
        return BASE_INCOME_WEIGHT * (estimateRoundsRemaining(state) / 5);
    }

    function vpEquivalent(state, { vp = 0, income = 0, money = 0, flex = 0 } = {}) {
        return vp * VP_WEIGHT + income * incomeWeight(state) + money * MONEY_WEIGHT + flex * FLEX_WEIGHT;
    }

    // How useful is a card still likely to be? Used for Scout/discard choices.
    function cardUsefulness(state, logic, playerId, card) {
        if (card.type === CARD_TYPES.WILD_LOCATION || card.type === CARD_TYPES.WILD_INDUSTRY) {
            return 5; // never volunteer a wild unless forced
        }
        if (card.type === CARD_TYPES.LOCATION) {
            const city = CITIES[card.location];
            if (!city) return 0;
            // Useful if any slot at this location could still take one of the
            // player's remaining tile types.
            const remaining = state.getRemainingTiles(playerId);
            for (const slotTypes of city.slots) {
                const allowed = Array.isArray(slotTypes) ? slotTypes : [slotTypes];
                for (const t of allowed) {
                    if (remaining[t] && remaining[t].count > 0) return 2;
                }
            }
            return 0;
        }
        if (card.type === CARD_TYPES.INDUSTRY) {
            const remaining = state.getRemainingTiles(playerId);
            const has = card.industryTypes.some(t => remaining[t] && remaining[t].count > 0);
            return has ? 1.5 : 0;
        }
        return 0.5;
    }

    // Prefer a non-wild matching card over a wild one when both are legal.
    function pickCardIndex(logic, playerId, action, target, player) {
        const validIndices = logic.getValidCardsForAction(playerId, action, target);
        if (validIndices.length === 0) return null;
        const nonWild = validIndices.find(idx => {
            const c = player.hand[idx];
            return c.type !== CARD_TYPES.WILD_LOCATION && c.type !== CARD_TYPES.WILD_INDUSTRY;
        });
        return nonWild !== undefined ? nonWild : validIndices[0];
    }

    function estimateFlipProbability(state, logic, playerId, cand) {
        const { industryType, cityId } = cand;
        let base;
        if (industryType === INDUSTRY_TYPES.COAL_MINE || industryType === INDUSTRY_TYPES.IRON_WORKS) {
            base = 0.7;
        } else if (industryType === INDUSTRY_TYPES.BREWERY) {
            base = 0.5;
        } else {
            // Sellable industries
            base = 0.6;
            const connected = state.getConnectedLocations(cityId);
            const hasReachableMerchant = state.merchantTiles.some(mt =>
                connected.has(mt.location) && state.merchantTileAccepts(mt, industryType)
            );
            if (hasReachableMerchant) base += 0.2;
            if (estimateRoundsRemaining(state) < 2) base -= 0.3;
        }
        return Math.max(0.1, Math.min(1, base));
    }

    function playerOwnsLinkTouching(state, playerId, cityId) {
        for (const conn of CONNECTIONS) {
            const link = state.boardLinks[conn.id];
            if (link && link.playerId === playerId && conn.cities.includes(cityId)) return true;
        }
        return false;
    }

    function countNewUnbuiltNeighborConnections(state, cityId) {
        let count = 0;
        for (const conn of CONNECTIONS) {
            if (state.boardLinks[conn.id]) continue;
            if (conn.cities.includes(cityId)) count++;
        }
        return count;
    }

    // ------------------------------------------------------------------
    // BUILD
    // ------------------------------------------------------------------

    function scoreBuildCandidate(state, logic, playerId, cand) {
        const { tileData, cost, cityId, industryType } = cand;
        const flipProb = estimateFlipProbability(state, logic, playerId, cand);
        const ownsAdjacentLink = playerOwnsLinkTouching(state, playerId, cityId);
        const linkSelfValue = ownsAdjacentLink ? tileData.linkVP * flipProb * 0.5 : 0;
        const isResourceType = industryType === INDUSTRY_TYPES.COAL_MINE || industryType === INDUSTRY_TYPES.IRON_WORKS;
        const resourceSelfSufficiency = isResourceType ? 0.15 * (tileData.resourceCubes || 0) : 0;
        const networkExpansion = 0.1 * countNewUnbuiltNeighborConnections(state, cityId);

        const score = vpEquivalent(state, {
            vp: tileData.vp * flipProb + linkSelfValue,
            income: tileData.income * flipProb,
            money: -cost.total,
        }) + resourceSelfSufficiency + networkExpansion;

        // Overbuilding the player's own tile (options.overbuild):
        //   'opportunity' (default since Assignment 8) subtract the future
        //                 value of the tile it replaces
        //   'a6'          score it exactly like a build on an empty space,
        //                 ignoring the tile it replaces (up to Assignment 7)
        //   research variants that were not adopted (Assignment 8):
        //   'opportunity-unflipped'  the charge for unflipped tiles only
        //   'no-unflipped'           never overbuild an own unflipped tile
        const variant = options.overbuild;
        if (variant !== 'a6') {
            const existing = existingTile(state, cand);
            if (existing && existing.playerId === playerId) {
                if (variant === 'no-unflipped' && !existing.flipped) return -Infinity;
                if (variant === 'opportunity' || (variant === 'opportunity-unflipped' && !existing.flipped)) {
                    return score - replacedTileValue(state, logic, playerId, cand, existing);
                }
            }
        }
        return score;
    }

    function existingTile(state, cand) {
        return isBreweryFarm(cand.cityId) ? state.breweryFarmTiles[cand.cityId]
            : state.boardIndustries[`${cand.cityId}_${cand.slotIndex}`];
    }

    // What keeping an own tile is worth, valued with the same terms the build
    // score uses for a new tile (its cost is sunk and not counted). A flipped
    // tile has already paid its income, so only the VP it would still score
    // is at stake; an unflipped one keeps its chance to flip and its cubes.
    function replacedTileValue(state, logic, playerId, cand, existing) {
        const t = existing.tileData;
        const ownsAdjacentLink = playerOwnsLinkTouching(state, playerId, cand.cityId);
        if (existing.flipped) {
            return vpEquivalent(state, { vp: t.vp + (ownsAdjacentLink ? t.linkVP * 0.5 : 0) });
        }
        const flipProb = estimateFlipProbability(state, logic, playerId, { industryType: existing.type, cityId: cand.cityId });
        const isResourceType = existing.type === INDUSTRY_TYPES.COAL_MINE || existing.type === INDUSTRY_TYPES.IRON_WORKS;
        return vpEquivalent(state, {
            vp: t.vp * flipProb + (ownsAdjacentLink ? t.linkVP * flipProb * 0.5 : 0),
            income: t.income * flipProb,
        }) + (isResourceType ? 0.15 * (existing.resourceCubes || 0) : 0);
    }

    function bestBuild(state, logic, playerId) {
        const targets = logic.getValidBuildTargets(playerId);
        if (targets.length === 0) return null;

        let best = null;
        let bestScore = -Infinity;
        for (const cand of targets) {
            const score = scoreBuildCandidate(state, logic, playerId, cand);
            if (score > bestScore) {
                bestScore = score;
                best = cand;
            }
        }
        if (!best) return null;

        const player = state.players[playerId];
        const target = { cityId: best.cityId, slotIndex: best.slotIndex, industryType: best.industryType };
        const cardIndex = pickCardIndex(logic, playerId, ACTIONS.BUILD, target, player);
        if (cardIndex === null) return null;

        const result = {
            action: ACTIONS.BUILD,
            pendingData: target,
            cardIndex,
            score: bestScore,
        };
        // Research diagnostics: every build target's score, and the tile it
        // would replace (options.explain)
        if (options.explain) {
            result.builds = targets.map(t => {
                const e = existingTile(state, t);
                return { cityId: t.cityId, slotIndex: t.slotIndex, industryType: t.industryType, level: t.tileData.level,
                    cost: t.cost.total, score: scoreBuildCandidate(state, logic, playerId, t),
                    replaces: e ? { own: e.playerId === playerId, level: e.tileData.level, flipped: e.flipped, cubes: e.resourceCubes || 0 } : null };
            });
        }
        return result;
    }

    // ------------------------------------------------------------------
    // NETWORK
    // ------------------------------------------------------------------

    function countHandCardsNewlyInNetwork(state, logic, playerId, cand) {
        const player = state.players[playerId];
        let count = 0;
        for (const card of player.hand) {
            if (card.type === CARD_TYPES.LOCATION) {
                if (!state.isInNetwork(playerId, card.location) && cand.cities.includes(card.location)) count++;
            } else if (card.type === CARD_TYPES.INDUSTRY) {
                // Industry cards benefit from any network growth, credit lightly
                count += 0.25;
            }
        }
        return count;
    }

    function connectsToNewMerchant(state, cand) {
        return cand.cities.some(c => isMerchantLocation(c));
    }

    function scoreNetworkCandidate(state, logic, playerId, cand) {
        const accessGain = countHandCardsNewlyInNetwork(state, logic, playerId, cand);
        const merchantGain = connectsToNewMerchant(state, cand) ? 1.5 : 0;
        const hasIndustry = Object.values(state.boardIndustries).some(t => t.playerId === playerId);
        const player = state.players[playerId];
        const linksBuilt = 14 - player.linksRemaining[cand.type];
        const overNetworkingPenalty = (!hasIndustry && linksBuilt >= 1) ? 1.0 : 0;
        // Keeping options open has standalone value even with no immediate hand
        // synergy — without it, industry cards (network-gated) go unplayable.
        // Taper off once a player already has a modest network.
        const explorationBonus = Math.max(0, 1.6 - linksBuilt * 0.3);

        return vpEquivalent(state, { vp: accessGain * 1.0 + merchantGain, money: -cand.cost })
            + explorationBonus - overNetworkingPenalty;
    }

    function bestNetwork(state, logic, playerId) {
        const targets = logic.getValidNetworkTargets(playerId);
        if (targets.length === 0) return null;

        let best = null;
        let bestScore = -Infinity;
        for (const cand of targets) {
            const score = scoreNetworkCandidate(state, logic, playerId, cand);
            if (score > bestScore) {
                bestScore = score;
                best = cand;
            }
        }
        if (!best) return null;

        const player = state.players[playerId];
        const cardIndex = pickCardIndex(logic, playerId, ACTIONS.NETWORK, null, player);
        if (cardIndex === null) return null;

        return {
            action: ACTIONS.NETWORK,
            pendingData: { connectionId: best.connectionId },
            cardIndex,
            score: bestScore,
        };
    }

    // ------------------------------------------------------------------
    // DEVELOP
    // ------------------------------------------------------------------

    function scoreDevelopPlan(state, logic, playerId) {
        const types = logic.getDevelopableTypes(playerId);
        const ironSources = state.findIronSource(playerId);
        if (types.length === 0 || ironSources.length === 0) return null;

        const player = state.players[playerId];
        if (!ironSources[0].free && ironSources[0].price > player.money) return null;

        const scored = types.map(t => ({
            t,
            urgency: t.tile.railEra === false ? 2.0 : 0.5,
            unlockValue: 0.3 * t.level,
        })).sort((a, b) => (b.urgency + b.unlockValue) - (a.urgency + a.unlockValue));

        const first = scored[0];

        // Second tile: must be legal (developable once the first is removed)
        // and affordable — the same check the engine enforces
        const second = scored.slice(1).find(s =>
            logic.canDevelopTypes(playerId, first.t.type, s.t.type).ok) || null;

        const ironCost = ironSources.slice(0, second ? 2 : 1).reduce((sum, s) => sum + (s.free ? 0 : s.price), 0);

        const score = vpEquivalent(state, {
            vp: (first.urgency + first.unlockValue) + (second ? second.urgency + second.unlockValue : 0),
            money: -ironCost,
        });

        const cardIndex = pickCardIndex(logic, playerId, ACTIONS.DEVELOP, null, player);
        if (cardIndex === null) return null;

        return {
            action: ACTIONS.DEVELOP,
            pendingData: { industryType1: first.t.type, industryType2: second ? second.t.type : null },
            cardIndex,
            score,
        };
    }

    // ------------------------------------------------------------------
    // SELL
    // ------------------------------------------------------------------

    // Value of the best merchant beer bonus this sale could claim (only
    // merchants with a barrel remaining grant bonuses).
    function bestMerchantBeerBonus(state, target) {
        let best = 0;
        for (const i of target.merchantIndices) {
            const mt = state.merchantTiles[i];
            if (!mt.hasBeer) continue;
            const merchData = MERCHANTS[mt.location];
            if (!merchData) continue;
            let value = 0;
            switch (merchData.bonusType) {
                case 'vp': value = merchData.bonusAmount * VP_WEIGHT; break;
                case 'money': value = merchData.bonusAmount * MONEY_WEIGHT; break;
                case 'income': value = merchData.bonusAmount * incomeWeight(state); break;
                case 'develop': value = merchData.bonusAmount * 0.5; break;
            }
            if (value > best) best = value;
        }
        return best;
    }

    function scoreSellPlan(state, logic, playerId) {
        const targets = logic.getValidSellTargets(playerId);
        if (targets.length === 0) return null;

        const ranked = targets.map(t => {
            const bonus = bestMerchantBeerBonus(state, t);
            const tileValue = t.tile.tileData.vp + t.tile.tileData.income * 0.3;
            return { t, tileValue, bonus };
        }).sort((a, b) => (b.bonus - a.bonus) || (b.tileValue - a.tileValue));

        // Drink merchant beer whenever it's on offer: the bonus is free and
        // it spares brewery barrels for other sales. Tiles share the available
        // beer, so add them in rank order only while the whole plan stays
        // sellable (validated by the engine's planSell).
        const sellPlan = [];
        const included = [];
        for (const r of ranked) {
            const entry = { key: r.t.key, useMerchantBeer: r.t.merchantBeerAvailable };
            if (logic.planSell(playerId, [...sellPlan, entry]).ok) {
                sellPlan.push(entry);
                included.push(r);
            }
        }
        if (sellPlan.length === 0) return null;
        const totalVP = included.reduce((s, r) => s + r.t.tile.tileData.vp, 0);
        const totalIncome = included.reduce((s, r) => s + r.t.tile.tileData.income, 0);
        const totalBonus = included.reduce((s, r) => s + r.bonus, 0);

        const player = state.players[playerId];
        const cardIndex = pickCardIndex(logic, playerId, ACTIONS.SELL, null, player);
        if (cardIndex === null) return null;

        return {
            action: ACTIONS.SELL,
            pendingData: { sellPlan },
            cardIndex,
            score: vpEquivalent(state, { vp: totalVP, income: totalIncome }) + totalBonus,
        };
    }

    // ------------------------------------------------------------------
    // LOAN
    // ------------------------------------------------------------------

    function cheapestAffordableBuildOrNetworkCost(state, logic, playerId) {
        let cheapest = Infinity;
        for (const t of logic.getValidBuildTargets(playerId)) {
            if (t.cost.total < cheapest) cheapest = t.cost.total;
        }
        for (const t of logic.getValidNetworkTargets(playerId)) {
            if (t.cost < cheapest) cheapest = t.cost;
        }
        return cheapest;
    }

    // Income payments still to come in the game: one at the end of every
    // remaining round except the game's last (used by options.loan 'cashflow')
    function incomePaymentsLeft(state) {
        const r = state.getRoundsRemaining();
        return state.era === ERA.CANAL ? r + ROUNDS_PER_ERA[state.numPlayers] - 1 : Math.max(0, r - 1);
    }

    // The best Build or Network score among targets affordable with `extra`
    // more money (-Infinity if none). The money is added only for the query.
    function bestBuildOrNetworkScore(state, logic, playerId, extra, onlyNew) {
        const player = state.players[playerId];
        const key = (t) => (t.connectionId ? `n:${t.connectionId}` : `b:${t.cityId}:${t.slotIndex}:${t.industryType}`);
        const before = onlyNew ? new Set([...logic.getValidBuildTargets(playerId), ...logic.getValidNetworkTargets(playerId)].map(key)) : null;
        player.money += extra;
        try {
            let best = -Infinity;
            for (const t of logic.getValidBuildTargets(playerId)) {
                if (before && before.has(key(t))) continue;
                best = Math.max(best, scoreBuildCandidate(state, logic, playerId, t));
            }
            for (const t of logic.getValidNetworkTargets(playerId)) {
                if (before && before.has(key(t))) continue;
                best = Math.max(best, scoreNetworkCandidate(state, logic, playerId, t));
            }
            return best;
        } finally {
            player.money -= extra;
        }
    }

    // Loan scoring. options.loan selects a research variant (Assignment 7):
    //   'a6' (default)  the original heuristic below
    //   'cashflow'      the loan's money value is what it actually yields: £30
    //                   now minus £3 for every income payment still to come
    //                   (replaces the flat 0.25 discount and the era-only
    //                   income term)
    //   'enabling'      instead of a flat +4 whenever nothing is affordable,
    //                   the loan earns what it makes possible: how much better
    //                   the best Build / Network it newly makes affordable
    //                   scores than the best one affordable now (and Pass)
    //   'cashflow+enabling'  both
    //   'never'         never borrow (a diagnostic ablation, not a candidate)
    function scoreLoanResult(state, logic, playerId) {
        if (!state.canTakeLoan(playerId)) return null;
        const variant = options.loan;
        if (variant === 'never') return null;
        const player = state.players[playerId];
        const incomeLevel = state.getIncomeLevel(playerId);
        const cheapest = cheapestAffordableBuildOrNetworkCost(state, logic, playerId);
        // Loan is a safety valve, not a scoring play — money sitting unspent has
        // no direct end-game value, so only credit a small flexibility premium
        // for the raw cash, and let cashCrunchBonus carry the real signal for
        // when a loan is actually needed to afford the next move.
        const enabling = variant.includes('enabling');
        let cashCrunchBonus = (player.money < cheapest) ? 4.0 : 0;
        let alreadyFlushPenalty = player.money > cheapest * 2.5 ? 2.5 : 0;
        const incomeFloorPenalty = incomeLevel <= (MIN_INCOME + 5) ? 2.5 : 0;
        if (enabling) {
            const now = Math.max(PASS_SCORE, bestBuildOrNetworkScore(state, logic, playerId, 0, false));
            const enabled = bestBuildOrNetworkScore(state, logic, playerId, LOAN_AMOUNT, true);
            cashCrunchBonus = Math.max(0, enabled - now);
            alreadyFlushPenalty = 0;
        }

        const base = variant.includes('cashflow')
            ? vpEquivalent(state, { money: LOAN_AMOUNT - LOAN_INCOME_PENALTY * incomePaymentsLeft(state) })
            : vpEquivalent(state, { money: LOAN_AMOUNT * 0.25, income: -LOAN_INCOME_PENALTY });
        const score = base + cashCrunchBonus - incomeFloorPenalty - alreadyFlushPenalty;

        const cardIndex = pickCardIndex(logic, playerId, ACTIONS.LOAN, null, player);
        if (cardIndex === null) return null;

        const result = { action: ACTIONS.LOAN, pendingData: {}, cardIndex, score };
        if (options.explain) result.parts = { base, cashCrunchBonus, alreadyFlushPenalty, incomeFloorPenalty, cheapest };
        return result;
    }

    // ------------------------------------------------------------------
    // SCOUT
    // ------------------------------------------------------------------

    function scoreScoutPlan(state, logic, playerId) {
        if (!logic.canScout(playerId)) return null;
        const player = state.players[playerId];
        const hand = player.hand;

        const usefulness = hand.map((card, idx) => ({ idx, score: cardUsefulness(state, logic, playerId, card) }))
            .sort((a, b) => a.score - b.score);

        const discardIdxs = usefulness.slice(0, 3).map(u => u.idx);
        const deadCount = usefulness.slice(0, 3).filter(u => u.score <= 0).length;
        const score = vpEquivalent(state, { flex: deadCount * 1.2 - (3 - deadCount) * 0.6 });

        return {
            action: ACTIONS.SCOUT,
            pendingData: { scoutCards: [discardIdxs[0], discardIdxs[1]] },
            cardIndex: discardIdxs[2],
            score,
        };
    }

    // ------------------------------------------------------------------
    // PASS
    // ------------------------------------------------------------------

    const PASS_SCORE = -0.5;

    function scorePassResult(state, logic, playerId) {
        const player = state.players[playerId];
        const cardIndex = pickCardIndex(logic, playerId, ACTIONS.PASS, null, player);
        return {
            action: ACTIONS.PASS,
            pendingData: {},
            cardIndex: cardIndex === null ? 0 : cardIndex,
            score: PASS_SCORE,
        };
    }

    // ------------------------------------------------------------------
    // Difficulty perturbation
    // ------------------------------------------------------------------

    function applyDifficulty(state, logic, playerId, results, difficulty, random) {
        if (difficulty === 'easy') {
            for (const r of results) r.score += (random() - 0.5) * 4;
            if (random() < 0.15 && results.length > 0) {
                return results[Math.floor(random() * results.length)];
            }
        } else if (difficulty === 'hard') {
            for (const r of results) {
                if (r.action === ACTIONS.BUILD) {
                    r.score += denialBonus(state, playerId, r);
                }
            }
        } else {
            // normal
            for (const r of results) r.score += (random() - 0.5) * 1.2;
        }
        return null;
    }

    // Hard's bonus for building where opponents could build too: 0.6 per
    // opponent location card naming the town, 0.3 per opponent industry card
    // showing the industry. Opponents' hands are hidden, so the bonus uses
    // the EXPECTED number of such cards given what this player can see.
    function denialBonus(state, playerId, decision) {
        const { cityId, industryType } = decision.pendingData;
        if (options.information === 'full') {
            // Assignment 5 baseline: reads the opponents' actual hands
            let bonus = 0;
            for (const p of state.players) {
                if (p.id === playerId) continue;
                for (const card of p.hand) {
                    if (card.type === CARD_TYPES.LOCATION && card.location === cityId) bonus += 0.6;
                    if (card.type === CARD_TYPES.INDUSTRY && card.industryTypes.includes(industryType)) bonus += 0.3;
                }
            }
            return bonus;
        }
        const { locations, industries } = expectedOpponentCards(state, playerId, cityId, industryType);
        return 0.6 * locations + 0.3 * industries;
    }

    // Expected number of location cards for `cityId` and industry cards
    // showing `industryType` in all opponents' hands together. The cards this
    // player cannot see are the era's deck minus every card it can see (its
    // own hand and the face-up discards); each is equally likely to be any of
    // the hidden cards, of which the opponents hold their hand counts.
    function expectedOpponentCards(state, playerId, cityId, industryType) {
        const deck = CARD_DECK[state.numPlayers];
        const showsIndustry = (types) => types.includes(industryType);
        let total = 0;
        let loc = deck.locations[cityId] || 0;
        let ind = deck.industries[industryType] || 0;
        for (const n of Object.values(deck.locations)) total += n;
        for (const n of Object.values(deck.industries)) total += n;
        const dual = deck.dualCottonManufacturer || 0;
        total += dual;
        if (showsIndustry([INDUSTRY_TYPES.COTTON_MILL, INDUSTRY_TYPES.MANUFACTURER])) ind += dual;

        const visible = [...state.players[playerId].hand, ...state.players.flatMap(p => p.discardPile)];
        let unseen = total;
        for (const card of visible) {
            if (card.type === CARD_TYPES.LOCATION) {
                unseen--;
                if (card.location === cityId) loc--;
            } else if (card.type === CARD_TYPES.INDUSTRY) {
                unseen--;
                if (showsIndustry(card.industryTypes)) ind--;
            }
        }
        const opponentCards = state.players.reduce((n, p) => n + (p.id === playerId ? 0 : p.hand.length), 0);
        if (unseen <= 0) return { locations: 0, industries: 0 };
        const share = Math.min(1, opponentCards / unseen);
        return { locations: Math.max(0, loc) * share, industries: Math.max(0, ind) * share };
    }

    // ------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------

    // rng: optional SeededRandom for the difficulty noise, so AI play is
    // reproducible. It is deliberately separate from the game's own
    // generator: the AI thinking must not change future deck shuffles.
    // Without one, Math.random is used (unseeded, as before).
    // opts (research only; the game passes none):
    //   information: 'player' (default) decides on the player's observation;
    //                'full' decides on the real state (Assignment 5 baseline)
    //   rounds:      'engine' (default) | 'deck-estimate' (Assignment 5 baseline)
    //   explain:     true adds `explain` (every candidate's score) to the decision
    //   loan:        loan-scoring variant (see scoreLoanResult; default 'a6')
    //   overbuild:   overbuild scoring (see scoreBuildCandidate; default 'opportunity')
    // AIPlayer.LEGACY_A5 / LEGACY_A6 restore the AI of those assignments.
    function chooseAction(state, logic, playerId, difficulty = 'normal', rng = null, opts = null) {
        const previous = options;
        options = opts ? { ...DEFAULT_OPTIONS, ...opts } : DEFAULT_OPTIONS;
        try {
            if (options.information === 'player') {
                state = state.getObservation(playerId);
                logic = new GameLogic(state);
            }
            return decide(state, logic, playerId, difficulty, rng);
        } finally {
            options = previous;
        }
    }

    function decide(state, logic, playerId, difficulty, rng) {
        const random = rng ? () => rng.next() : Math.random;
        const results = [];

        if (logic.canPerformAction(ACTIONS.BUILD, playerId)) {
            const r = bestBuild(state, logic, playerId);
            if (r) results.push(r);
        }
        if (logic.canPerformAction(ACTIONS.NETWORK, playerId)) {
            const r = bestNetwork(state, logic, playerId);
            if (r) results.push(r);
        }
        if (logic.canPerformAction(ACTIONS.DEVELOP, playerId)) {
            const r = scoreDevelopPlan(state, logic, playerId);
            if (r) results.push(r);
        }
        if (logic.canPerformAction(ACTIONS.SELL, playerId)) {
            const r = scoreSellPlan(state, logic, playerId);
            if (r) results.push(r);
        }
        const loanResult = scoreLoanResult(state, logic, playerId);
        if (loanResult) results.push(loanResult);

        if (logic.canPerformAction(ACTIONS.SCOUT, playerId)) {
            const r = scoreScoutPlan(state, logic, playerId);
            if (r) results.push(r);
        }
        results.push(scorePassResult(state, logic, playerId));

        if (results.length === 0) {
            // Should not happen (Pass is always available), but guard anyway.
            return { action: ACTIONS.PASS, pendingData: {}, cardIndex: 0 };
        }

        const unperturbed = options.explain ? results.map(r => ({ action: r.action, score: r.score, parts: r.parts, builds: r.builds })) : null;
        const forced = applyDifficulty(state, logic, playerId, results, difficulty, random);
        results.sort((a, b) => b.score - a.score);
        const chosen = forced || results[0];
        // Research diagnostics (options.explain): every candidate's score
        // before and after the difficulty perturbation. Does not affect play.
        if (unperturbed) {
            return { ...chosen, explain: { candidates: unperturbed, final: results.map(r => ({ action: r.action, score: r.score })), forced: !!forced } };
        }
        return chosen;
    }

    return { chooseAction, LEGACY_A5, LEGACY_A6, roundsRemaining: (state, opts = null) => {
        const previous = options;
        options = opts ? { ...DEFAULT_OPTIONS, ...opts } : DEFAULT_OPTIONS;
        try { return estimateRoundsRemaining(state); } finally { options = previous; }
    } };
})();
