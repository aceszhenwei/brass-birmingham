// Assignment 11: experimental short-horizon planner (research only; the game
// never loads this file, and the production AI is unchanged).
//
// The planner chooses the current action by looking at what the player could
// do next. It works ONLY on the player's observation (state.getObservation),
// so it never sees opponents' hands, the deck order or the game's random
// generator.
//
// Hypothetical model (documented assumptions):
//   - A plan is a sequence of the player's OWN actions, applied to clones of
//     the observation with logic.applyMove (legal, rule-checked moves that
//     do not advance the turn).
//   - Within the current turn (the actions the player has left) the model is
//     exact: nobody else moves between them.
//   - Actions beyond the current turn assume opponents do nothing in between,
//     no income is paid and no cards are drawn: only the cards in hand now
//     can be used. Their value is discounted by `gamma`, and they are not
//     planned across the end of an era (Canal links and Level I tiles go).
//   - Candidate actions come from the production heuristic (explain): the
//     best move of each action type, plus the next-best builds and links.
//     Follow-ups at the last level are the heuristic's single best move.
//
// Evaluation (config.evaluate):
//   'sum'    the heuristic's own action scores, added along the plan
//            (follow-ups discounted by gamma beyond the current turn)
//   'state'  the change in a static position value V after the plan (see
//            positionValue), the gain beyond the turn discounted by gamma
//
// config: { depth: 1|2|3, width: first-level candidates, width2: second-level
//           candidates (depth 3), evaluate, gamma, level, aiOptions }
// depth 1 is the control: the same candidates and evaluation, no lookahead.

'use strict';

const DEFAULTS = { depth: 2, width: 6, width2: 3, evaluate: 'sum', gamma: 0.6, level: 'normal', aiOptions: null };

