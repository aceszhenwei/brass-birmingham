'use strict';

// Assignment 10 (options.network / cards / sourcing / shortfall / develop).
// network 'double' and develop 'horizon' were adopted; the production AI is
// pinned by recorded games (test/fixtures/assignment10-baseline.json), the AI
// of Assignment 9 (AIPlayer.LEGACY_A9) by test/ai-invest.test.js. Each
// variant keeps play legal, pure and reproducible.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { createGame, aiSeedFor } = require('./helpers/headless');
const { checkInvariants } = require('./helpers/invariants');
const { playGame } = require('./helpers/headless');
const { fingerprint } = require('./helpers/fingerprint');
const baseline = require('./fixtures/assignment10-baseline.json');

const E = loadEngine();
const ser = (s) => JSON.stringify(s.serialize());
const VARIANTS = [{ network: 'single' }, { develop: 'a8' }, { cards: 'useful' }, { cards: 'buildable' }, { sourcing: 'own' }, { shortfall: 'value' }];
const WILD = [E.CARD_TYPES.WILD_LOCATION, E.CARD_TYPES.WILD_INDUSTRY];

// Play a complete game with the given options, calling visit(state, logic,
// decision, aiRng) before each turn decision
function walk(players, seed, opts, visit = null) {
    const { state, logic } = createGame(E, { players, seed });
    const aiRng = new E.SeededRandom(aiSeedFor(seed));
    for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
        if (d.type === 'shortfall') {
            const move = E.AIPlayer.chooseShortfall(state, logic, d.playerId, opts);
            assert.ok(logic.play(d.playerId, move).success);
            continue;
        }
        if (visit) visit(state, logic, d, aiRng);
        const r = logic.play(d.playerId, logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng, opts)));
        assert.ok(r.success, r.message);
    }
    return { state, logic };
}

test("the defaults are network 'double' and develop 'horizon'; LEGACY_A9 is single links and develop 'a8'", () => {
    const defaults = { network: 'double', develop: 'horizon', cards: 'first', sourcing: 'engine', shortfall: 'a9' };
    walk(3, 120, null, (state, logic, d, aiRng) => {
        const key = (opts) => JSON.stringify(logic.moveFromDecision(
            E.AIPlayer.chooseAction(state, logic, d.playerId, 'hard', aiRng.clone(), opts)));
        assert.equal(key(defaults), key(null));
        assert.equal(key(E.AIPlayer.LEGACY_A9), key({ network: 'single', develop: 'a8' }));
        assert.deepEqual(E.AIPlayer.chooseShortfall(state, logic, d.playerId, null), logic.defaultShortfallMove(d.playerId));
    });
});

test('double: two-link Networks only in the Rail Era, and only when legal', () => {
    let doubles = 0;
    for (const [players, seed] of [[2, 121], [3, 122], [4, 123]]) {
        walk(players, seed, { network: 'double' }, (state, logic, d, aiRng) => {
            const decision = E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng.clone(), { network: 'double' });
            const move = logic.moveFromDecision(decision);
            if (move.type === E.ACTIONS.NETWORK && move.links.length === 2) {
                doubles++;
                assert.equal(state.era, 'rail');
                assert.ok(logic.resolveMove(d.playerId, move).ok);
            }
        });
    }
    assert.ok(doubles > 0, 'some double links were built');
});

test('useful-cards: a discarding action never throws away a more useful card than it keeps', () => {
    let checked = 0;
    walk(3, 124, { cards: 'useful' }, (state, logic, d, aiRng) => {
        const move = logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng.clone(), { cards: 'useful' }));
        if (![E.ACTIONS.NETWORK, E.ACTIONS.DEVELOP, E.ACTIONS.SELL, E.ACTIONS.LOAN, E.ACTIONS.PASS].includes(move.type)) return;
        const hand = state.players[d.playerId].hand;
        const buildable = new Set();
        for (const t of logic.getValidBuildTargets(d.playerId)) {
            for (const i of logic.getValidCardsForAction(d.playerId, E.ACTIONS.BUILD, t)) buildable.add(i);
        }
        // A card usable for a build now is never discarded while a non-wild
        // card that cannot build is kept
        const dead = hand.some((c, i) => !WILD.includes(c.type) && !buildable.has(i));
        if (dead) assert.ok(!buildable.has(move.card), `discarded a buildable card: ${JSON.stringify(hand[move.card])}`);
        assert.ok(!WILD.includes(hand[move.card].type) || hand.every(c => WILD.includes(c.type)), 'never volunteers a wild');
        checked++;
    });
    assert.ok(checked > 20);
});

