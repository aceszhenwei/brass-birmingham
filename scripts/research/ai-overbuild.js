#!/usr/bin/env node
// Assignment 8: how and why the AI overbuilds its own industries.
//
//   node scripts/research/ai-overbuild.js [--players 3] [--seeds 50] [--levels normal] [--overbuild a6] [--sell a8] [--legacy a9] [--examples 2]
//
// Plays mirror games (every seat the same level; seeds 200000 + 1000 *
// players + i as in ai-baseline.js) with the AI's diagnostics on, and for
// every Build it records whether it replaced one of the player's own tiles,
// and if so: the replaced tile (industry, level, flipped, cubes left), the
// era and rounds left, the build's score and the best build that would NOT
// have replaced anything, and what became of the new tile (flipped and
// scored by the era's end, or itself replaced / sold before then).
//
// Every own overbuild is put in one class:
//   canal-level1  an unflipped Level I tile replaced in the Canal Era (it
//                 would be removed at the end of the era anyway)
//   flipped       a flipped tile (its income is kept, but the VP it would
//                 still have scored is lost)
//   cubes         an unflipped Coal Mine / Iron Works with cubes still on it
//                 (the cubes are discarded)
//   unflipped     any other unflipped tile (a brewery's beer, or a cotton
//                 mill / manufacturer / pottery that was never sold)
// --overbuild selects a research variant (js/aiPlayer.js, options.overbuild).
// --sell a8 runs on the selling valuation of Assignment 8, which it studied.

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
const VARIANT = arg('overbuild', null);
const SELL = arg('sell', null);
const EXAMPLES = Number(arg('examples', 2));
const E = loadEngine();
// --legacy a9: the AI before Assignment 10 (AIPlayer.LEGACY_A9: single links,
// Develop until the end), which the earlier reports measured
const LEGACY_PINS = arg('legacy', null) === 'a9' ? E.AIPlayer.LEGACY_A9 : {};
const A = E.ACTIONS;

const pct = (a, b) => `${a} of ${b} (${b ? (100 * a / b).toFixed(0) : 0}%)`;
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '–');

