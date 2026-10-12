'use strict';

// Development and selling variants (Assignment 9), each measured against the
// Assignment 8 AI (sell 'a8', AIPlayer.LEGACY_A8). sell 'calibrated' was
// adopted; the AI of Assignment 9 (AIPlayer.LEGACY_A9) is pinned by recorded
// games (test/fixtures/assignment9-baseline.json). Assignment 10 later made
// develop 'horizon' the default (test/ai-close.test.js).

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { createGame, aiSeedFor } = require('./helpers/headless');
const { checkInvariants } = require('./helpers/invariants');
const { playGame } = require('./helpers/headless');
const { fingerprint } = require('./helpers/fingerprint');
const baseline = require('./fixtures/assignment9-baseline.json');

const E = loadEngine();
const ser = (s) => JSON.stringify(s.serialize());
const A9 = E.AIPlayer.LEGACY_A9;
const VARIANTS = [{ ...A9, develop: 'horizon', sell: 'a8' }, { ...A9, sell: 'calibrated' }, { ...A9, sell: 'connect' }];
const gameRoundsLeft = (state) => state.getRoundsRemaining() + (state.era === 'canal' ? E.ROUNDS_PER_ERA[state.numPlayers] : 0);

// Walk complete games played by the AI with the given options, calling
// visit(state, logic, decision, aiRng) before each turn
function walk(seeds, visit, playOptions = null) {
    for (const [players, seed] of seeds) {
        const { state, logic } = createGame(E, { players, seed });
        const aiRng = new E.SeededRandom(aiSeedFor(seed));
        for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
            if (d.type === 'shortfall') { logic.play(d.playerId, logic.defaultShortfallMove(d.playerId)); continue; }
            visit(state, logic, d, aiRng);
            assert.ok(logic.play(d.playerId, logic.moveFromDecision(
                E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng, playOptions))).success);
        }
    }
}

test('each variant changes only its own valuation, in the intended direction', () => {
    let lateDevelops = 0;
    let calibratedChanged = 0;
    let connectChanged = 0;
    walk([[2, 111], [3, 112], [4, 113]], (state, logic, d, aiRng) => {
        const cands = (opts) => E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng.clone(), { explain: true, ...opts }).explain.candidates;
        const base = cands(E.AIPlayer.LEGACY_A8);
        const score = (list, action) => (list.find(c => c.action === action) || {}).score;

        // horizon: no Develop in the game's last two rounds, nothing else changes
        const h = cands({ ...A9, develop: 'horizon', sell: 'a8' });
        if (gameRoundsLeft(state) <= 2) {
            if (score(base, 'develop') !== undefined) lateDevelops++;
            assert.equal(score(h, 'develop'), undefined);
        } else {
            assert.equal(score(h, 'develop'), score(base, 'develop'));
        }
        for (const a of ['build', 'network', 'sell', 'loan']) assert.equal(score(h, a), score(base, a));

        // calibrated: only sellable build targets that cannot be sold yet score lower
        const c = cands({ ...A9, sell: 'calibrated' });
        const bb = (base.find(x => x.action === 'build') || {}).builds || [];
        const cb = (c.find(x => x.action === 'build') || {}).builds || [];
        bb.forEach((b, i) => {
            // (Overbuilding an own sellable tile can score higher: the
            // calibrated, lower value of the tile being replaced is charged)
            if (b.replaces && b.replaces.own) return;
            if (['cottonMill', 'manufacturer', 'pottery'].includes(b.industryType)) {
                assert.ok(cb[i].score <= b.score);
                if (cb[i].score < b.score) calibratedChanged++;
            } else {
                assert.equal(cb[i].score, b.score);
            }
        });
        for (const a of ['network', 'develop', 'sell', 'loan']) assert.equal(score(c, a), score(base, a));

        // connect: only Network can score higher
        const n = cands({ ...A9, sell: 'connect' });
        if (score(base, 'network') !== undefined) {
            assert.ok(score(n, 'network') >= score(base, 'network'));
            if (score(n, 'network') > score(base, 'network')) connectChanged++;
        }
        for (const a of ['build', 'develop', 'sell', 'loan']) assert.equal(score(n, a), score(base, a));
    }, E.AIPlayer.LEGACY_A8);   // (the Assignment 8 AI leaves more tiles to connect)
    assert.ok(lateDevelops > 0 && calibratedChanged > 0 && connectChanged > 0,
        `variants exercised: ${lateDevelops}, ${calibratedChanged}, ${connectChanged}`);
});

test("the Assignment 9 AI is sell 'calibrated', and LEGACY_A8 is sell 'a8'", () => {
    walk([[3, 114]], (state, logic, d, aiRng) => {
        const key = (opts) => JSON.stringify(logic.moveFromDecision(
            E.AIPlayer.chooseAction(state, logic, d.playerId, 'hard', aiRng.clone(), opts)));
        assert.equal(key({ ...A9, sell: 'calibrated' }), key(A9));
        assert.equal(key(E.AIPlayer.LEGACY_A8), key({ ...A9, overbuild: 'opportunity', sell: 'a8' }));
    });
});

for (const players of [2, 3, 4]) {
    test(`${players} players: the Assignment 9 AI (LEGACY_A9) replays its recorded games exactly`, () => {
        for (const g of baseline.games[players]) {
            const r = playGame({ players, seed: g.seed, difficulty: g.difficulty, aiOptions: A9, E });
            assert.equal(fingerprint(r.state, { steps: r.steps, actions: r.actions }), g.fingerprint,
                `seed ${g.seed} (${g.difficulty}) no longer plays as recorded`);
        }
    });
}

for (const opts of VARIANTS) {
    test(`research variant ${JSON.stringify(opts)}: legal, pure and reproducible complete games`, () => {
        const play = (seed) => {
            const { state, logic } = createGame(E, { players: 3, seed });
            const aiRng = new E.SeededRandom(aiSeedFor(seed));
            for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
                if (d.type === 'shortfall') { logic.play(d.playerId, logic.defaultShortfallMove(d.playerId)); continue; }
                const before = ser(state);
                const move = logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng, opts));
                assert.equal(ser(state), before, 'choosing changed the state');
                if (opts.develop === 'horizon' && gameRoundsLeft(state) <= 2) assert.notEqual(move.type, 'develop');
                const r = logic.play(d.playerId, move);
                assert.ok(r.success, r.message);
                assert.deepEqual(checkInvariants(E, state), []);
            }
            return ser(state);
        };
        assert.equal(play(115), play(115), 'same seed, same game');
    });
}
