#!/usr/bin/env node
// Assignment 15: prediction quality and cost of the opponent models
// (docs/research/ai-opponent-modelling-a15.md, scripts/research/opponents.js).
//
//   node scripts/research/ai-opponents.js [--players 2,3,4] [--games 4] [--every 4] [--q build,network]
//       [--first 1] [--models M1,M2,M3,M3b] [--policy M0|M1|M2|M3|M3b]
//
// --policy: the planner that plays every seat and whose plans are recorded
// (default M0, the production planner). Also recorded: whether the step was
// realised (the player's first move of the next turn has the same target).
//
// Production self-play (the Assignment 14 planner at every seat, no wall-clock
// cut-off; seeds 160000 + 1000 * players + i). At every turn decision whose
// plan has a Build or Network step after the current turn, the first such step
// is recorded with each model's prediction that an opponent takes its target
// before the player's next turn:
//   M1  1 - prod(1 - q * e) over the opponent turns first (e: exposure, see
//       opponents.js; q per step type)
//   M2  the target is taken in the one simulated opponent world
//   M3  the share of the three sampled worlds in which it is taken
// The opponent worlds are replayed on the position after the plan's
// current-turn steps. At the player's next decision the outcome is read from
// the real game: was the target taken by an opponent, and was the step still
// legal (cards not checked)? Games with odd i fit M1's q per step type (maximum
// likelihood); prediction quality is reported on games with even i.
// With --every N, every Nth turn decision also times a full plan by each
// model on the same observation, and records whether its chosen move differs
// from the production planner's.
// Research only: the models never change the game.

'use strict';

const { loadEngine } = require('../../test/helpers/engine');
const { createOpponentModel, DEFAULT_Q } = require('./opponents');

function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : fallback;
}
const PLAYERS = String(arg('players', '2,3,4')).split(',').map(Number);
const GAMES = Number(arg('games', 4));
const EVERY = Number(arg('every', 4));
const FIRST = Number(arg('first', 1));
const TIMED = String(arg('models', 'M1,M2,M3')).split(',');
const POLICY = arg('policy', 'M0');
const qArg = arg('q', null);
const Q = qArg ? { build: Number(qArg.split(',')[0]), network: Number(qArg.split(',')[1]) } : DEFAULT_Q;
const E = loadEngine();
const A = E.ACTIONS;
const PROD = { ...E.AIPlanner.PRODUCTION, maxMs: Infinity };
const MODELS = {
    M1: createOpponentModel(E, { kind: 'contest', q: Q }),
    M2: createOpponentModel(E, { kind: 'simulate' }),
    M3: createOpponentModel(E, { kind: 'robust' }),
    M3b: createOpponentModel(E, { kind: 'robust', scenarios: 2 }),
};
const research = MODELS.M3.research;

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const quantile = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : NaN; };
const pct = (a, b) => `${a} of ${b} (${b ? (100 * a / b).toFixed(0) : 0}%)`;

// Is the step's target occupied by an opponent in `state`?
function takenBy(state, step, id) {
    if (step.type === A.NETWORK) return step.links.some(l => state.boardLinks[l] && state.boardLinks[l].playerId !== id);
    const tile = E.isBreweryFarm(step.location) ? state.breweryFarmTiles[step.location] : state.boardIndustries[`${step.location}_${step.slot}`];
    return !!(tile && tile.playerId !== id);
}
const legal = (state, step, id) => { const { card, ...rest } = step; return new E.GameLogic(state).resolveMove(id, rest, { requireCard: false }).ok; };

