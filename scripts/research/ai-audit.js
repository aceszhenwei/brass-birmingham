#!/usr/bin/env node
// Assignment 5: legality, fairness and decision-coverage probe for the
// existing AI (docs/research/ai-baseline-audit.md, section 2).
//
//   node scripts/research/ai-audit.js [--games 10] [--players 2,3,4] [--baseline a5|a6|a8]
//
// By default it probes the current AI; --baseline a5 probes the Assignment 5
// baseline (AIPlayer.LEGACY_A5), which reproduces the Assignment 5 tables, and
// --baseline a6 the AI of Assignments 6-7 (AIPlayer.LEGACY_A6, the Assignment 6 tables),
// --baseline a8 the AI of Assignment 8 (AIPlayer.LEGACY_A8).
//
// Plays all-AI games at each difficulty (seeds 1000*players + i, the same
// seeds as scripts/simulate.js) and, at EVERY AI decision, checks:
//   legal        the AI's move resolves to a legal move
//   pure         choosing did not change the game state (serialize() before = after)
//   hands        the decision changes if opponents' hands are replaced by a
//                random sample of the cards the player cannot see
//   deck         the decision changes if the draw deck is reshuffled
//   choices      the move leaves a real player choice (coal, iron, beer,
//                merchant, free develop) to the engine's default
//   double rail  in the Rail Era, a two-link Network was legal when the AI
//                built a single link (the AI never plans one)
//   corrections  (current AI only) the decision changes if the AI instead
//                reads the real state (information: 'full') or uses the
//                Assignment 5 rounds estimate (rounds: 'deck-estimate')
// Both what-if decisions use a copy of the AI's random stream, so they see
// the same noise as the real decision. The real game is never altered.

'use strict';

const { loadEngine } = require('../../test/helpers/engine');
const { withOpponentHands, aiSeedFor } = require('./harness');

function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : fallback;
}
const GAMES = Number(arg('games', 10));
const PLAYERS = String(arg('players', '2,3,4')).split(',').map(Number);
const E = loadEngine();
const BASELINES = { a5: E.AIPlayer.LEGACY_A5, a6: E.AIPlayer.LEGACY_A6, a8: E.AIPlayer.LEGACY_A8 };
const OPTIONS = BASELINES[arg('baseline', '')] || null;
const LEGACY = OPTIONS === E.AIPlayer.LEGACY_A5;   // no correction columns for the uncorrected AI

function probe(players, difficulty, seed, totals, examples) {
    const names = ['A', 'B', 'C', 'D'].slice(0, players);
    const state = new E.GameState(players, names, names.map(() => ({ isAI: true, difficulty })), { seed });
    const logic = new E.GameLogic(state);
    const aiRng = new E.SeededRandom(aiSeedFor(seed));
    const viewRng = new E.SeededRandom(seed * 7919 + 1);
    const key = (dec) => JSON.stringify(logic.moveFromDecision(dec));

    for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
        if (d.type === 'shortfall') {
            logic.play(d.playerId, logic.defaultShortfallMove(d.playerId));
            continue;
        }
        const id = d.playerId;
        const choose = (rng) => E.AIPlayer.chooseAction(state, logic, id, difficulty, rng, OPTIONS);

        // What-if decisions on copies of the AI's random stream
        const withHands = withOpponentHands(E, state, id, 'resample', viewRng, () => choose(aiRng.clone()));
        const savedDeck = state.drawDeck;
        state.drawDeck = viewRng.shuffle([...savedDeck]);
        let withDeck;
        try { withDeck = choose(aiRng.clone()); } finally { state.drawDeck = savedDeck; }

        // How often each Assignment 6 correction changes the decision here
        if (!LEGACY) {
            if (key(E.AIPlayer.chooseAction(state, logic, id, difficulty, aiRng.clone(), { ...OPTIONS, information: 'full' })) !==
                key(choose(aiRng.clone()))) totals.infoChanged++;
            if (key(E.AIPlayer.chooseAction(state, logic, id, difficulty, aiRng.clone(), { ...OPTIONS, rounds: 'deck-estimate' })) !==
                key(choose(aiRng.clone()))) totals.roundsChanged++;
        }

        // The real decision
        const before = JSON.stringify(state.serialize());
        const decision = choose(aiRng);
        const after = JSON.stringify(state.serialize());
        const move = logic.moveFromDecision(decision);
        const real = JSON.stringify(move);

        totals.decisions++;
        if (before !== after) totals.impure++;
        const resolved = logic.resolveMove(id, move);
        if (!resolved.ok) totals.illegal++;
        if (key(withHands) !== real) {
            totals.handSensitive++;
            if (examples.length < 3) {
                examples.push({ seed, players, era: state.era, round: state.round, player: id,
                    real: move, withSampledHands: logic.moveFromDecision(withHands) });
            }
        }
        if (key(withDeck) !== real) totals.deckSensitive++;

        // A real choice left to the engine's default?
        const next = logic.getNextChoice(id, move);
        if (next) totals.choices[next.kind] = (totals.choices[next.kind] || 0) + 1;
        if (next) totals.movesWithChoice++;

        if (move.type === 'network' && state.era === 'rail') {
            totals.railNetwork++;
            const double = logic.getLegalMoves(id).some(m => m.type === 'network' && m.links.length === 2);
            if (double) totals.doubleRailLegal++;
        }
        const r = logic.play(id, move);
        if (!r.success) throw new Error(`AI move rejected (seed ${seed}): ${r.message}`);
    }
}

const started = Date.now();
const extra = LEGACY ? '' : ' Changed by the information correction | Changed by the rounds correction |';
console.log('| Players | Difficulty | Decisions | Illegal | State changed | Changes with resampled opponent hands | Changes with reshuffled deck | Moves leaving a choice to the engine | Rail networks with a double link legal |' + extra);
console.log('|---|---|---|---|---|---|---|---|---|' + (LEGACY ? '' : '---|---|'));
const allExamples = {};
for (const players of PLAYERS) {
    for (const difficulty of ['easy', 'normal', 'hard']) {
        const totals = { decisions: 0, illegal: 0, impure: 0, handSensitive: 0, deckSensitive: 0,
            movesWithChoice: 0, choices: {}, railNetwork: 0, doubleRailLegal: 0, infoChanged: 0, roundsChanged: 0 };
        const examples = [];
        for (let i = 1; i <= GAMES; i++) probe(players, difficulty, 1000 * players + i, totals, examples);
        const pct = (n) => `${n} (${(100 * n / totals.decisions).toFixed(1)}%)`;
        const kinds = Object.entries(totals.choices).map(([k, n]) => `${k} ${n}`).join(', ');
        console.log(`| ${players} | ${difficulty} | ${totals.decisions} | ${totals.illegal} | ${totals.impure} | ` +
            `${pct(totals.handSensitive)} | ${pct(totals.deckSensitive)} | ${pct(totals.movesWithChoice)}${kinds ? ` (${kinds})` : ''} | ` +
            `${totals.doubleRailLegal} of ${totals.railNetwork} |` + (LEGACY ? '' : ` ${pct(totals.infoChanged)} | ${pct(totals.roundsChanged)} |`));
        if (examples.length) allExamples[`${players}p ${difficulty}`] = examples;
    }
}
console.log('\nExamples of decisions that depend on opponents\' hands:');
for (const [k, list] of Object.entries(allExamples)) {
    for (const ex of list.slice(0, 2)) console.log(`  ${k}: ${JSON.stringify(ex)}`);
}
console.log(`\n(${((Date.now() - started) / 1000).toFixed(1)}s)`);
