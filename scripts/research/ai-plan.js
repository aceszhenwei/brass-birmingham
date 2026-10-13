#!/usr/bin/env node
// Assignment 11: measurements for the short-horizon planning study.
//
//   node scripts/research/ai-plan.js search  [--players 3] [--seeds 10]
//   node scripts/research/ai-plan.js missed  [--players 3] [--seeds 20] [--examples 6]
//   node scripts/research/ai-plan.js realise [--players 3] [--seeds 10] [--planner p2-sum]
//   node scripts/research/ai-plan.js evaluate [--players 3] [--seeds 30]
//
// search   In production mirror games (Normal), at every turn decision: the
//          number of legal moves (one per card x target, and with every
//          resource/merchant choice expanded), the player's actions left in
//          the turn, and the cost of clone, getObservation, applyMove and one
//          heuristic decision. By game phase: early (Canal rounds 1-4), middle
//          (rest of Canal, Rail rounds 1-3), late (rest of Rail).
// missed   In production mirror games (Normal), at every turn decision: the
//          planner's choice (depth 2 and 3, both evaluations) against the
//          heuristic's own best action. Where they differ, the action types
//          of the first two planned actions and whether the follow-up falls
//          in the same turn (exact: no opponent can move in between) or the
//          next (assumed). Prints reproducible examples.
// realise  Games where seat 0 is a planner and the others production Normal:
//          how often the planned follow-up is actually played next (same
//          turn, or after the opponents' turns), and the decision time
//          distribution and states evaluated.
// evaluate Production mirror games (Normal): how well each evaluation predicts
//          the final result. At the start of every round, for every player:
//          the static position value V (planner 'state' evaluation) and
//          the VP so far plus the VP the era's scoring would add now; and,
//          over the whole game, the sum of the heuristic scores of the
//          actions each player took (the planner's 'sum' evaluation). Each
//          is compared with final VP: correlation across players, and how
//          often it ranks a pair of players in the same game correctly.
//
// Seeds: 200000 + 1000 * players + i (the exploration seeds).

'use strict';

const { loadEngine } = require('../../test/helpers/engine');
const { aiSeedFor, PLANNER_CONFIGS } = require('./harness');
const { createPlanner } = require('./planner');

const MODE = process.argv[2] || 'search';
function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : fallback;
}
const PLAYERS = Number(arg('players', 3));
const SEEDS = Number(arg('seeds', MODE === 'missed' ? 20 : 10));
const EXAMPLES = Number(arg('examples', 6));
const PLANNER = arg('planner', 'p2-sum');
const E = loadEngine();
const A = E.ACTIONS;

const pct = (a, b) => `${a} of ${b} (${b ? (100 * a / b).toFixed(0) : 0}%)`;
const quantile = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : NaN; };
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '–');
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '–');
const timeIt = (fn) => { const t = process.hrtime.bigint(); const r = fn(); return [r, Number(process.hrtime.bigint() - t) / 1e6]; };

function phaseOf(state) {
    if (state.era === 'canal') return state.round <= 4 ? 'early' : 'middle';
    return state.round <= 3 ? 'middle' : 'late';
}
const moveKey = (m) => JSON.stringify(m);
// Same action and target (ignores the card discarded and resource choices)
function sameAction(a, b) {
    if (!a || !b || a.type !== b.type) return false;
    if (a.type === A.BUILD) return a.location === b.location && a.slot === b.slot && a.industry === b.industry;
    if (a.type === A.NETWORK) return JSON.stringify(a.links) === JSON.stringify(b.links);
    if (a.type === A.DEVELOP) return JSON.stringify(a.industries) === JSON.stringify(b.industries);
    return true;
}

function newGame(seed) {
    const names = ['A', 'B', 'C', 'D'].slice(0, PLAYERS);
    const state = new E.GameState(PLAYERS, names, names.map(() => ({ isAI: true, difficulty: 'normal' })), { seed });
    return { state, logic: new E.GameLogic(state), aiRng: new E.SeededRandom(aiSeedFor(seed)) };
}

