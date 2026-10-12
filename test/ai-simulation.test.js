'use strict';

// Full AI-vs-AI games through the strict headless driver: every game must
// terminate with the right number of rounds per era, every AI action must
// succeed, and the state invariants must hold after every single action.
// Each game is also cloned and saved part-way through; the original, the
// clone and the restored save must finish identically.
//
// Games per player count: BRASS_SIM_GAMES (default 10). For the large
// regression run use `node scripts/simulate.js --games 100`.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { continuationCheck } = require('./helpers/headless');

const E = loadEngine();
const GAMES = Number(process.env.BRASS_SIM_GAMES || 10);
const ROUNDS = { 2: 10, 3: 9, 4: 8 };
const DIFFICULTIES = ['easy', 'normal', 'hard'];

for (const players of [2, 3, 4]) {
    test(`${GAMES} headless ${players}-player AI games complete, and clone/restore mid-game continue identically`, () => {
        for (let i = 1; i <= GAMES; i++) {
            const seed = 1000 * players + i;
            const checkpoint = 1 + (i * 37) % 70; // anywhere from round 1 to the Rail Era
            const g = continuationCheck(E, { players, seed, difficulty: DIFFICULTIES[i % 3], checkpoint });
            assert.equal(g.state.gameOver, true);
            assert.equal(g.canalRounds, ROUNDS[players], `canal rounds (seed ${seed})`);
            assert.equal(g.railRounds, ROUNDS[players], `rail rounds (seed ${seed})`);
        }
    });
}
