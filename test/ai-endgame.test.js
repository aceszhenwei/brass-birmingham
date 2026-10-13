'use strict';

// Assignment 14: the planner's endgame cash valuation (endgame 'tiebreak')
// and scoring-link candidates (scoringLinks), docs/research/ai-endgame-evaluation-a14.md.
// The fixture holds two positions from Assignment 13 (human-strategy-a13.md,
// section 9.1) where the Assignment 12 production planner took a last-round
// loan while a link scoring several VP was affordable.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const fixture = require('./fixtures/assignment14-endgame.json');
const LAST = fixture.positions.filter(f => f.actionsThisTurn === 0);

const E = loadEngine();
const A12 = { ...E.AIPlanner.PRODUCTION, endgame: 'a12', scoringLinks: false, maxMs: Infinity };
const ENDGAME = { ...A12, endgame: 'tiebreak' };
const LINKS = { ...A12, scoringLinks: true };
const BOTH = { ...A12, endgame: 'tiebreak', scoringLinks: true };

const load = (f) => { const state = E.GameState.deserialize(f.state); return { state, logic: new E.GameLogic(state) }; };
const scoreNow = (state, id) => {
    const s = state.clone().calculateEraScore().find(x => x.playerId === id);
    return state.players[id].vp + s.linkVP + s.industryVP;
};
// Play the player's last turn with `cfg`: the moves and the score at its end
function playLastTurn(f, cfg) {
    const { state, logic } = load(f);
    const moves = [];
    while (!state.gameOver && state.currentPlayerId === f.player) {
        const r = E.AIPlanner.plan(state, f.player, cfg);
        moves.push(r.move);
        assert.ok(logic.play(f.player, r.move).success);
    }
    return { moves, score: scoreNow(state, f.player), money: state.players[f.player].money };
}

test('the fixture positions still show the Assignment 12 behaviour: a loan first', () => {
    for (const f of LAST) {
        const { state } = load(f);
        assert.equal(state.getRoundsRemaining(), 1);
        assert.equal(JSON.stringify(E.AIPlanner.plan(state, f.player, A12).plan), JSON.stringify(f.productionPlan));
    }
});

test('endgame, scoring links and both: no last-round loan, and more VP than the Assignment 12 planner', () => {
    for (const f of LAST) {
        const base = playLastTurn(f, A12);
        assert.equal(base.moves[0].type, E.ACTIONS.LOAN);
        for (const cfg of [ENDGAME, LINKS, BOTH]) {
            const r = playLastTurn(f, cfg);
            assert.ok(r.moves.every(m => m.type !== E.ACTIONS.LOAN), `seed ${f.seed}: ${JSON.stringify(r.moves)}`);
            assert.ok(r.score >= base.score + 2, `seed ${f.seed}: ${r.score} vs ${base.score}`);
        }
    }
});

test('scoring links: the 8 VP link the heuristic ranked 5th is searched and built (seed 904002)', () => {
    const f = LAST.find(p => p.seed === 904002);
    for (const cfg of [LINKS, BOTH]) {
        const r = playLastTurn(f, cfg);
        assert.ok(r.moves.some(m => m.type === E.ACTIONS.NETWORK && m.links.includes('derby-uttoxeter')));
    }
});

test('after the last action of the game, income and money only break ties', () => {
    const f = LAST[0];
    const { state, logic } = load(f);
    const id = f.player;
    const value = (final) => E.AIPlanner.positionValue(state, logic, id, null, final);
    const [usual, final] = [value(false), value(true)];
    state.players[id].money += 100;
    assert.ok(Math.abs(value(true) - final - 0.001) < 1e-9);
    assert.ok(value(false) - usual > 10);
    // An income level outweighs any realistic amount of money, and both stay far below 1 VP
    state.players[id].money -= 100;
    const level = state.getIncomeLevel(id);
    state.players[id].incomeSpace += 10;
    const levels = state.getIncomeLevel(id) - level;
    assert.ok(levels > 0);
    assert.ok(Math.abs(value(true) - final - 0.01 * levels) < 1e-9);
});

test('endgame: plans stop at the end of the game (second action of a penultimate-round turn)', () => {
    const f = fixture.positions.find(p => p.actionsThisTurn === 1);
    const { state } = load(f);
    assert.equal(state.getRoundsRemaining(), 2);
    // 1 action left in this turn, 2 in the last: never a fourth
    for (const cfg of [ENDGAME, BOTH]) assert.ok(E.AIPlanner.plan(state, f.player, cfg).plan.length <= 3);
});

test('options off reproduce the Assignment 12 planner', () => {
    for (const f of fixture.positions) {
        const { state } = load(f);
        const { endgame, scoringLinks, ...legacy } = A12;
        assert.equal(JSON.stringify(E.AIPlanner.plan(state, f.player, legacy).plan), JSON.stringify(E.AIPlanner.plan(state, f.player, A12).plan));
    }
});

test('GameState.linkValue agrees with era scoring', () => {
    for (const f of fixture.positions) {
        const { state } = load(f);
        const scores = state.clone().calculateEraScore();
        for (const p of state.players) {
            const own = Object.entries(state.boardLinks).filter(([, l]) => l.playerId === p.id).reduce((a, [id]) => a + state.linkValue(id), 0);
            assert.equal(own, scores.find(s => s.playerId === p.id).linkVP);
        }
    }
});
