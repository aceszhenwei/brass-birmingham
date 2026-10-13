#!/usr/bin/env node
// Assignment 13: trace one last-round decision of the production AI (the
// four-action planner) in self-play, to see why it left a scoring link unbuilt.
//
//   node scripts/research/ai-gap-trace.js [--players 4] [--seed 904002] [--player 0] [--round 8]
//
// At the given player's decisions in that Rail-Era round it prints: the plan
// chosen; the heuristic's candidate actions (the planner's root candidates
// come from these); the best single link by the planner's own position value;
// the position-value gain of the chosen plan and of alternatives (loan then
// link, link then the chosen sale); and where that link ranks among the links
// the heuristic scores (the planner takes the best three).
// Research only: the game and the AI are unchanged.

'use strict';

const { loadEngine } = require('../../test/helpers/engine');
const { aiSeedFor } = require('./harness');

function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? Number(process.argv[i + 1]) : fallback;
}
const E = loadEngine(); const A = E.ACTIONS;
const [players, seed, who, round] = [arg('players', 4), arg('seed', 904002), arg('player', 0), arg('round', 8)];
const CFG = { planner: { ...E.AIPlanner.PRODUCTION, maxMs: Infinity } };
const names = ['A','B','C','D'].slice(0, players);
const state = new E.GameState(players, names, names.map(() => ({ isAI: true, difficulty: 'normal' })), { seed });
const logic = new E.GameLogic(state); const rng = new E.SeededRandom(aiSeedFor(seed));
for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
  const id = d.playerId;
  if (d.type === 'shortfall') { logic.play(id, logic.defaultShortfallMove(id)); continue; }
  const dec = E.AIPlanner.chooseAction(state, logic, id, 'normal', rng, CFG);
  if (state.era === 'rail' && state.round === round && id === who) {
    const p = state.players[id];
    console.log(`decision: actions left ${state.actionsPerTurn - state.actionsThisTurn}, money £${p.money}, income ${state.getIncomeLevel(id)}, VP ${p.vp}, rounds left ${state.getRoundsRemaining()}`);
    console.log('plan:', JSON.stringify(dec.plan));
    const h = E.AIPlayer.chooseAction(state, logic, id, 'normal', new E.SeededRandom(1), { explain: true });
    console.log('heuristic candidates:', h.explain.candidates.map(c => `${c.action} ${c.score.toFixed(2)}`).join(', '));
    const obs = state.getObservation(id);
    const v0 = E.AIPlanner.positionValue(obs, new E.GameLogic(obs), id);
    const seq = (moves) => { const c = obs.clone(); const l = new E.GameLogic(c); for (const m of moves) { const r = l.applyMove(id, m); if (!r.success) return 'illegal: ' + r.message; } return (E.AIPlanner.positionValue(c, l, id) - v0).toFixed(2); };
    const links = logic.getValidNetworkTargets(id).slice(0, 40);
    const card = 0, card2 = 0;
    const best = links.map(n => ({ n, v: seq([{ type: A.NETWORK, card, links: [n.connectionId] }]) })).sort((a, b) => b.v - a.v)[0];
    console.log('best single link by position value:', best.n.connectionId, best.v);
    console.log('[plan as chosen]:', seq(dec.plan.slice(0, state.actionsPerTurn - state.actionsThisTurn)));
    console.log('[loan, link]:', seq([{ type: A.LOAN, card }, { type: A.NETWORK, card: card2, links: [best.n.connectionId] }]));
    console.log('[link, then the chosen sale]:', seq([{ type: A.NETWORK, card, links: [best.n.connectionId] }, dec.plan[1] || dec.plan[0]]));
    const hn = (h.explain.candidates.find(c => c.action === 'network') || {}).networks || [];
    const rank = [...hn].sort((x, y) => y.score - x.score).findIndex(x => x.connectionId === best.n.connectionId);
    console.log(`heuristic rank of ${best.n.connectionId} among ${hn.length} links: ${rank + 1} (score ${(hn.find(x => x.connectionId === best.n.connectionId) || {}).score?.toFixed(2)})`);
    console.log('[link, loan]:', seq([{ type: A.NETWORK, card, links: [best.n.connectionId] }, { type: A.LOAN, card: card2 }]));
  }
  logic.play(id, logic.moveFromDecision(dec));
}
