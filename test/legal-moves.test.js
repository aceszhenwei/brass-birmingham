'use strict';

// getLegalMoves / applyMove: every listed move is legal, every legal action
// the rules engine knows about is listed, and illegal moves are rejected
// without touching the state.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { createGame, playActions, aiSeedFor, randomPlayout } = require('./helpers/headless');

const E = loadEngine();
const ser = (state) => JSON.stringify(state.serialize());

// Positions from real AI games: every `step` actions, for each player count
function positions({ step = 9, games = [[2, 301], [3, 302], [4, 303]] } = {}) {
    const out = [];
    for (const [players, seed] of games) {
        const { state, logic } = createGame(E, { players, seed });
        const aiRng = new E.SeededRandom(aiSeedFor(seed));
        while (!state.gameOver) {
            out.push(state.clone());
            playActions(E, state, logic, { aiRng, maxActions: step });
        }
    }
    return out;
}
const POSITIONS = positions();

test('every listed move (all choice variants) applies successfully', () => {
    let checked = 0;
    for (const pos of POSITIONS.filter((_, i) => i % 3 === 0)) {
        const pid = pos.currentPlayerId;
        const moves = new E.GameLogic(pos).getLegalMoves(pid, { expandChoices: true });
        assert.ok(moves.length > 0);
        for (const move of moves) {
            const sim = pos.clone();
            const r = new E.GameLogic(sim).applyMove(pid, move);
            assert.equal(r.success, true, `${JSON.stringify(move)}: ${r.message}`);
            assert.deepEqual(r.move, move, 'a listed move is already fully specified');
            checked++;
        }
    }
    assert.ok(checked > 1000, `checked ${checked} moves`);
});

test('listed moves are unique and fully specified', () => {
    for (const pos of POSITIONS.filter((_, i) => i % 4 === 0)) {
        const logic = new E.GameLogic(pos);
        const pid = pos.currentPlayerId;
        for (const opts of [{}, { expandChoices: true }]) {
            const keys = logic.getLegalMoves(pid, opts).map(m => JSON.stringify(m));
            assert.equal(new Set(keys).size, keys.length, 'duplicate moves');
        }
        // Default listing = one completion per decision; expanded ⊇ default
        const expanded = new Set(logic.getLegalMoves(pid, { expandChoices: true }).map(m => JSON.stringify(m)));
        for (const m of logic.getLegalMoves(pid)) {
            assert.ok(expanded.has(JSON.stringify(m)), `default move missing from the expanded list: ${JSON.stringify(m)}`);
        }
    }
});

test('the action buttons and the move list agree (canPerformAction ⇔ a move of that type)', () => {
    for (const pos of POSITIONS) {
        const logic = new E.GameLogic(pos);
        const pid = pos.currentPlayerId;
        const types = new Set(logic.getLegalMoves(pid).map(m => m.type));
        for (const action of Object.values(E.ACTIONS)) {
            assert.equal(types.has(action), logic.canPerformAction(action, pid),
                `${action} at ${pos.era} round ${pos.round}`);
        }
    }
});

test('completeness: every target the rules queries offer appears as a move', () => {
    for (const pos of POSITIONS.filter((_, i) => i % 2 === 0)) {
        const logic = new E.GameLogic(pos);
        const pid = pos.currentPlayerId;
        const moves = logic.getLegalMoves(pid, { allCards: true });
        const has = (pred) => moves.some(pred);
        for (const t of logic.getValidBuildTargets(pid)) {
            for (const card of logic.getValidCardsForAction(pid, 'build', t)) {
                assert.ok(has(m => m.type === 'build' && m.card === card && m.location === t.cityId &&
                    m.slot === t.slotIndex && m.industry === t.industryType), `build ${t.cityId}/${t.slotIndex}`);
            }
        }
        for (const t of logic.getValidNetworkTargets(pid)) {
            assert.ok(has(m => m.type === 'network' && m.links.length === 1 && m.links[0] === t.connectionId));
            for (const s of logic.getValidSecondRailLinks(pid, t.connectionId)) {
                assert.ok(has(m => m.type === 'network' && m.links[0] === t.connectionId && m.links[1] === s.connectionId));
            }
        }
        for (const t of logic.getValidSellTargets(pid)) {
            assert.ok(has(m => m.type === 'sell' && m.sales.length === 1 && m.sales[0].tile === t.key), `sell ${t.key}`);
        }
        for (const t of logic.getDevelopableTypes(pid)) {
            if (logic.canDevelopTypes(pid, t.type).ok) {
                assert.ok(has(m => m.type === 'develop' && m.industries.length === 1 && m.industries[0] === t.type));
            }
        }
    }
});

