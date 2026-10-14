#!/usr/bin/env node
// Two controlled automated games, NEVER evidence of human performance.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, engine } = require('./human-games');
const E = engine();
for (const [count, seed] of [[2, 1701], [3, 1702]]) {
    const state = new E.GameState(count, ['Scripted seat', 'AI Bob', 'AI Carol'].slice(0, count),
        Array.from({ length: count }, (_, i) => ({ isAI: i > 0, difficulty: 'easy' })), { seed });
    const logic = new E.GameLogic(state), rng = new E.SeededRandom((seed ^ 0x9E3779B9) >>> 0);
    const record = new E.GameRecord.Recorder(state, { id: `synthetic-${count}p-${seed}`, source: 'synthetic', createdAt: '2026-10-14T00:00:00.000Z' });
    let actions = 0;
    while (!state.gameOver && actions++ < 1000) {
        const d = logic.getCurrentDecision(), before = state.clone();
        // Even the nominal human seat is driven by the unmodified Easy policy.
        const move = d.type === 'shortfall' ? logic.defaultShortfallMove(d.playerId)
            : logic.moveFromDecision(E.AIPlanner.chooseAction(state, logic, d.playerId, 'easy', rng));
        const result = logic.play(d.playerId, move);
        if (!result.success) throw new Error(result.message);
        record.append(before, result, state);
    }
    const data = record.export(state); E.GameRecord.replay(data);
    const file = path.join(ROOT, `research/human-games/samples/${data.id}.json`);
    fs.writeFileSync(file, JSON.stringify(data) + '\n');
    console.log(`${file}: ${actions} actions, synthetic only`);
}
