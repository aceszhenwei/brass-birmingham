#!/usr/bin/env node
// Record a regression fixture of AI games: every game's fingerprint, so a test
// can require the AI to replay them exactly. Any change to the AI's play then
// shows up as a test failure that must be explained.
//
//   node scripts/research/record-ai-baseline.js --preset a6        # test/fixtures/assignment6-baseline.json
//   node scripts/research/record-ai-baseline.js --preset a8        # test/fixtures/assignment8-baseline.json
//   node scripts/research/record-ai-baseline.js --preset a9        # test/fixtures/assignment9-baseline.json
//   node scripts/research/record-ai-baseline.js --preset a10       # test/fixtures/assignment10-baseline.json
//   node scripts/research/record-ai-baseline.js --preset current   # test/fixtures/assignment12-baseline.json
//
// Presets: a6 = the AI of Assignments 6-7 (AIPlayer.LEGACY_A6); a8 = the AI of
// Assignment 8 (AIPlayer.LEGACY_A8); a9 = the AI of Assignment 9
// (AIPlayer.LEGACY_A9); a10 = the heuristic AI of Assignment 10
// (AIPlayer.chooseAction with no options); current = the production AI
// (AIPlanner.chooseAction, since Assignment 12; 4 games per player count).
// Re-record a fixture only for an intended change to that AI.
// Games: 10 per player count, seeds 6000 + 1000 * players + i, difficulty
// rotating easy / normal / hard by seed, each AI with its own seeded stream
// (as the UI plays).

'use strict';

const fs = require('fs');
const path = require('path');
const { loadEngine } = require('../../test/helpers/engine');
const { playGame } = require('../../test/helpers/headless');
const { fingerprint } = require('../../test/helpers/fingerprint');

const i = process.argv.indexOf('--preset');
const preset = i >= 0 ? process.argv[i + 1] : 'current';
const E = loadEngine();
const PRESETS = {
    a6: { options: E.AIPlayer.LEGACY_A6, file: 'assignment6-baseline.json',
        from: 'the AI of Assignments 6-7 (AIPlayer.LEGACY_A6; production until Assignment 8)' },
    a8: { options: E.AIPlayer.LEGACY_A8, file: 'assignment8-baseline.json',
        from: 'the production AI since Assignment 8' },
    a9: { options: E.AIPlayer.LEGACY_A9, file: 'assignment9-baseline.json',
        from: 'the production AI since Assignment 9' },
    a10: { options: null, file: 'assignment10-baseline.json', from: 'the production AI since Assignment 10' },
    current: { options: null, planner: true, games: 4, file: 'assignment12-baseline.json', from: 'the production planner AI since Assignment 12' },
};
const p = PRESETS[preset];
if (!p) { console.error('usage: record-ai-baseline.js --preset a6|a8|a9|a10|current'); process.exit(2); }

const games = {};
for (const players of [2, 3, 4]) {
    games[players] = [];
    for (let k = 1; k <= (p.games || 10); k++) {
        const seed = 6000 + 1000 * players + k;
        const difficulty = ['easy', 'normal', 'hard'][k % 3];
        const g = playGame({ players, seed, difficulty, aiOptions: p.options, chooseAction: p.planner ? E.AIPlanner.chooseAction : null, E });
        games[players].push({ seed, difficulty, steps: g.steps, vp: g.vp, fingerprint: fingerprint(g.state, { steps: g.steps, actions: g.actions }) });
    }
}
const out = path.join(__dirname, '..', '..', 'test', 'fixtures', p.file);
const lines = Object.entries(games).map(([n, list]) => `  "${n}": [\n${list.map(g => `   ${JSON.stringify(g)}`).join(',\n')}\n  ]`);
fs.writeFileSync(out, `{\n "generatedFrom": "${p.from}",\n` +
    ` "scheme": "seed 6000+1000*players+i, difficulty easy/normal/hard by seed, each AI with its own seeded stream",\n` +
    ` "games": {\n${lines.join(',\n')}\n }\n}\n`);
console.log(`wrote ${out}`);
