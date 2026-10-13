// ============================================================================
// Brass: Birmingham - AI planner (production since Assignment 12)
// ============================================================================
// Short-horizon planning on top of the heuristic AI (aiPlayer.js). For each
// decision the planner looks a few of the player's OWN actions ahead and plays
// the first action of the best plan; the next decision is planned afresh.
// It executes exactly one legal action per decision.
//
// Information: it works only on the player's observation
// (state.getObservation), so opponents' hands, the deck order and the game's
// random generator are never visible to it. Hypothetical actions are played
// on clones of that observation with logic.applyMove (the engine's own
// rule-checked execution, which does not advance the turn); the real game is
// never touched.
//
// Model (docs/research/ai-planning-a11.md, ai-planning-a12.md):
//   - Within the current turn the model is exact: the player's consecutive
//     actions with the cards in hand.
//   - Beyond the current turn it assumes opponents do nothing in between, no
//     income is paid and no cards are drawn (only cards in hand now can be
//     used); those actions' gains are discounted by `gamma`. No plan crosses
//     the end of an era.
//   - Candidates come from the heuristic (AIPlayer explain): the best move of
//     each action type plus the next-best builds and links. `widths[k]` are
//     kept at plan depth k (the last level takes the single best move).
//   - Evaluation 'state': the change in a static position value (VP, VP the
//     era's scoring would add now, expected VP of unflipped tiles, income and
//     money, in the heuristic's units). 'sum': the heuristic's action scores
//     added along the plan (research only).
//
// Budget: `maxStates` (deterministic) and `maxMs` (wall clock, a safety net).
// When either runs out the planner stops expanding and returns the best plan
// whose evaluation completed; if none did, the heuristic's best move. Either
// way the move is legal (it was applied successfully to a clone).
//
// AIPlanner.chooseAction(state, logic, playerId, difficulty, rng, opts) is the
// production entry point, with AIPlayer.chooseAction's signature: Easy plays
// the heuristic; Normal and Hard plan with AIPlanner.PRODUCTION.
// ============================================================================

