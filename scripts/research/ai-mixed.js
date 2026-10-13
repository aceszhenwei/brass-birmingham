#!/usr/bin/env node
// Summarise mixed-table games (ai-baseline.js mixed): for each policy, its
// win share (ties shared), mean rank, and its VP relative to the table mean
// (per game: its VP minus the mean VP of the table), ± 1.96 standard errors.
//
//   node scripts/research/ai-mixed.js research-a12/mixed-*.json

'use strict';

const fs = require('fs');

for (const file of process.argv.slice(2)) {
    const { rows } = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!rows.length) continue;
    const players = rows[0].players;
    const per = {};
    for (const row of rows) {
        const mean = row.final.reduce((a, f) => a + f.vp, 0) / row.final.length;
        const winners = row.final.filter(f => f.rank === 1).length;
        row.seats.forEach((seat, id) => {
            const p = per[seat] || (per[seat] = { rel: [], win: 0, rank: 0, n: 0 });
            p.rel.push(row.final[id].vp - mean);
            p.win += row.final[id].rank === 1 ? 1 / winners : 0;
            p.rank += row.final[id].rank;
            p.n++;
        });
    }
    const games = rows.length;
    console.log(`### Mixed tables: ${players} players, ${games} games (${games / players} seeds × ${players} rotations)\n`);
    console.log('| Policy | Win share | Mean rank | VP relative to the table mean |');
    console.log('|---|---|---|---|');
    for (const [seat, p] of Object.entries(per).sort((a, b) => b[1].win - a[1].win)) {
        const m = p.rel.reduce((a, b) => a + b, 0) / p.n;
        const sd = Math.sqrt(p.rel.reduce((a, b) => a + (b - m) ** 2, 0) / (p.n - 1));
        const h = 1.96 * sd / Math.sqrt(p.n);
        console.log(`| ${seat} | ${(100 * p.win / p.n).toFixed(1)}% | ${(p.rank / p.n).toFixed(2)} | ${m >= 0 ? '+' : ''}${m.toFixed(2)} ± ${h.toFixed(2)} |`);
    }
    console.log('');
}