const records = [];
const timing = {};
const changed = {};
const slot = (o, players, name, init) => { o[players] = o[players] || {}; if (!(name in o[players])) o[players][name] = init(); return o[players]; };
for (const players of PLAYERS) {
    for (let i = FIRST; i < FIRST + GAMES; i++) {
        const seed = 160000 + 1000 * players + i;
        const names = ['A', 'B', 'C', 'D'].slice(0, players);
        const state = new E.GameState(players, names, names.map(() => ({ isAI: true, difficulty: 'normal' })), { seed });
        const logic = new E.GameLogic(state);
        const pending = new Map();
        let decisions = 0;
        for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
            const id = d.playerId;
            if (d.type === 'shortfall') { logic.play(id, logic.defaultShortfallMove(id)); continue; }
            const turnKey = `${state.era}:${state.round}`;
            const obs = state.getObservation(id);
            const obsLogic = new E.GameLogic(obs);
            const t0 = process.hrtime.bigint();
            const r = E.AIPlanner.plan(state, id, POLICY === 'M0' ? PROD : { ...PROD, opponentModel: MODELS[POLICY] });
            const ms0 = Number(process.hrtime.bigint() - t0) / 1e6;
            // Outcome of this player's pending prediction, at its first decision of a later turn
            const p = pending.get(id);
            if (p && p.turnKey !== turnKey) {
                pending.delete(id);
                if (state.era === p.era) {
                    records.push({ ...p, taken: takenBy(state, p.step, id), legal: legal(state, p.step, id),
                        realised: research.targetKey(r.move) === research.targetKey(p.step) });
                }
            }
            const left = state.actionsPerTurn - state.actionsThisTurn;
            const step = r.plan.slice(left).find(m => m.type === A.BUILD || m.type === A.NETWORK);
            if (step && !pending.has(id)) {
                // The position after the plan's current-turn steps
                const after = obs.clone();
                const afterLogic = new E.GameLogic(after);
                for (const m of r.plan.slice(0, left)) afterLogic.applyMove(id, m);
                const ex = research.exposures(obs, obsLogic, id, step);
                const ctx2 = MODELS.M2.prepare(obs, obsLogic, id);
                const m2 = ctx2.worlds.map(w => research.applyWorld(after, w).state);
                const ctx3 = MODELS.M3.prepare(obs, obsLogic, id);
                const m3 = ctx3.worlds.map(w => research.applyWorld(after, w).state);
                pending.set(id, {
                    players, game: i, era: state.era, turnKey, type: step.type, step, ex, k: ex.filter(e => e > 0).length, exposure: ex.reduce((a, b) => a + b, 0), opponentsBefore: ctx2.turns.length,
                    alreadyTaken: takenBy(after, step, id),
                    m2: m2.some(s => takenBy(s, step, id)) ? 1 : 0,
                    m3: mean(m3.map(s => (takenBy(s, step, id) ? 1 : 0))),
                });
            }
            if (EVERY > 0 && state.actionsThisTurn === 0 && decisions++ % EVERY === 0) {
                slot(timing, players, 'M0', () => []).M0.push(ms0);
                slot(changed, players, 'n', () => 0).n++;
                for (const name of TIMED) {
                    const t = process.hrtime.bigint();
                    const rm = E.AIPlanner.plan(state, id, { ...PROD, opponentModel: MODELS[name] });
                    slot(timing, players, name, () => [])[name].push(Number(process.hrtime.bigint() - t) / 1e6);
                    if (JSON.stringify(rm.move) !== JSON.stringify(r.move)) slot(changed, players, name, () => 0)[name]++;
                    else slot(changed, players, name, () => 0);
                }
            }
            // The production move (identical to AIPlanner.chooseAction's: the plan is deterministic)
            logic.play(id, r.move);
        }
        console.error(`${players}p game ${i} done (${records.length} outcomes)`);
    }
}

// ---------------------------------------------------------------------------
// Fit M1's q on odd games, evaluate every model on even games
// ---------------------------------------------------------------------------

const valid = records.filter(r => !r.alreadyTaken);
const fit = valid.filter(r => r.game % 2 === 1);
const test = valid.filter(r => r.game % 2 === 0);
const m1 = (q, r) => 1 - r.ex.reduce((w, e) => w * (1 - q * e), 1);
function fitQ(rows) {
    let best = { q: 0, ll: -Infinity };
    for (let q = 0.005; q < 0.8; q += 0.005) {
        let ll = 0;
        for (const r of rows) {
            const p = Math.min(1 - 1e-9, Math.max(1e-9, m1(q, r)));
            ll += r.taken ? Math.log(p) : Math.log(1 - p);
        }
        if (ll > best.ll) best = { q, ll };
    }
    return Number(best.q.toFixed(3));
}
const qFit = { build: fitQ(fit.filter(r => r.type === A.BUILD)), network: fitQ(fit.filter(r => r.type === A.NETWORK)) };
const baseRate = mean(fit.map(r => (r.taken ? 1 : 0)));
const predictors = {
    'Base rate (fit games)': () => baseRate,
    'M1 (q fitted)': (r) => m1(qFit[r.type === A.BUILD ? 'build' : 'network'], r),
    'M2 (one world)': (r) => r.m2,
    'M3 (three worlds)': (r) => r.m3,
};
// AUC: chance that a taken target is scored above one that was not (ties 1/2)
function auc(rows, f) {
    const pos = rows.filter(r => r.taken).map(f);
    const neg = rows.filter(r => !r.taken).map(f);
    let s = 0;
    for (const a of pos) for (const b of neg) s += a > b ? 1 : a === b ? 0.5 : 0;
    return pos.length && neg.length ? s / (pos.length * neg.length) : NaN;
}