test("the AI's decisions are always among the legal moves", () => {
    let checked = 0;
    for (const [players, seed] of [[2, 311], [3, 312], [4, 313]]) {
        const { state, logic } = createGame(E, { players, seed });
        const aiRng = new E.SeededRandom(aiSeedFor(seed));
        let n = 0;
        while (!state.gameOver) {
            const pid = state.currentPlayerId;
            if (n++ % 3 === 0) {
                const decision = E.AIPlayer.chooseAction(state, logic, pid, 'normal', aiRng.clone());
                const r = logic.resolveMove(pid, logic.moveFromDecision(decision));
                assert.equal(r.ok, true, r.message);
                // Orders with no effect are listed once: the three Scout cards,
                // and two different industries in one Develop — compare as sets
                const norm = (m) => JSON.stringify(
                    m.type === 'scout' ? { ...m, cards: [...m.cards].sort() }
                        : m.type === 'develop' ? { ...m, industries: [...m.industries].sort() } : m);
                const legal = new Set(logic.getLegalMoves(pid, { expandChoices: true, allCards: true }).map(norm));
                assert.ok(legal.has(norm(r.resolved)), `AI move not listed: ${JSON.stringify(r.resolved)}`);
                checked++;
            }
            playActions(E, state, logic, { aiRng, maxActions: 1 });
        }
    }
    assert.ok(checked > 80);
});

test('enumeration and validation never modify the state', () => {
    for (const pos of POSITIONS.filter((_, i) => i % 5 === 0)) {
        const before = ser(pos);
        const logic = new E.GameLogic(pos);
        const pid = pos.currentPlayerId;
        const moves = logic.getLegalMoves(pid, { expandChoices: true });
        for (const m of moves.slice(0, 50)) {
            logic.resolveMove(pid, m);
            logic.getNextChoice(pid, { ...m, card: undefined });
        }
        assert.equal(ser(pos), before);
    }
});

// Fuzz: perturb legal moves; whatever happens, a rejected move must leave the
// state byte-for-byte unchanged, and an accepted one must be fully legal.
test('fuzzed moves are either legal or rejected without any state change', () => {
    const rng = new E.SeededRandom(99);
    const pickFrom = (arr) => arr[rng.int(arr.length)];
    const junk = () => pickFrom([undefined, null, -1, 99, 'market', 'mine:nowhere_0', 'brewery:leek_0',
        'works:dudley_1', 'none', 'skip', 0, 1, 2, 'leek', 'birmingham', 'coalMine', [], {}, 'xyz']);
    let rejected = 0;
    let accepted = 0;
    for (const pos of POSITIONS.filter((_, i) => i % 2 === 0)) {
        const pid = pos.currentPlayerId;
        const moves = new E.GameLogic(pos).getLegalMoves(pid, { expandChoices: true });
        for (let k = 0; k < 15; k++) {
            const move = JSON.parse(JSON.stringify(pickFrom(moves)));
            // Mutate one field somewhere in the move
            const fields = [];
            const walk = (o, path) => {
                for (const [key, v] of Object.entries(o)) {
                    fields.push([...path, key]);
                    if (v && typeof v === 'object') walk(v, [...path, key]);
                }
            };
            walk(move, []);
            const path = pickFrom(fields);
            let o = move;
            for (const key of path.slice(0, -1)) o = o[key];
            o[path[path.length - 1]] = junk();

            const sim = pos.clone();
            const before = ser(sim);
            const r = new E.GameLogic(sim).applyMove(pid, move);
            if (r.success) {
                accepted++;
            } else {
                rejected++;
                assert.equal(ser(sim), before, `rejected move changed the state: ${JSON.stringify(move)}`);
            }
        }
    }
    assert.ok(rejected > 100, `rejected ${rejected}`);
    assert.ok(accepted > 10, `accepted ${accepted}`);
});

test('malformed and illegal moves are rejected with a reason', () => {
    const { state, logic } = createGame(E, { players: 3, seed: 7 });
    const pid = state.currentPlayerId;
    const before = ser(state);
    const bad = [
        null, 42, 'build', {}, { type: 'teleport', card: 0 },
        { type: 'pass' }, { type: 'pass', card: 8 }, { type: 'pass', card: 1.5 },
        { type: 'build', card: 0 }, { type: 'build', card: 0, location: 'london', slot: 0, industry: 'cottonMill' },
        { type: 'network', card: 0, links: [] }, { type: 'network', card: 0, links: ['nowhere'] },
        { type: 'network', card: 0, links: ['birmingham-nuneaton'] },
        { type: 'develop', card: 0, industries: [] }, { type: 'develop', card: 0, industries: ['pottery'] },
        { type: 'develop', card: 0, industries: ['coalMine', 'coalMine', 'coalMine'] },
        { type: 'sell', card: 0, sales: [] }, { type: 'sell', card: 0, sales: [{ tile: 'birmingham_0' }] },
        { type: 'scout', cards: [0, 0, 1] }, { type: 'scout', cards: [0, 1] },
        { type: 'shortfall', tile: 'birmingham_0' },
    ];
    for (const move of bad) {
        const r = logic.applyMove(pid, move);
        assert.equal(r.success, false, JSON.stringify(move));
        assert.ok(typeof r.message === 'string' && r.message.length > 0);
    }
    assert.equal(ser(state), before);
});

test('random legal-move games (every choice expanded) run to completion', () => {
    for (const [players, seed] of [[2, 401], [3, 402], [4, 403]]) {
        const g = randomPlayout(E, { players, seed });
        assert.equal(g.state.gameOver, true);
        assert.equal(g.canalRounds, { 2: 10, 3: 9, 4: 8 }[players]);
        assert.equal(g.railRounds, { 2: 10, 3: 9, 4: 8 }[players]);
    }
});
