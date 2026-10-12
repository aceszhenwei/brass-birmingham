#!/usr/bin/env node
// Record the current production AI (the Assignment 6 AI, whose loan
// heuristic Assignment 7 kept) as a regression fixture:
// test/fixtures/assignment6-baseline.json. test/ai-loans.test.js replays the
// games and requires identical fingerprints, so any change to the
// production AI's play shows up as a test failure that must be explained.
//
//   node scripts/research/record-a6-baseline.js        (rewrites the fixture)
//
// Games: 10 per player count, seeds 6000 + 1000 * players + i, difficulty
// rotating easy / normal / hard by seed, each seat's AI with its own seeded
// stream (as the UI plays).

'use strict';

const fs = require('fs');
const path = require('path');
const { loadEngine } = require('../../test/helpers/engine');
const { playGame } = require('../../test/helpers/headless');
const { fingerprint } = require('../../test/helpers/fingerprint');

const E = loadEngine();
const games = {};
for (const players of [2, 3, 4]) {
    games[players] = [];
    for (let i = 1; i <= 10; i++) {
        const seed = 6000 + 1000 * players + i;
        const difficulty = ['easy', 'normal', 'hard'][i % 3];
        const g = playGame({ players, seed, difficulty, E });
        games[players].push({ seed, difficulty, steps: g.steps, vp: g.vp, fingerprint: fingerprint(g.state, { steps: g.steps, actions: g.actions }) });
    }
}
const out = path.join(__dirname, '..', '..', 'test', 'fixtures', 'assignment6-baseline.json');
const lines = Object.entries(games).map(([n, list]) => `  "${n}": [\n${list.map(g => `   ${JSON.stringify(g)}`).join(',\n')}\n  ]`);
fs.writeFileSync(out, `{\n "generatedFrom": "production AI after Assignment 6 (loan heuristic kept in Assignment 7)",\n` +
    ` "scheme": "seed 6000+1000*players+i, difficulty easy/normal/hard by seed, each AI with its own seeded stream",\n` +
    ` "games": {\n${lines.join(',\n')}\n }\n}\n`);
console.log(`wrote ${out}`);
