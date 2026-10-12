// Headless game driver for tests and simulations.
//
// Mirrors UIManager.processActionStep/completeAction (turn advance, era
// transitions, Gloucester bonus auto-resolution for AI) without a DOM.
// Unlike the interactive UI — which recovers from a failed AI action by
// passing — this driver is STRICT: any failed action or engine exception is
// thrown with context, so tests expose AI/engine disagreements instead of
// hiding them.

'use strict';

const { loadEngine } = require('./engine');
const { checkInvariants } = require('./invariants');

class AIActionError extends Error {}

// Apply an AI decision ({ action, pendingData, cardIndex }) exactly as the UI
// would. Returns the engine result object.
function applyDecision(E, state, logic, playerId, decision) {
    const A = E.ACTIONS;
    const pd = decision.pendingData || {};
    switch (decision.action) {
        case A.BUILD:
            return logic.executeBuild(playerId, pd.cityId, pd.slotIndex, pd.industryType, decision.cardIndex);
        case A.NETWORK:
            return pd.connectionId2
                ? logic.executeNetworkDouble(playerId, pd.connectionId, pd.connectionId2, decision.cardIndex)
                : logic.executeNetwork(playerId, pd.connectionId, decision.cardIndex);
        case A.DEVELOP:
            return logic.executeDevelop(playerId, pd.industryType1, pd.industryType2, decision.cardIndex);
        case A.SELL:
            return logic.executeSell(playerId, pd.sellPlan, decision.cardIndex, { autoResolveDevelop: true });
        case A.LOAN:
            return logic.executeLoan(playerId, decision.cardIndex);
        case A.SCOUT:
            return logic.executeScout(playerId, [...(pd.scoutCards || []), decision.cardIndex]);
        case A.PASS:
            return logic.executePass(playerId, decision.cardIndex);
        default:
            return { success: false, message: `unknown action ${decision.action}` };
    }
}

// Advance after a successful action; handles era end / game end like the UI.
function advance(state) {
    const result = state.advanceTurn();
    if (result === 'endCanalEra') {
        const roundsPlayed = state.round - 1;
        state.endCanalEra();
        return { event: 'endCanalEra', roundsPlayed };
    }
    if (result === 'endGame') {
        const roundsPlayed = state.round - 1;
        state.endGame();
        return { event: 'endGame', roundsPlayed };
    }
    return { event: null };
}

// Play one complete AI-vs-AI game. Throws on any failure or (when
// checkEveryStep) any invariant violation.
// options.chooseAction replaces the AI's decision function (used by tests to
// inject a bad decision and prove failures are reported, not hidden).
function playGame({ players = 3, seed = 1, difficulty = 'normal', maxSteps = 5000, checkEveryStep = true,
    chooseAction = null } = {}) {
    const E = loadEngine({ seed });
    const names = ['A', 'B', 'C', 'D'].slice(0, players);
    const state = new E.GameState(players, names, names.map(() => ({ isAI: true, difficulty })));
    const logic = new E.GameLogic(state);

    const summary = { players, seed, steps: 0, actions: {}, canalRounds: null, railRounds: null };

    while (!state.gameOver) {
        if (++summary.steps > maxSteps) {
            throw new AIActionError(`game did not terminate within ${maxSteps} actions (seed ${seed})`);
        }
        const playerId = state.currentPlayerId;
        const before = `era=${state.era} round=${state.round} player=${playerId}`;

        let decision;
        try {
            decision = (chooseAction || E.AIPlayer.chooseAction)(state, logic, playerId, difficulty);
        } catch (err) {
            throw new AIActionError(`AI threw while choosing (${before}, seed ${seed}): ${err.stack || err}`);
        }
        const result = applyDecision(E, state, logic, playerId, decision);
        if (!result || !result.success) {
            throw new AIActionError(
                `AI action failed: ${decision.action} ${JSON.stringify(decision.pendingData)} ` +
                `-> "${result && result.message}" (${before}, seed ${seed})`);
        }
        summary.actions[decision.action] = (summary.actions[decision.action] || 0) + 1;

        const { event, roundsPlayed } = advance(state);
        if (event === 'endCanalEra') summary.canalRounds = roundsPlayed;
        if (event === 'endGame') summary.railRounds = roundsPlayed;

        if (checkEveryStep) {
            const problems = checkInvariants(E, state);
            if (problems.length) {
                throw new AIActionError(`invariant violated after ${decision.action} (${before}, seed ${seed}):\n  ` +
                    problems.join('\n  '));
            }
        }
    }

    summary.vp = state.players.map(p => p.vp);
    summary.money = state.players.map(p => p.money);
    summary.state = state;
    return summary;
}

module.exports = { applyDecision, advance, playGame, AIActionError };