function createPlanner(E, config = {}) {
    const cfg = { ...DEFAULTS, ...config };
    const A = E.ACTIONS;
    const stats = { decisions: 0, states: 0, ms: 0, maxMs: 0, changed: 0, plans: [] };

    // The heuristic's candidate moves in `state` for `id`: [{ move, score, action }]
    function candidates(state, logic, id, width) {
        stats.states++;
        const d = E.AIPlayer.chooseAction(state, logic, id, cfg.level, new E.SeededRandom(1),
            { ...(cfg.aiOptions || {}), information: 'full', explain: true });
        const out = [];
        const seen = new Set();
        const add = (move, score, action) => {
            const key = JSON.stringify(move);
            if (seen.has(key)) return;
            seen.add(key);
            out.push({ move, score, action });
        };
        const hand = state.players[id].hand;
        const isWild = (c) => c.type === E.CARD_TYPES.WILD_LOCATION || c.type === E.CARD_TYPES.WILD_INDUSTRY;
        for (const c of d.explain.candidates) {
            if (c.cardIndex === undefined && c.action !== A.SCOUT) continue;
            add(logic.moveFromDecision({ action: c.action, pendingData: c.pendingData, cardIndex: c.cardIndex }), c.score, c.action);
            // Next-best builds and links
            if (c.action === A.BUILD && c.builds) {
                for (const b of [...c.builds].sort((x, y) => y.score - x.score).slice(1, 3)) {
                    const target = { cityId: b.cityId, slotIndex: b.slotIndex, industryType: b.industryType };
                    const valid = logic.getValidCardsForAction(id, A.BUILD, target);
                    const card = valid.find(i => !isWild(hand[i])) ?? valid[0];
                    if (card === undefined) continue;
                    add({ type: A.BUILD, card, location: b.cityId, slot: b.slotIndex, industry: b.industryType }, b.score, A.BUILD);
                }
            }
            if (c.action === A.NETWORK && c.networks) {
                for (const n of [...c.networks].sort((x, y) => y.score - x.score).slice(0, 2)) {
                    add({ type: A.NETWORK, card: c.cardIndex, links: [n.connectionId] }, n.score, A.NETWORK);
                }
            }
        }
        out.sort((a, b) => b.score - a.score);
        return out.slice(0, width);
    }

    // Static value of a position for player id (evaluate 'state'): VP so
    // far, VP the era's scoring would add now (links and flipped tiles), the
    // expected VP of unflipped tiles (the heuristic's flip probability), and
    // income and money in the heuristic's own units. Uses a throwaway clone.
    function positionValue(state, logic, id) {
        const p = state.players[id];
        let expected = 0;
        for (const [key, tile] of Object.entries(state.boardIndustries)) {
            if (tile.playerId !== id || tile.flipped) continue;
            const cityId = key.split('_')[0];
            const prob = E.AIPlayer.research.flipProbability(state, logic, id, { industryType: tile.type, cityId, tileData: tile.tileData }, cfg.aiOptions);
            expected += prob * E.AIPlayer.research.vpEquivalent(state, { vp: tile.tileData.vp, income: tile.tileData.income }, cfg.aiOptions);
        }
        const scoring = state.clone().calculateEraScore().find(s => s.playerId === id);
        return p.vp + scoring.linkVP + scoring.industryVP + expected +
            E.AIPlayer.research.vpEquivalent(state, { income: state.getIncomeLevel(id), money: p.money }, cfg.aiOptions);
    }

    // Apply a move to a clone; null if it fails
    function after(state, id, move) {
        const s = state.clone();
        const l = new E.GameLogic(s);
        const r = l.applyMove(id, move);
        return r.success ? { state: s, logic: l } : null;
    }

    // Best value of continuing from (state) with `steps` more actions, the
    // first of which is action number `index` (1-based) of the plan
    function continuation(state, logic, id, steps, index, ctx, base) {
        if (steps <= 0 || state.players[id].hand.length === 0) return { value: 0, moves: [] };
        const beyondTurn = index > ctx.actionsLeft;
        if (beyondTurn && ctx.lastRoundOfEra) return { value: 0, moves: [] };
        const weight = beyondTurn ? cfg.gamma : 1;
        const width = steps >= 2 ? cfg.width2 : 1;
        let best = null;
        for (const c of candidates(state, logic, id, width)) {
            let value;
            let moves = [c.move];
            if (cfg.evaluate === 'sum') {
                value = weight * c.score;
                if (steps > 1) {
                    const next = after(state, id, c.move);
                    if (!next) continue;
                    const rest = continuation(next.state, next.logic, id, steps - 1, index + 1, ctx, null);
                    value += rest.value;
                    moves = moves.concat(rest.moves);
                }
            } else {
                const next = after(state, id, c.move);
                if (!next) continue;
                value = weight * (positionValue(next.state, next.logic, id) - base);
                if (steps > 1) {
                    const v1 = positionValue(next.state, next.logic, id);
                    const rest = continuation(next.state, next.logic, id, steps - 1, index + 1, ctx, v1);
                    value += rest.value;
                    moves = moves.concat(rest.moves);
                }
            }
            if (!best || value > best.value) best = { value, moves };
        }
        return best || { value: 0, moves: [] };
    }

    // Choose a move for the decision of player `id` in the REAL game `state`
    function choose(state, id) {
        const t0 = process.hrtime.bigint();
        const obs = state.getObservation(id);
        const logic = new E.GameLogic(obs);
        const ctx = {
            actionsLeft: obs.actionsPerTurn - obs.actionsThisTurn,
            lastRoundOfEra: obs.getRoundsRemaining() <= 1,
        };
        const roots = candidates(obs, logic, id, cfg.width);
        const base = cfg.evaluate === 'state' ? positionValue(obs, logic, id) : 0;
        let best = null;
        for (const c of roots) {
            const next = after(obs, id, c.move);
            if (!next) continue;
            let value;
            let plan = [c.move];
            if (cfg.evaluate === 'sum') {
                value = c.score;
                if (cfg.depth > 1) {
                    const rest = continuation(next.state, next.logic, id, cfg.depth - 1, 2, ctx, null);
                    value += rest.value;
                    plan = plan.concat(rest.moves);
                }
            } else {
                const v1 = positionValue(next.state, next.logic, id);
                value = v1 - base;
                if (cfg.depth > 1) {
                    const rest = continuation(next.state, next.logic, id, cfg.depth - 1, 2, ctx, v1);
                    value += rest.value;
                    plan = plan.concat(rest.moves);
                }
            }
            if (!best || value > best.value) best = { value, plan, heuristicFirst: c === roots[0] };
        }
        const ms = Number(process.hrtime.bigint() - t0) / 1e6;
        stats.decisions++;
        stats.ms += ms;
        stats.maxMs = Math.max(stats.maxMs, ms);
        if (!best) return null;
        if (!best.heuristicFirst) stats.changed++;
        return { move: best.plan[0], plan: best.plan, value: best.value, ms };
    }

    return { choose, positionValue, stats, config: cfg };
}

module.exports = { createPlanner, DEFAULTS };
