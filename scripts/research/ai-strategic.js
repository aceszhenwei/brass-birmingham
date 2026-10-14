#!/usr/bin/env node
// Assignment 16, stage 1: position-level diagnostics of the long-term
// valuation candidates (docs/research/ai-strategic-valuation-a16.md).
//
//   node scripts/research/ai-strategic.js [--players 2,3,4] [--games 2] [--every 3] [--examples 8]
//
// Production self-play (the Assignment 14 planner at every seat, no wall-clock
// cut-off; seeds 190000 + 1000 * players + i). At every Nth turn-start
// position, each candidate (A futureLinks, B eraValue, C developValue) plans
// on the same observation. Recorded per candidate: decision time, whether its
// first move differs from production's, and the action types chosen (by era).
// Research only: the candidates never change the game.

'use strict';

const { loadEngine } = require('../../test/helpers/engine');

function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : fallback;
}
const PLAYERS = String(arg('players', '2,3,4')).split(',').map(Number);
const GAMES = Number(arg('games', 2));
const EVERY = Number(arg('every', 3));
const EXAMPLES = Number(arg('examples', 8));
const E = loadEngine();
const PROD = { ...E.AIPlanner.PRODUCTION, maxMs: Infinity };
const CANDIDATES = { A: { futureLinks: true }, B: { eraValue: true }, C: { developValue: true } };

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const quantile = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : NaN; };
const pct = (a, b) => `${a} of ${b} (${b ? (100 * a / b).toFixed(0) : 0}%)`;
const describe = (m) => (m.type === E.ACTIONS.NETWORK ? `network ${m.links.join('+')}` : m.type === E.ACTIONS.BUILD
    ? `build ${m.industry}@${m.location}` : m.type === E.ACTIONS.DEVELOP ? `develop ${(m.industries || []).join('+')}` : m.type);

const rows = [];
for (const players of PLAYERS) {
    for (let i = 1; i <= GAMES; i++) {
        const seed = 190000 + 1000 * players + i;
        const names = ['A', 'B', 'C', 'D'].slice(0, players);
        const state = new E.GameState(players, names, names.map(() => ({ isAI: true, difficulty: 'normal' })), { seed });
        const logic = new E.GameLogic(state);
        let k = 0;
        for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
            const id = d.playerId;
            if (d.type === 'shortfall') { logic.play(id, logic.defaultShortfallMove(id)); continue; }
            const t0 = process.hrtime.bigint();
            const r = E.AIPlanner.plan(state, id, PROD);
            const ms0 = Number(process.hrtime.bigint() - t0) / 1e6;
            if (state.actionsThisTurn === 0 && k++ % EVERY === 0) {
                const level = (m) => (m.type === E.ACTIONS.BUILD ? (state.getNextTile(id, m.industry) || {}).level : undefined);
                const row = { players, seed, player: id, era: state.era, round: state.round, base: { move: r.move, ms: ms0, level: level(r.move) } };
                for (const [name, opts] of Object.entries(CANDIDATES)) {
                    const t = process.hrtime.bigint();
                    const c = E.AIPlanner.plan(state, id, { ...PROD, ...opts });
                    row[name] = { move: c.move, ms: Number(process.hrtime.bigint() - t) / 1e6, level: level(c.move) };
                }
                rows.push(row);
            }
            logic.play(id, r.move);
        }
        console.error(`${players}p game ${i} done (${rows.length} positions)`);
    }
}

console.log(`## Long-term valuation candidates: position-level diagnostics\n`);
console.log(`Production self-play, ${GAMES} games per player count, every ${EVERY}rd turn-start position: ${rows.length} positions.\n`);
console.log('| Players | Planner | Positions | Mean ms | p95 ms | Max ms | First move differs from production |');
console.log('|---|---|---|---|---|---|---|');
for (const n of PLAYERS) {
    const rs = rows.filter(r => r.players === n);
    for (const name of ['base', ...Object.keys(CANDIDATES)]) {
        const t = rs.map(r => r[name].ms);
        const diff = name === 'base' ? '–' : pct(rs.filter(r => JSON.stringify(r[name].move) !== JSON.stringify(r.base.move)).length, rs.length);
        console.log(`| ${n} | ${name} | ${rs.length} | ${mean(t).toFixed(0)} | ${quantile(t, 0.95).toFixed(0)} | ${Math.max(...t).toFixed(0)} | ${diff} |`);
    }
}
console.log('\n### First-move action types (all positions)\n');
const types = [...new Set(rows.flatMap(r => ['base', ...Object.keys(CANDIDATES)].map(n => r[n].move.type)))].sort();
console.log(`| Era | Planner | ${types.join(' | ')} |`);
console.log(`|---|---|${types.map(() => '---').join('|')}|`);
for (const era of [E.ERA.CANAL, E.ERA.RAIL]) {
    const rs = rows.filter(r => r.era === era);
    for (const name of ['base', ...Object.keys(CANDIDATES)]) {
        console.log(`| ${era} | ${name} | ${types.map(t => rs.filter(r => r[name].move.type === t).length).join(' | ')} |`);
    }
}
console.log('\n### Level of tiles built as the first move (Canal Era): Level I / Level II+\n');
for (const name of ['base', ...Object.keys(CANDIDATES)]) {
    let l1 = 0, l2 = 0;
    for (const r of rows.filter(x => x.era === E.ERA.CANAL && x[name].move.type === E.ACTIONS.BUILD)) {
        const lvl = r[name].level;
        if (lvl === undefined) continue;
        if (lvl >= 2) l2++; else l1++;
    }
    if (l1 + l2) console.log(`- ${name}: ${l1} / ${l2}`);
}
console.log('\n### Examples of changed decisions\n');
for (const name of Object.keys(CANDIDATES)) {
    const ex = rows.filter(r => JSON.stringify(r[name].move) !== JSON.stringify(r.base.move)).slice(0, EXAMPLES);
    for (const r of ex) console.log(`- ${name}: seed ${r.seed}, player ${r.player}, ${r.era} round ${r.round}: production ${describe(r.base.move)}; ${name} ${describe(r[name].move)}`);
}
