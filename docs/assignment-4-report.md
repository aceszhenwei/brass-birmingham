# Assignment 4 — Engine-Controlled Game Progression and Headless Gameplay

**Goal.** Make the engine the authority over the whole game lifecycle, so a
complete game can run without the browser, with the UI and the AI acting only
as consumers.

**Out of scope.** No new AI strategies, difficulty levels, search or gameplay
features.

`index.html` still opens directly from disk, with no build step and no
dependencies. The architecture is documented in [`engine.md`](engine.md).

## 1. Architectural changes

### Before
Progression was split between the engine and the UI.
- **What the engine did.** `GameState.advanceTurn()` ended turns and rounds.
- **What `UIManager.completeAction` did:**
  - called `advanceTurn` and kept its result in a closure;
  - surfaced end-of-round notices;
  - resolved income shortfalls through its own prompt loop;
  - only then called `endCanalEra()` / `endGame()`;
  - computed the final tie-break itself.
- **The duplicate.** The headless test driver re-implemented that same sequence (`advance` + `resolveShortfalls`).
- **The gap.** Nothing stopped a move from being played out of turn except the UI.

### After

| Piece | Change |
|---|---|
| `js/progression.js` (new, ~160 lines, mixed into `GameLogic`) | `getCurrentDecision()`, `play(playerId, move)`, `getCurrentLegalMoves()`, `defaultShortfallMove()`, `runGame(choose)` |
| `GameState` | `isEraOver()`, `getFinalRanking()` (VP → income → money; full ties share a rank), `endGame()` refuses while a shortfall is pending, and the turn counter is reset when an era's last card is played |
| `UIManager` | `playMove` → `logic.play`; `completeAction` presents the returned events; a new `continueGame()` asks the engine for the next decision. `resolvePendingShortfalls` and `afterTurnAdvance` are gone, and the UI no longer calls `advanceTurn`, `endCanalEra` or `endGame` |
| Headless driver | Now only a move chooser around `logic.play`. All its turn, shortfall and era logic was deleted |

**What `play()` does.** It is the single entry point for every decision:
1. Validates that the move belongs to the decision that is due: the right player, and a turn action versus a shortfall decision.
2. Applies it through the Assignment 3 move engine.
3. Advances the game: turn end and hand refill, round end with income and turn order, shortfall decisions, era scoring and set-up, final scoring.
4. Returns `events`: `move`, `roundEnd`, `shortfall`, `eraEnd`, `gameEnd`, `turnStart`.

### Design decisions

- **No new state fields.** Everything progression needs can be worked out from the existing state:
  - whose turn it is (turn order and index);
  - the actions left;
  - a pending shortfall (negative money while owning tiles);
  - a due era end (all hands and the deck empty).

  As a result, the save format is unchanged (version 1). Clones and restored saves continue exactly, including the awkward case of a shortfall that falls on the Canal Era's final round, where era scoring has to wait for it.
- **Reuse, not rewrite.** The rule steps in `GameState` (`advanceTurn`, `endRound`, `endCanalEra`, `calculateEraScore`) were already correct and tested. `play()` sequences them; it doesn't replace them. They remain available as low-level primitives for focused unit tests.
- **Events instead of callbacks.** The engine reports what happened and the UI decides how to show it: log lines, the Canal scoring screen, the game-over table. That keeps the engine free of any presentation logic.
- **Same rules for every seat.** Human and AI seats differ only in who chooses the move. A test plays the same seed with every seat flagged human, then AI, and gets the same game.

## 2. Rulebook conformance of the lifecycle

