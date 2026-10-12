#!/usr/bin/env node
// Assignment 9: does the AI turn its investments into income and VP?
//
//   node scripts/research/ai-invest.js [--players 3] [--seeds 50] [--levels normal] [--develop a8] [--sell a8] [--legacy a9] [--examples 2]
//
// Plays mirror games (every seat the same level; seeds 200000 + 1000 *
// players + i as in ai-baseline.js) with the AI's diagnostics on, and follows
//
// DEVELOPMENT: every industry developed —
//   blocked     the industry's top tile (the one developed away) could not
//               be built in the current era (a Canal-only tile in the Rail
//               Era, or a Rail-only tile in the Canal Era): developing was
//               the only way to build that industry now
//   buildable   the player could already build that industry somewhere
//   used        the player built that industry later in the game
//   flipped     ...and at least one of those later tiles flipped
//   and its iron cost, era, rounds left, and the best other action.
//
// SELLING: every sellable tile (cotton mill, manufacturer, pottery) the AI
// builds, at each of its owner's turns: sellable now, blocked by MERCHANT
// (no connected merchant buys it) or blocked by BEER (a merchant is
// connected but there is too little beer), and how it ended: sold, still
// unsold at its era's end, or removed earlier (overbuilt / shortfall).
// A sale opportunity is a turn where Sell was legal; it is "taken" when the
// player sold, and otherwise the chosen action is recorded.
//
// --develop / --sell select research variants (js/aiPlayer.js options).

'use strict';

const { loadEngine } = require('../../test/helpers/engine');
const { aiSeedFor } = require('./harness');

function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : fallback;
}
const PLAYERS = Number(arg('players', 3));
const SEEDS = Number(arg('seeds', 50));
const LEVELS = String(arg('levels', 'normal')).split(',');
const DEVELOP = arg('develop', null);
const SELL = arg('sell', null);
const EXAMPLES = Number(arg('examples', 2));
const E = loadEngine();
// --legacy a9: the AI before Assignment 10 (AIPlayer.LEGACY_A9: single links,
// Develop until the end), which the earlier reports measured
const LEGACY_PINS = arg('legacy', null) === 'a9' ? E.AIPlayer.LEGACY_A9 : {};
const A = E.ACTIONS;
const SELLABLE = ['cottonMill', 'manufacturer', 'pottery'];

const pct = (a, b) => `${a} of ${b} (${b ? (100 * a / b).toFixed(0) : 0}%)`;
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '–');

// Why an unflipped sellable tile cannot be sold now
function sellStatus(logic, state, id, key, tile) {
    const [cityId] = key.split('_');
    const merchants = logic.getSellMerchantsFor(id, cityId, tile.type);
    if (merchants.length === 0) return 'merchant';
    const need = tile.tileData.beersToSell || 0;
    const merchantBeer = merchants.some(i => state.merchantTiles[i].hasBeer) ? 1 : 0;
    const breweryBeer = state.findBeerSources(cityId, id, null).length;
    if (need > 0 && breweryBeer + merchantBeer < need) return 'beer';
    return 'sellable';
}

