// Headless game driver for tests and simulations.
//
// Since Assignment 4 the ENGINE runs the game: getCurrentDecision() says who
// must decide what, and play() applies the move and performs every automatic
// step (turn and round ends, income, turn order, era scoring and set-up,
// final scoring). This driver only chooses moves — exactly like the browser
// UI does — so there is no turn-progression logic here to keep in sync.
//
// It is STRICT: any rejected move or engine exception is thrown with context
// (the interactive UI instead recovers from a failed AI action by passing).
//
// Randomness: the game draws from its own seeded generator (state.rng); the
// AI's difficulty noise draws from a separate seeded stream (aiRng), derived
// from the game seed exactly as UIManager does it. Same seed => same game.

'use strict';

const { loadEngine } = require('./engine');
const { checkInvariants } = require('./invariants');

class AIActionError extends Error {}

const aiSeedFor = (seed) => (seed ^ 0x9E3779B9) >>> 0;

// A new seeded game with all seats AI. `difficulty` is one level for every
// seat, or an array with one level per seat.
function createGame(E, { players = 3, seed = 1, difficulty = 'normal' } = {}) {
    const names = ['A', 'B', 'C', 'D'].slice(0, players);
    const levels = names.map((_, i) => (Array.isArray(difficulty) ? difficulty[i % difficulty.length] : difficulty));
    const state = new E.GameState(players, names, levels.map(d => ({ isAI: true, difficulty: d })), { seed });
    return { state, logic: new E.GameLogic(state) };
}

const copyMove = (m) => JSON.parse(JSON.stringify(m));

// Track rounds per era from the engine's events
function noteEvents(summary, events) {
    for (const ev of events) {
        if (ev.type === 'roundEnd') summary[ev.era === 'canal' ? 'canalRounds' : 'railRounds'] = ev.round;
    }
}

