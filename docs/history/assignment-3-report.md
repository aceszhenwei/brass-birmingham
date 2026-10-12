# Assignment 3 — Unified Legal Actions and Player Decision-Making

**Goal.** One reliable, rule-compliant decision interface for human players,
the existing AI and future AI opponents, with every choice the rulebook grants
to the player actually given to the player.

**Out of scope.** No new AI algorithms, no turn/era flow refactor, and no
rendering, styling or artwork changes.

`index.html` still opens directly from disk, with no build step and no
dependencies. The move format and choice rules are documented in
[`moves.md`](../moves.md).

## 1. Architectural changes and design decisions

### Before
- **Spread-out rules.** Each action had its own validation inside its `execute*` method, plus separate query functions (`getValidBuildTargets`, `planSell`, `runDoubleRail`, `canDevelopTypes`, …). Assignment 1 had added validation inside each executor, so an action's rules lived in two or three places.
- **No single list of moves.** There was no single description of "a move" and no way to list every legal move.
- **Choices made by the engine.** Coal ties, iron works, beer, merchant and shortfall tiles were decided automatically by the engine.
- **UI-only state.** Gloucester's free develop was asked after the sale through UI-only state.

### After

| Component | Role |
|---|---|
| **Move format** (`moves.md`) | Plain JSON for each of the seven actions plus `shortfall`. Every rules-granted choice is an optional field |
| **Planners** (`js/moves.js`), one per move type | Validate a move and work out what it consumes **without changing the state**, using a ledger for consumption earlier in the same move. Each rules choice is a *choice point* whose options are exactly the legal ones at that moment |
| **`resolveMove`** | Validates given choices and completes missing ones: defaults first, then a depth-first search over alternatives if the defaults fail. Can also return every completion |
| **`applyMove`** | Resolve, then execute the plan. Atomic: an illegal move leaves the state byte-for-byte unchanged |
| **`getLegalMoves`** | Every legal move, with choices completed, or all choice variants with `expandChoices` |
| **`getNextChoice`** | The next decision to put to a human, with only viable options |
| **`execute*` wrappers** (`js/gameLogic.js`) | The old entry points, kept so the existing UI paths, the AI and all earlier tests keep working. Each builds a move and calls `applyMove` |
| **Shortfall decisions** (`js/gameState.js`) | Income shortfalls are pending player decisions instead of automatic sales |

**Why one planner per move type, used four ways** (validation, completion,
expansion, prompting): it is the simplest way to guarantee that what the UI
offers, what `getLegalMoves` lists, what the AI may play and what `applyMove`
accepts are always the same set. There is no second copy of any rule to drift
apart. That drift was the root cause of A1/A2 in Assignment 1.

**Why choices are optional fields with engine completion:**
- Existing callers (the AI and the old wrappers) keep working unchanged.
- Defaults reproduce the previous automatic choices exactly. As a result, all 300 recorded Assignment 1 games still replay bit-for-bit, even though every action now goes through the new engine.
- A caller can still specify any subset of choices; anything it specifies is validated, never silently replaced.

**Why search on completion:** some combinations only work with non-default
choices. For example, in a two-tile sale the first tile should drink the
merchant's barrel so the second can have the only brewery barrel it can
reach. The search makes `applyMove` accept every move that has at least one
legal completion. The search is bounded at 4,000 planner runs; real positions
need at most a few dozen.

**Why a mixin file.** `js/moves.js` adds its methods to `GameLogic` with
`Object.assign`. This keeps the existing classic-script layout, with no
modules and no build, and keeps the move engine readable on its own.
`gameLogic.js` shrank from 1,268 to 676 lines; `moves.js` is about 1,000.

### Small supporting change: shortfalls as pending decisions
- **Why it was needed.** Restoring the shortfall choice required a minimal touch to round progression.
- **What `endRound` does now.** It leaves a player who owns tiles with negative money (the pending decision). It applies the VP penalty at once only when there is nothing to choose.
- **What is blocked.** No other move can be played while a shortfall is pending, and `endCanalEra()` refuses to score the era.
- **Who settles it.**
  - The UI and the headless driver settle shortfalls right after `advanceTurn`, before the next turn or era scoring. This is where the old code resolved them.
  - Human players are prompted.
  - AI seats use the previous automatic policy, via `state.defaultShortfallTile`.
- **No new state.** No new field is needed: the decision is derived from negative money. Saves taken during a pending shortfall restore correctly; the validator was updated to accept negative money only for a player who owns tiles.