for (const level of LEVELS) {
    const dev = [];            // one per developed industry
    const tiles = [];          // one per sellable tile built
    const opps = { turns: 0, legal: 0, taken: 0, instead: {} };
    let decisions = 0;
    const counts = { develop: 0, developIron: 0, builds: 0, sellableBuilds: 0, breweries: 0 };
    for (let i = 1; i <= SEEDS; i++) {
        const seed = 200000 + 1000 * PLAYERS + i;
        const names = ['A', 'B', 'C', 'D'].slice(0, PLAYERS);
        const state = new E.GameState(PLAYERS, names, names.map(() => ({ isAI: true, difficulty: level })), { seed });
        const logic = new E.GameLogic(state);
        const aiRng = new E.SeededRandom(aiSeedFor(seed));
        const opts = { explain: true, ...LEGACY_PINS, ...(DEVELOP ? { develop: DEVELOP } : {}), ...(SELL ? { sell: SELL } : {}) };
        const live = [];       // sellable tiles still being followed
        const builtAfter = []; // { id, type, t, key }
        let t = 0;

        const settle = (era) => {
            for (const rec of live.filter(r => r.era === era && !r.outcome)) {
                const now = state.boardIndustries[rec.key];
                rec.outcome = now !== rec.tile ? 'removed' : now.flipped ? 'sold' : 'unsold';
            }
        };
        for (const method of ['endCanalEra', 'endGame']) {
            const original = state[method].bind(state);
            state[method] = () => { settle(state.era); return original(); };
        }

        for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
            const id = d.playerId;
            if (d.type === 'shortfall') { logic.play(id, logic.defaultShortfallMove(id)); continue; }
            t++;
            decisions++;
            // Follow this player's sellable tiles
            for (const rec of live.filter(r => r.player === id && !r.outcome)) {
                const now = state.boardIndustries[rec.key];
                if (now !== rec.tile) { rec.outcome = 'removed'; continue; }
                if (now.flipped) { rec.outcome = 'sold'; continue; }
                rec.turns++;
                rec.status[sellStatus(logic, state, id, rec.key, now)]++;
            }
            const decision = E.AIPlayer.chooseAction(state, logic, id, level, aiRng, opts);
            const move = logic.moveFromDecision(decision);

            opps.turns++;
            if (logic.canPerformAction(A.SELL, id)) {
                opps.legal++;
                if (move.type === A.SELL) opps.taken++;
                else opps.instead[move.type] = (opps.instead[move.type] || 0) + 1;
            }
            if (move.type === A.DEVELOP) {
                counts.develop++;
                counts.developIron += logic.planMove(id, move).plan.cost;
                const cands = decision.explain.candidates;
                const others = cands.filter(c => c.action !== A.DEVELOP).sort((a, b) => b.score - a.score);
                const buildCand = cands.find(c => c.action === A.BUILD);
                move.industries.forEach((type, k) => {
                    const tile = logic.peekDevelopTile(id, type, k > 0 && move.industries[0] === type ? 1 : 0);
                    const blocked = state.era === 'rail' ? !tile.railEra : !tile.canalEra;
                    const gameRoundsLeft = state.getRoundsRemaining() + (state.era === 'canal' ? E.ROUNDS_PER_ERA[PLAYERS] : 0);
                    const buildable = logic.getValidBuildTargets(id).some(b => b.industryType === type);
                    dev.push({ seed, player: id, t, era: state.era, round: state.round, roundsLeft: state.getRoundsRemaining(), gameRoundsLeft,
                        type, level: tile.level, canalOnly: tile.railEra === false, blockedNext: blocked, buildable,
                        alt: others[0] ? `${others[0].action} ${others[0].score.toFixed(2)}` : '–',
                        devScore: (cands.find(c => c.action === A.DEVELOP) || {}).score, bestBuild: buildCand ? buildCand.score : null });
                });
            }
            let key = null;
            if (move.type === A.BUILD) {
                counts.builds++;
                key = `${move.location}_${move.slot}`;
                if (move.industry === 'brewery') counts.breweries++;
                builtAfter.push({ id, type: move.industry, t, key });
            }
            const r = logic.play(id, move);
            if (!r.success) throw new Error(`rejected (seed ${seed}): ${r.message}`);
            if (move.type === A.BUILD && SELLABLE.includes(move.industry) && state.boardIndustries[key]) {
                counts.sellableBuilds++;
                const tile = state.boardIndustries[key];
                const rec = { seed, player: id, key, tile, type: move.industry, level: tile.tileData.level, vp: tile.tileData.vp,
                    beers: tile.tileData.beersToSell || 0, era: state.era, round: state.round, roundsLeft: state.getRoundsRemaining(),
                    atBuild: sellStatus(logic, state, id, key, tile), turns: 0, status: { sellable: 0, merchant: 0, beer: 0 }, outcome: null };
                if (tile.flipped) rec.outcome = 'sold';
                tiles.push(rec);
                live.push(rec);
            }
        }
        settle(state.era);
        for (const dv of dev.filter(x => x.seed === seed)) {
            const later = builtAfter.filter(b => b.id === dv.player && b.type === dv.type && b.t > dv.t);
            dv.used = later.length > 0;
            dv.usedSameEra = later.some(b => true) && later.length > 0;
            dv.flippedLater = later.some(b => { const tl = state.boardIndustries[b.key]; return tl && tl.playerId === dv.player && tl.type === dv.type && tl.flipped; });
        }
    }

    const games = SEEDS * PLAYERS;
    console.log(`## ${level}${DEVELOP ? ` (develop: ${DEVELOP})` : ''}${SELL ? ` (sell: ${SELL})` : ''}: ${PLAYERS} players, ${SEEDS} games\n`);

    // Development
    const n = dev.length;
    const by = (f) => dev.filter(f).length;
    console.log(`**Development:** ${counts.develop} Develop actions (${(counts.develop / games).toFixed(2)} per player per game) removing ${n} tiles; ` +
        `iron spent £${(counts.developIron / games).toFixed(0)} per player per game.`);
    console.log(`- Canal / Rail: ${by(d => d.era === 'canal')} / ${by(d => d.era === 'rail')}; removed tile Level I ${pct(by(d => d.level === 1), n)}, Canal-only ${pct(by(d => d.canalOnly), n)}`);
    console.log(`- The industry was already buildable somewhere: ${pct(by(d => d.buildable), n)}; its top tile was unbuildable in this era (developing was the only way on): ${pct(by(d => d.blockedNext), n)} (later built ${pct(by(d => d.blockedNext && d.used), by(d => d.blockedNext))})`);
    console.log(`- The industry was built later: ${pct(by(d => d.used), n)}; and a later tile of it flipped: ${pct(by(d => d.flippedLater), n)}`);
    const types = {};
    for (const d of dev) { types[d.type] = types[d.type] || [0, 0]; types[d.type][0]++; if (d.used) types[d.type][1]++; }
    console.log(`- By industry (developed → later built): ${Object.entries(types).sort((a, b) => b[1][0] - a[1][0]).map(([k, [a, b]]) => `${k} ${a} → ${b}`).join(', ')}`);
    const timing = [[1, 2], [3, 5], [6, 10], [11, 20]].map(([lo, hi]) => { const xs = dev.filter(d => d.gameRoundsLeft >= lo && d.gameRoundsLeft <= hi); return `${lo}–${hi} rounds left: ${xs.length} (built later ${xs.length ? (100 * xs.filter(d => d.used).length / xs.length).toFixed(0) : 0}%)`; });
    console.log(`- Timing (rounds left in the GAME): ${timing.join('; ')}`);
    const withBuild = dev.filter(d => d.bestBuild !== null);
    console.log(`- A Build was available at ${pct(withBuild.length, n)} of these; Develop outscored the best Build by ${f1(avg(withBuild.map(d => d.devScore - d.bestBuild)))} on average`);

    // Selling
    const m = tiles.length;
    const tb = (f) => tiles.filter(f).length;
    const turns = tiles.reduce((s, x) => s + x.turns, 0);
    const st = (k) => tiles.reduce((s, x) => s + x.status[k], 0);
    console.log(`\n**Selling:** ${m} sellable tiles built (${(m / games).toFixed(2)} per player per game; ${(100 * counts.sellableBuilds / counts.builds).toFixed(0)}% of builds); breweries built ${(counts.breweries / games).toFixed(2)} per player per game.`);
    console.log(`- At build time: sellable ${pct(tb(x => x.atBuild === 'sellable'), m)}, no merchant ${pct(tb(x => x.atBuild === 'merchant'), m)}, not enough beer ${pct(tb(x => x.atBuild === 'beer'), m)}`);
    console.log(`- Outcome: sold ${pct(tb(x => x.outcome === 'sold'), m)}, unsold at era end ${pct(tb(x => x.outcome === 'unsold'), m)}, removed first ${pct(tb(x => x.outcome === 'removed'), m)}`);
    for (const k of ['sellable', 'merchant', 'beer']) {
        console.log(`  - built ${k === 'sellable' ? 'sellable' : k === 'merchant' ? 'without a merchant' : 'short of beer'}: sold ${pct(tb(x => x.atBuild === k && x.outcome === 'sold'), tb(x => x.atBuild === k))}`);
    }
    const unsold = tiles.filter(x => x.outcome === 'unsold');
    const dominant = (x) => (x.turns === 0 ? 'none' : ['sellable', 'merchant', 'beer'].sort((a, b) => x.status[b] - x.status[a])[0]);
    console.log(`- Unsold tiles' main obstacle over their life: no merchant ${pct(unsold.filter(x => dominant(x) === 'merchant').length, unsold.length)}, ` +
        `beer ${pct(unsold.filter(x => dominant(x) === 'beer').length, unsold.length)}, sellable but not sold ${pct(unsold.filter(x => dominant(x) === 'sellable').length, unsold.length)}, ` +
        `built in the era's last turn ${pct(unsold.filter(x => x.turns === 0).length, unsold.length)}; VP left unscored ${unsold.reduce((s, x) => s + x.vp, 0)} (${(unsold.reduce((s, x) => s + x.vp, 0) / games).toFixed(1)} per player per game)`);
    console.log(`- Owner turns while waiting: sellable ${pct(st('sellable'), turns)}, blocked by merchant ${pct(st('merchant'), turns)}, blocked by beer ${pct(st('beer'), turns)}`);
    const tyS = {};
    for (const x of tiles) { tyS[x.type] = tyS[x.type] || [0, 0]; tyS[x.type][0]++; if (x.outcome === 'sold') tyS[x.type][1]++; }
    console.log(`- By industry (built → sold): ${Object.entries(tyS).map(([k, [a, b]]) => `${k} ${a} → ${b}`).join(', ')}`);
    console.log(`- Sell legal at ${pct(opps.legal, opps.turns)} of turns; taken ${pct(opps.taken, opps.legal)}; otherwise: ${Object.entries(opps.instead).sort((a, b) => b[1] - a[1]).map(([a, k]) => `${a} ${k}`).join(', ') || '–'}`);

    console.log('\n**Examples**');
    for (const d of dev.filter(x => !x.used).slice(0, EXAMPLES)) {
        console.log(`- develop never built: seed ${d.seed}, player ${d.player}, ${d.era} round ${d.round}: ${d.type} Lv${d.level}${d.canalOnly ? ' (Canal-only)' : ''}; ` +
            `buildable ${d.buildable}, next blocked ${d.blockedNext}; develop score ${f1(d.devScore)}, best other ${d.alt}`);
    }
    for (const x of unsold.slice(0, EXAMPLES)) {
        console.log(`- unsold: seed ${x.seed}, player ${x.player}, ${x.type} Lv${x.level} (${x.beers} beer) built ${x.era} round ${x.round}; at build: ${x.atBuild}; ` +
            `turns sellable/merchant/beer ${x.status.sellable}/${x.status.merchant}/${x.status.beer}`);
    }
    console.log();
}