// Play moves on an existing game until it ends (or `maxActions` moves have
// been played). Turn actions come from the AI (with `aiRng`, each seat at
// its own difficulty unless `difficulty` overrides it); income
// shortfalls use `shortfallPolicy` (default: the engine's automatic policy,
// which is what the UI uses for AI seats). With `replay`, recorded moves are
// played instead. Every move played is pushed onto `record` if given.
// summary.steps / summary.actions count turn actions only (as in earlier
// assignments); summary.shortfalls counts shortfall decisions.
function playActions(E, state, logic, {
    aiRng = null, difficulty = null, chooseAction = null, aiOptions = null, shortfallPolicy = null, replay = null,
    record = null, maxActions = Infinity, maxSteps = 5000, checkEveryStep = true, summary = null, label = '',
} = {}) {
    summary = summary || { steps: 0, actions: {}, canalRounds: null, railRounds: null };
    summary.shortfalls = summary.shortfalls || 0;
    let played = 0;
    for (let d = logic.getCurrentDecision(); d.type !== 'gameOver' && played < maxActions; d = logic.getCurrentDecision()) {
        played++;
        const where = `era=${state.era} round=${state.round} player=${d.playerId} ${label}`;
        let move;
        if (replay) {
            move = replay.shift();
            if (!move) throw new AIActionError(`replay ran out of moves (${where})`);
        } else if (d.type === 'shortfall') {
            move = shortfallPolicy ? shortfallPolicy(state, logic, d.playerId) : logic.defaultShortfallMove(d.playerId);
        } else {
            try {
                // Each seat plays at its own difficulty (as in the UI) unless overridden
                const level = difficulty || state.players[d.playerId].aiDifficulty;
                move = logic.moveFromDecision((chooseAction || E.AIPlayer.chooseAction)(state, logic, d.playerId, level, aiRng, aiOptions));
            } catch (err) {
                throw new AIActionError(`AI threw while choosing (${where}): ${err.stack || err}`);
            }
        }
        if (record) record.push(copyMove(move));

        const result = logic.play(d.playerId, move);
        if (!result.success) {
            throw new AIActionError(`move rejected: ${JSON.stringify(move)} -> "${result.message}" (${where})`);
        }
        if (move.type === 'shortfall') {
            summary.shortfalls++;
        } else {
            if (++summary.steps > maxSteps) throw new AIActionError(`game did not terminate within ${maxSteps} actions ${label}`);
            summary.actions[move.type] = (summary.actions[move.type] || 0) + 1;
        }
        noteEvents(summary, result.events);

        if (checkEveryStep) {
            const problems = checkInvariants(E, state);
            if (problems.length) {
                throw new AIActionError(`invariant violated after ${move.type} (${where}):\n  ` + problems.join('\n  '));
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
// options.aiOptions is passed to AIPlayer.chooseAction (e.g. AIPlayer.LEGACY_A5,
// the AI as it was up to Assignment 5, which the recorded games come from).
function playGame({ players = 3, seed = 1, difficulty = 'normal', maxSteps = 5000, checkEveryStep = true,
    chooseAction = null, aiOptions = null, sharedRng = false, record = null, E = null } = {}) {
    E = E || loadEngine();
    const { state, logic } = createGame(E, { players, seed, difficulty });
    const aiRng = sharedRng ? state.rng : new E.SeededRandom(aiSeedFor(seed));
    const summary = { players, seed, steps: 0, actions: {}, canalRounds: null, railRounds: null };
    playActions(E, state, logic, {
        aiRng, chooseAction, aiOptions, record, maxSteps, checkEveryStep, summary, label: `(seed ${seed})`,
    });
    summary.vp = state.players.map(p => p.vp);
    summary.money = state.players.map(p => p.money);
    summary.state = state;
    summary.E = E;
    return summary;
}

// Play a whole game choosing at random among the legal moves for whatever
// decision is due (with every resource / merchant / bonus choice expanded) —
// including random shortfall decisions. Every listed move must be accepted
// by play() and the invariants must hold after every move.
function randomPlayout(E, { players = 3, seed = 1, expandChoices = true, checkEveryStep = true } = {}) {
    const { state, logic } = createGame(E, { players, seed });
    const rng = new E.SeededRandom((seed * 2654435761) >>> 0);
    const summary = { players, seed, actions: 0, moves: {}, maxLegalMoves: 0, canalRounds: null, railRounds: null };
    logic.runGame((d) => {
        const moves = logic.getCurrentLegalMoves({ expandChoices });
        if (moves.length === 0) throw new AIActionError(`no legal moves for player ${d.playerId} (seed ${seed})`);
        summary.maxLegalMoves = Math.max(summary.maxLegalMoves, moves.length);
        // Pick a move TYPE uniformly first, so builds, sales and links are
        // exercised as often as the far more numerous pass/scout variants
        const types = [...new Set(moves.map(m => m.type))];
        const type = types[rng.int(types.length)];
        const ofType = moves.filter(m => m.type === type);
        const move = ofType[rng.int(ofType.length)];
        summary.moves[move.type] = (summary.moves[move.type] || 0) + 1;
        if (move.type !== 'shortfall') summary.actions++;
        return move;
    }, {
        maxMoves: 5000,
        onMove: (result) => {
            noteEvents(summary, result.events);
            if (checkEveryStep) {
                const problems = checkInvariants(E, state);
                if (problems.length) throw new AIActionError(`invariant violated after ${JSON.stringify(result.move)} (seed ${seed}):\n  ${problems.join('\n  ')}`);
            }
        },
    });
    if (!state.gameOver) throw new AIActionError(`random game did not terminate (seed ${seed})`);
    summary.state = state;
    return summary;
}

// Clone/serialize continuation check (Assignment 2): play `checkpoint`
// moves, then take an in-memory clone and a JSON save. The original plays on
// with the AI (moves recorded); the clone replays exactly those moves; the
// restored save plays on with the AI itself, using the restored AI stream.
// All three must end in byte-identical states. Throws on any difference.
// Returns the original game's summary.
function continuationCheck(E, { players = 3, seed = 1, difficulty = 'normal', checkpoint = 20, checkEveryStep = true } = {}) {
    const label = `(seed ${seed}, checkpoint ${checkpoint})`;
    const { state, logic } = createGame(E, { players, seed, difficulty });
    const aiRng = new E.SeededRandom(aiSeedFor(seed));
    const summary = { players, seed, steps: 0, actions: {}, canalRounds: null, railRounds: null };
    playActions(E, state, logic, { aiRng, maxActions: checkpoint, checkEveryStep, summary, label });

    const clone = state.clone();
    const saved = JSON.stringify({ game: state.serialize(), ai: aiRng.getState() });
    if (JSON.stringify(clone.serialize()) !== JSON.stringify(state.serialize())) {
        throw new AIActionError(`clone differs from the original at the checkpoint ${label}`);
    }

    const moves = [];
    playActions(E, state, logic, { aiRng, record: moves, checkEveryStep, summary, label });

    playActions(E, clone, new E.GameLogic(clone), { replay: [...moves], checkEveryStep: false, label: `${label} [clone]` });

    const loaded = JSON.parse(saved);
    const restored = E.GameState.deserialize(loaded.game);
    const restoredMoves = [];
    playActions(E, restored, new E.GameLogic(restored), {
        aiRng: E.SeededRandom.fromState(loaded.ai), record: restoredMoves,
        checkEveryStep: false, label: `${label} [restored]`,
    });

    const final = JSON.stringify(state.serialize());
    if (JSON.stringify(clone.serialize()) !== final) throw new AIActionError(`clone ended differently ${label}`);
    if (JSON.stringify(restored.serialize()) !== final) throw new AIActionError(`restored game ended differently ${label}`);
    if (JSON.stringify(restoredMoves) !== JSON.stringify(moves)) {
        throw new AIActionError(`AI chose differently after restoring ${label}`);
    }

    summary.vp = state.players.map(p => p.vp);
    summary.state = state;
    return summary;
}

module.exports = { createGame, playActions, playGame, randomPlayout, continuationCheck, aiSeedFor, AIActionError };
