'use strict';

// Full AI-vs-AI games through the strict headless driver: every game must
// terminate with the right number of rounds per era, every AI action must
// succeed, and the state invariants must hold after every single action.
//
// Games per player count: BRASS_SIM_GAMES (default 10). For the large
// regression run use `node scripts/simulate.js --games 100`.

const test = require('node:test');
const assert = require('node:assert/strict');
const { playGame } = require('./helpers/headless');

const GAMES = Number(process.env.BRASS_SIM_GAMES || 10);
const ROUNDS = { 2: 10, 3: 9, 4: 8 };
const DIFFICULTIES = ['easy', 'normal', 'hard'];

for (const players of [2, 3, 4]) {
    test(`${GAMES} headless ${players}-player AI games complete without failures`, () => {
        for (let seed = 1; seed <= GAMES; seed++) {
            const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length];
            const g = playGame({ players, seed: 1000 * players + seed, difficulty });
            assert.equal(g.state.gameOver, true);
            assert.equal(g.canalRounds, ROUNDS[players], `canal rounds (seed ${g.seed})`);
            assert.equal(g.railRounds, ROUNDS[players], `rail rounds (seed ${g.seed})`);
        }
    });
}
