// ============================================================================
// Brass: Birmingham - Moves: one representation for every player decision
// ============================================================================
// Every decision a player can make is a plain JSON "move":
//
//   { type: 'build',   card, location, slot, industry, coal: [src], iron: [src] }
//   { type: 'network', card, links: [connId] | [connId, connId], coal: [src], beer: src }
//   { type: 'develop', card, industries: [type] | [type, type], iron: [src] }
//   { type: 'sell',    card, sales: [{ tile, merchant, beer: [src], freeDevelop }] }
//   { type: 'loan',    card }
//   { type: 'scout',   cards: [i, j, k] }
//   { type: 'pass',    card }
//   { type: 'shortfall', tile }   — sell a tile to cover negative income
//
// `card` is an index into the player's hand. Resource sources are strings:
//   coal  'mine:<tileKey>' | 'market'
//   iron  'works:<tileKey>' | 'market'
//   beer  'brewery:<tileKey>'            (farm breweries: 'brewery:farm_<id>')
//   sale  merchant: <merchantTiles index> (sell there AND drink its barrel) | 'none'
//         freeDevelop (Gloucester bonus): <industry type> | 'skip'
//
// Every resource field is OPTIONAL. Wherever the rulebook lets the player
// choose (equally close coal mines, any iron works, any eligible beer, which
// merchant, the Gloucester develop), the planner treats the field as a
// "choice point": a value given in the move is validated against the legal
// options; a missing value is completed by the engine (defaults first,
// searching alternatives if the defaults can't work).
//
// One planner per move type validates a move and works out exactly what it
// will consume WITHOUT touching the state — consumption earlier in the same
// move is tracked in a ledger. The same planners drive:
//   applyMove        validate + complete + execute, atomically
//   resolveMove      validate + complete (no execution)
//   getLegalMoves    every legal move, defaults or fully expanded
//   getNextChoice    the next decision to put to a human player
// so the UI, the AI and the tests all go through one set of rules.
// ============================================================================

const MOVE_SHORTFALL = 'shortfall';
const MOVE_SEARCH_LIMIT = 4000; // planner runs per resolveMove (never reached in practice)

class MoveError extends Error {}

function cloneMove(move) {
    return JSON.parse(JSON.stringify(move));
}

// Read / write a value at a slot path such as ['sales', 1, 'beer', 0]
function getAtSlot(obj, slot) {
    let o = obj;
    for (const k of slot) {
        if (o === null || o === undefined) return undefined;
        o = o[k];
    }
    return o;
}

function setAtSlot(obj, slot, value) {
    let o = obj;
    for (let i = 0; i < slot.length - 1; i++) {
        const k = slot[i];
        if (o[k] === null || o[k] === undefined) o[k] = typeof slot[i + 1] === 'number' ? [] : {};
        o = o[k];
    }
    o[slot[slot.length - 1]] = value;
    return obj;
}