// The heuristic's own best action (unperturbed), as a move
function heuristicBest(state, logic, id) {
    const d = E.AIPlayer.chooseAction(state, logic, id, 'normal', new E.SeededRandom(1), { explain: true });
    const top = [...d.explain.candidates].sort((a, b) => b.score - a.score)[0];
    return logic.moveFromDecision({ action: top.action, pendingData: top.pendingData, cardIndex: top.cardIndex });
}

if (MODE === 'search') {
    const rows = { early: [], middle: [], late: [] };
    for (let i = 1; i <= SEEDS; i++) {
        const seed = 200000 + 1000 * PLAYERS + i;
        const { state, logic, aiRng } = newGame(seed);
        for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
            const id = d.playerId;
            if (d.type === 'shortfall') { logic.play(id, logic.defaultShortfallMove(id)); continue; }
            const [legal, msLegal] = timeIt(() => logic.getLegalMoves(id));
            const [expanded, msExpanded] = timeIt(() => logic.getLegalMoves(id, { expandChoices: true }));
            const [obs, msObs] = timeIt(() => state.getObservation(id));
            const [copy, msClone] = timeIt(() => obs.clone());
            const [, msApply] = timeIt(() => new E.GameLogic(copy).applyMove(id, legal[0]));
            const [decision, msChoose] = timeIt(() => E.AIPlayer.chooseAction(state, logic, id, 'normal', aiRng));
            rows[phaseOf(state)].push({ legal: legal.length, expanded: expanded.length, msLegal, msExpanded, msObs, msClone, msApply, msChoose,
                actionsLeft: state.actionsPerTurn - state.actionsThisTurn });
            logic.play(id, logic.moveFromDecision(decision));
        }
    }
    console.log(`## Search space and cost: ${PLAYERS} players, ${SEEDS} production games (Normal)\n`);
    console.log('| Phase | Decisions | Legal moves: median / p95 / max | With choices expanded: median / max | Last action of a turn | getLegalMoves ms (median / max) | Expanded ms (median / max) | getObservation ms | clone ms | applyMove ms | Heuristic decision ms (median / max) |');
    console.log('|---|---|---|---|---|---|---|---|---|---|---|');
    for (const [phase, r] of Object.entries(rows)) {
        const col = (k) => r.map(x => x[k]);
        console.log(`| ${phase} | ${r.length} | ${quantile(col('legal'), 0.5)} / ${quantile(col('legal'), 0.95)} / ${Math.max(...col('legal'))} | ` +
            `${quantile(col('expanded'), 0.5)} / ${Math.max(...col('expanded'))} | ${pct(r.filter(x => x.actionsLeft === 1).length, r.length)} | ` +
            `${f1(quantile(col('msLegal'), 0.5))} / ${f1(Math.max(...col('msLegal')))} | ${f1(quantile(col('msExpanded'), 0.5))} / ${f1(Math.max(...col('msExpanded')))} | ` +
            `${f2(mean(col('msObs')))} | ${f2(mean(col('msClone')))} | ${f2(mean(col('msApply')))} | ${f2(quantile(col('msChoose'), 0.5))} / ${f1(Math.max(...col('msChoose')))} |`);
    }
}