const AIPlanner = (() => {
    const PRODUCTION = Object.freeze({ depth: 3, evaluate: 'state', widths: [6, 3], gamma: 0.6, maxMs: 2500, maxStates: Infinity });
    const DEFAULTS = Object.freeze({ depth: 2, evaluate: 'sum', widths: [6, 3], gamma: 0.6, maxMs: Infinity, maxStates: Infinity });
    const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
    const isWild = (c) => c.type === CARD_TYPES.WILD_LOCATION || c.type === CARD_TYPES.WILD_INDUSTRY;

    // Candidates kept at plan depth `level` (1-based) when `steps` actions
    // remain: the configured width, or 1 at the last level
    function widthAt(cfg, level, steps) {
        if (steps <= 1 && level > 1) return 1;
        const w = cfg.widths;
        return w[Math.min(level - 1, w.length - 1)];
    }

    // Static value of a position for a player (evaluate 'state'): VP so far,
    // the VP the era's scoring would add now (links and flipped tiles), the
    // expected VP and income of unflipped tiles (the heuristic's flip
    // probability), and income and money, in the heuristic's units. The
    // era scoring runs on a throwaway clone.
    function positionValueOf(state, logic, playerId, aiOptions = null) {
        const p = state.players[playerId];
        let expected = 0;
        for (const [key, tile] of Object.entries(state.boardIndustries)) {
            if (tile.playerId !== playerId || tile.flipped) continue;
            const cityId = key.split('_')[0];
            const prob = AIPlayer.research.flipProbability(state, logic, playerId, { industryType: tile.type, cityId, tileData: tile.tileData }, aiOptions);
            expected += prob * AIPlayer.research.vpEquivalent(state, { vp: tile.tileData.vp, income: tile.tileData.income }, aiOptions);
        }
        const scoring = state.clone().calculateEraScore().find(s => s.playerId === playerId);
        return p.vp + scoring.linkVP + scoring.industryVP + expected +
            AIPlayer.research.vpEquivalent(state, { income: state.getIncomeLevel(playerId), money: p.money }, aiOptions);
    }

    function plan(realState, playerId, config) {
        const cfg = { ...DEFAULTS, ...config };
        const aiOptions = { ...(cfg.aiOptions || {}), information: 'full', explain: true };
        const level = cfg.level || 'normal';
        const t0 = now();
        const run = { states: 0, timedOut: false };
        const outOfBudget = () => {
            if (run.timedOut) return true;
            if (run.states >= cfg.maxStates || now() - t0 >= cfg.maxMs) run.timedOut = true;
            return run.timedOut;
        };

        // The heuristic's candidate moves: [{ move, score }], best first
        function candidates(state, logic, width) {
            run.states++;
            const d = AIPlayer.chooseAction(state, logic, playerId, level, new SeededRandom(1), aiOptions);
            const out = [];
            const seen = new Set();
            const add = (move, score) => {
                const key = JSON.stringify(move);
                if (seen.has(key)) return;
                seen.add(key);
                out.push({ move, score });
            };
            const hand = state.players[playerId].hand;
            for (const c of d.explain.candidates) {
                if (c.cardIndex === undefined && c.action !== ACTIONS.SCOUT) continue;
                add(logic.moveFromDecision({ action: c.action, pendingData: c.pendingData, cardIndex: c.cardIndex }), c.score);
                if (c.action === ACTIONS.BUILD && c.builds) {
                    for (const b of [...c.builds].sort((x, y) => y.score - x.score).slice(1, 3)) {
                        const target = { cityId: b.cityId, slotIndex: b.slotIndex, industryType: b.industryType };
                        const valid = logic.getValidCardsForAction(playerId, ACTIONS.BUILD, target);
                        const nonWild = valid.find(i => !isWild(hand[i]));
                        const card = nonWild !== undefined ? nonWild : valid[0];
                        if (card === undefined) continue;
                        add({ type: ACTIONS.BUILD, card, location: b.cityId, slot: b.slotIndex, industry: b.industryType }, b.score);
                    }
                }
                if (c.action === ACTIONS.NETWORK && c.networks) {
                    for (const n of [...c.networks].sort((x, y) => y.score - x.score).slice(0, 2)) {
                        add({ type: ACTIONS.NETWORK, card: c.cardIndex, links: [n.connectionId] }, n.score);
                    }
                }
            }
            out.sort((a, b) => b.score - a.score);
            return out.slice(0, width);
        }

        const positionValue = (state, logic) => positionValueOf(state, logic, playerId, cfg.aiOptions);

        // Apply a move to a clone; null if it fails
        function after(state, move) {
            const s = state.clone();
            const l = new GameLogic(s);
            return l.applyMove(playerId, move).success ? { state: s, logic: l } : null;
        }

        const obs = realState.getObservation(playerId);
        const obsLogic = new GameLogic(obs);
        const ctx = { actionsLeft: obs.actionsPerTurn - obs.actionsThisTurn, lastRoundOfEra: obs.getRoundsRemaining() <= 1 };

        // Best value of continuing with `steps` more actions, the first being
        // action number `index` (1-based) of the plan. `base` is the position
        // value before it (evaluate 'state').
        function continuation(state, logic, steps, index, base) {
            if (steps <= 0 || state.players[playerId].hand.length === 0) return { value: 0, moves: [] };
            const beyondTurn = index > ctx.actionsLeft;
            if (beyondTurn && ctx.lastRoundOfEra) return { value: 0, moves: [] };
            const weight = beyondTurn ? cfg.gamma : 1;
            let best = null;
            for (const c of candidates(state, logic, widthAt(cfg, index, steps))) {
                if (outOfBudget()) break;
                let value;
                let moves = [c.move];
                if (cfg.evaluate === 'sum') {
                    value = weight * c.score;
                    if (steps > 1) {
                        const next = after(state, c.move);
                        if (!next) continue;
                        const rest = continuation(next.state, next.logic, steps - 1, index + 1, null);
                        value += rest.value;
                        moves = moves.concat(rest.moves);
                    }
                } else {
                    const next = after(state, c.move);
                    if (!next) continue;
                    const v1 = positionValue(next.state, next.logic);
                    value = weight * (v1 - base);
                    if (steps > 1) {
                        const rest = continuation(next.state, next.logic, steps - 1, index + 1, v1);
                        value += rest.value;
                        moves = moves.concat(rest.moves);
                    }
                }
                if (!best || value > best.value) best = { value, moves };
            }
            return best || { value: 0, moves: [] };
        }

        const roots = candidates(obs, obsLogic, widthAt(cfg, 1, cfg.depth));
        const base = cfg.evaluate === 'state' ? positionValue(obs, obsLogic) : 0;
        let best = null;
        let fallback = null;
        for (const c of roots) {
            if (best && outOfBudget()) break;
            const next = after(obs, c.move);
            if (!next) continue;
            if (!fallback) fallback = { value: -Infinity, plan: [c.move], complete: false };
            let value;
            let moves = [c.move];
            if (cfg.evaluate === 'sum') {
                value = c.score;
                if (cfg.depth > 1) {
                    const rest = continuation(next.state, next.logic, cfg.depth - 1, 2, null);
                    value += rest.value;
                    moves = moves.concat(rest.moves);
                }
            } else {
                const v1 = positionValue(next.state, next.logic);
                value = v1 - base;
                if (cfg.depth > 1) {
                    const rest = continuation(next.state, next.logic, cfg.depth - 1, 2, v1);
                    value += rest.value;
                    moves = moves.concat(rest.moves);
                }
            }
            // A plan whose evaluation the budget cut short is not compared
            if (run.timedOut && best) break;
            if (!best || value > best.value) best = { value, plan: moves, complete: !run.timedOut };
        }
        const chosen = best || fallback;
        if (!chosen) return null;
        return {
            move: chosen.plan[0], plan: chosen.plan, value: chosen.value,
            states: run.states, ms: now() - t0, timedOut: run.timedOut,
            heuristicFirst: roots.length > 0 && JSON.stringify(roots[0].move) === JSON.stringify(chosen.plan[0]),
        };
    }

    // Production entry point (AIPlayer.chooseAction's signature). opts.planner
    // overrides the plan configuration ('none' plays the heuristic);
    // the other opts go to the heuristic.
    function chooseAction(state, logic, playerId, difficulty = 'normal', rng = null, opts = null) {
        const { planner, ...heuristicOptions } = opts || {};
        const config = planner === undefined ? (difficulty === 'easy' ? null : PRODUCTION) : (planner === 'none' ? null : planner);
        if (!config) return AIPlayer.chooseAction(state, logic, playerId, difficulty, rng, opts ? heuristicOptions : null);
        const r = plan(state, playerId, { ...config, level: difficulty, aiOptions: Object.keys(heuristicOptions).length ? heuristicOptions : null });
        if (!r) return AIPlayer.chooseAction(state, logic, playerId, difficulty, rng, opts ? heuristicOptions : null);
        return { action: r.move.type, move: r.move, plan: r.plan, planStats: { states: r.states, ms: r.ms, timedOut: r.timedOut } };
    }

    return { chooseAction, plan, positionValue: positionValueOf, PRODUCTION, DEFAULTS };
})();
