#!/usr/bin/env node
// Assignment 7: apply the pre-registered adoption criteria
// (docs/research/ai-loans-a7-plan.md) to seat-balanced matchup results.
//
//   node scripts/research/ai-criteria.js research-a7/validate-*.json
//
// For every pair "candidate:baseline" it prints, per player count and pooled
// over 2, 3 and 4 players (each player count weighted equally):
//   the candidate's win share, and the per-game VP difference candidate −
//   baseline (mean of the candidate seats minus mean of the baseline seats),
// each with a 95% interval (mean ± 1.96 standard errors; the pooled standard
// error combines the per-count ones). Criterion checks:
//   improves    pooled VP-difference interval entirely above 0 and pooled win share > 50%
//   regression  any player count, or the pooled result, with its interval entirely below 0

'use strict';

const fs = require('fs');

const rows = process.argv.slice(2).flatMap(f => JSON.parse(fs.readFileSync(f, 'utf8')).rows).filter(r => r.exp === 'matchup');
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const mean = (xs) => sum(xs) / xs.length;
const se = (xs) => { const m = mean(xs); return Math.sqrt(sum(xs.map(x => (x - m) ** 2)) / Math.max(1, xs.length - 1) / xs.length); };
const fmt = (m, s, unit = '') => `${m >= 0 && unit !== '%' ? '+' : ''}${m.toFixed(unit === '%' ? 1 : 2)}${unit} ± ${(1.96 * s).toFixed(unit === '%' ? 1 : 2)}`;

console.log('| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |');
console.log('|---|---|---|---|---|---|');
for (const pair of [...new Set(rows.map(r => r.pair))]) {
    const [a, b] = pair.split(':');
    const per = [];
    for (const n of [2, 3, 4]) {
        const games = rows.filter(r => r.pair === pair && r.players === n);
        if (!games.length) continue;
        const seatsOf = (g, p) => g.seats.map((x, i) => (x === p ? i : -1)).filter(i => i >= 0);
        const diff = games.map(g => mean(seatsOf(g, a).map(i => g.final[i].vp)) - mean(seatsOf(g, b).map(i => g.final[i].vp)));
        const win = games.map(g => sum(seatsOf(g, a).map(i => g.final[i].win)) * 100);
        const r = { n, games: games.length, d: mean(diff), dse: se(diff), w: mean(win), wse: se(win) };
        per.push(r);
        const verdict = r.d - 1.96 * r.dse > 0 ? 'above 0' : r.d + 1.96 * r.dse < 0 ? '**below 0**' : 'includes 0';
        console.log(`| ${a} vs ${b} | ${n} | ${r.games} | ${fmt(r.w, r.wse, '%')} | ${fmt(r.d, r.dse)} | ${verdict} |`);
    }
    if (per.length) {
        const k = per.length;
        const d = mean(per.map(r => r.d));
        const dse = Math.sqrt(sum(per.map(r => r.dse ** 2))) / k;
        const w = mean(per.map(r => r.w));
        const wse = Math.sqrt(sum(per.map(r => r.wse ** 2))) / k;
        const improves = d - 1.96 * dse > 0 && w > 50;
        const regression = d + 1.96 * dse < 0 || per.some(r => r.d + 1.96 * r.dse < 0);
        console.log(`| ${a} vs ${b} | **pooled** | ${sum(per.map(r => r.games))} | ${fmt(w, wse, '%')} | ${fmt(d, dse)} | ` +
            `${improves ? '**improves**' : 'no improvement'}${regression ? '; **regression**' : ''} |`);
    }
}