if (MODE === 'missed') {
    const variants = ['p2-sum', 'p3-sum', 'p2-state', 'p3-state'];
    const planners = Object.fromEntries(variants.map(v => [v, createPlanner(E, { ...PLANNER_CONFIGS[v], level: 'normal' })]));
    const res = Object.fromEntries(variants.map(v => [v, { decisions: 0, differ: 0, sameTurn: 0, crossTurn: 0, pairs: {}, gains: [], examples: [] }]));
    for (let i = 1; i <= SEEDS; i++) {
        const seed = 200000 + 1000 * PLAYERS + i;
        const { state, logic, aiRng } = newGame(seed);
        for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
            const id = d.playerId;
            if (d.type === 'shortfall') { logic.play(id, logic.defaultShortfallMove(id)); continue; }
            const obs = state.getObservation(id);
            const best = heuristicBest(obs, new E.GameLogic(obs), id);
            const actionsLeft = state.actionsPerTurn - state.actionsThisTurn;
            for (const v of variants) {
                const r = planners[v].choose(state, id);
                const x = res[v];
                x.decisions++;
                if (!r || sameAction(r.move, best)) continue;
                x.differ++;
                const pair = `${r.plan[0].type} → ${r.plan[1] ? r.plan[1].type : '–'}`;
                x.pairs[pair] = (x.pairs[pair] || 0) + 1;
                if (actionsLeft >= 2) x.sameTurn++; else x.crossTurn++;
                if (x.examples.length < EXAMPLES) {
                    const desc = (m) => (m.type === A.BUILD ? `build ${m.industry} at ${m.location}` : m.type === A.NETWORK ? `network ${m.links.join(' + ')}`
                        : m.type === A.DEVELOP ? `develop ${m.industries.join(' + ')}` : m.type);
                    x.examples.push(`seed ${seed}, player ${id}, ${state.era} round ${state.round} (${actionsLeft >= 2 ? 'first action of the turn' : 'last action of the turn'}): heuristic ${desc(best)}; planner ${r.plan.map(desc).join(', then ')}`);
                }
            }
            logic.play(id, logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, id, 'normal', aiRng)));
        }
    }
    console.log(`## Where the planner disagrees with the heuristic: ${PLAYERS} players, ${SEEDS} production games (Normal)\n`);
    console.log('| Planner | Decisions | Different first action | With another action left this turn (follow-up exact) | At the last action of a turn (follow-up next turn) | Most common planned pairs |');
    console.log('|---|---|---|---|---|---|');
    for (const v of variants) {
        const x = res[v];
        const top = Object.entries(x.pairs).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${k} ${n}`).join('; ');
        console.log(`| ${v} | ${x.decisions} | ${pct(x.differ, x.decisions)} | ${x.sameTurn} | ${x.crossTurn} | ${top} |`);
    }
    for (const v of variants) {
        console.log(`\n**Examples (${v})**`);
        for (const e of res[v].examples) console.log(`- ${e}`);
    }
}

if (MODE === 'realise') {
    const planner = createPlanner(E, { ...PLANNER_CONFIGS[PLANNER], level: 'normal' });
    const c = { plans: 0, sameTurnPlanned: 0, sameTurnPlayed: 0, nextTurnPlanned: 0, nextTurnPlayed: 0, nextTurnLegal: 0 };
    const times = [];
    const states = [];
    const byPhase = { early: [], middle: [], late: [] };
    for (let i = 1; i <= SEEDS; i++) {
        const seed = 200000 + 1000 * PLAYERS + i;
        const { state, logic, aiRng } = newGame(seed);
        let pending = null;   // { move, sameTurn } planned follow-up for seat 0
        for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
            const id = d.playerId;
            if (d.type === 'shortfall') { logic.play(id, logic.defaultShortfallMove(id)); continue; }
            let move;
            if (id === 0) {
                if (pending) {
                    if (!pending.sameTurn && logic.resolveMove(0, pending.move).ok) c.nextTurnLegal++;
                }
                const before = planner.stats.states;
                const r = planner.choose(state, 0);
                times.push(r.ms);
                states.push(planner.stats.states - before);
                byPhase[phaseOf(state)].push(r.ms);
                move = r.move;
                if (pending && sameAction(move, pending.move)) c[pending.sameTurn ? 'sameTurnPlayed' : 'nextTurnPlayed']++;
                c.plans++;
                const sameTurn = state.actionsPerTurn - state.actionsThisTurn >= 2;
                pending = r.plan[1] ? { move: r.plan[1], sameTurn } : null;
                if (pending) c[sameTurn ? 'sameTurnPlanned' : 'nextTurnPlanned']++;
            } else {
                move = logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, id, 'normal', aiRng));
            }
            const res = logic.play(id, move);
            if (!res.success) throw new Error(`rejected (seed ${seed}): ${res.message}`);
        }
    }
    console.log(`## Plan realisation and cost: ${PLANNER}, ${PLAYERS} players, ${SEEDS} games (seat 0 the planner, others production Normal)\n`);
    console.log(`- Planned follow-up in the same turn: played next ${pct(c.sameTurnPlayed, c.sameTurnPlanned)}`);
    console.log(`- Planned follow-up in the next turn (after the opponents): still legal ${pct(c.nextTurnLegal, c.nextTurnPlanned)}, played ${pct(c.nextTurnPlayed, c.nextTurnPlanned)}`);
    console.log(`- Decision time: mean ${f1(mean(times))} ms, median ${f1(quantile(times, 0.5))}, p95 ${f1(quantile(times, 0.95))}, max ${f1(Math.max(...times))}; per game ${f1(times.reduce((a, b) => a + b, 0) / SEEDS / 1000)} s for the planner's seat`);
    console.log(`- States evaluated per decision: mean ${f1(mean(states))}, max ${Math.max(...states)}`);
    console.log(`- By phase (mean / max ms): ${Object.entries(byPhase).map(([k, v]) => `${k} ${f1(mean(v))} / ${f1(Math.max(...v))}`).join('; ')}`);
}

