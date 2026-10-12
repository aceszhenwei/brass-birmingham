#!/usr/bin/env node
// Paired before/after comparison of mirror games (Assignment 6).
//
//   node scripts/research/ai-compare.js research-a6/mirror-*.json [--pairs hard:hard-a5,...]
//
// Mirror games put the same policy at every seat, and every policy plays the
// same seeds. For each seed, the per-player mean of a measure under the
// variant is compared with the baseline on that seed; the table shows the
// baseline mean, the variant mean, and the mean paired difference ± 1.96
// standard errors (bold when the interval excludes 0).

'use strict';

const fs = require('fs');

const files = process.argv.slice(2).filter(a => !a.startsWith('--') && a.endsWith('.json'));
const pairsArg = process.argv.indexOf('--pairs');
const PAIRS = (pairsArg >= 0 ? process.argv[pairsArg + 1]
    : 'hard-fairinfo:hard-a5,easy-rounds:easy-a5,normal-rounds:normal-a5,hard-rounds:hard-a5,easy:easy-a5,normal:normal-a5,hard:hard-a5')
    .split(',').map(p => p.split(':'));
const rows = files.flatMap(f => JSON.parse(fs.readFileSync(f, 'utf8')).rows).filter(r => r.exp === 'mirror');

const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const mean = (xs) => sum(xs) / xs.length;
const sd = (xs) => { const m = mean(xs); return Math.sqrt(sum(xs.map(x => (x - m) ** 2)) / Math.max(1, xs.length - 1)); };

const MEASURES = [
    ['Final VP', (s, f) => f.vp],
    ['Winner VP', null],
    ['Link VP', (s) => s.canal.linkVP + s.rail.linkVP],
    ['Tile VP', (s) => s.canal.industryVP + s.rail.industryVP],
    ['Income level', (s, f) => f.income],
    ['Money left', (s, f) => f.money],
    ['Loans', (s) => s.actions.loan],
    ['Builds', (s) => s.actions.build],
    ['Develop actions', (s) => s.actions.develop],
    ['Tiles sold', (s) => s.tilesSold],
    ['Networks', (s) => s.actions.network],
    ['Links built', (s) => s.links.canal + s.links.rail],
    ['Passes', (s) => s.actions.pass],
    ['Shortfall sales', (s) => s.shortfallSales],
    ['VP lost to shortfalls', (s) => s.shortfallVPLost],
    ['Own unflipped overbuilds', (s) => s.overbuildOwnUnflipped],
];

for (const [variant, base] of PAIRS) {
    for (const n of [2, 3, 4]) {
        const bySeed = (level) => new Map(rows.filter(r => r.players === n && r.level === level).map(r => [r.seed, r]));
        const A = bySeed(variant);
        const B = bySeed(base);
        const seeds = [...A.keys()].filter(k => B.has(k));
        if (!seeds.length) continue;
        console.log(`\n### ${variant} vs ${base}, ${n} players (${seeds.length} paired seeds)\n`);
        console.log(`| Measure (per player per game) | ${base} | ${variant} | Difference |`);
        console.log('|---|---|---|---|');
        for (const [name, fn] of MEASURES) {
            const gameValue = (g) => (fn ? mean(g.final.map((f, i) => fn(g.stats[i], f))) : Math.max(...g.final.map(f => f.vp)));
            const a = seeds.map(k => gameValue(A.get(k)));
            const b = seeds.map(k => gameValue(B.get(k)));
            const d = a.map((x, i) => x - b[i]);
            const half = 1.96 * sd(d) / Math.sqrt(d.length);
            const m = mean(d);
            const sig = Math.abs(m) > half && half > 0;
            const cell = `${m >= 0 ? '+' : ''}${m.toFixed(2)} ± ${half.toFixed(2)}`;
            console.log(`| ${name} | ${mean(b).toFixed(2)} | ${mean(a).toFixed(2)} | ${sig ? `**${cell}**` : cell} |`);
        }
    }
}
