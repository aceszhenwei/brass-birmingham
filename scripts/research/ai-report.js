#!/usr/bin/env node
// Summarise the raw results of scripts/research/ai-baseline.js as Markdown
// tables (the tables in docs/research/ai-baseline-audit.md).
//
//   node scripts/research/ai-report.js research-results/*.json
//
// Intervals are 95%: Wilson intervals for win shares, mean ± 1.96 standard
// errors for means. Games that share a seed are not independent (they share
// a deck and merchant setup), so the intervals are somewhat optimistic.

'use strict';

const fs = require('fs');

const rows = process.argv.slice(2).flatMap(f => JSON.parse(fs.readFileSync(f, 'utf8')).rows);
if (rows.length === 0) {
    console.error('usage: ai-report.js <results.json>...');
    process.exit(2);
}

const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const mean = (xs) => (xs.length ? sum(xs) / xs.length : NaN);
const sd = (xs) => { const m = mean(xs); return Math.sqrt(sum(xs.map(x => (x - m) ** 2)) / Math.max(1, xs.length - 1)); };
const ci = (xs) => 1.96 * sd(xs) / Math.sqrt(xs.length);
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '–');
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '–');
const pm = (xs) => `${f1(mean(xs))} ± ${f1(ci(xs))}`;
function wilson(wins, n) {
    if (n === 0) return [NaN, NaN];
    const z = 1.96;
    const p = wins / n;
    const d = 1 + z * z / n;
    const c = (p + z * z / (2 * n)) / d;
    const h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d;
    return [Math.max(0, c - h), Math.min(1, c + h)];
}
const pct = (wins, n) => {
    const [lo, hi] = wilson(wins, n);
    return `${(100 * wins / n).toFixed(1)}% [${(100 * lo).toFixed(0)}–${(100 * hi).toFixed(0)}]`;
};
const seatsOf = (r, policy) => r.seats.map((p, i) => (p === policy ? i : -1)).filter(i => i >= 0);
const PLAYER_COUNTS = [2, 3, 4];

// ---------------------------------------------------------------------------
// Matchups
// ---------------------------------------------------------------------------
const matchups = rows.filter(r => r.exp === 'matchup');
if (matchups.length) {
    console.log('## Pairwise matchups (seats balanced)\n');
    console.log('A win share: the share of games won by a seat playing A (ties split); 50% means equal strength.');
    console.log('VP difference: per game, the mean final VP of the A seats minus that of the B seats.\n');
    console.log('| Players | A vs B | Games | A win share [95% CI] | VP difference A − B | Mean VP A | Mean VP B |');
    console.log('|---|---|---|---|---|---|---|');
    const pairs = [...new Set(matchups.map(r => r.pair))];
    for (const pair of pairs) {
        const [a, b] = pair.split(':');
        for (const n of PLAYER_COUNTS) {
            const games = matchups.filter(r => r.pair === pair && r.players === n);
            if (!games.length) continue;
            const winsA = sum(games.map(g => sum(seatsOf(g, a).map(i => g.final[i].win))));
            const vpA = games.map(g => mean(seatsOf(g, a).map(i => g.final[i].vp)));
            const vpB = games.map(g => mean(seatsOf(g, b).map(i => g.final[i].vp)));
            const diff = vpA.map((x, i) => x - vpB[i]);
            console.log(`| ${n} | ${a} vs ${b} | ${games.length} | ${pct(winsA, games.length)} | ${pm(diff)} | ${f1(mean(vpA))} | ${f1(mean(vpB))} |`);
        }
    }
    console.log();
}