if (MODE === 'evaluate') {
    const planner = createPlanner(E, { level: 'normal' });
    const samples = { early: [], middle: [], late: [] };   // per game: [{ id, V, scored, sum }]
    const finals = [];
    for (let i = 1; i <= SEEDS; i++) {
        const seed = 200000 + 1000 * PLAYERS + i;
        const { state, logic, aiRng } = newGame(seed);
        const sums = new Array(PLAYERS).fill(0);
        const snaps = { early: null, middle: null, late: null };
        let lastRound = null;
        for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
            const id = d.playerId;
            if (d.type === 'shortfall') { logic.play(id, logic.defaultShortfallMove(id)); continue; }
            const roundKey = `${state.era}-${state.round}`;
            const phase = phaseOf(state);
            if (roundKey !== lastRound) {
                lastRound = roundKey;
                // The last snapshot of each phase is kept (end of the phase)
                snaps[phase] = state.players.map(p => {
                    const scored = state.clone().calculateEraScore().find(x => x.playerId === p.id);
                    return { V: planner.positionValue(state, logic, p.id), scored: p.vp + scored.linkVP + scored.industryVP, sum: sums[p.id] };
                });
            }
            const decision = E.AIPlayer.chooseAction(state, logic, id, 'normal', aiRng, { explain: true });
            const chosen = decision.explain.candidates.find(c => c.action === decision.action);
            sums[id] += chosen ? chosen.score : 0;
            logic.play(id, logic.moveFromDecision(decision));
        }
        const final = state.players.map(p => p.vp);
        finals.push({ final, sums: [...sums] });
        for (const ph of Object.keys(snaps)) if (snaps[ph]) samples[ph].push({ final, snap: snaps[ph] });
    }
    const corr = (xs, ys) => {
        const mx = mean(xs), my = mean(ys);
        let sxy = 0, sxx = 0, syy = 0;
        xs.forEach((x, k) => { sxy += (x - mx) * (ys[k] - my); sxx += (x - mx) ** 2; syy += (ys[k] - my) ** 2; });
        return sxy / Math.sqrt(sxx * syy);
    };
    const pairAccuracy = (games, get) => {
        let right = 0, n = 0;
        for (const g of games) for (let a = 0; a < PLAYERS; a++) for (let b = a + 1; b < PLAYERS; b++) {
            if (g.final[a] === g.final[b]) continue;
            n++;
            if ((get(g, a) - get(g, b)) * (g.final[a] - g.final[b]) > 0) right++;
        }
        return `${(100 * right / n).toFixed(0)}%`;
    };
    console.log(`## How well the evaluations predict the final result: ${PLAYERS} players, ${SEEDS} production games (Normal)\n`);
    console.log('| Snapshot | Measure | Correlation with final VP | Pairs of players ranked correctly |');
    console.log('|---|---|---|---|');
    for (const [ph, games] of Object.entries(samples)) {
        const f = games.flatMap(g => g.final);
        for (const [name, key] of [['position value V (state)', 'V'], ['VP + VP scorable now', 'scored'], ['sum of action scores so far (sum)', 'sum']]) {
            const x = games.flatMap(g => g.snap.map(s => s[key]));
            console.log(`| ${ph} (start of its last round) | ${name} | ${f2(corr(x, f))} | ${pairAccuracy(games, (g, p) => g.snap[p][key])} |`);
        }
    }
    const f = finals.flatMap(g => g.final);
    const x = finals.flatMap(g => g.sums);
    console.log(`| whole game | sum of action scores (sum) | ${f2(corr(x, f))} | ${pairAccuracy(finals, (g, p) => g.sums[p])} |`);
}