const MoveEngine = {

    // ========================================================================
    // Public API
    // ========================================================================

    // Validate, complete and execute a move. Illegal moves are rejected with
    // no change to the state. Returns { success, message, move } where `move`
    // is the fully specified move that was played.
    applyMove(playerId, move) {
        const r = this.resolveMove(playerId, move);
        if (!r.ok) return { success: false, message: r.message };
        const result = this.executePlan(playerId, r.plan);
        return { success: true, message: result.message, move: r.resolved };
    },

    // Validate a move and complete its unspecified choices, without changing
    // the state. Returns { ok, message, resolved, plan, points }.
    // options.requireCard=false validates everything except the card (used
    // while a human is still building the move).
    // options.all=true returns { ok, results: [...] } with EVERY legal
    // completion (deduplicated) instead of the first.
    resolveMove(playerId, move, options = {}) {
        const requireCard = options.requireCard !== false;
        const results = [];
        const seen = new Set();
        let firstFailure = null;
        const stack = [[]];
        let runs = 0;

        while (stack.length && runs++ < MOVE_SEARCH_LIMIT) {
            const path = stack.pop();
            const r = this.planMove(playerId, move, { path, requireCard });
            // Queue the alternatives at every free choice made beyond `path`.
            // Shallow points are pushed first and smaller alternatives last,
            // so the stack pops completions in lexicographic ("defaults
            // first, change the latest choice first") order.
            const free = r.points.filter(p => !p.fixed);
            const prefix = free.map(p => p.index);
            for (let j = path.length; j < free.length; j++) {
                for (let alt = free[j].options.length - 1; alt >= 1; alt--) {
                    stack.push([...prefix.slice(0, j), alt]);
                }
            }
            if (r.ok) {
                if (!options.all) return r;
                const key = moveKey(r.resolved);
                if (!seen.has(key)) { seen.add(key); results.push(r); }
            } else if (!firstFailure) {
                firstFailure = r;
            }
        }
        if (options.all) return { ok: results.length > 0, message: firstFailure ? firstFailure.message : '', results };
        return firstFailure || { ok: false, message: 'No legal way to play this move', points: [] };
    },

    // Every legal move for a player. By default one move per distinct
    // decision (card × target), with resource choices completed by the
    // engine; options.expandChoices=true also lists every legal resource /
    // merchant / bonus combination as a separate move. Identical cards are
    // merged unless options.allCards=true.
    getLegalMoves(playerId, options = {}) {
        const state = this.state;
        if (state.gameOver) return [];
        const pending = state.getPendingShortfalls();
        if (pending.length > 0) {
            if (!pending.includes(playerId)) return [];
            return this.shortfallTileKeys(playerId).map(tile => ({ type: MOVE_SHORTFALL, tile }));
        }
        const player = state.players[playerId];
        if (player.hand.length === 0) return [];

        const cards = this.distinctCardIndices(playerId, options.allCards);
        const skeletons = [];

        // Build: every legal target × every card that can pay for it
        for (const t of this.getValidBuildTargets(playerId)) {
            const usable = this.getValidCardsForAction(playerId, ACTIONS.BUILD, t);
            for (const card of cards.filter(c => usable.includes(c))) {
                skeletons.push({ type: ACTIONS.BUILD, card, location: t.cityId, slot: t.slotIndex, industry: t.industryType });
            }
        }
        // Network: single links, and in the Rail Era ordered pairs of links
        for (const t of this.getValidNetworkTargets(playerId)) {
            for (const card of cards) skeletons.push({ type: ACTIONS.NETWORK, card, links: [t.connectionId] });
        }
        if (state.era === ERA.RAIL && player.linksRemaining.rail >= 2) {
            for (const conn of CONNECTIONS) {
                if (!conn.rail || state.boardLinks[conn.id]) continue;
                for (const second of this.getValidSecondRailLinks(playerId, conn.id)) {
                    for (const card of cards) {
                        skeletons.push({ type: ACTIONS.NETWORK, card, links: [conn.id, second.connectionId] });
                    }
                }
            }
        }
        // Develop: one tile, or two (unordered for different industries)
        const typeOrder = Object.keys(INDUSTRY_DATA);
        for (const t of this.getDevelopableTypes(playerId)) {
            if (!this.canDevelopTypes(playerId, t.type).ok) continue;
            for (const card of cards) skeletons.push({ type: ACTIONS.DEVELOP, card, industries: [t.type] });
            for (const second of this.getSecondDevelopOptions(playerId, t.type)) {
                if (typeOrder.indexOf(second.type) < typeOrder.indexOf(t.type)) continue;
                for (const card of cards) skeletons.push({ type: ACTIONS.DEVELOP, card, industries: [t.type, second.type] });
            }
        }
        // Sell: every sellable set of tiles (supersets of an unsellable set
        // are skipped — adding a tile only adds requirements)
        for (const tiles of this.sellableTileSets(playerId)) {
            for (const card of cards) {
                skeletons.push({ type: ACTIONS.SELL, card, sales: tiles.map(tile => ({ tile })) });
            }
        }
        if (state.canTakeLoan(playerId)) {
            for (const card of cards) skeletons.push({ type: ACTIONS.LOAN, card });
        }
        if (this.canScout(playerId)) {
            const n = player.hand.length;
            const seen = new Set();
            for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
                const key = [i, j, k].map(x => cardKey(player.hand[x])).sort().join('|');
                if (!options.allCards && seen.has(key)) continue;
                seen.add(key);
                skeletons.push({ type: ACTIONS.SCOUT, cards: [i, j, k] });
            }
        }
        for (const card of cards) skeletons.push({ type: ACTIONS.PASS, card });

        const moves = [];
        for (const skeleton of skeletons) {
            if (options.expandChoices) {
                const r = this.resolveMove(playerId, skeleton, { all: true });
                for (const x of r.results) moves.push(x.resolved);
            } else {
                const r = this.resolveMove(playerId, skeleton);
                if (r.ok) moves.push(r.resolved);
            }
        }
        return moves;
    },

    // The next decision a human should make to complete `move`: the first
    // unspecified choice point with more than one option that can still lead
    // to a legal move. Returns null when nothing is left to choose (or the
    // move is illegal — check resolveMove). Single viable options are filled
    // in automatically.
    // Returns { kind, slot, options: [{ value, label }], move } — `move` is
    // the input with any forced choices filled; apply the player's pick with
    // withChoice(move, slot, value).
    getNextChoice(playerId, move, options = {}) {
        let current = cloneMove(move);
        for (let guard = 0; guard < 50; guard++) {
            const r = this.resolveMove(playerId, current, { requireCard: false });
            if (!r.ok) return null;
            const point = r.points.find(p => !p.fixed && p.options.length > 1);
            if (!point) return null;
            const viable = point.options.filter(value =>
                this.resolveMove(playerId, withChoice(current, point.slot, value), { requireCard: false }).ok);
            if (viable.length === 1) {
                current = withChoice(current, point.slot, viable[0]);
                continue;
            }
            return {
                kind: point.kind,
                slot: point.slot,
                prompt: point.prompt,
                options: viable.map(value => ({ value, label: this.describeChoice(point.kind, value, playerId) })),
                move: current,
            };
        }
        return null;
    },

    // Human-readable label for a choice value
    describeChoice(kind, value, playerId) {
        const ownerName = (tile) => (tile.playerId === playerId ? 'yours' : this.state.players[tile.playerId].name);
        const where = (key) => (key.startsWith('farm_')
            ? BREWERY_FARMS[key.slice(5)].name
            : CITIES[key.split('_')[0]].name);
        const tileAt = (key) => (key.startsWith('farm_')
            ? this.state.breweryFarmTiles[key.slice(5)]
            : this.state.boardIndustries[key]);
        if (value === 'market') {
            return kind === 'coal' ? `Buy from the coal market (£${this.state.getCoalPrice()})`
                : `Buy from the iron market (£${this.state.getIronPrice()})`;
        }
        if (value === 'none') return 'Sell without merchant beer';
        if (value === 'skip') return 'Skip the free develop';
        if (typeof value === 'number') {
            const mt = this.state.merchantTiles[value];
            const m = MERCHANTS[mt.location];
            const bonus = { vp: `+${m.bonusAmount} VP`, money: `+£${m.bonusAmount}`,
                income: `+${m.bonusAmount} income`, develop: 'free develop' }[m.bonusType];
            return `Sell to ${m.name} and drink its beer (${bonus})`;
        }
        if (kind === 'freeDevelop' && INDUSTRY_DISPLAY[value]) {
            const next = this.peekDevelopTile(playerId, value, 0);
            return `Develop ${INDUSTRY_DISPLAY[value].name}${next ? ` Lv${next.level}` : ''} (free)`;
        }
        const [src, key] = String(value).split(/:(.*)/);
        if (key !== undefined && (src === 'mine' || src === 'works' || src === 'brewery')) {
            const tile = tileAt(key);
            const name = { mine: 'Coal Mine', works: 'Iron Works', brewery: 'Brewery' }[src];
            return `${name} in ${where(key)} (${ownerName(tile)}, ${tile.resourceCubes} left)`;
        }
        if (kind === 'shortfall') return value;
        return String(value);
    },

    // Translate an AI decision ({ action, pendingData, cardIndex }) into a move
    moveFromDecision(decision) {
        const pd = decision.pendingData || {};
        switch (decision.action) {
            case ACTIONS.BUILD:
                return { type: ACTIONS.BUILD, card: decision.cardIndex, location: pd.cityId, slot: pd.slotIndex, industry: pd.industryType };
            case ACTIONS.NETWORK:
                return { type: ACTIONS.NETWORK, card: decision.cardIndex,
                    links: pd.connectionId2 ? [pd.connectionId, pd.connectionId2] : [pd.connectionId] };
            case ACTIONS.DEVELOP:
                return { type: ACTIONS.DEVELOP, card: decision.cardIndex,
                    industries: pd.industryType2 ? [pd.industryType1, pd.industryType2] : [pd.industryType1] };
            case ACTIONS.SELL:
                return { type: ACTIONS.SELL, card: decision.cardIndex, sales: legacySales(pd.sellPlan) };
            case ACTIONS.SCOUT:
                return { type: ACTIONS.SCOUT, cards: [...(pd.scoutCards || []), decision.cardIndex] };
            default:
                return { type: decision.action, card: decision.cardIndex };
        }
    },

    // ========================================================================
    // Planning
    // ========================================================================

    // Validate one move along one path of choices. Never changes the state.
    // ctx.path: indices to take at the free choice points (default 0).
    // Returns { ok, message, resolved, plan, points }.
    planMove(playerId, move, ctx = {}) {
        const run = this.newPlanRun(ctx);
        try {
            if (!move || typeof move !== 'object') throw new MoveError('Not a move');
            if (this.state.gameOver) throw new MoveError('The game is over');
            if (!this.state.players[playerId]) throw new MoveError('Unknown player');
            run.resolved = cloneMove(move);

            const pending = this.state.getPendingShortfalls();
            if (move.type === MOVE_SHORTFALL) {
                if (!pending.includes(playerId)) throw new MoveError('You have no income shortfall to cover');
            } else if (pending.length > 0) {
                throw new MoveError('Income shortfalls must be covered first');
            }

            let plan;
            switch (move.type) {
                case ACTIONS.BUILD: plan = this.planBuild(playerId, move, run); break;
                case ACTIONS.NETWORK: plan = this.planNetwork(playerId, move, run); break;
                case ACTIONS.DEVELOP: plan = this.planDevelop(playerId, move, run); break;
                case ACTIONS.SELL: plan = this.planSellMove(playerId, move, run); break;
                case ACTIONS.LOAN: plan = this.planLoan(playerId, move, run); break;
                case ACTIONS.SCOUT: plan = this.planScout(playerId, move, run); break;
                case ACTIONS.PASS: plan = this.planPass(playerId, move, run); break;
                case MOVE_SHORTFALL: plan = this.planShortfall(playerId, move, run); break;
                default: throw new MoveError(`Unknown move type "${move.type}"`);
            }
            return { ok: true, message: '', resolved: run.resolved, plan, points: run.points };
        } catch (err) {
            if (!(err instanceof MoveError)) throw err;
            return { ok: false, message: err.message, resolved: null, plan: null, points: run.points };
        }
    },

    // Planning context: the choice path, recorded choice points, and the
    // ledger of what the move has consumed so far
    newPlanRun(ctx = {}) {
        return {
            path: ctx.path || [],
            requireCard: ctx.requireCard !== false,
            points: [],
            free: 0,
            ledger: { cubes: {}, coalMarket: 0, ironMarket: 0, merchants: new Set(), mat: {} },
            resolved: {},
        };
    },

    // A choice point. `specified` (from the move) must be one of `options`;
    // otherwise the path decides (default: the first option). The chosen
    // value is written into the resolved move at `slot`.
    choose(run, kind, slot, options, emptyMessage, prompt) {
        if (options.length === 0) throw new MoveError(emptyMessage);
        const specified = getAtSlot(run.resolved, slot);
        let index;
        let fixed;
        if (specified !== undefined && specified !== null) {
            index = options.indexOf(specified);
            if (index < 0) throw new MoveError(`That ${CHOICE_NAMES[kind] || kind} choice is not allowed`);
            fixed = true;
        } else {
            const i = run.free++;
            index = i < run.path.length ? run.path[i] : 0;
            if (index >= options.length) throw new MoveError('Invalid choice path');
            fixed = false;
        }
        run.points.push({ kind, slot, options, index, fixed, prompt });
        const value = options[index];
        setAtSlot(run.resolved, slot, value);
        return value;
    },

    checkCard(playerId, run, cardIndex, label = 'card') {
        if (cardIndex === undefined && !run.requireCard) return;
        if (!this.isValidCardIndex(playerId, cardIndex)) throw new MoveError(`Select a ${label} to discard`);
    },

    // ---- Resource choices (pure; consumption so far is in run.ledger) -----

    remainingCubes(run, key) {
        const tile = key.startsWith('farm_') ? this.state.breweryFarmTiles[key.slice(5)] : this.state.boardIndustries[key];
        if (!tile || tile.flipped) return 0;
        return tile.resourceCubes - (run.ledger.cubes[key] || 0);
    },

    marketPrice(kind, taken) {
        const prices = kind === 'coal' ? COAL_MARKET_PRICES : IRON_MARKET_PRICES;
        const count = (kind === 'coal' ? this.state.coalMarket : this.state.ironMarket) - taken;
        if (count <= 0) return kind === 'coal' ? COAL_EMPTY_PRICE : IRON_EMPTY_PRICE;
        return prices[prices.length - count];
    },

    // Coal sources usable from any of `locations` (a build location, or both
    // ends of a rail link). Rulebook: the CLOSEST connected unflipped mine
    // with coal (ties: player's choice); only if none is connected, the
    // market — and that needs a connection to a merchant space.
    coalOptions(locations, playerId, run) {
        const distance = new Map();
        let marketReachable = false;
        for (const loc of locations) {
            for (const src of this.state.findCoalSource(loc, playerId)) {
                if (src.type === 'mine') {
                    const prev = distance.get(src.key);
                    if (prev === undefined || src.distance < prev) distance.set(src.key, src.distance);
                } else {
                    marketReachable = true;
                }
            }
        }
        const mines = [...distance.entries()].filter(([key]) => this.remainingCubes(run, key) > 0);
        if (mines.length > 0) {
            const closest = Math.min(...mines.map(([, d]) => d));
            return mines.filter(([, d]) => d === closest).map(([key]) => `mine:${key}`);
        }
        return marketReachable ? ['market'] : [];
    },

    // Iron: ANY unflipped Iron Works with iron (no connection needed, any
    // order); only if none has iron, the market.
    ironOptions(run) {
        const works = Object.entries(this.state.boardIndustries)
            .filter(([key, t]) => t.type === INDUSTRY_TYPES.IRON_WORKS && this.remainingCubes(run, key) > 0)
            .map(([key]) => `works:${key}`);
        return works.length > 0 ? works : ['market'];
    },

    takeCoal(run, playerId, locations, slot) {
        const source = this.choose(run, 'coal', slot, this.coalOptions(locations, playerId, run), 'No coal available',
            'Choose which coal to use');
        return this.consumeChoice(run, 'coal', source);
    },

    takeIron(run, slot) {
        const source = this.choose(run, 'iron', slot, this.ironOptions(run), 'No iron available',
            'Choose which iron to use');
        return this.consumeChoice(run, 'iron', source);
    },

    // Record a coal/iron unit in the ledger; returns its price
    consumeChoice(run, kind, source) {
        if (source === 'market') {
            const field = kind === 'coal' ? 'coalMarket' : 'ironMarket';
            const price = this.marketPrice(kind, run.ledger[field]);
            run.ledger[field]++;
            return { source, price };
        }
        const key = source.split(/:(.*)/)[1];
        run.ledger.cubes[key] = (run.ledger.cubes[key] || 0) + 1;
        return { source, price: 0 };
    },

    // Brewery beer usable for a requirement at `location` (sales) — own
    // breweries anywhere, opponents' breweries connected to it.
    breweryBeerOptions(location, playerId, run) {
        const keys = [];
        for (const src of this.state.findBeerSources(location, playerId, null)) {
            if (!keys.includes(src.key) && this.remainingCubes(run, src.key) > 0) keys.push(src.key);
        }
        return keys.map(k => `brewery:${k}`);
    },

    // ---- Build ------------------------------------------------------------

    planBuild(playerId, move, run) {
        this.checkCard(playerId, run, move.card);
        const isFarm = isBreweryFarm(move.location);
        const slotIndex = isFarm ? 0 : move.slot;
        if (!this.checkBuildTargetAt(playerId, move.location, slotIndex, move.industry)) {
            throw new MoveError('You cannot build that there');
        }
        if (move.card !== undefined &&
            !this.getValidCardsForAction(playerId, ACTIONS.BUILD,
                { cityId: move.location, industryType: move.industry }).includes(move.card)) {
            throw new MoveError('That card cannot be used for this build');
        }
        if (isFarm) run.resolved.slot = 0;

        const tile = this.state.getNextTile(playerId, move.industry);
        let cost = tile.cost;
        const coal = [];
        const iron = [];
        for (let i = 0; i < tile.costCoal; i++) {
            const c = this.takeCoal(run, playerId, [move.location], ['coal', i]);
            coal.push(c.source);
            cost += c.price;
        }
        for (let i = 0; i < tile.costIron; i++) {
            const c = this.takeIron(run, ['iron', i]);
            iron.push(c.source);
            cost += c.price;
        }
        if (!coal.length) delete run.resolved.coal;
        if (!iron.length) delete run.resolved.iron;
        if (cost > this.state.players[playerId].money) throw new MoveError('Cannot afford this build');
        return { type: ACTIONS.BUILD, card: move.card, location: move.location, slot: slotIndex,
            industry: move.industry, coal, iron, cost };
    },

    // ---- Network ----------------------------------------------------------

    planNetwork(playerId, move, run) {
        this.checkCard(playerId, run, move.card);
        const links = move.links;
        if (!Array.isArray(links) || links.length < 1 || links.length > 2) throw new MoveError('Choose one or two links');
        const conns = links.map(id => CONNECTIONS.find(c => c.id === id));
        if (conns.some(c => !c)) throw new MoveError('Invalid connection');
        const player = this.state.players[playerId];

        if (links.length === 1) {
            if (!this.checkNetworkTarget(playerId, conns[0])) throw new MoveError('You cannot build that link');
            delete run.resolved.beer;
            if (this.state.era === ERA.CANAL) {
                delete run.resolved.coal;
                return { type: ACTIONS.NETWORK, card: move.card, links, linkType: 'canal', coal: [], beer: null, cost: CANAL_LINK_COST };
            }
            const c = this.takeCoal(run, playerId, conns[0].cities, ['coal', 0]);
            const cost = RAIL_LINK_COST + c.price;
            if (cost > player.money) throw new MoveError('Cannot afford this link');
            return { type: ACTIONS.NETWORK, card: move.card, links, linkType: 'rail', coal: [c.source], beer: null, cost };
        }

        // Two rail links in one action: £15, 1 coal per link (each sourced
        // with its own link placed), and 1 beer from a Brewery (own anywhere,
        // or an opponent's connected to the second link; not merchant beer).
        if (this.state.era !== ERA.RAIL) throw new MoveError('Double links are Rail Era only');
        if (links[0] === links[1]) throw new MoveError('Choose two different links');
        if (!conns[0].rail || !conns[1].rail) throw new MoveError('Not a railway line');
        if (player.linksRemaining.rail < 2) throw new MoveError('Not enough rail links');
        if (this.state.boardLinks[links[0]] || this.state.boardLinks[links[1]]) throw new MoveError('Connection already built');

        // Links are placed on the board temporarily while planning (adjacency
        // and connections depend on them) and always removed again.
        const placed = [];
        try {
            if (!this.playerHasNoTilesOnBoard(playerId) &&
                !this.state.isInNetwork(playerId, conns[0].cities[0]) &&
                !this.state.isInNetwork(playerId, conns[0].cities[1])) {
                throw new MoveError('First link is not adjacent to your network');
            }
            this.state.boardLinks[links[0]] = { playerId, type: 'rail' };
            placed.push(links[0]);
            const c1 = this.takeCoal(run, playerId, conns[0].cities, ['coal', 0]);

            if (!this.state.isInNetwork(playerId, conns[1].cities[0]) &&
                !this.state.isInNetwork(playerId, conns[1].cities[1])) {
                throw new MoveError('Second link is not adjacent to your network');
            }
            this.state.boardLinks[links[1]] = { playerId, type: 'rail' };
            placed.push(links[1]);
            const c2 = this.takeCoal(run, playerId, conns[1].cities, ['coal', 1]);

            const beer = this.choose(run, 'beer', ['beer'], this.doubleRailBeerOptions(playerId, conns[1], run),
                'No beer available for the second link', 'Choose the beer for the second link');
            const key = beer.split(/:(.*)/)[1];
            run.ledger.cubes[key] = (run.ledger.cubes[key] || 0) + 1;

            const cost = RAIL_DOUBLE_LINK_COST + c1.price + c2.price;
            if (cost > player.money) throw new MoveError('Cannot afford both links');
            return { type: ACTIONS.NETWORK, card: move.card, links, linkType: 'rail',
                coal: [c1.source, c2.source], beer, cost, coalCost2: c2.price };
        } finally {
            for (const id of placed) delete this.state.boardLinks[id];
        }
    },

    // Beer for the second rail link: own breweries anywhere, then opponents'
    // breweries connected to the second link (which is on the board here)
    doubleRailBeerOptions(playerId, conn, run) {
        const keys = [];
        const add = (key) => { if (!keys.includes(key) && this.remainingCubes(run, key) > 0) keys.push(key); };
        for (const [key, t] of Object.entries(this.state.boardIndustries)) {
            if (t.type === INDUSTRY_TYPES.BREWERY && t.playerId === playerId) add(key);
        }
        for (const [farmId, t] of Object.entries(this.state.breweryFarmTiles)) {
            if (t && t.playerId === playerId) add(`farm_${farmId}`);
        }
        for (const endpoint of conn.cities) {
            for (const loc of this.state.getConnectedLocations(endpoint)) {
                if (isCity(loc)) {
                    CITIES[loc].slots.forEach((_, i) => {
                        const t = this.state.boardIndustries[`${loc}_${i}`];
                        if (t && t.type === INDUSTRY_TYPES.BREWERY && t.playerId !== playerId) add(`${loc}_${i}`);
                    });
                }
                if (isBreweryFarm(loc)) {
                    const t = this.state.breweryFarmTiles[loc];
                    if (t && t.playerId !== playerId) add(`farm_${loc}`);
                }
            }
        }
        return keys.map(k => `brewery:${k}`);
    },

    // ---- Develop ----------------------------------------------------------

    planDevelop(playerId, move, run) {
        this.checkCard(playerId, run, move.card);
        const types = move.industries;
        if (!Array.isArray(types) || types.length < 1 || types.length > 2) throw new MoveError('Choose one or two tiles to develop');
        // Each tile must be the lowest of its industry when removed, and not
        // carry the "cannot develop" (lightbulb) icon
        types.forEach((type, i) => {
            const tile = this.peekDevelopTile(playerId, type, i === 1 && types[0] === type ? 1 : 0);
            if (!tile || !tile.canDevelop) {
                throw new MoveError(i === 0 ? 'That tile cannot be developed' : 'The second tile cannot be developed');
            }
        });
        let cost = 0;
        const iron = [];
        for (let i = 0; i < types.length; i++) {
            const c = this.takeIron(run, ['iron', i]);
            iron.push(c.source);
            cost += c.price;
        }
        if (cost > this.state.players[playerId].money) throw new MoveError('Cannot afford market iron');
        return { type: ACTIONS.DEVELOP, card: move.card, industries: [...types], iron, cost };
    },

    // ---- Sell -------------------------------------------------------------

    planSellMove(playerId, move, run) {
        this.checkCard(playerId, run, move.card);
        const sales = move.sales;
        if (!Array.isArray(sales) || sales.length === 0) throw new MoveError('Nothing selected to sell');
        const seen = new Set();
        const steps = [];

        sales.forEach((sale, i) => {
            const key = sale && sale.tile;
            const tile = this.state.boardIndustries[key];
            if (!tile || seen.has(key) || tile.playerId !== playerId || tile.flipped || !isSellableIndustry(tile.type)) {
                throw new MoveError('That industry cannot be sold');
            }
            seen.add(key);
            const name = `${INDUSTRY_DISPLAY[tile.type].name} Lv${tile.tileData.level}`;
            const [cityId] = key.split('_');
            const merchantIndices = this.getSellMerchantsFor(playerId, cityId, tile.type);
            if (merchantIndices.length === 0) throw new MoveError(`No connected merchant buys the ${name}`);

            let beerNeeded = tile.tileData.beersToSell || 0;
            let merchant = null;
            let freeDevelop = null;

            // Which merchant tile to sell to — choosing one with a barrel
            // means drinking it (and taking its bonus); 'none' means selling
            // without merchant beer. Best bonus first.
            if (beerNeeded > 0) {
                const withBeer = merchantIndices
                    .filter(m => this.state.merchantTiles[m].hasBeer && !run.ledger.merchants.has(m))
                    .sort((a, b) => this.merchantBonusValue(this.state.merchantTiles[b]) -
                                    this.merchantBonusValue(this.state.merchantTiles[a]));
                const pick = this.choose(run, 'merchant', ['sales', i, 'merchant'], [...withBeer, 'none'],
                    'No merchant', `Choose a merchant for the ${name}`);
                if (pick !== 'none') {
                    merchant = pick;
                    run.ledger.merchants.add(pick);
                    beerNeeded--;
                    // Gloucester bonus: develop one tile for free (or skip)
                    const bonus = MERCHANTS[this.state.merchantTiles[pick].location];
                    if (bonus.bonusType === 'develop') {
                        freeDevelop = this.choose(run, 'freeDevelop', ['sales', i, 'freeDevelop'],
                            [...this.freeDevelopOptions(playerId, run), 'skip'], 'No develop option',
                            'Merchant bonus: develop one tile for free');
                        if (freeDevelop !== 'skip') run.ledger.mat[freeDevelop] = (run.ledger.mat[freeDevelop] || 0) + 1;
                    } else {
                        delete run.resolved.sales[i].freeDevelop;
                    }
                } else {
                    delete run.resolved.sales[i].freeDevelop;
                }
            } else {
                run.resolved.sales[i].merchant = 'none';
                delete run.resolved.sales[i].freeDevelop;
            }

            // Remaining beer from breweries (own anywhere, opponents' connected)
            const beer = [];
            for (let j = 0; j < beerNeeded; j++) {
                const src = this.choose(run, 'beer', ['sales', i, 'beer', j], this.breweryBeerOptions(cityId, playerId, run),
                    `Not enough beer to sell the ${name}`, `Choose beer for the ${name}`);
                const bkey = src.split(/:(.*)/)[1];
                run.ledger.cubes[bkey] = (run.ledger.cubes[bkey] || 0) + 1;
                beer.push(src);
            }
            if (!beer.length) delete run.resolved.sales[i].beer;
            steps.push({ key, tile, merchant, beer, freeDevelop });
        });
        return { type: ACTIONS.SELL, card: move.card, steps };
    },

    // Gloucester free develop options: developable industries given tiles
    // already removed earlier in this move. Ordered like the previous
    // automatic choice (Canal-only tiles first, then lowest level).
    freeDevelopOptions(playerId, run) {
        const options = [];
        for (const type of Object.keys(this.state.players[playerId].industryTiles)) {
            const tile = this.peekDevelopTile(playerId, type, run.ledger.mat[type] || 0);
            if (tile && tile.canDevelop) options.push({ type, tile });
        }
        options.sort((a, b) =>
            (Number(b.tile.railEra === false) - Number(a.tile.railEra === false)) || (a.tile.level - b.tile.level));
        return options.map(o => o.type);
    },

    // ---- Loan / Scout / Pass ------------------------------------------------

    planLoan(playerId, move, run) {
        this.checkCard(playerId, run, move.card);
        if (!this.state.canTakeLoan(playerId)) throw new MoveError('A loan cannot take your income below -10');
        return { type: ACTIONS.LOAN, card: move.card };
    },

    planScout(playerId, move, run) {
        if (!this.canScout(playerId)) throw new MoveError('You cannot scout right now');
        const cards = move.cards;
        if (cards === undefined && !run.requireCard) return { type: ACTIONS.SCOUT, cards: [] };
        if (!Array.isArray(cards) || cards.length !== 3 || new Set(cards).size !== 3 ||
            !cards.every(i => this.isValidCardIndex(playerId, i))) {
            throw new MoveError('Must discard exactly 3 different cards');
        }
        return { type: ACTIONS.SCOUT, cards: [...cards] };
    },

    planPass(playerId, move, run) {
        this.checkCard(playerId, run, move.card);
        return { type: ACTIONS.PASS, card: move.card };
    },

    // ---- Income shortfall ---------------------------------------------------

    planShortfall(playerId, move, run) {
        if (!this.shortfallTileKeys(playerId).includes(move.tile)) {
            throw new MoveError('Choose one of your industry tiles to sell');
        }
        return { type: MOVE_SHORTFALL, tile: move.tile };
    },

    // Board keys of every industry tile the player owns (farms: 'northern')
    shortfallTileKeys(playerId) {
        return this.state.ownedTileKeys(playerId);
    },

    // ========================================================================
    // Execution of a validated plan
    // ========================================================================

    executePlan(playerId, plan) {
        switch (plan.type) {
            case ACTIONS.BUILD: return this.executeBuildPlan(playerId, plan);
            case ACTIONS.NETWORK: return this.executeNetworkPlan(playerId, plan);
            case ACTIONS.DEVELOP: return this.executeDevelopPlan(playerId, plan);
            case ACTIONS.SELL: return this.executeSellPlan(playerId, plan);
            case ACTIONS.LOAN: return this.executeLoanPlan(playerId, plan);
            case ACTIONS.SCOUT: return this.executeScoutPlan(playerId, plan);
            case ACTIONS.PASS:
                this.discardCard(playerId, plan.card);
                return { message: 'Passed' };
            case MOVE_SHORTFALL: return { message: this.state.sellTileForShortfall(playerId, plan.tile) };
            default: throw new Error(`cannot execute ${plan.type}`);
        }
    },

    consumeSource(source) {
        if (source === 'market-coal') this.state.takeMarketCoal();
        else if (source === 'market-iron') this.state.takeMarketIron();
        else this.state.consumeResource(source.split(/:(.*)/)[1]);
    },

    executeBuildPlan(playerId, plan) {
        const { location, slot, industry } = plan;
        const isFarm = isBreweryFarm(location);
        const tileData = this.state.useNextTile(playerId, industry);

        this.state.spendMoney(playerId, plan.cost);
        for (const src of plan.coal) this.consumeSource(src === 'market' ? 'market-coal' : src);
        for (const src of plan.iron) this.consumeSource(src === 'market' ? 'market-iron' : src);

        // Overbuilt tiles (own or opponent's) are removed from the game along
        // with any cubes on them; placement below simply overwrites the slot.
        // Breweries hold 1 beer when built in the Canal Era, 2 in the Rail
        // Era; coal mines / iron works use the cube count printed on the tile.
        let cubes = tileData.resourceCubes || 0;
        if (industry === INDUSTRY_TYPES.BREWERY) cubes = this.state.era === ERA.RAIL ? 2 : 1;
        const placedTile = { playerId, type: industry, tileData, flipped: false, resourceCubes: cubes };

        let key;
        if (isFarm) {
            key = location; // farm tiles live in breweryFarmTiles by farm id
            this.state.breweryFarmTiles[location] = placedTile;
        } else {
            key = `${location}_${slot}`;
            this.state.boardIndustries[key] = placedTile;
        }

        // Moving coal/iron to the market: iron works always sell their cubes
        // into empty market spaces immediately; coal mines only if connected
        // to a merchant location. The money is not "spent" (no turn-order effect).
        let marketSale = null;
        if (industry === INDUSTRY_TYPES.IRON_WORKS) {
            marketSale = this.state.autoSellToMarket(key, placedTile);
        } else if (industry === INDUSTRY_TYPES.COAL_MINE) {
            const connected = this.state.getConnectedLocations(location);
            if ([...connected].some(loc => isMerchantLocation(loc))) {
                marketSale = this.state.autoSellToMarket(key, placedTile);
            }
        }
        if (marketSale && marketSale.moneyGained > 0) this.state.players[playerId].money += marketSale.moneyGained;

        this.discardCard(playerId, plan.card);

        const locName = isFarm ? BREWERY_FARMS[location].name : CITIES[location].name;
        let message = `Built ${INDUSTRY_DISPLAY[industry].name} Level ${tileData.level} in ${locName}`;
        if (marketSale && marketSale.cubesMoved > 0) {
            message += ` — sold ${marketSale.cubesMoved} to market for £${marketSale.moneyGained}`;
            if (marketSale.flipped) message += ' (tile flipped!)';
        }
        return { message };
    },

    executeNetworkPlan(playerId, plan) {
        const player = this.state.players[playerId];
        const name = id => CITIES[id]?.name || MERCHANTS[id]?.name || id;
        if (plan.linkType === 'canal') {
            this.state.spendMoney(playerId, plan.cost);
        } else {
            // Each link is on the board before its coal is taken
            plan.links.forEach((id, i) => {
                this.state.boardLinks[id] = { playerId, type: 'rail' };
                this.consumeSource(plan.coal[i] === 'market' ? 'market-coal' : plan.coal[i]);
            });
            if (plan.beer) this.consumeSource(plan.beer);
            this.state.spendMoney(playerId, plan.cost);
        }
        for (const id of plan.links) {
            this.state.boardLinks[id] = { playerId, type: plan.linkType };
            player.linksRemaining[plan.linkType]--;
        }
        this.discardCard(playerId, plan.card);

        const conns = plan.links.map(id => CONNECTIONS.find(c => c.id === id));
        if (conns.length === 1) {
            return { message: `Built ${plan.linkType} link: ${name(conns[0].cities[0])} - ${name(conns[0].cities[1])}` };
        }
        return {
            message: `Built 2 rail links: ${name(conns[0].cities[0])} - ${name(conns[0].cities[1])} and ` +
                `${name(conns[1].cities[0])} - ${name(conns[1].cities[1])} (1 beer consumed)`,
        };
    },

    executeDevelopPlan(playerId, plan) {
        for (const src of plan.iron) {
            if (src === 'market') {
                // Buy from the market (or the General Supply at £6 when empty)
                this.state.spendMoney(playerId, this.state.getIronPrice());
                this.state.takeMarketIron();
            } else {
                this.consumeSource(src);
            }
        }
        for (const type of plan.industries) this.state.developTile(playerId, type);
        this.discardCard(playerId, plan.card);
        return { message: `Developed ${plan.industries.map(t => INDUSTRY_DISPLAY[t].name).join(' and ')}` };
    },

    executeSellPlan(playerId, plan) {
        const player = this.state.players[playerId];
        const results = [];
        for (const step of plan.steps) {
            const notes = [];
            if (step.merchant !== null) {
                const mt = this.state.merchantTiles[step.merchant];
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
                        if (step.freeDevelop && step.freeDevelop !== 'skip') {
                            const tile = this.state.developTile(playerId, step.freeDevelop);
                            notes.push(`free develop: ${INDUSTRY_DISPLAY[step.freeDevelop].name} Lv${tile.level}`);
                        } else {
                            notes.push('free develop skipped');
                        }
                        break;
                }
            }
            for (const src of step.beer) this.consumeSource(src);
            // Flip the tile (advances income by the tile's spaces)
            this.state.flipTile(step.key, step.tile);
            let line = `Sold ${INDUSTRY_DISPLAY[step.tile.type].name} Lv${step.tile.tileData.level}`;
            if (notes.length) line += ` [${notes.join('; ')}]`;
            results.push(line);
        }
        this.discardCard(playerId, plan.card);
        return { message: results.join(', ') };
    },

    executeLoanPlan(playerId, plan) {
        this.state.players[playerId].money += LOAN_AMOUNT;
        this.state.applyLoanIncomeDrop(playerId);
        this.discardCard(playerId, plan.card);
        return { message: `Took £${LOAN_AMOUNT} loan (income -${LOAN_INCOME_PENALTY} levels)` };
    },

    executeScoutPlan(playerId, plan) {
        const player = this.state.players[playerId];
        // Discard the 3 cards face up (in the order chosen), then remove them
        // from the hand in reverse index order to keep indices valid
        for (const idx of plan.cards) player.discardPile.push(player.hand[idx]);
        for (const idx of [...plan.cards].sort((a, b) => b - a)) player.hand.splice(idx, 1);
        player.hand.push({ type: CARD_TYPES.WILD_LOCATION, name: 'Wild Location' });
        player.hand.push({ type: CARD_TYPES.WILD_INDUSTRY, name: 'Wild Industry' });
        this.state.wildLocationPile--;
        this.state.wildIndustryPile--;
        return { message: 'Scouted: gained Wild Location + Wild Industry' };
    },

    // ========================================================================
    // Enumeration helpers
    // ========================================================================

    // One hand index per distinct card (identical cards are interchangeable)
    distinctCardIndices(playerId, allCards = false) {
        const hand = this.state.players[playerId].hand;
        if (allCards) return hand.map((_, i) => i);
        const seen = new Set();
        const out = [];
        hand.forEach((card, i) => {
            const key = cardKey(card);
            if (!seen.has(key)) { seen.add(key); out.push(i); }
        });
        return out;
    },

    // Every non-empty set of the player's sellable tiles that can be sold
    // together (with some legal choice of merchants and beer), in board order.
    sellableTileSets(playerId) {
        const keys = this.getValidSellTargets(playerId).map(t => t.key);
        const ok = [];
        const bad = [];
        const n = keys.length;
        // Enumerate by size so supersets of unsellable sets can be skipped
        const masks = [];
        for (let m = 1; m < (1 << n); m++) masks.push(m);
        masks.sort((a, b) => popcount(a) - popcount(b) || a - b);
        for (const m of masks) {
            if (bad.some(b => (m & b) === b)) continue;
            const tiles = keys.filter((_, i) => m & (1 << i));
            const r = this.resolveMove(playerId, { type: ACTIONS.SELL, sales: tiles.map(tile => ({ tile })) },
                { requireCard: false });
            if (r.ok) ok.push(tiles); else bad.push(m);
        }
        return ok;
    },
};