test('own-sources: takes its own coal, iron or beer where the rules allow a choice', () => {
    let ownChosen = 0;
    for (const [players, seed] of [[3, 125], [4, 126]]) {
        walk(players, seed, { sourcing: 'own' }, (state, logic, d, aiRng) => {
            const move = logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng.clone(), { sourcing: 'own' }));
            const r = logic.resolveMove(d.playerId, move);
            assert.ok(r.ok, r.message);
            for (const p of r.points) {
                if (!['coal', 'iron', 'beer'].includes(p.kind) || p.options.length < 2) continue;
                const isOwn = (v) => {
                    const key = String(v).split(/:(.*)/)[1];
                    const tile = key && (key.startsWith('farm_') ? state.breweryFarmTiles[key.slice(5)] : state.boardIndustries[key]);
                    return !!tile && tile.playerId === d.playerId;
                };
                if (p.options.some(isOwn) && isOwn(p.options[p.index])) ownChosen++;
            }
        });
    }
    assert.ok(ownChosen > 0);
});

test('value-shortfall: always sells one of the player\'s own tiles', () => {
    let shortfalls = 0;
    for (let seed = 127; seed < 135 && shortfalls === 0; seed++) {
        const { state, logic } = createGame(E, { players: 2, seed });
        const aiRng = new E.SeededRandom(aiSeedFor(seed));
        for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
            if (d.type === 'shortfall') {
                const move = E.AIPlayer.chooseShortfall(state, logic, d.playerId, { shortfall: 'value' });
                assert.ok(state.ownedTileKeys(d.playerId).includes(move.tile));
                assert.ok(logic.play(d.playerId, move).success);
                shortfalls++;
                continue;
            }
            logic.play(d.playerId, logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng)));
        }
    }
    assert.ok(shortfalls > 0);
});

for (const opts of VARIANTS) {
    test(`research variant ${JSON.stringify(opts)}: legal, pure and reproducible complete games`, () => {
        const play = (seed) => {
            const { state, logic } = createGame(E, { players: 3, seed });
            const aiRng = new E.SeededRandom(aiSeedFor(seed));
            for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
                const before = ser(state);
                const move = d.type === 'shortfall' ? E.AIPlayer.chooseShortfall(state, logic, d.playerId, opts)
                    : logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, d.playerId, 'normal', aiRng, opts));
                assert.equal(ser(state), before, 'choosing changed the state');
                const r = logic.play(d.playerId, move);
                assert.ok(r.success, r.message);
                assert.deepEqual(checkInvariants(E, state), []);
            }
            return ser(state);
        };
        assert.equal(play(128), play(128), 'same seed, same game');
    });
}

test('value-shortfall: handles farm breweries (the 2-player game that exposed the bug)', () => {
    const { playMatch } = require('../scripts/research/harness');
    for (const seats of [['normal%value-shortfall', 'normal'], ['normal', 'normal%value-shortfall']]) {
        const r = playMatch(E, { players: 2, seed: 202014, seats, detailed: false });
        assert.equal(r.ranking.length, 2);
    }
});

for (const players of [2, 3, 4]) {
    test(`${players} players: the production AI replays the recorded Assignment 10 games exactly`, () => {
        for (const g of baseline.games[players]) {
            const r = playGame({ players, seed: g.seed, difficulty: g.difficulty, E });
            assert.equal(fingerprint(r.state, { steps: r.steps, actions: r.actions }), g.fingerprint,
                `seed ${g.seed} (${g.difficulty}) no longer plays as recorded`);
        }
    });
}
