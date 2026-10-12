#!/usr/bin/env node
// Headless AI-vs-AI simulation for regression testing.
//
//   node scripts/simulate.js [--games 100] [--players 2,3,4] [--first 1] [--no-a1]
//
// For every game (seed = 1000 * players + i, i = first .. first+games-1,
// difficulty rotating easy/normal/hard):
//   1. Play a full game through the strict driver in test/helpers/headless.js
//      — any failed AI action, engine exception, invariant violation or
//      non-terminating game is reported.
//   2. Part-way through, clone the state and save it to JSON; the original,
//      the clone (replaying the original's decisions) and the restored save
//      (AI choosing with its restored random stream) must finish identically.
//   3. Unless --no-a1: replay the same seed with the Assignment 1 randomness
//      layout and compare it to test/fixtures/assignment1-baseline.json
//      (games recorded from the Assignment 1 code).
// The exit code is non-zero if anything went wrong.

'use strict';

const { loadEngine } = require('../test/helpers/engine');
const { playGame, continuationCheck } = require('../test/helpers/headless');
const { fingerprint } = require('../test/helpers/fingerprint');
const baseline = require('../test/fixtures/assignment1-baseline.json');

function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : fallback;
}

const GAMES = Number(arg('games', 100));
const PLAYERS = String(arg('players', '2,3,4')).split(',').map(Number);
const FIRST = Number(arg('first', 1));
const COMPARE_A1 = !process.argv.includes('--no-a1');
const ROUNDS = { 2: 10, 3: 9, 4: 8 };
const DIFFICULTIES = ['easy', 'normal', 'hard'];
const E = loadEngine();

let totalProblems = 0;
const started = Date.now();

for (const players of PLAYERS) {
    const t0 = Date.now();
    const failures = [];
    const roundMismatches = [];
    const actions = {};
    let completed = 0;
    let steps = 0;
    let winnerVP = 0;
    let a1Compared = 0;
    const a1Mismatches = [];
    const a1BySeed = new Map((baseline.games[players] || []).map(g => [g.seed, g]));

    for (let i = FIRST; i < FIRST + GAMES; i++) {
        const seed = 1000 * players + i;
        const difficulty = DIFFICULTIES[i % 3];
        const checkpoint = 1 + (i * 37) % 70;
        try {
            const g = continuationCheck(E, { players, seed, difficulty, checkpoint });
            completed++;
            steps += g.steps;
            winnerVP += Math.max(...g.vp);
            for (const [a, n] of Object.entries(g.actions)) actions[a] = (actions[a] || 0) + n;
            if (g.canalRounds !== ROUNDS[players] || g.railRounds !== ROUNDS[players]) {
                roundMismatches.push(`seed ${seed}: canal ${g.canalRounds}, rail ${g.railRounds}`);
            }

            const a1 = a1BySeed.get(seed);
            if (COMPARE_A1 && a1 && a1.difficulty === difficulty) {
                const r = playGame({ players, seed, difficulty, sharedRng: true, E });
                a1Compared++;
                if (fingerprint(r.state, { steps: r.steps, actions: r.actions }) !== a1.fingerprint) {
                    a1Mismatches.push(`seed ${seed}`);
                }
            }
        } catch (err) {
            failures.push(err.message.split('\n').slice(0, 4).join('\n    '));
        }
    }

    totalProblems += failures.length + roundMismatches.length + a1Mismatches.length;
    console.log(`\n${players} players: ${completed}/${GAMES} games completed in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    console.log(`  rounds per era: ${roundMismatches.length ? 'MISMATCH' : `${ROUNDS[players]} + ${ROUNDS[players]} in every game`}`);
    console.log(`  clone + JSON restore mid-game: ${completed} identical continuations`);
    if (COMPARE_A1) {
        console.log(`  Assignment 1 comparison: ${a1Compared - a1Mismatches.length}/${a1Compared} games identical`);
    }
    if (completed) {
        console.log(`  avg actions/game: ${(steps / completed).toFixed(1)}, avg winning VP: ${(winnerVP / completed).toFixed(1)}`);
        console.log(`  actions: ${Object.entries(actions).sort((a, b) => b[1] - a[1]).map(([a, n]) => `${a} ${n}`).join(', ')}`);
    }
    for (const m of roundMismatches) console.log(`  ROUNDS ${m}`);
    for (const m of a1Mismatches) console.log(`  DIFFERS FROM ASSIGNMENT 1 ${m}`);
    for (const f of failures) console.log(`  FAILED ${f}`);
}

console.log(`\nTotal: ${totalProblems === 0 ? 'all games passed' : `${totalProblems} problem(s)`} ` +
    `(${((Date.now() - started) / 1000).toFixed(1)}s)`);
process.exit(totalProblems === 0 ? 0 : 1);
