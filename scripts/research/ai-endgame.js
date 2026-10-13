#!/usr/bin/env node
// Assignment 14, stage 1: targeted regression scenarios for the endgame
// candidates (docs/research/ai-endgame-evaluation-a14.md).
//
//   node scripts/research/ai-endgame.js [--players 2,3,4] [--examples 6]
//   node scripts/research/ai-endgame.js --timing [--players 2,3,4]
//
// --timing: decision times of the production planner and candidate C with
// the production wall-clock cut-off (2.5 s), one self-play game per player
// count each (seed 140900 + players), run one at a time on an idle machine.
//
// Replays the Assignment 13 self-play games (production four-action planner at
// every seat, no wall-clock cut-off; seeds 900000 + 1000 * players + i, 10/8/6
// games at 2/3/4 players). At the start of every player's turn in the
// penultimate Rail round, the rest of the game is played out on a copy of the
// real game with that player's seat taken by each policy in turn (the
// production baseline and candidates A, B and C) and every other seat by the
// baseline. For that player it records:
//   final VP (paired: the same position, only that seat's policy differs)
//   loans taken in the last two rounds, money left at the end, and "missed":
//   a loan, develop, scout or pass taken in the last round while a link
//   scoring 1+ VP was legal (and so affordable)
//   decision time (ms) of every decision of that seat
// The real game then continues with the baseline's move, exactly as in
// Assignment 13. Research only: replaying a game changes nothing.

'use strict';

const { loadEngine } = require('../../test/helpers/engine');
const { aiSeedFor, PLANNER_CONFIGS } = require('./harness');

function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : fallback;
}
const PLAYERS = String(arg('players', '2,3,4')).split(',').map(Number);
const GAMES = { 2: 10, 3: 8, 4: 6 };
const EXAMPLES = Number(arg('examples', 6));
const E = loadEngine();
const A = E.ACTIONS;
const planner = (name) => ({ ...E.AIPlanner.A12, maxMs: Infinity, ...(name ? PLANNER_CONFIGS[name] : {}) });
const POLICIES = { base: planner(null), A: planner('p4-a'), B: planner('p4-b'), C: planner('p4-c') };
const NON_SCORING = new Set([A.LOAN, A.DEVELOP, A.SCOUT, A.PASS]);

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const se = (xs) => { const m = mean(xs); return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / Math.max(1, xs.length - 1) / xs.length); };
const quantile = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : NaN; };

const scoringLinkAvailable = (state, logic, id) => logic.getValidNetworkTargets(id).some(t => state.linkValue(t.connectionId) >= 1);
const describe = (m) => (m.type === A.NETWORK ? `network ${m.links.join('+')}` : m.type === A.BUILD ? `build ${m.industry}@${m.location}` : m.type);

// Play the rest of the game on a copy, seat `id` with `cfg`, others the baseline
function playOut(real, id, cfg, seed) {
    const state = real.clone();
    const logic = new E.GameLogic(state);
    const rng = new E.SeededRandom(aiSeedFor(seed) + id);
    const out = { moves: [], loans: 0, missed: 0, ms: [] };
    for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
        const pid = d.playerId;
        if (d.type === 'shortfall') { logic.play(pid, logic.defaultShortfallMove(pid)); continue; }
        if (pid !== id) {
            logic.play(pid, logic.moveFromDecision(E.AIPlanner.chooseAction(state, logic, pid, 'normal', rng, { planner: POLICIES.base })));
            continue;
        }
        const lastRound = state.getRoundsRemaining() <= 1;
        const available = lastRound && scoringLinkAvailable(state, logic, id);
        const t0 = process.hrtime.bigint();
        const dec = E.AIPlanner.chooseAction(state, logic, id, 'normal', rng, { planner: cfg });
        out.ms.push(Number(process.hrtime.bigint() - t0) / 1e6);
        const move = logic.moveFromDecision(dec);
        if (move.type === A.LOAN) out.loans++;
        if (available && NON_SCORING.has(move.type)) out.missed++;
        out.moves.push(`${lastRound ? 'last' : 'penult'}: ${describe(move)}`);
        const r = logic.play(id, move);
        if (!r.success) throw new Error(`illegal move in replay: ${r.message}`);
    }
    out.vp = state.players[id].vp;
    out.money = state.players[id].money;
    return out;
}

