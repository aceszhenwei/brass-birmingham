#!/usr/bin/env node
// Headless AI-vs-AI simulation for regression testing.
//
//   node scripts/simulate.js [--games 100] [--players 2,3,4] [--first 1] [--no-a1] [--random 20] [--mixed 30]
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
//      layout and the legacy AI baseline (AIPlayer.LEGACY_A5), and compare it
//      to test/fixtures/assignment1-baseline.json (games recorded from the
//      Assignment 1 code).
// Then (--mixed N, default 30 per player count) play N games where the seats
// have DIFFERENT difficulties (easy / normal / hard / normal), and
// (--random N, default 20 per player count) play N games choosing at
// random among getLegalMoves with every choice expanded, including random
// income-shortfall decisions: every listed move must apply and every
// invariant must hold.
// The exit code is non-zero if anything went wrong.

'use strict';

const { loadEngine } = require('../test/helpers/engine');
const { playGame, continuationCheck, randomPlayout } = require('../test/helpers/headless');
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
const RANDOM = Number(arg('random', 20));
const MIXED = Number(arg('mixed', 30));
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
                const r = playGame({ players, seed, difficulty, sharedRng: true, aiOptions: E.AIPlayer.LEGACY_A5, E });
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
    if (MIXED > 0) {
        const m0 = Date.now();
        let mixedOk = 0;
        for (let i = 1; i <= MIXED; i++) {
            const seed = 70000 + 1000 * players + i;
            try {
                const g = continuationCheck(E, { players, seed, difficulty: ['easy', 'normal', 'hard', 'normal'],
                    checkpoint: 1 + (i * 37) % 70 });
                if (g.canalRounds !== ROUNDS[players] || g.railRounds !== ROUNDS[players]) {
                    roundMismatches.push(`mixed seed ${seed}: canal ${g.canalRounds}, rail ${g.railRounds}`);
                } else {
                    mixedOk++;
                }
            } catch (err) {
                failures.push(`mixed: ${err.message.split('\n').slice(0, 4).join('\n    ')}`);
            }
        }
        totalProblems += MIXED - mixedOk;
        console.log(`  mixed-difficulty games (seats easy/normal/hard/normal): ${mixedOk}/${MIXED} completed in ${((Date.now() - m0) / 1000).toFixed(1)}s`);
    }
    if (RANDOM > 0) {
        const r0 = Date.now();
        let randomOk = 0;
        let maxMoves = 0;
        const randomMoves = {};
        for (let i = 1; i <= RANDOM; i++) {
            try {
                const g = randomPlayout(E, { players, seed: 50000 + 1000 * players + i });
                if (g.canalRounds !== ROUNDS[players] || g.railRounds !== ROUNDS[players]) {
                    roundMismatches.push(`random seed ${g.seed}: canal ${g.canalRounds}, rail ${g.railRounds}`);
                } else {
                    randomOk++;
                }
                maxMoves = Math.max(maxMoves, g.maxLegalMoves);
                for (const [t, n] of Object.entries(g.moves)) randomMoves[t] = (randomMoves[t] || 0) + n;
            } catch (err) {
                failures.push(`random: ${err.message.split('\n').slice(0, 4).join('\n    ')}`);
            }
        }
        totalProblems += RANDOM - randomOk;
        console.log(`  random legal-move games: ${randomOk}/${RANDOM} completed in ${((Date.now() - r0) / 1000).toFixed(1)}s ` +
            `(up to ${maxMoves} legal moves per position; ${Object.entries(randomMoves).map(([t, n]) => `${t} ${n}`).join(', ')})`);
    }
    for (const m of roundMismatches) console.log(`  ROUNDS ${m}`);
    for (const m of a1Mismatches) console.log(`  DIFFERS FROM ASSIGNMENT 1 ${m}`);
    for (const f of failures) console.log(`  FAILED ${f}`);
}

console.log(`\nTotal: ${totalProblems === 0 ? 'all games passed' : `${totalProblems} problem(s)`} ` +
    `(${((Date.now() - started) / 1000).toFixed(1)}s)`);
process.exit(totalProblems === 0 ? 0 : 1);
