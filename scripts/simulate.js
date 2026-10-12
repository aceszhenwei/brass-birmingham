#!/usr/bin/env node
// Headless AI-vs-AI simulation for regression testing.
//
//   node scripts/simulate.js [--games 100] [--players 2,3,4] [--seed 1]
//
// Every game runs through the strict driver in test/helpers/headless.js: any
// failed AI action, engine exception, invariant violation or non-terminating
// game is reported, and the exit code is non-zero if anything went wrong.

'use strict';

const { playGame } = require('../test/helpers/headless');

function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : fallback;
}

const GAMES = Number(arg('games', 100));
const PLAYERS = String(arg('players', '2,3,4')).split(',').map(Number);
const SEED0 = Number(arg('seed', 1));
const ROUNDS = { 2: 10, 3: 9, 4: 8 };
const DIFFICULTIES = ['easy', 'normal', 'hard'];

let totalFailures = 0;
const started = Date.now();

for (const players of PLAYERS) {
    const t0 = Date.now();
    const failures = [];
    const actions = {};
    const roundMismatches = [];
    let steps = 0;
    let winnerVP = 0;
    for (let i = 0; i < GAMES; i++) {
        const seed = SEED0 + i;
        const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length];
        try {
            const g = playGame({ players, seed: 1000 * players + seed, difficulty });
            steps += g.steps;
            winnerVP += Math.max(...g.vp);
            for (const [a, n] of Object.entries(g.actions)) actions[a] = (actions[a] || 0) + n;
            if (g.canalRounds !== ROUNDS[players] || g.railRounds !== ROUNDS[players]) {
                roundMismatches.push(`seed ${g.seed}: canal ${g.canalRounds}, rail ${g.railRounds}`);
            }
        } catch (err) {
            failures.push(err.message.split('\n').slice(0, 4).join('\n    '));
        }
    }
    const completed = GAMES - failures.length;
    totalFailures += failures.length + roundMismatches.length;
    console.log(`\n${players} players: ${completed}/${GAMES} games completed in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    console.log(`  rounds per era: ${roundMismatches.length ? 'MISMATCH' : `${ROUNDS[players]} + ${ROUNDS[players]} in every game`}`);
    if (completed) {
        console.log(`  avg actions/game: ${(steps / completed).toFixed(1)}, avg winning VP: ${(winnerVP / completed).toFixed(1)}`);
        console.log(`  actions: ${Object.entries(actions).sort((a, b) => b[1] - a[1]).map(([a, n]) => `${a} ${n}`).join(', ')}`);
    }
    for (const m of roundMismatches) console.log(`  ROUNDS ${m}`);
    for (const f of failures) console.log(`  FAILED ${f}`);
}

console.log(`\nTotal: ${totalFailures === 0 ? 'all games passed' : `${totalFailures} problem(s)`} ` +
    `(${((Date.now() - started) / 1000).toFixed(1)}s)`);
process.exit(totalFailures === 0 ? 0 : 1);