| Step | Rulebook | Engine behaviour (tested) |
|---|---|---|
| Actions | 1 action each in the first Canal round, otherwise 2 (p.6) | `actionsLeft` in the decision; checked for every round of complete games |
| Hand refill | Refill to 8 after your turn; hands shrink once the deck is gone (p.6) | Tested |
| Turn order | Least money spent first; ties keep relative order (p.6) | Tested |
| Income | Paid at the end of each round, but not after the final round of the game (p.6) | `roundEnd.income` is `null` for the final round; tested |
| Shortfall | Sell tiles of your choice for half cost until covered, else lose 1 VP per £1 (p.6) | A pending decision that blocks everything else, era scoring included; tested across a save/restore |
| Era end | After the round in which the last cards are played: score links, then flipped tiles; Canal: remove Level I tiles, reset merchant beer, reshuffle and deal 8 (p.7) | Tested, including that tiles sold for a shortfall aren't scored |
| Winner | Most VP; ties by income level, then money; still tied = draw (p.7) | `getFinalRanking()`; tested |
| Rounds | 10 / 9 / 8 per era for 2 / 3 / 4 players (p.6) | Every simulated game |

## 3. Tests — 148 passing (was 135)

```
node --test test/*.test.js        # ~28 s
node scripts/simulate.js          # the large run below
```

**New: `progression.test.js` (12 tests).** It checks that:
- the engine reports the decision that is due;
- `play` rejects out-of-turn moves, the wrong decision type and invalid cards, without changing anything;
- the event sequence is correct: moves, round end (income paid, new turn order), turn start;
- **complete games run through the engine alone** for 2, 3 and 4 players, with:
  - exact round counts;
  - one action per seat in Canal round 1 and two in every other round;
  - one era end and one game end;
  - invariants after every move;
  - no moves accepted and none listed after the game ends;
- no income is paid after the final round;
- a shortfall in the last Canal round:
  - the era waits unscored;
  - a save taken at that moment restores into the same pending decision;
  - covering it, in both the original and the restored game, triggers scoring;
  - the sold tiles are not scored;
  - both games end identical;
- the final ranking applies VP, income and money tie-breaks, with shared ranks;
- human-flagged and AI-flagged seats produce an identical game;
- **saves taken at every lifecycle boundary** (each round end, shortfall and era end) for 2, 3 and 4 players restore and continue to the identical final state;
- `runGame` respects `maxMoves` and reports rejected moves.

**Also new:**
- `ui-choices.test.js` (+1, reworked): the UI hands progression to the engine. A played move advances the turn and the engine-driven `continueGame` announces it. Human shortfalls are prompted through the engine's decision, and AI seats' shortfalls are automatic, followed by their scheduled turn.
- **Invariants strengthened**, checked after every move of every simulated game:
  - the action count stays within the turn's allowance;
  - a finished era is only left unscored while a shortfall is pending;
  - the current player holds cards;
  - negative money only for a player with tiles to sell.

**Reworked to use the engine:** the turn-structure tests in `turns.test.js` now play through `logic.play`. Everything from Assignments 1–3 is retained: the 300-game bit-for-bit comparison with Assignment 1, clone/serialize continuation, legal-move soundness and completeness, fuzzing, and player choices.

## 4. Simulation results

`node scripts/simulate.js --games 100 --random 20 --mixed 30` (494 s) plus
`--games 200 --first 101 --no-a1 --random 0 --mixed 0` (301 s).

Every game is driven only through `getCurrentDecision` / `play`. Each AI game
is also cloned and JSON-saved part-way through: the original, the clone
(replaying the original's moves) and the restored save (the AI choosing again
with its restored random stream) must all finish byte-identical.

| Run | 2 players | 3 players | 4 players |
|---|---|---|---|
| AI games, seeds ×001–×100, difficulty easy/normal/hard by seed | 100/100 | 100/100 | 100/100 |
| …bit-for-bit identical to the recorded Assignment 1 games | 100/100 | 100/100 | 100/100 |
| **Mixed-difficulty games** (seats easy / normal / hard / normal) | 30/30 | 30/30 | 30/30 |
| Random legal-move games (all choices expanded, random shortfall decisions) | 20/20 | 20/20 | 20/20 |
| AI games, seeds ×101–×300 | 200/200 | 200/200 | 200/200 |

