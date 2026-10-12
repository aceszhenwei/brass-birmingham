// Headless game driver for tests and simulations.
//
// Mirrors UIManager.processActionStep/completeAction (turn advance, era
// transitions, Gloucester bonus auto-resolution for AI) without a DOM.
// Unlike the interactive UI — which recovers from a failed AI action by
// passing — this driver is STRICT: any failed action or engine exception is
// thrown with context, so tests expose AI/engine disagreements instead of
// hiding them.
//
// Randomness: the game draws from its own seeded generator (state.rng); the
// AI's difficulty noise draws from a separate seeded stream (aiRng), derived
// from the game seed exactly as UIManager does it. Same seed => same game.

'use strict';

const { loadEngine } = require('./engine');
const { checkInvariants } = require('./invariants');

class AIActionError extends Error {}

const aiSeedFor = (seed) => (seed ^ 0x9E3779B9) >>> 0;

// Apply a decision ({ action, pendingData, cardIndex }) exactly as the UI
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

// A new seeded game with all seats AI.
function createGame(E, { players = 3, seed = 1, difficulty = 'normal' } = {}) {
    const names = ['A', 'B', 'C', 'D'].slice(0, players);
    const state = new E.GameState(players, names, names.map(() => ({ isAI: true, difficulty })), { seed });
    return { state, logic: new E.GameLogic(state) };
}

const copyDecision = (d) => JSON.parse(JSON.stringify(d));

// Play actions on an existing game until it ends (or `maxActions` have been
// played). Decisions come from the AI (with `aiRng`) unless `replay` supplies
// a list of recorded decisions. Every decision applied is pushed onto
// `record` if given. Updates and returns `summary`.
function playActions(E, state, logic, {
    aiRng = null, difficulty = 'normal', chooseAction = null, replay = null, record = null,
    maxActions = Infinity, maxSteps = 5000, checkEveryStep = true, summary = null, label = '',
} = {}) {
    summary = summary || { steps: 0, actions: {}, canalRounds: null, railRounds: null };
    let played = 0;
    while (!state.gameOver && played < maxActions) {
        if (++summary.steps > maxSteps) {
            throw new AIActionError(`game did not terminate within ${maxSteps} actions ${label}`);
        }
        played++;
        const playerId = state.currentPlayerId;
        const where = `era=${state.era} round=${state.round} player=${playerId} ${label}`;

        let decision;
        if (replay) {
            decision = replay.shift();
            if (!decision) throw new AIActionError(`replay ran out of decisions (${where})`);
        } else {
            try {
                decision = (chooseAction || E.AIPlayer.chooseAction)(state, logic, playerId, difficulty, aiRng);
            } catch (err) {
                throw new AIActionError(`AI threw while choosing (${where}): ${err.stack || err}`);
            }
        }
        if (record) record.push(copyDecision(decision));

        const result = applyDecision(E, state, logic, playerId, decision);
        if (!result || !result.success) {
            throw new AIActionError(
                `AI action failed: ${decision.action} ${JSON.stringify(decision.pendingData)} ` +
                `-> "${result && result.message}" (${where})`);
        }
        summary.actions[decision.action] = (summary.actions[decision.action] || 0) + 1;

        const { event, roundsPlayed } = advance(state);
        if (event === 'endCanalEra') summary.canalRounds = roundsPlayed;
        if (event === 'endGame') summary.railRounds = roundsPlayed;

        if (checkEveryStep) {
            const problems = checkInvariants(E, state);
            if (problems.length) {
                throw new AIActionError(`invariant violated after ${decision.action} (${where}):\n  ` +
                    problems.join('\n  '));
            }
        }
    }
    return summary;
}

// Play one complete AI-vs-AI game. Throws on any failure or (when
// checkEveryStep) any invariant violation.
// options.chooseAction replaces the AI's decision function (used by tests to
// inject a bad decision and prove failures are reported, not hidden).
// options.sharedRng makes the AI draw from the GAME's generator, which
// reproduces the single-stream randomness of the Assignment 1 harness (used
// only to compare behaviour against Assignment 1).
function playGame({ players = 3, seed = 1, difficulty = 'normal', maxSteps = 5000, checkEveryStep = true,
    chooseAction = null, sharedRng = false, record = null, E = null } = {}) {
    E = E || loadEngine();
    const { state, logic } = createGame(E, { players, seed, difficulty });
    const aiRng = sharedRng ? state.rng : new E.SeededRandom(aiSeedFor(seed));
    const summary = { players, seed, steps: 0, actions: {}, canalRounds: null, railRounds: null };
    playActions(E, state, logic, {
        aiRng, difficulty, chooseAction, record, maxSteps, checkEveryStep, summary, label: `(seed ${seed})`,
    });
    summary.vp = state.players.map(p => p.vp);
    summary.money = state.players.map(p => p.money);
    summary.state = state;
    summary.E = E;
    return summary;
}

// Clone/serialize continuation check (Assignment 2): play `checkpoint`
// actions, then take an in-memory clone and a JSON save. The original plays
// on with the AI (decisions recorded); the clone replays exactly those
// decisions; the restored save plays on with the AI itself, using the restored
// AI stream. All three must end in byte-identical states. Throws on any
// difference. Returns the original game's summary.
function continuationCheck(E, { players = 3, seed = 1, difficulty = 'normal', checkpoint = 20, checkEveryStep = true } = {}) {
    const label = `(seed ${seed}, checkpoint ${checkpoint})`;
    const { state, logic } = createGame(E, { players, seed, difficulty });
    const aiRng = new E.SeededRandom(aiSeedFor(seed));
    const summary = { players, seed, steps: 0, actions: {}, canalRounds: null, railRounds: null };
    playActions(E, state, logic, { aiRng, difficulty, maxActions: checkpoint, checkEveryStep, summary, label });

    const clone = state.clone();
    const saved = JSON.stringify({ game: state.serialize(), ai: aiRng.getState() });
    if (JSON.stringify(clone.serialize()) !== JSON.stringify(state.serialize())) {
        throw new AIActionError(`clone differs from the original at the checkpoint ${label}`);
    }

    const decisions = [];
    playActions(E, state, logic, { aiRng, difficulty, record: decisions, checkEveryStep, summary, label });

    playActions(E, clone, new E.GameLogic(clone), { replay: [...decisions], checkEveryStep: false, label: `${label} [clone]` });

    const loaded = JSON.parse(saved);
    const restored = E.GameState.deserialize(loaded.game);
    const restoredDecisions = [];
    playActions(E, restored, new E.GameLogic(restored), {
        aiRng: E.SeededRandom.fromState(loaded.ai), difficulty, record: restoredDecisions,
        checkEveryStep: false, label: `${label} [restored]`,
    });

    const final = JSON.stringify(state.serialize());
    if (JSON.stringify(clone.serialize()) !== final) throw new AIActionError(`clone ended differently ${label}`);
    if (JSON.stringify(restored.serialize()) !== final) throw new AIActionError(`restored game ended differently ${label}`);
    if (JSON.stringify(restoredDecisions) !== JSON.stringify(decisions)) {
        throw new AIActionError(`AI chose differently after restoring ${label}`);
    }

    summary.vp = state.players.map(p => p.vp);
    summary.state = state;
    return summary;
}

module.exports = { applyDecision, advance, createGame, playActions, playGame, continuationCheck, aiSeedFor, AIActionError };