console.log(`## Opponent-model prediction quality\n`);
console.log(`Policy: ${POLICY}. Games: ${GAMES} per player count (${PLAYERS.join(', ')} players), seeds 160000 + 1000 * players + i. Recorded next-turn Build/Network steps: ${records.length}; ` +
    `excluded because the plan's own current-turn steps already block them: ${records.length - valid.length}.`);
console.log(`\nM1 q fitted on odd games: build ${qFit.build}, network ${qFit.network} (the run used build ${Q.build}, network ${Q.network} for timing).\n`);
console.log('### Outcomes (all games)\n');
console.log('| Players / type | Steps | Taken by an opponent | Illegal at the next decision (any reason) | Realised next turn | Opponent turns before the next one (mean) | Turns with exposure > 0 (mean) | Summed exposure (mean) |');
console.log('|---|---|---|---|---|---|---|---|');
for (const n of PLAYERS) {
    const rows = valid.filter(r => r.players === n);
    console.log(`| ${n} | ${rows.length} | ${pct(rows.filter(r => r.taken).length, rows.length)} | ${pct(rows.filter(r => !r.legal).length, rows.length)} | ${pct(rows.filter(r => r.realised).length, rows.length)} | ${mean(rows.map(r => r.opponentsBefore)).toFixed(2)} | ${mean(rows.map(r => r.k)).toFixed(2)} | ${mean(rows.map(r => r.exposure)).toFixed(2)} |`);
}
for (const type of [A.BUILD, A.NETWORK]) {
    const rows = valid.filter(r => r.type === type);
    console.log(`| ${type} | ${rows.length} | ${pct(rows.filter(r => r.taken).length, rows.length)} | ${pct(rows.filter(r => !r.legal).length, rows.length)} | ${pct(rows.filter(r => r.realised).length, rows.length)} | ${mean(rows.map(r => r.opponentsBefore)).toFixed(2)} | ${mean(rows.map(r => r.k)).toFixed(2)} | ${mean(rows.map(r => r.exposure)).toFixed(2)} |`);
}
console.log(`\n### Prediction of "taken by an opponent" (test games: ${test.length} steps, ${test.filter(r => r.taken).length} taken)\n`);
console.log('| Predictor | Brier score | AUC | Mean prediction | Taken when predicted >= 0.5 | Taken when predicted < 0.5 |');
console.log('|---|---|---|---|---|---|');
for (const [name, f] of Object.entries(predictors)) {
    const brier = mean(test.map(r => (f(r) - (r.taken ? 1 : 0)) ** 2));
    const hi = test.filter(r => f(r) >= 0.5), lo = test.filter(r => f(r) < 0.5);
    console.log(`| ${name} | ${brier.toFixed(4)} | ${auc(test, f).toFixed(3)} | ${mean(test.map(f)).toFixed(3)} | ${pct(hi.filter(r => r.taken).length, hi.length)} | ${pct(lo.filter(r => r.taken).length, lo.length)} |`);
}
console.log('\n### Calibration of M1 (test games, by predicted probability)\n');
console.log('| M1 predicted | Steps | Taken | M1 predicted (mean) |');
console.log('|---|---|---|---|');
const m1Of = predictors['M1 (q fitted)'];
for (const [lo, hi] of [[0, 1e-9], [1e-9, 0.1], [0.1, 0.2], [0.2, 0.4], [0.4, 1.01]]) {
    const k = `${lo.toFixed(2)}–${Math.min(hi, 1).toFixed(2)}`;
    const rows = test.filter(r => m1Of(r) >= lo && m1Of(r) < hi);
    console.log(`| ${k} | ${rows.length} | ${pct(rows.filter(r => r.taken).length, rows.length)} | ${mean(rows.map(predictors['M1 (q fitted)'])).toFixed(3)} |`);
}
if (Object.keys(changed).length) {
    console.log(`\n### Cost and decision changes (turn-start positions, one process)\n`);
    console.log('| Players | Planner | Positions | Mean ms | p95 ms | Max ms | First move differs from M0 |');
    console.log('|---|---|---|---|---|---|---|');
    for (const n of Object.keys(timing)) {
        for (const name of ['M0', ...TIMED]) {
            const t = timing[n][name];
            console.log(`| ${n} | ${name} | ${t.length} | ${mean(t).toFixed(0)} | ${quantile(t, 0.95).toFixed(0)} | ${Math.max(...t).toFixed(0)} | ${name === 'M0' ? '–' : pct(changed[n][name], changed[n].n)} |`);
        }
    }
}
