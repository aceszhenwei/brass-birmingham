'use strict';

// Overbuild scoring (Assignment 8). Production charges an overbuild of the
// player's own tile for the replaced tile's future value ('opportunity');
// 'a6' (AIPlayer.LEGACY_A6) is the previous scoring. The variants change only
// how a Build replacing the player's own tile is scored. The Assignment 8 AI
// (AIPlayer.LEGACY_A8) is pinned by recorded games
// (test/fixtures/assignment8-baseline.json); the production AI since
// Assignment 9 by test/ai-invest.test.js.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { createGame, aiSeedFor } = require('./helpers/headless');
const { checkInvariants } = require('./helpers/invariants');
const { playGame } = require('./helpers/headless');
const { fingerprint } = require('./helpers/fingerprint');
const baseline = require('./fixtures/assignment8-baseline.json');

const E = loadEngine();
const ser = (s) => JSON.stringify(s.serialize());
const VARIANTS = ['opportunity', 'opportunity-unflipped', 'no-unflipped'];

test('the variants re-score only overbuilds of the player\'s own tiles, in the intended direction', () => {
    const seen = { ownFlipped: 0, ownUnflipped: 0 };
    for (const [players, seed] of [[2, 101], [3, 102], [4, 103]]) {
        const { state, logic } = createGame(E, { players, seed });
        const aiRng = new E.SeededRandom(aiSeedFor(seed));
        for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
            if (d.type === 'shortfall') { logic.play(d.playerId, logic.defaultShortfallMove(d.playerId)); continue; }
            const builds = (overbuild) => {
                const r = E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng.clone(), { explain: true, overbuild });
                const c = r.explain.candidates.find(x => x.action === 'build');
                return c ? c.builds : [];
            };
            const base = builds('a6');
            // A variant that rules out every build target proposes no Build
            // at all; its scores then count as -Infinity
            const score = (list, i) => (list[i] ? list[i].score : -Infinity);
            if (base.length) {
                const v = Object.fromEntries(VARIANTS.map(x => [x, builds(x)]));
                base.forEach((b, i) => {
                    const own = b.replaces && b.replaces.own;
                    if (!own) {
                        for (const x of VARIANTS) if (v[x].length) assert.equal(score(v[x], i), b.score, `${x} changed a non-overbuild`);
                        return;
                    }
                    seen[b.replaces.flipped ? 'ownFlipped' : 'ownUnflipped']++;
                    assert.ok(score(v.opportunity, i) < b.score, 'opportunity charges for the replaced tile');
                    if (b.replaces.flipped) {
                        assert.equal(score(v['opportunity-unflipped'], i), b.score);
                        assert.equal(score(v['no-unflipped'], i), b.score);
                    } else {
                        assert.equal(score(v['opportunity-unflipped'], i), score(v.opportunity, i));
                        assert.equal(score(v['no-unflipped'], i), -Infinity);
                    }
                });
            }
            assert.ok(logic.play(d.playerId, logic.moveFromDecision(
                E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng))).success);
        }
    }
    assert.ok(seen.ownFlipped > 0 && seen.ownUnflipped > 0, `overbuild candidates exercised: ${JSON.stringify(seen)}`);
});

for (const players of [2, 3, 4]) {
    test(`${players} players: the Assignment 8 AI (LEGACY_A8) replays its recorded games exactly`, () => {
        for (const g of baseline.games[players]) {
            const r = playGame({ players, seed: g.seed, difficulty: g.difficulty, aiOptions: E.AIPlayer.LEGACY_A8, E });
            assert.equal(fingerprint(r.state, { steps: r.steps, actions: r.actions }), g.fingerprint,
                `seed ${g.seed} (${g.difficulty}) no longer plays as recorded`);
        }
    });
}

test("the default overbuild scoring is 'opportunity', LEGACY_A6 is 'a6', and build diagnostics don't change decisions", () => {
    const { state, logic } = createGame(E, { players: 3, seed: 104 });
    const aiRng = new E.SeededRandom(aiSeedFor(104));
    for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
        if (d.type === 'shortfall') { logic.play(d.playerId, logic.defaultShortfallMove(d.playerId)); continue; }
        const key = (opts) => JSON.stringify(logic.moveFromDecision(
            E.AIPlayer.chooseAction(state, logic, d.playerId, 'hard', aiRng.clone(), opts)));
        assert.equal(key({ overbuild: 'opportunity' }), key(null));
        assert.equal(key(E.AIPlayer.LEGACY_A6), key({ overbuild: 'a6', sell: 'a8' }));
        assert.equal(key({ explain: true }), key(null));
        assert.ok(logic.play(d.playerId, logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, d.playerId, 'hard', aiRng))).success);
    }
});

for (const overbuild of VARIANTS) {
    test(`research overbuild variant "${overbuild}": legal, pure and reproducible complete games`, () => {
        const play = (seed) => {
            const { state, logic } = createGame(E, { players: 3, seed });
            const aiRng = new E.SeededRandom(aiSeedFor(seed));
            let ownUnflipped = 0;
            for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
                if (d.type === 'shortfall') { logic.play(d.playerId, logic.defaultShortfallMove(d.playerId)); continue; }
                const before = ser(state);
                const move = logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng, { overbuild }));
                assert.equal(ser(state), before, 'choosing changed the state');
                if (move.type === 'build') {
                    const t = state.boardIndustries[`${move.location}_${move.slot}`];
                    if (t && t.playerId === d.playerId && !t.flipped) ownUnflipped++;
                }
                const r = logic.play(d.playerId, move);
                assert.ok(r.success, r.message);
                assert.deepEqual(checkInvariants(E, state), []);
            }
            return { final: ser(state), ownUnflipped };
        };
        const a = play(105);
        assert.equal(play(105).final, a.final, 'same seed, same game');
        if (overbuild === 'no-unflipped') assert.equal(a.ownUnflipped, 0);
    });
}