for (const level of LEVELS) {
    const obs = [];            // own overbuilds
    let builds = 0;
    let opponentOverbuilds = 0;
    let freshFlippedByEraEnd = 0;
    let fresh = 0;
    for (let i = 1; i <= SEEDS; i++) {
        const seed = 200000 + 1000 * PLAYERS + i;
        const names = ['A', 'B', 'C', 'D'].slice(0, PLAYERS);
        const state = new E.GameState(PLAYERS, names, names.map(() => ({ isAI: true, difficulty: level })), { seed });
        const logic = new E.GameLogic(state);
        const aiRng = new E.SeededRandom(aiSeedFor(seed));
        const opts = { explain: true, ...LEGACY_PINS, ...(VARIANT ? { overbuild: VARIANT } : {}), ...(SELL ? { sell: SELL } : {}) };
        const pending = [];    // builds waiting for their era's end: { key, rec | null, era }

        // At each era end, settle what became of the tiles built in it
        for (const method of ['endCanalEra', 'endGame']) {
            const original = state[method].bind(state);
            state[method] = () => {
                for (const p of pending.filter(x => x.era === state.era)) {
                    const t = state.boardIndustries[p.key];
                    const same = t && t === p.tile;
                    const outcome = !same ? 'replaced or sold' : t.flipped ? 'flipped' : 'unflipped';
                    if (p.rec) p.rec.outcome = outcome;
                    else if (outcome === 'flipped') freshFlippedByEraEnd++;
                }
                return original();
            };
        }

        for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
            const id = d.playerId;
            if (d.type === 'shortfall') { logic.play(id, logic.defaultShortfallMove(id)); continue; }
            const decision = E.AIPlayer.chooseAction(state, logic, id, level, aiRng, opts);
            const move = logic.moveFromDecision(decision);
            let rec = null;
            let key = null;
            if (move.type === A.BUILD) {
                builds++;
                key = `${move.location}_${move.slot}`;
                const existing = state.boardIndustries[key];
                if (existing && existing.playerId !== id) opponentOverbuilds++;
                if (existing && existing.playerId === id) {
                    const cand = decision.explain.candidates.find(c => c.action === A.BUILD);
                    const fresh = (cand.builds || []).filter(b => !b.replaces);
                    const freshSame = fresh.filter(b => b.industryType === move.industry);
                    const bestFresh = fresh.reduce((m, b) => Math.max(m, b.score), -Infinity);
                    const chosen = (cand.builds || []).find(b => b.cityId === move.location && b.slotIndex === move.slot && b.industryType === move.industry);
                    const others = decision.explain.candidates.filter(c => c.action !== A.BUILD).sort((a, b) => b.score - a.score);
                    const t = existing.tileData;
                    rec = {
                        seed, player: id, era: state.era, round: state.round, roundsLeft: state.getRoundsRemaining(),
                        type: existing.type, oldLevel: t.level, newLevel: state.getNextTile(id, move.industry).level,
                        flipped: existing.flipped, cubes: existing.resourceCubes || 0, oldVP: t.vp, oldIncome: t.income, oldCost: t.cost,
                        cost: logic.planMove(id, move).plan.cost, score: chosen ? chosen.score : NaN,
                        bestFresh, freshAvailable: fresh.length > 0, freshSameIndustry: freshSame.length > 0,
                        nextAction: others[0] ? `${others[0].action} ${others[0].score.toFixed(2)}` : '–',
                        outcome: state.era === 'rail' ? 'unknown' : 'unknown',
                    };
                    rec.kind = (state.era === 'canal' && !existing.flipped && t.level === 1) ? 'canal-level1'
                        : existing.flipped ? 'flipped'
                            : (existing.type === 'coalMine' || existing.type === 'ironWorks') && rec.cubes > 0 ? 'cubes' : 'unflipped';
                    obs.push(rec);
                } else {
                    fresh++;
                }
            }
            const r = logic.play(id, move);
            if (!r.success) throw new Error(`rejected (seed ${seed}): ${r.message}`);
            if (move.type === A.BUILD && state.boardIndustries[key]) {
                pending.push({ key, tile: state.boardIndustries[key], rec, era: state.era });
            }
        }
    }

    const n = obs.length;
    const by = (f) => obs.filter(f).length;
    const games = SEEDS * PLAYERS;
    console.log(`## ${level}${VARIANT ? ` (overbuild: ${VARIANT})` : ''}: ${PLAYERS} players, ${SEEDS} games: ` +
        `${n} own overbuilds in ${builds} builds (${(100 * n / builds).toFixed(1)}%; ${(n / games).toFixed(2)} per player per game), ` +
        `${opponentOverbuilds} opponent overbuilds\n`);
    const kinds = ['canal-level1', 'flipped', 'cubes', 'unflipped'];
    console.log('| Class | Overbuilds | Canal / Rail | Mean rounds left | Industries | Cubes lost | Old tile VP | Spent | New tile flipped by era end | Fresh build available | Same industry available fresh |');
    console.log('|---|---|---|---|---|---|---|---|---|---|---|');
    for (const k of [...kinds, 'all']) {
        const xs = k === 'all' ? obs : obs.filter(o => o.kind === k);
        if (!xs.length) continue;
        const ind = {};
        for (const o of xs) ind[o.type] = (ind[o.type] || 0) + 1;
        const settled = xs.filter(o => o.outcome !== 'unknown');
        console.log(`| ${k} | ${xs.length} | ${xs.filter(o => o.era === 'canal').length} / ${xs.filter(o => o.era === 'rail').length} | ` +
            `${f1(avg(xs.map(o => o.roundsLeft)))} | ${Object.entries(ind).sort((a, b) => b[1] - a[1]).map(([t, c]) => `${t} ${c}`).join(', ')} | ` +
            `${xs.reduce((s, o) => s + o.cubes, 0)} | ${xs.reduce((s, o) => s + (o.flipped ? o.oldVP : 0), 0)} (flipped) | ` +
            `£${xs.reduce((s, o) => s + o.cost, 0)} | ${pct(settled.filter(o => o.outcome === 'flipped').length, settled.length)} | ` +
            `${pct(xs.filter(o => o.freshAvailable).length, xs.length)} | ${pct(xs.filter(o => o.freshSameIndustry).length, xs.length)} |`);
    }
    console.log(`\nFor comparison, builds on empty spaces flipped by their era's end: ${pct(freshFlippedByEraEnd, fresh)}.`);
    const withFresh = obs.filter(o => o.freshAvailable);
    console.log(`Where a build on an empty space was also possible, the overbuild outscored the best one by ${f1(avg(withFresh.map(o => o.score - o.bestFresh)))} on average ` +
        `(median ${f1(withFresh.map(o => o.score - o.bestFresh).sort((a, b) => a - b)[Math.floor(withFresh.length / 2)])}).`);
    const byRounds = [[1, 2], [3, 4], [5, 10]].map(([lo, hi]) => `${lo}–${hi} rounds left: ${by(o => o.roundsLeft >= lo && o.roundsLeft <= hi)}`);
    console.log(`Timing: ${byRounds.join(', ')}.`);
    console.log('\n**Examples**');
    for (const k of kinds) {
        for (const o of obs.filter(x => x.kind === k).slice(0, EXAMPLES)) {
            console.log(`- ${k}: seed ${o.seed}, player ${o.player}, ${o.era} round ${o.round} (${o.roundsLeft} left): ` +
                `${o.type} Lv${o.oldLevel}${o.flipped ? ' (flipped)' : ''}${o.cubes ? `, ${o.cubes} cubes` : ''} → Lv${o.newLevel} for £${o.cost}; ` +
                `score ${f1(o.score)}, best empty-space build ${f1(o.bestFresh)}, best other action ${o.nextAction}; new tile: ${o.outcome}`);
        }
    }
    console.log();
}
