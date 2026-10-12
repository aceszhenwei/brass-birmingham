// ============================================================================
// Brass: Birmingham - Game Progression (engine-controlled lifecycle)
// ============================================================================
// The engine decides whose decision is next and performs every automatic
// step of the game itself. A whole game is played with two calls:
//
//   logic.getCurrentDecision()
//       -> { type: 'action',    playerId, actionsLeft, era, round }
//        | { type: 'shortfall', playerId, owed }
//        | { type: 'gameOver',  ranking }
//   logic.play(playerId, move)
//       -> { success, message, move, events }
//
// play() checks that the move belongs to the decision that is due, applies it
// through the move engine (js/moves.js, applyMove), then advances the game:
//   - the turn ends when the player's actions are used up (hand refilled);
//   - the round ends when everyone has had a turn: income, then turn order
//     by money spent;
//   - players who can't pay income owe a 'shortfall' decision — nothing else
//     happens (not even era scoring) until it is covered;
//   - the era ends after the round in which the last cards are played: it is
//     scored, and either the Rail Era is set up or the game ends with final
//     scoring and the ranking (VP, then income, then money).
// Everything that happened is returned as `events` for the UI to present.
//
// Nothing here is stored outside GameState: whose turn it is, the actions
// left, pending shortfalls (negative money) and a due era end (all hands and
// the deck empty) are all read from the state, so a cloned or restored game
// continues exactly where it was.
// ============================================================================

const Progression = {

    // The decision the game is waiting for
    getCurrentDecision() {
        const state = this.state;
        if (state.gameOver) return { type: 'gameOver', ranking: state.getFinalRanking() };
        const pending = state.getPendingShortfalls();
        if (pending.length > 0) {
            const playerId = state.turnOrder.find(id => pending.includes(id));
            return { type: 'shortfall', playerId, owed: -state.players[playerId].money };
        }
        return {
            type: 'action',
            playerId: state.currentPlayerId,
            actionsLeft: state.actionsPerTurn - state.actionsThisTurn,
            era: state.era,
            round: state.round,
        };
    },

    // Legal moves for the decision that is due ([] when the game is over)
    getCurrentLegalMoves(options = {}) {
        const d = this.getCurrentDecision();
        return d.type === 'gameOver' ? [] : this.getLegalMoves(d.playerId, options);
    },

    // Play a move for the player whose decision is due, then advance the
    // game. Illegal or out-of-turn moves are rejected with no state change.
    play(playerId, move) {
        const state = this.state;
        const decision = this.getCurrentDecision();
        const fail = (message) => ({ success: false, message, events: [] });
        if (decision.type === 'gameOver') return fail('The game is over');
        if (playerId !== decision.playerId) {
            const who = state.players[decision.playerId].name;
            return fail(decision.type === 'shortfall'
                ? `${who} must first cover an income shortfall` : `It is ${who}'s turn`);
        }
        const isShortfall = !!move && move.type === MOVE_SHORTFALL;
        if (decision.type === 'shortfall' && !isShortfall) return fail('Cover your income shortfall first');
        if (decision.type === 'action' && isShortfall) return fail('You have no income shortfall to cover');

        const before = { round: state.round, era: state.era, turnPlayer: state.currentPlayerId };
        const result = this.applyMove(playerId, move);
        if (!result.success) return { ...result, events: [] };

        const events = [{ type: 'move', playerId, move: result.move, message: result.message }];
        if (!isShortfall) this.endAction(events);
        this.settle(events);

        // Announce whose turn it is when it changed (or a new era began)
        const next = this.getCurrentDecision();
        if (next.type === 'action' && (next.playerId !== before.turnPlayer || state.era !== before.era ||
            state.round !== before.round)) {
            events.push({ type: 'turnStart', playerId: next.playerId, era: state.era, round: state.round });
        }
        return { ...result, events };
    },

    // After an action: count it, end the turn / round as needed
    endAction(events) {
        const state = this.state;
        const round = state.round;
        const era = state.era;
        // Income is paid at the income level held at the end of the round
        const levels = state.players.map(p => state.getIncomeLevel(p.id));
        state.lastRoundEvents = [];
        state.advanceTurn();
        if (state.round !== round) {
            const finalRound = era === ERA.RAIL && state.isEraOver();
            events.push({
                type: 'roundEnd',
                era,
                round,
                income: finalRound ? null : levels,      // no income after the last round of the game
                turnOrder: [...state.turnOrder],
                notices: state.lastRoundEvents.map(e => ({ ...e })),
            });
            const pending = state.getPendingShortfalls();
            if (pending.length > 0) {
                events.push({ type: 'shortfall', playerIds: pending,
                    owed: pending.map(id => -state.players[id].money) });
            }
        }
    },

    // Run the automatic steps that are due: era scoring and transition, and
    // final scoring. Waits while an income shortfall is pending.
    settle(events) {
        const state = this.state;
        while (!state.gameOver && state.getPendingShortfalls().length === 0 && state.isEraOver()) {
            if (state.era === ERA.CANAL) {
                const scores = state.endCanalEra();
                events.push({ type: 'eraEnd', era: ERA.CANAL, scores });
            } else {
                const scores = state.endGame();
                events.push({ type: 'gameEnd', scores, ranking: state.getFinalRanking() });
            }
        }
    },

    // The automatic shortfall choice used for AI seats (and as a default):
    // unflipped tiles before flipped ones, then the lowest VP.
    defaultShortfallMove(playerId) {
        return { type: MOVE_SHORTFALL, tile: this.state.defaultShortfallTile(playerId) };
    },

    // Play a complete game (or until maxMoves) without any UI:
    // choose(decision, logic) must return a move for decision.playerId.
    // onMove(result, decision) is called after every successful move.
    // Throws if a chosen move is rejected. Returns { moves, ranking }.
    runGame(choose, { maxMoves = 10000, onMove = null } = {}) {
        let moves = 0;
        for (let d = this.getCurrentDecision(); d.type !== 'gameOver'; d = this.getCurrentDecision()) {
            if (moves >= maxMoves) break;
            moves++;
            const move = choose(d, this);
            const result = this.play(d.playerId, move);
            if (!result.success) {
                throw new Error(`move rejected for player ${d.playerId} (${d.type}): ${result.message} — ${JSON.stringify(move)}`);
            }
            if (onMove) onMove(result, d);
        }
        return { moves, ranking: this.state.gameOver ? this.state.getFinalRanking() : null };
    },
};

Object.assign(GameLogic.prototype, Progression);