// ---------------------------------------------------------------------------
// Three-way
// ---------------------------------------------------------------------------
const threeway = rows.filter(r => r.exp === 'threeway');
if (threeway.length) {
    console.log(`## Three-way games (3 players, one of each difficulty, all six seatings; ${threeway.length} games)\n`);
    console.log('| Difficulty | Win share [95% CI] | Mean VP | Mean rank |');
    console.log('|---|---|---|---|');
    for (const level of [...new Set(threeway.flatMap(g => g.seats))]) {
        const wins = sum(threeway.map(g => g.final[g.seats.indexOf(level)].win));
        const vp = threeway.map(g => g.final[g.seats.indexOf(level)].vp);
        const rank = threeway.map(g => g.final[g.seats.indexOf(level)].rank);
        console.log(`| ${level} | ${pct(wins, threeway.length)} | ${pm(vp)} | ${f2(mean(rank))} |`);
    }
    console.log();
}

// ---------------------------------------------------------------------------
// Mirror games: gameplay statistics
// ---------------------------------------------------------------------------
const mirror = rows.filter(r => r.exp === 'mirror');
if (mirror.length) {
    const groups = [];
    for (const n of PLAYER_COUNTS) {
        for (const level of [...new Set(mirror.map(r => r.level))]) {
            const games = mirror.filter(r => r.players === n && r.level === level);
            if (games.length) groups.push({ n, level, games, seats: games.flatMap(g => g.final.map((f, i) => ({ f, s: g.stats[i], g, i }))) });
        }
    }
    const table = (title, cols, cell) => {
        console.log(`### ${title}\n`);
        console.log(`| Players | Level | ${cols.join(' | ')} |`);
        console.log(`|---|---|${cols.map(() => '---').join('|')}|`);
        for (const grp of groups) console.log(`| ${grp.n} | ${grp.level} | ${cols.map((c, j) => cell(grp, c, j)).join(' | ')} |`);
        console.log();
    };
    console.log('## Mirror games (every seat the same difficulty): per-player statistics\n');
    console.log(`Means per player per game (± 95% CI where shown). ${mirror.length} games.\n`);

    table('Outcomes', ['Games', 'Final VP', 'Winner VP', 'Income level', 'Money left', 'Loans'], (grp, c) => {
        const S = grp.seats;
        switch (c) {
            case 'Games': return grp.games.length;
            case 'Final VP': return pm(S.map(x => x.f.vp));
            case 'Winner VP': return pm(grp.games.map(g => Math.max(...g.final.map(f => f.vp))));
            case 'Income level': return pm(S.map(x => x.f.income));
            case 'Money left': return pm(S.map(x => x.f.money));
            case 'Loans': return f1(mean(S.map(x => x.s.actions.loan)));
        }
    });
    const ACTS = ['build', 'network', 'develop', 'sell', 'loan', 'scout', 'pass'];
    table('Actions per player per game', ACTS, (grp, c) => f1(mean(grp.seats.map(x => x.s.actions[c]))));

    const TYPES = ['cottonMill', 'coalMine', 'ironWorks', 'manufacturer', 'pottery', 'brewery'];
    table('Tiles built per player (Canal + Rail)', [...TYPES, 'Mean level', 'Overbuilt own tile (unflipped)'], (grp, c) => {
        if (c === 'Overbuilt own tile (unflipped)') {
            return `${f2(mean(grp.seats.map(x => x.s.overbuildOwn)))} (${f2(mean(grp.seats.map(x => x.s.overbuildOwnUnflipped)))})`;
        }
        if (c === 'Mean level') {
            const lv = grp.seats.map(x => x.s.buildLevelSum);
            const n = grp.seats.map(x => x.s.actions.build);
            return f2(sum(lv) / sum(n));
        }
        return `${f1(mean(grp.seats.map(x => x.s.builds.canal[c] || 0)))} + ${f1(mean(grp.seats.map(x => x.s.builds.rail[c] || 0)))}`;
    });

    table('Selling and development', ['Tiles sold', 'Merchant bonuses', 'Tiles developed', 'Unflipped sellable at Canal end', 'Unflipped sellable at game end', 'Unflipped (all) at game end'], (grp, c) => {
        const S = grp.seats;
        switch (c) {
            case 'Tiles sold': return f1(mean(S.map(x => x.s.tilesSold)));
            case 'Merchant bonuses': return f1(mean(S.map(x => x.s.merchantBonuses)));
            case 'Tiles developed': return f1(mean(S.map(x => x.s.developTiles)));
            case 'Unflipped sellable at Canal end': return f2(mean(S.map(x => x.s.canal.unflippedSellable)));
            case 'Unflipped sellable at game end': return f2(mean(S.map(x => x.s.rail.unflippedSellable)));
            case 'Unflipped (all) at game end': return f2(mean(S.map(x => x.s.rail.unflipped)));
        }
    });

    table('VP sources per player', ['Canal links', 'Canal tiles', 'Rail links', 'Rail tiles', 'Merchant VP bonuses', 'VP lost to shortfalls', 'Level I tiles removed at Canal end', 'Money at Canal end'], (grp, c) => {
        const S = grp.seats;
        switch (c) {
            case 'Canal links': return f1(mean(S.map(x => x.s.canal.linkVP)));
            case 'Canal tiles': return f1(mean(S.map(x => x.s.canal.industryVP)));
            case 'Rail links': return f1(mean(S.map(x => x.s.rail.linkVP)));
            case 'Rail tiles': return f1(mean(S.map(x => x.s.rail.industryVP)));
            case 'Merchant VP bonuses': return f1(mean(S.map(x => x.f.vp - x.s.canal.linkVP - x.s.canal.industryVP - x.s.rail.linkVP - x.s.rail.industryVP + x.s.shortfallVPLost)));
            case 'VP lost to shortfalls': return f1(mean(S.map(x => x.s.shortfallVPLost)));
            case 'Level I tiles removed at Canal end': return f2(mean(S.map(x => x.s.canal.level1)));
            case 'Money at Canal end': return f1(mean(S.map(x => x.s.canal.money)));
        }
    });

    const share = (o) => { const t = sum(Object.values(o)); return t ? Object.entries(o).map(([k, v]) => `${k} ${(100 * v / t).toFixed(0)}%`).join(', ') : '–'; };
    const totals = (S, key) => S.reduce((acc, x) => { for (const [k, v] of Object.entries(x.s[key])) acc[k] = (acc[k] || 0) + v; return acc; }, {});
    table('Resources and card use', ['Coal from', 'Iron from', 'Brewery beer from', 'Passes while another action was legal', 'Non-build discards of a buildable card while holding a dead card', 'Shortfall tile sales (flipped)'], (grp, c) => {
        const S = grp.seats;
        switch (c) {
            case 'Coal from': return share(totals(S, 'coal'));
            case 'Iron from': return share(totals(S, 'iron'));
            case 'Brewery beer from': return share(totals(S, 'beer'));
            case 'Passes while another action was legal': return `${sum(S.map(x => x.s.passWithOptions))} of ${sum(S.map(x => x.s.actions.pass))}`;
            case 'Non-build discards of a buildable card while holding a dead card': {
                const a = sum(S.map(x => x.s.playableDiscards));
                const b = sum(S.map(x => x.s.nonBuildDiscards));
                return `${a} of ${b} (${(100 * a / b).toFixed(0)}%)`;
            }
            case 'Shortfall tile sales (flipped)': return `${f2(mean(S.map(x => x.s.shortfallSales)))} (${f2(mean(S.map(x => x.s.shortfallFlippedSold)))})`;
        }
    });

    console.log('### Turn-order position (mirror games)\n');
    console.log('Win share by position in the initial turn order (1 = first to act). With identical policies at every seat, an even split means no positional advantage.\n');
    console.log('| Players | Level | ' + [1, 2, 3, 4].map(p => `Position ${p}`).join(' | ') + ' |');
    console.log('|---|---|---|---|---|---|');
    for (const grp of groups) {
        const cells = [0, 1, 2, 3].map(pos => {
            if (pos >= grp.n) return '';
            const wins = sum(grp.games.map(g => sum(g.final.filter((f, i) => g.startPosition[i] === pos).map(f => f.win))));
            return pct(wins, grp.games.length);
        });
        console.log(`| ${grp.n} | ${grp.level} | ${cells.join(' | ')} |`);
    }
    console.log();
}