const CHOICE_NAMES = { coal: 'coal', iron: 'iron', beer: 'beer', merchant: 'merchant', freeDevelop: 'develop' };

function popcount(x) {
    let c = 0;
    while (x) { c += x & 1; x >>= 1; }
    return c;
}

function cardKey(card) {
    if (card.type === CARD_TYPES.LOCATION) return `L:${card.location}`;
    if (card.type === CARD_TYPES.INDUSTRY) return `I:${card.industryTypes.join('/')}`;
    return card.type;
}

// Canonical key of a resolved move, ignoring the order of interchangeable
// resource units (used to deduplicate expanded moves)
function moveKey(move) {
    const m = cloneMove(move);
    const sortList = (o, f) => { if (Array.isArray(o[f])) o[f] = [...o[f]].sort(); };
    if (m.type === ACTIONS.BUILD) { sortList(m, 'coal'); sortList(m, 'iron'); }
    if (m.type === ACTIONS.DEVELOP) sortList(m, 'iron');
    if (m.type === ACTIONS.SELL) for (const s of m.sales) sortList(s, 'beer');
    return JSON.stringify(m);
}

// A copy of `move` with `value` placed at `slot`
function withChoice(move, slot, value) {
    return setAtSlot(cloneMove(move), slot, value);
}

// Legacy sell plans ({ key, useMerchantBeer }) -> move sales
function legacySales(sellPlan) {
    if (!Array.isArray(sellPlan)) return sellPlan;
    return sellPlan.map(e => {
        const sale = { tile: e.key !== undefined ? e.key : e.tile };
        if (e.useMerchantBeer === false) sale.merchant = 'none';
        if (e.merchant !== undefined) sale.merchant = e.merchant;
        if (e.beer !== undefined) sale.beer = e.beer;
        if (e.freeDevelop !== undefined) sale.freeDevelop = e.freeDevelop;
        return sale;
    });
}

Object.assign(GameLogic.prototype, MoveEngine);