if (process.argv.includes('--timing')) {
    console.log('| Players | Policy | Decisions | Mean ms | p95 ms | Max ms | Cut off | Longest two-action turn (ms) | Final VP (mean) |');
    console.log('|---|---|---|---|---|---|---|---|---|');
    for (const players of PLAYERS) {
        for (const name of ['base', 'C']) {
            const cfg = { ...POLICIES[name], maxMs: E.AIPlanner.A12.maxMs };
            const seed = 140900 + players;
            const names = ['A', 'B', 'C', 'D'].slice(0, players);
            const state = new E.GameState(players, names, names.map(() => ({ isAI: true, difficulty: 'normal' })), { seed });
            const logic = new E.GameLogic(state);
            const rng = new E.SeededRandom(aiSeedFor(seed));
            const ms = [];
            let cut = 0, turn = 0, longest = 0, current = null;
            for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
                if (d.type === 'shortfall') { logic.play(d.playerId, logic.defaultShortfallMove(d.playerId)); continue; }
                const key = `${state.era}:${state.round}:${d.playerId}`;
                if (key !== current) { current = key; turn = 0; }
                const dec = E.AIPlanner.chooseAction(state, logic, d.playerId, 'normal', rng, { planner: cfg });
                ms.push(dec.planStats.ms);
                if (dec.planStats.timedOut) cut++;
                turn += dec.planStats.ms;
                longest = Math.max(longest, turn);
                logic.play(d.playerId, logic.moveFromDecision(dec));
            }
            console.log(`| ${players} | ${name} | ${ms.length} | ${mean(ms).toFixed(0)} | ${quantile(ms, 0.95).toFixed(0)} | ${Math.max(...ms).toFixed(0)} | ${cut} | ${longest.toFixed(0)} | ${mean(state.players.map(p => p.vp)).toFixed(1)} |`);
        }
    }
    process.exit(0);
}

const all = [];
for (const players of PLAYERS) {
    const turns = [];
    for (let i = 1; i <= GAMES[players]; i++) {
        const seed = 900000 + 1000 * players + i;
        const names = ['A', 'B', 'C', 'D'].slice(0, players);
        const state = new E.GameState(players, names, names.map(() => ({ isAI: true, difficulty: 'normal' })), { seed });
        const logic = new E.GameLogic(state);
        const rng = new E.SeededRandom(aiSeedFor(seed));
        for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
            const id = d.playerId;
            if (d.type === 'shortfall') { logic.play(id, logic.defaultShortfallMove(id)); continue; }
            if (state.era === E.ERA.RAIL && state.getRoundsRemaining() === 2 && state.actionsThisTurn === 0) {
                const row = { players, seed, player: id, money0: state.players[id].money };
                for (const [name, cfg] of Object.entries(POLICIES)) row[name] = playOut(state, id, cfg, seed);
                turns.push(row);
            }
            const dec = E.AIPlanner.chooseAction(state, logic, id, 'normal', rng, { planner: POLICIES.base });
            logic.play(id, logic.moveFromDecision(dec));
        }
    }
    all.push(...turns);
    console.log(`\n## ${players} players: ${GAMES[players]} games, ${turns.length} player endings\n`);
    console.log('| Policy | Final VP | Difference vs base (± 1.96 SE) | Better / worse | Loans (last 2 rounds) | Missed scoring links (last round) | Money left | Mean / p95 / max ms |');
    console.log('|---|---|---|---|---|---|---|---|');
    for (const name of Object.keys(POLICIES)) {
        const d = turns.map(t => t[name].vp - t.base.vp);
        const ms = turns.flatMap(t => t[name].ms);
        console.log(`| ${name} | ${mean(turns.map(t => t[name].vp)).toFixed(2)} | ${name === 'base' ? '–' : `${mean(d) >= 0 ? '+' : ''}${mean(d).toFixed(2)} ± ${(1.96 * se(d)).toFixed(2)}`} | ` +
            `${d.filter(x => x > 0).length} / ${d.filter(x => x < 0).length} | ${turns.reduce((a, t) => a + t[name].loans, 0)} | ${turns.reduce((a, t) => a + t[name].missed, 0)} | ` +
            `£${mean(turns.map(t => t[name].money)).toFixed(1)} | ${mean(ms).toFixed(0)} / ${quantile(ms, 0.95).toFixed(0)} / ${Math.max(...ms).toFixed(0)} |`);
    }
}

console.log('\n## Endings where a candidate and the baseline differ (largest VP differences first)\n');
const diffs = all.filter(t => ['A', 'B', 'C'].some(n => t[n].moves.join() !== t.base.moves.join()))
    .sort((x, y) => Math.max(...['A', 'B', 'C'].map(n => Math.abs(y[n].vp - y.base.vp))) - Math.max(...['A', 'B', 'C'].map(n => Math.abs(x[n].vp - x.base.vp))));
console.log(`${diffs.length} of ${all.length} player endings differ under at least one candidate.\n`);
for (const t of diffs.slice(0, EXAMPLES)) {
    console.log(`- seed ${t.seed}, player ${t.player} (£${t.money0} at the start of the penultimate round):`);
    for (const n of Object.keys(POLICIES)) console.log(`  - ${n}: ${t[n].moves.join(', ')}: ${t[n].vp} final VP, £${t[n].money} left`);
}
