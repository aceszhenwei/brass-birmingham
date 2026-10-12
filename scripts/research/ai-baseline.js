#!/usr/bin/env node
// Assignment 5: baseline experiments for the existing AI.
//
//   node scripts/research/ai-baseline.js <experiment> [--players 2,3,4] [--seeds N] [--out file.json]
//
// Experiments (every game is fully reproducible from its seed):
//   matchups  [--pairs a:b,c:d]  Two policies against each other, with the
//             seats balanced: every arrangement of the two policies over the
//             seats is played on every seed (2p: AB, BA; 3p: AAB, ABA, BAA,
//             BBA, BAB, ABB; 4p: the six arrangements of AABB).
//   mirror    [--levels easy,normal,hard]  Every seat the same difficulty,
//             with the detailed per-decision statistics.
//   threeway  [--levels easy,normal,hard]  3 players, one seat per level,
//             all six seatings.
// Policies: easy, normal, hard (the current AI); <level>-a5 (the Assignment 5
// baseline), <level>-fairinfo and <level>-rounds (one correction each);
// hard-blind and hard-fair (the baseline Hard shown no / resampled opponent
// hands); random (uniform legal moves). See scripts/research/harness.js.
//
// Game seeds are 200000 + 1000 * players + i (i = 1..N), distinct from the
// seeds scripts/simulate.js and the tests use. Raw per-game results are
// written as JSON (default research-results/<experiment>-<players>.json,
// ignored by git); summarise them with scripts/research/ai-report.js.

'use strict';

const fs = require('fs');
const path = require('path');
const { loadEngine } = require('../../test/helpers/engine');
const { playMatch } = require('./harness');

const experiment = process.argv[2];
function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : fallback;
}
const PLAYERS = String(arg('players', '2,3,4')).split(',').map(Number);
const SEEDS = Number(arg('seeds', experiment === 'mirror' ? 100 : 50));
// Default: the Assignment 6 comparisons (corrections in isolation and
// together against the Assignment 5 baseline, then the corrected ladder)
const DEFAULT_PAIRS = 'hard-fairinfo:hard-a5,easy-rounds:easy-a5,normal-rounds:normal-a5,hard-rounds:hard-a5,' +
    'easy:easy-a5,normal:normal-a5,hard:hard-a5,easy:normal,normal:hard,easy:hard';
const PAIRS = String(arg('pairs', DEFAULT_PAIRS)).split(',').map(p => p.split(':'));
const LEVELS = String(arg('levels', 'easy,normal,hard')).split(',');
const OUT = arg('out', path.join('research-results', `${experiment}-${PLAYERS.join('')}.json`));
const seedFor = (players, i) => 200000 + 1000 * players + i;

// Every distinct arrangement of `counts` policies over the seats
function arrangements(items) {
    if (items.length <= 1) return [items];
    const out = new Set();
    items.forEach((x, i) => {
        for (const rest of arrangements([...items.slice(0, i), ...items.slice(i + 1)])) out.add(JSON.stringify([x, ...rest]));
    });
    return [...out].map(s => JSON.parse(s));
}

function seatPatterns(players, a, b) {
    if (players === 2) return [[a, b], [b, a]];
    if (players === 3) return [...arrangements([a, a, b]), ...arrangements([a, b, b])];
    return arrangements([a, a, b, b]);
}

const E = loadEngine();
const rows = [];
const started = Date.now();
let failures = 0;

function run(exp, players, seed, seats, detailed, extra = {}) {
    try {
        const r = playMatch(E, { players, seed, seats, detailed });
        rows.push({ exp, players, seed, seats, startPosition: r.startPosition, final: r.final, stats: r.stats, ...extra });
    } catch (err) {
        failures++;
        console.log(`FAILED ${exp} ${players}p seed ${seed} ${seats.join(',')}: ${err.message}`);
    }
}

for (const players of PLAYERS) {
    const t0 = Date.now();
    if (experiment === 'matchups') {
        for (const [a, b] of PAIRS) {
            const patterns = seatPatterns(players, a, b);
            for (let i = 1; i <= SEEDS; i++) {
                for (const seats of patterns) run('matchup', players, seedFor(players, i), seats, false, { pair: `${a}:${b}` });
            }
        }
    } else if (experiment === 'mirror') {
        for (const level of LEVELS) {
            for (let i = 1; i <= SEEDS; i++) run('mirror', players, seedFor(players, i), Array(players).fill(level), true, { level });
        }
    } else if (experiment === 'threeway') {
        if (players !== 3) continue;
        for (let i = 1; i <= SEEDS; i++) {
            for (const seats of arrangements(LEVELS.slice(0, 3))) run('threeway', 3, seedFor(3, i), seats, false);
        }
    } else {
        console.error('usage: ai-baseline.js matchups|mirror|threeway [--players 2,3,4] [--seeds N] [--out file]');
        process.exit(2);
    }
    console.log(`${experiment} ${players}p: ${rows.filter(r => r.players === players).length} games in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ experiment, seeds: SEEDS, rows }));
console.log(`${rows.length} games, ${failures} failed, written to ${OUT} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
process.exit(failures ? 1 : 0);
