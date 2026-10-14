# Engine Architecture and Game Progression

Since Assignment 4 the game engine runs a whole Brass: Birmingham game on its
own, from setup to final scoring. The browser UI, the existing AI and the
headless tools are consumers: they ask the engine what decision is due, make
it, and present what happened. None of them advances the game themselves.

## Layers

| Layer | File | Responsibility |
|---|---|---|
| Data | `js/gameData.js` | Board, tiles, cards, merchants, markets (rulebook constants) |
| Randomness | `js/random.js` | `SeededRandom`: every shuffle, reproducible and serializable |
| State | `js/gameState.js` | The complete game state; low-level steps (income, turn order, era cleanup, scoring); clone / serialize / restore |
| Rules queries | `js/gameLogic.js` | Legal targets, costs and resource sources |
| Moves | `js/moves.js` | The move format, validation and player choices: `applyMove`, `getLegalMoves`, `getNextChoice` ([`moves.md`](moves.md)) |
| **Progression** | `js/progression.js` | **Who decides next, and everything that happens automatically: `getCurrentDecision`, `play`, `runGame`** |
| Consumers | `js/uiManager.js`, `js/aiPlayer.js`, `test/helpers/headless.js`, `scripts/simulate.js` | Present the game and choose moves |

## Playing a game through the engine

```js
const state = new GameState(3, ['Ann', 'Bob', 'Cy'], [], { seed: 42 });
const logic = new GameLogic(state);

logic.getCurrentDecision();
//   { type: 'action',    playerId, actionsLeft, era, round }
// | { type: 'shortfall', playerId, owed }
// | { type: 'gameOver',  ranking }

logic.getCurrentLegalMoves();          // legal moves for that decision
logic.play(playerId, move);            // -> { success, message, move, events }

// Or a whole game in one call, with any move-choosing function:
logic.runGame((decision, logic) => chooseSomeMove(decision, logic));
```

### What `play()` does

1. **Checks** that the move belongs to the decision that is due:
   - the right player;
   - a turn action during a turn, or a shortfall move while a shortfall is owed;
   - the game is not over.

   Anything else is rejected with no state change.
2. **Applies** the move through `applyMove` (validation and player choices, [`moves.md`](moves.md)).
3. **For a turn action, advances the game** (`GameState.advanceTurn`):
   - the action is counted;
   - when the player's actions are used up (one in Canal round 1, otherwise two), their hand is refilled to 8 and the next player in turn order takes over;
   - players without cards are skipped once the deck is exhausted;
   - after the last player in a round: income is paid (not after the final round of the game), a player who can't pay owes a **shortfall** decision (or loses VP if they have no tiles), and the turn order is re-sorted by money spent (ties keep their order).
4. **Settles anything automatic that is due.** Nothing here happens while a shortfall is pending:
   - when the last cards of the Canal Era have been played, the era is scored, canal links and Level I tiles are removed, merchant beer is refilled, and the deck is rebuilt and dealt;
   - when the last cards of the Rail Era have been played, the game is scored and ends.
5. **Reports events**, in order:

| Event | Fields | When |
|---|---|---|
| `move` | `playerId, move, message` | Always (the move as played, fully specified) |
| `roundEnd` | `era, round, income[] (null after the final round), turnOrder, notices[]` | A round ended |
| `shortfall` | `playerIds, owed` | Players must sell tiles to pay income |
| `eraEnd` | `era: 'canal', scores` | The Canal Era was scored and the Rail Era set up |
| `gameEnd` | `scores, ranking` | Final scoring |
| `turnStart` | `playerId, era, round` | A new player (or new round / era) is up |

### Rounds remaining

`state.getRoundsRemaining()` is the number of rounds left in the current era,
counting the round in progress:
- it is 10 / 9 / 8 in the first round of an era at 2 / 3 / 4 players (`ROUNDS_PER_ERA`), and 1 in the last;
- it is 0 once the era's cards are all played or the game is over.

The engine still ends an era by its cards; the count is what the deck sizes
produce, and the tests check it against the round ends of complete games.

### Final ranking

`state.getFinalRanking()` ranks by VP, then income level, then money
(rulebook p.7). Players tied on all three share the rank, which is a draw. The
game-over screen shows this ranking; before Assignment 4 it was computed in
the UI.

## No hidden progression state

Everything the progression layer needs is read from `GameState`, so a
cloned or restored game always continues exactly where it was:

| Question | Read from |
|---|---|
| Whose turn, actions left | `turnOrder`, `currentPlayerIndex`, `actionsThisTurn`, `actionsPerTurn` |
| Shortfall owed | A player's money below zero (only possible while they own tiles to sell) |
| Era end due | Every hand and the draw deck are empty (`state.isEraOver()`), and no shortfall is pending |
| Game over | `gameOver` |

**Example: a shortfall at the end of the Canal Era.** If the last Canal round
leaves a player unable to pay their income, the state rests in "shortfall
owed, era end due". A save taken at that moment restores into the same
situation. Covering the shortfall then triggers the Canal scoring, and
tiles sold to cover it are not scored.

## Headless games

There is no browser and no copy of the turn logic. The test driver
(`test/helpers/headless.js`) is only a move chooser around `logic.play`, and a
complete AI game is:

```js
const aiRng = new SeededRandom(seed ^ 0x9E3779B9);
logic.runGame((d, lg) => d.type === 'shortfall'
    ? lg.defaultShortfallMove(d.playerId)                       // the AI's (and UI's) automatic policy
    : lg.moveFromDecision(AIPlayer.chooseAction(state, lg, d.playerId, state.players[d.playerId].aiDifficulty, aiRng)));
```

Human and AI seats differ only in **who chooses**. The engine treats them
identically, and a test plays the same seed with every seat flagged as human,
then as AI, and gets the same game.

## The UI's role now

`UIManager` sends every decision, human or AI, through `playMove` → `logic.play`:

- **After every successful move** it presents the events: log entries, the Canal and Rail scoring reviews, then the game-over table. It then calls `continueGame()`, which asks `getCurrentDecision()` and:
  - prompts a human for a shortfall, or plays the automatic choice for an AI seat;
  - announces a new player's turn;
  - schedules the AI.
- **It never calls** `advanceTurn`, `endCanalEra` or `endGame` itself.

Low-level steps (`advanceTurn`, `endRound`, `endCanalEra`, `endGame`,
`applyMove`) remain available for tests that examine one step in isolation.
Real games should always go through `play`.

## UI undo and scoring inspection

The UI keeps independent snapshots before successful human actions that leave
the same turn active. Undo/reset restores a snapshot in place, preserving
references held by the logic and renderer, and restores the UI log. History
is cleared at turn, round and era boundaries. This uses the existing clone
API; the progression engine still owns every forward transition.

For a scoring review, the UI retains the engine's `eraEnd` and `gameEnd`
score results separately for Canal and Rail. It displays industry, link and
era totals without replaying moves or recalculating component scores.
