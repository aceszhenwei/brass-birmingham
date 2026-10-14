// Research wrapper around the planner (js/aiPlanner.js, AIPlanner.plan).
//
// Assignment 11 built the planner here; Assignment 12 moved it into the game
// as js/aiPlanner.js, unchanged in behaviour, and this file now only adapts
// the research configuration and records statistics. The model and its
// assumptions are documented in js/aiPlanner.js.
//
// config: { depth: 1-4, width: first-level candidates, width2: candidates at
//           every later level but the last (or widths: [w1, w2, w3]),
//           evaluate: 'sum' | 'state', gamma, level, aiOptions,
//           maxStates, maxMs, endgame, scoringLinks (Assignment 14) }
// Candidates come from the heuristic AI of Assignment 10 (aiOptions are passed
// to it). Depth 1 is the control: the same candidates and evaluation, no
// lookahead.

'use strict';

const DEFAULTS = { depth: 2, width: 6, width2: 3, evaluate: 'sum', gamma: 0.6, level: 'normal', aiOptions: null };

function createPlanner(E, config = {}) {
    const cfg = { ...DEFAULTS, ...config };
    const widths = cfg.widths || [cfg.width, cfg.width2];
    const planConfig = {
        depth: cfg.depth, evaluate: cfg.evaluate, widths, gamma: cfg.gamma, level: cfg.level, aiOptions: cfg.aiOptions,
        maxStates: cfg.maxStates === undefined ? Infinity : cfg.maxStates, maxMs: cfg.maxMs === undefined ? Infinity : cfg.maxMs,
        endgame: cfg.endgame || 'a12', scoringLinks: !!cfg.scoringLinks,
    };
    const stats = { decisions: 0, states: 0, ms: 0, maxMs: 0, changed: 0, timedOut: 0, times: [] };

    // Choose a move for the decision of player `id` in the REAL game `state`
    function choose(state, id) {
        const t0 = process.hrtime.bigint();
        const r = E.AIPlanner.plan(state, id, planConfig);
        const ms = Number(process.hrtime.bigint() - t0) / 1e6;
        stats.decisions++;
        stats.ms += ms;
        stats.maxMs = Math.max(stats.maxMs, ms);
        stats.times.push(ms);
        if (!r) return null;
        stats.states += r.states;
        if (r.timedOut) stats.timedOut++;
        if (!r.heuristicFirst) stats.changed++;
        return { move: r.move, plan: r.plan, value: r.value, ms, states: r.states, timedOut: r.timedOut };
    }

    const positionValue = (state, logic, id) => E.AIPlanner.positionValue(state, logic, id, cfg.aiOptions);
    return { choose, positionValue, stats, config: cfg };
}

module.exports = { createPlanner, DEFAULTS };