Moving turn and era flow into the engine remains Assignment 4.

## 2. Player choices restored (rulebook check)

| Audit | Rulebook | Now |
|---|---|---|
| B1 Coal tie (builds) | "If multiple Coal Mines are equally close, choose one" (p.8) | Player chooses among the closest mines. A farther mine or the market is rejected while a closer mine has coal |
| B2 Iron works | "Any unflipped Iron Works … does not have to be the closest … each iron from a different Iron Works" (p.8) | Player chooses any works with iron, per unit. The market only when no works has iron |
| B3 Beer | Own breweries (no connection), connected opponents', or the barrel beside the merchant tile sold to; "each beer may be consumed from a different source" (p.8) | Player chooses each barrel |
| B4 Merchant | Sell to a connected merchant tile showing the good; "if there is a beer barrel … you may consume this beer" (p.10) | Player chooses the merchant tile (drinking its barrel and taking its bonus) or no merchant beer |
| B5 Shortfall | "You may remove any of your Industry tiles, but must stop as soon as you have acquired enough money" (p.6) | Player chooses each tile, one at a time, until covered |
| Gloucester bonus | "Remove 1 of the lowest level tiles of any industry … cannot remove a Pottery tile showing a lightbulb" (p.10) | Chosen as part of the Sell move (`freeDevelop`), never a lightbulb tile. *Interpretation:* skipping it is allowed, as before |
| Double-rail beer | Brewery beer only; an opponent's must be connected to the second link (p.11) | Player chooses among eligible breweries |
| Rail coal tie (A4) | As B1, measured from the link | Unchanged from Assignment 2, now through the same choice mechanism |

**UI changes:**
- **Choice dialogs.** After choosing a target, a human player sees a dialog for each decision that has more than one viable option: Choose Coal, Choose Iron, Choose Beer, Choose Merchant, or Merchant Bonus: Free Develop. Each option shows the owner and the cubes left, or the merchant's bonus.
- **Sell dialog.** Its "use merchant beer" checkbox is replaced by the merchant choice.
- **Shortfall prompt.** After a round, an Income Shortfall prompt lists the player's tiles with their sale value.
- **Existing styling.** The dialogs reuse the existing modal and choice-list styling. No CSS changed in this assignment.

## 3. Tests — 135 passing (was 108)

```
node --test test/*.test.js          # ~27 s
node scripts/simulate.js --games 100 --random 20
```

| File | What it covers |
|---|---|
| `legal-moves.test.js` (9, new) | See the breakdown below this table |
| `choices.test.js` (13, new) | One rulebook scenario per choice — see the breakdown below this table |
| `ui-choices.test.js` (4, new) | The real `UIManager` against a fake DOM: a human is prompted for a coal tie then plays the card; no prompt when there is no choice; a human chooses a shortfall tile; an AI seat's shortfall is automatic |
| `serialization.test.js` (+1) | A save made during a pending shortfall restores and continues; negative money without tiles is rejected |
| Updated tests (2) | A rail-coal preference for a farther mine is now **rejected** rather than silently replaced, because choices are validated. The shortfall test now has the player choose a tile (different from the old automatic pick) |

**`legal-moves.test.js` checks:**
- **Soundness:** more than 1,000 listed moves across 2, 3 and 4-player AI-game positions all apply successfully, and are already fully specified.
- **Uniqueness:** listed moves contain no duplicates.
- **Defaults vs expanded:** the expanded listing contains every default move.
- **Buttons agree:** `canPerformAction` ⇔ a move of that type exists.
- **Completeness:** every target the rules queries offer appears as a move.
- **AI coverage:** every AI decision in three full games appears in the expanded listing.
- **No mutation:** enumeration and validation never change the state.
- **Fuzzing:** thousands of mutated moves are either fully legal or rejected with the state unchanged.
- **Malformed moves:** 21 malformed moves are rejected with reasons.
- **Random games:** complete games choosing random legal moves.

**`choices.test.js` scenarios:**
- **Coal:**
  - equally close mines are selectable, while a farther mine or the market is rejected;
  - the next-closest mine is used when the closest runs out mid-build.
- **Iron:**
  - any works may be chosen and the market is rejected;
  - the chosen works flips and pays its owner;
  - two units can come from two different works.
- **Merchant:**
  - the choice decides the bonus;
  - merchants that don't buy the good or have no barrel are rejected.