- **Totals:** 1,350 games with zero problems.
- **Termination:** every game terminated, with no stalls or loops (each run is bounded).
- **Rounds:** exactly 10 / 9 / 8 rounds per era in every game.
- **Failures:** no rejected moves; no broken invariants.
- **Clone and restore:** every clone and restored save finished identically.
- **Coverage of the random games:** up to 560 legal moves in a position and 329 random shortfall decisions.

### Behaviour compared with before

**Gameplay is unchanged:**
- all 300 recorded Assignment 1 games replay bit-for-bit under the engine-driven loop;
- game lengths (78 / 105 / 124 actions) and action mixes match Assignment 3 exactly.

**Changes found and investigated (all intended, none affects gameplay):**

| Change | Effect |
|---|---|
| A move played out of turn is now **rejected by the engine** | Before, only the UI prevented it; scenario tests that call `applyMove` directly are unaffected |
| The turn counter (`actionsThisTurn`) is reset when an era's last card is played | It used to stay at the final count while an end-of-Canal shortfall was pending or after the game ended. This state detail was found by the new progression invariant; it had no gameplay effect |
| Fully tied players now **share a rank** on the game-over table | Before, they were numbered 1, 2, … by sort position. The tie-break order itself (VP, income, money) is unchanged and now computed in the engine |
| The headless driver lets each AI seat play at its own difficulty | This is how the UI already ran mixed-difficulty games. Games with one difficulty for every seat are unaffected |

### The browser game (Playwright, through `index.html`)
- **1 human + 2 AI.** A full game was played by clicking:
  - the human built, linked, developed, took loans, scouted and passed;
  - the human answered **four Income Shortfall prompts** raised by the engine's decision;
  - the game passed the Canal scoring screen and reached the game-over table, with no console errors and no AI recoveries.
- **4 AI (spectator game).** It ran unattended through both eras:
  - the Canal scoring screen dismissed itself;
  - the game-over table showed the engine's ranking (`1 Dave 69 VP, 2 Carol 56, 3 Bob 30, 4 Alice 0`);
  - no errors.
- **Coal choice.** The Choose Coal dialog from Assignment 3 still works.

## 5. Remaining limitations

1. **Primitives are still public.** Low-level steps (`advanceTurn`, `endCanalEra`, `applyMove`, …) remain callable for focused tests. Real games must use `play`; this is documented, not enforced.
2. **Hidden information is not enforced for AIs.** The existing "hard" AI reads opponents' hands. Proper AIs should observe `getPlayerView(id)` and sample hidden cards when simulating.
3. **Performance.** A clone takes about 70 µs, and a full expanded `getLegalMoves` about 10–30 ms with up to ~560 moves. That is enough for thousands of rollouts per decision, but deep search will want lazy move generation or a cheaper move list (for example, merging equivalent card choices).
4. **Interpretations carried over.** Gloucester's free develop may be skipped (as before). Hot-seat human players can still see each other's hands when the turn changes (UI scope).
5. **Not built.** There is no save/load or undo UI, although the engine supports both through `serialize` / `clone`.

## 6. Is the codebase ready for dedicated AI development?

**Yes.** The planned engine refactor is complete, and testing revealed no
outstanding defects. An AI now has everything it needs from the engine:

| Need | Provided by |
|---|---|
| The decision to make | `getCurrentDecision()` |
| Every legal option, including resource and merchant choices | `getCurrentLegalMoves({ expandChoices })` |
| Hypothetical play without side effects | `state.clone()` + `new GameLogic(clone).play(...)` |
| Whole-game rollouts | `runGame(choose)` |
| Reproducible experiments | Seeds for the game and for the AI's own stream |
| Saving and replaying positions | `serialize` / `deserialize` |
| An outcome to optimise | `getFinalRanking()` and the scoring events |

**First design points for the AI work:**
- an information-set model built on `getPlayerView` (no peeking at hidden cards);
- an evaluation function;
- possibly faster move generation for deep search.

The 148-test suite and `scripts/simulate.js` provide the regression safety net
for that work.
