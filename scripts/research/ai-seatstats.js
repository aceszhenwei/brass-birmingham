#!/usr/bin/env node
// Behaviour in seat-balanced matchups (scripts/research/ai-baseline.js
// matchups output): for each pair, the candidate's seats against the
// baseline's seats IN THE SAME GAMES. Per game, the candidate seats' mean
// minus the baseline seats' mean; the table gives the mean of that paired
// difference over games, ± 1.96 standard errors.
//
//   node scripts/research/ai-seatstats.js research-a11/explore-*.json [--pairs a:b,c:d]

'use strict';

const fs = require('fs');

const files = process.argv.slice(2).filter(a => a.endsWith('.json'));
const i = process.argv.indexOf('--pairs');
const only = i >= 0 ? new Set(process.argv[i + 1].split(',')) : null;

const MEASURES = [
    ['Final VP', (s, f) => f.vp],
    ['Final income level', (s, f) => f.income],
    ['Link VP (both eras)', (s) => s.canal.linkVP + s.rail.linkVP],
    ['Industry VP (both eras)', (s) => s.canal.industryVP + s.rail.industryVP],
    ['Builds', (s) => s.actions.build],
    ['Develop actions', (s) => s.actions.develop],
    ['Network actions', (s) => s.actions.network],
    ['Links built', (s) => s.links.canal + s.links.rail],
    ['Sell actions', (s) => s.actions.sell],
    ['Tiles sold', (s) => s.tilesSold],
    ['Loans', (s) => s.actions.loan],
    ['Scouts', (s) => s.actions.scout],
    ['Passes', (s) => s.actions.pass],
    ['Unflipped tiles at the end', (s) => s.rail.unflipped],
    ['Shortfall sales', (s) => s.shortfallSales],
    ['VP lost to shortfalls', (s) => s.shortfallVPLost],
];

const groups = new Map();
for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const row of data.rows) {
        if (!row.pair) continue;
        const [cand, base] = Array.isArray(row.pair) ? row.pair : String(row.pair).split(':');
        const key = `${cand}:${base}`;
        if (only && !only.has(key)) continue;
        const g = groups.get(key) || { cand, base, byPlayers: {} };
        groups.set(key, g);
        const list = g.byPlayers[row.players] || (g.byPlayers[row.players] = []);
        const diff = MEASURES.map(([, f]) => {
            const c = [], b = [];
            row.seats.forEach((seat, id) => (seat === cand ? c : b).push(f(row.stats[id], row.final[id])));
            if (!c.length || !b.length) return null;
            return c.reduce((x, y) => x + y, 0) / c.length - b.reduce((x, y) => x + y, 0) / b.length;
        });
        list.push(diff);
    }
}

const stat = (xs) => {
    const n = xs.length;
    const m = xs.reduce((a, b) => a + b, 0) / n;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, n - 1));
    const h = 1.96 * sd / Math.sqrt(n);
    const sig = Math.abs(m) > h;
    const t = `${m >= 0 ? '+' : ''}${m.toFixed(2)} ± ${h.toFixed(2)}`;
    return sig ? `**${t}**` : t;
};
for (const g of groups.values()) {
    const counts = Object.keys(g.byPlayers).sort();
    console.log(`### ${g.cand} vs ${g.base}: candidate seats minus baseline seats, per game\n`);
    console.log(`| Measure | ${counts.map(n => `${n} players (${g.byPlayers[n].length} games)`).join(' | ')} |`);
    console.log(`|---|${counts.map(() => '---').join('|')}|`);
    MEASURES.forEach(([name], k) => {
        console.log(`| ${name} | ${counts.map(n => stat(g.byPlayers[n].map(d => d[k]).filter(x => x !== null))).join(' | ')} |`);
    });
    console.log('');
}