- **Gloucester:** the develop choice, including skip and lightbulb exclusion.
- **Beer:** own breweries anywhere and connected opponents' are selectable; an unconnected opponent's is rejected.
- **Complex sales:** search finds the only allocation that sells both tiles, and a forced bad choice is rejected without change.
- **Double-rail beer:** the choice, including an opponent's brewery reachable only through the second link.
- **Shortfall:**
  - other moves are blocked and era scoring is refused while it is pending;
  - selling the last tile still leaves money owed, so VP are lost;
  - a farm brewery can be sold.
- **Consecutive actions:** a mine emptied by the first action is no longer offered to the second; market prices rise between actions.

**Retained:** every test from Assignments 1 and 2. That includes the
bit-for-bit replay of Assignment 1 games and the clone/restore continuation
checks.

## 4. Simulation results

`node scripts/simulate.js --games 100 --random 20` (434 s) plus
`--games 200 --first 101 --no-a1 --random 0` (295 s):

| Run | 2 players | 3 players | 4 players |
|---|---|---|---|
| AI games, seeds ×001–×100 (strict driver, invariants after every action, clone + JSON restore mid-game) | 100/100 | 100/100 | 100/100 |
| …identical to the recorded Assignment 1 games | 100/100 | 100/100 | 100/100 |
| AI games, seeds ×101–×300 | 200/200 | 200/200 | 200/200 |
| Random legal-move games (every choice expanded, random shortfall choices) | 20/20 | 20/20 | 20/20 |

**Zero problems in any run:**
- every game ended with 10/9/8 rounds per era;
- no AI action failed;
- no invariant broke;
- every clone and restored save finished identically.

**AI and random-game figures:**
- The AI plays exactly as before: game length is 78 / 105 / 124 actions, and the action mix is unchanged.
- The random games reached up to 560 legal moves in a position and made 328 random shortfall decisions, all legal and correctly applied.

### Is the game still playable? (real browser, Playwright)
- **Full game.** A complete game was played through `index.html` with 1 human + 2 AI seats, by clicking the action bar, dialogs and cards:
  - the human built, linked, developed, took loans, scouted and passed;
  - the human answered two real **Income Shortfall** prompts;
  - the game reached final scoring with no console errors and no AI recoveries.
- **Coal-choice dialog.** A set-up position with two equally close mines showed the Choose Coal dialog, listing both mines with owner and cubes left. Clicking the second mine consumed that mine's coal.
- **Second full game.** A second full game run after the final code change raised a real **Choose Iron** dialog during normal play, plus two shortfall prompts.
- **Re-run after a late refactor.** After the last refactor (rail-coal options rebuilt on the shared `coalOptions`), a shorter re-run of the simulation also passed with zero problems: 30 AI games and 5 random games per player count, with every AI game identical to Assignment 1.
- **Compatibility.** `index.html` opens directly from disk. The seeded RNG, cloning and saves from Assignment 2 are unchanged. The existing AI and all game modes (2–4 players, any mix of human and AI seats, every difficulty) work as before.

## 5. Remaining limitations

1. **Turn and era flow still live in `UIManager`.** Both the UI and the headless driver call `advanceTurn` → settle shortfalls → `endCanalEra`/`endGame`. `applyMove` applies one action but does not advance the turn, and it does not enforce whose turn it is. Both belong to Assignment 4.
2. **Choice order in the UI.** Resource choices are asked after the target and before the card; Scout asks for three cards. The rules don't fix an order, but a future UI might show all choices on one screen.
3. **Gloucester skip.** Skipping the free develop is allowed (an interpretation; the rulebook doesn't say it is compulsory).
4. **Enumeration cost.** A full `getLegalMoves({ expandChoices: true })` takes about 10–30 ms and lists up to about 560 moves. That is fine for rollouts and shallow search; deep search may want lazy or incremental generation later.
5. **Hidden information.** The existing AI still reads opponents' hands. A future AI should use `getPlayerView` and sample hidden cards (noted in Assignment 2).
6. **Double rail links temporarily touch the board while planning.** Adjacency and connectivity are computed against the real board, so planning a double rail link places the links temporarily and always removes them. The tests confirm no state change, but it is the one planner that is not purely read-only internally.

## 6. Readiness for Assignment 4

**Ready.** Every decision is now a move with a single legal-move generator and
a single atomic executor. The remaining step is to put `advanceTurn`,
shortfall settlement and era transitions behind the same interface.

The headless driver's `advance` and `resolveShortfalls` already show the
exact sequence. A natural follow-on is an engine-level `applyMove` that also
advances the game and reports whose decision is next: a turn action or a
pending shortfall.
