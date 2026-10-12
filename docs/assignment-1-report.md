# Assignment 1 — Regression Testing, Rule Corrections and Stability

Scope: automated tests, the confirmed defects from
[`brass-review-findings.md`](brass-review-findings.md), the game-data check and
headless simulation. No new AI strategy, no engine refactor and no UI redesign.
`index.html` still opens directly from disk; there is still no build step and
no dependency.

## 1. Test framework

Run with Node.js 18+ (developed on Node 22):

```
node --test test/*.test.js                     # full suite, 10 AI games per player count
BRASS_SIM_GAMES=100 node --test test/*.test.js  # same, 100 AI games per player count
node scripts/simulate.js --games 100           # headless regression run with statistics
```

**How the engine is loaded.** The game files remain plain `<script>` files.
`test/helpers/engine.js` evaluates them in order inside a Node `vm` context,
exactly as `index.html` does. It can also replace `Math.random` in that context
with a seeded PRNG, which makes test games reproducible without adding seeding
to the engine (that is deferred work).

| Helper | Purpose |
|---|---|
| `test/helpers/engine.js` | Loads `gameData` → `gameState` → `gameLogic` → `aiPlayer` (optionally more files) into a `vm` context; optional seed |
| `test/helpers/scenario.js` | Builds hand-crafted positions: place tiles and links, set hands, card factories |
| `test/helpers/headless.js` | **Strict** AI-vs-AI driver that mirrors `UIManager`'s turn flow. Any failed action or exception throws `AIActionError` |
| `test/helpers/invariants.js` | State checks run after every simulated action (see §4) |
| `test/helpers/dom.js` | Minimal fake DOM, so `UIManager`'s turn logic (A2, hidden hand) can be tested without a browser |

| Test file | Covers |
|---|---|
| `init.test.js` | 2/3/4-player setup: deck sizes (40/54/64), hands, £17, income space 10, link tiles, markets, merchant tiles per player count, location-banner rules, turn order |
| `actions.test.js` | Legal **and** illegal examples of all seven actions (Build, Network incl. double rail, Develop, Sell, Loan, Scout, Pass). Every illegal attempt must be rejected **and leave the state byte-for-byte unchanged** |
| `resources.test.js` | Closest-mine coal, market coal needing a merchant (including merchant spaces with no tiles), £8/£6 empty-market prices, iron from any works, coal/iron sold to the market on build, flips and the owner's income, brewery barrels per era, overbuilding |
| `turns.test.js` | One action in Canal round 1, then two. Hand refill. Turn order by money spent (stable ties). Exact 10/9/8 rounds per era. Canal-era cleanup. Income timing, including none after the final round |
| `scoring.test.js` | Link VP (only flipped tiles count; merchants count 2), the farm brewery on Kidderminster–Worcester, Level II+ tiles scoring in both eras, shortfall sales and VP loss, the income track |
| `regressions.test.js` | One or more tests reproducing each defect A1–A4 and A6 |
| `ai-simulation.test.js` | Full AI games for each player count with invariants checked after every action |

**Result: 74 tests, 74 passing** (about 9 s with the default 10 AI games per player count).

### The regression tests reproduce the defects

`regressions.test.js` was run against the **original** code (commit
`2c1fe1f`, in a separate worktree). 13 of its 17 tests fail there and pass
after the fixes. The other 4 also pass on the old code by design. They check
behaviour that was already correct and must stay that way:
- a failed human action is cancelled, not auto-passed;
- the strict driver throws when an action fails;
- a 1-merchant + 1-brewery sale works;
- a human's own hand stays face up.

## 2. Defects fixed

### A1 — Sell eligibility vs beer consumption
- **Root cause.** There were two causes:
  - `getValidSellTargets` counted every connected merchant barrel (both Oxford barrels) as available beer, but `executeSell` may only use the one barrel beside the merchant tile it sells to (rulebook p.8 and p.10).
  - `executeSell` also changed state tile by tile. It spent the merchant barrel and paid the bonus *before* checking brewery beer, then skipped the tile with `continue` if the beer ran out. Tiles in a multi-tile sale also competed for the same barrels without any check.
- **Fix.**
  - A new `GameLogic.planSell(playerId, plan)` resolves the whole sale **without changing anything**. It keeps a running record of the barrels already claimed and allows at most one merchant barrel per tile, from a merchant tile that buys that good.
  - `executeSell` runs the plan first. If any tile can't be sold, the action fails and nothing is consumed or awarded. Otherwise it applies exactly the resolved steps.
  - `getValidSellTargets` now counts brewery beer plus at most one merchant barrel.
  - The sell dialog validates the selected combination before a card is spent.
  - The AI adds tiles to its sale only while `planSell` still accepts the plan. This is a correctness change only; its scoring is unchanged.

### A2 — A failed AI action froze the game
- **Root cause.** On failure, `UIManager.completeAction` called `cancelAction()` and returned, so it never scheduled the next AI turn. An exception thrown inside `AIPlayer.chooseAction` also escaped the `setTimeout` callback, with the same result.
- **Fix (interactive game).**
  - A new `recoverAITurn(reason)` logs the failure to the console and the game log, then passes with the AI's first card, and the game continues.
  - `executeOneAITurn` catches exceptions from `chooseAction` and recovers the same way.
  - A failed **human** action still just cancels.
- **Fix (tests).** The headless driver does not use this safety net. Every failed AI action or exception raises `AIActionError` with the decision, the game state and the seed. A regression test proves the driver throws on an injected bad decision.

### A3 — Develop could remove lightbulb tiles
- **Root cause.**
  - `executeDevelop` never checked `canDevelop`.
  - The UI's second-tile list only checked that a second tile of the same industry existed. So Pottery II + Pottery III (lightbulb) was accepted.
- **Fix.** `GameLogic.canDevelopTypes(playerId, type1, type2)` checks that each tile:
  - is the lowest tile of its industry at the moment it is removed;
  - has no lightbulb icon;
  - can be paid for with the iron available.

  `executeDevelop` enforces it. The UI's second choice and the AI's second choice both use it through `getSecondDevelopOptions`, so the engine, the UI and the AI now apply the same rule.

### A4 — Rail coal came from the wrong mine
- **Root cause.** `findCheapestCoalForLink` gathered the mines reachable from end 0, then from end 1, and sorted by **price** only. Every board mine is free, so end 0's list always won, even when a mine sat at end 1.
- **Fix.**
  - `getRailCoalOptions(conn, playerId)` measures distance from whichever end of the link is nearer, as if the link were already placed (rulebook p.8 and p.11). A mine at either end is distance 0. It returns the set of **equally closest** mines.
  - Market coal is offered only when no mine is reachable.
  - `executeNetwork(…, { coalMineKey })` and `executeNetworkDouble(…, { coalMineKey1, coalMineKey2 })` accept the player's choice between equally close mines. A choice of a farther mine is ignored. When no choice is given, the first option is used. The interface for making this choice comes later, with the player-choice work.
  - The correct mine is drained and flipped, and its owner gets the income. This is covered by a test.
  - Building a rail link with no coal available now fails. Before, it silently built the link for free.

### A6 — Minor UI and action-selection defects
- **Double develop affordability.** The dialog used `ironSources.length >= 2`, which is always true. It now lists only second tiles that `canDevelopTypes` accepts, so the second iron is affordable.
- **Second rail link affordability.**
  - `getValidSecondRailLinks` checked neither £15 plus both coals, nor the first link's effect on the second coal's price.
  - Listing the options and building the links now share one dry-run procedure, `runDoubleRail`. It places link 1, takes its coal, places link 2, takes its coal, checks the beer and checks the total cost, and undoes everything unless it commits.
  - The dialog now shows the real total, including coal.
- **AI hand visible.** `updateHand` now draws an AI seat's hand as card backs (`assets/cards/back.jpg`, with a text fallback). It never shows card faces.

### A5 (supporting change) — Actions validate their input
- The regression and illegal-move tests need actions to reject bad input, so every `execute*` method now validates before changing any state:
  - **Build** must match a target from `getValidBuildTargets` and use an allowed card.
  - **Network** must be a valid target with a coal source.
  - **Scout** requires `canScout` and 3 distinct cards.
  - **Develop, Sell, Loan and Pass** require a real card index.
- Moves that were already legal behave exactly as before.

## 3. Game data (Manufacturer II/IV, Pottery I/V, Cotton Mill I)

- **The question.** The audit's concern came from a low-resolution player-mat illustration on page 5 of the rulebook.
- **The evidence.** The repository bundles high-resolution retail component art:
  - `assets/player-mat.jpg`, the full player mat with costs, VPs, income and link icons;
  - `assets/tiles/*-flipped.jpg`, the scoring face of every tile.

  Both agree with `gameData.js` on every disputed value:

  | Tile | Value in both sources and `gameData.js` |
  |---|---|
  | Manufacturer II | £10, 1 iron, VP 5, income +1, 1 link |
  | Manufacturer IV | £8, 1 iron, VP 3, income +6, 1 link |
  | Pottery I | VP 10, income +5 |
  | Pottery V | VP 20, income +5 |
  | Cotton Mill I | VP 5, income +5 |

  The rest of the mat matches as well: every cost, coal and iron requirement, beer requirement, VP, income and link value, and the Canal-only and Rail-only marks.
- **Decision.** Two independent component sources agree with each other, and the rulebook render disagrees with both, so it is treated as a pre-production illustration. **No tile values were changed.** No question remains open here unless a physical mat shows otherwise.

## 4. Simulation results

`node scripts/simulate.js` runs games through the strict driver. Seats use one
difficulty per game, rotating easy / normal / hard by seed. **After every
action** the driver checks these invariants:

- **Players:** money and VP never negative; income space between 0 and 99; at most 8 cards in hand.
- **Markets:** coal and iron cube counts within their market sizes.
- **Wild cards:** conserved (4 + 4), with the wild-card flags matching the hands.
- **Link tiles:** placed + remaining = 14 per player; no canal links in the Rail Era.
- **Industry tiles:**
  - every tile sits in a slot that allows its industry;
  - resource tiles are flipped exactly when they are empty;
  - non-resource tiles hold no cubes;
  - every tile on the board is legal in the current era;
  - one tile per location per player in the Canal Era;
  - tiles on the board never exceed tiles used from the mat.
- **Merchants:** blank merchant tiles never hold beer.
- **Turns:** turn order is a permutation of the players.

| Run | 2 players | 3 players | 4 players | Problems |
|---|---|---|---|---|
| `--games 100` (seeds 1–100) | 100/100, 10+10 rounds | 100/100, 9+9 rounds | 100/100, 8+8 rounds | **0** |
| `--games 300 --seed 5001` | SIM300_2 | SIM300_3 | SIM300_4 | SIM300_TOTAL |
| Original code, same driver, `--games 100` | ORIG_2 | ORIG_3 | ORIG_4 | ORIG_TOTAL |

Average game length with the fixed code (100-game run): 78 / 105 / 124 actions,
with average winning VP of 51 / 59 / 63.

**Real browser check.** A Playwright run of `index.html` (1 human + 2 AI seats):
- the human passed for 17 turns while the AIs played through Canal round 9;
- no console errors and no AI recoveries were needed;
- the AI seat's hand displayed as card backs.

## 5. Remaining issues and open rule questions

1. **Player choices are still made automatically** (findings B1–B5):
   - the coal mine for builds when two are equally close;
   - which iron works supplies iron;
   - beer source (own breweries are always used first);
   - which merchant tile or barrel to sell to;
   - which tiles to sell to cover an income shortfall.

   Rail-coal ties are supported by the engine but not yet offered in the UI. All of these belong to the player-choice work.
2. **Turn flow still lives in `UIManager`.** The headless driver mirrors it: advancing turns, era transitions and the AI's automatic Gloucester bonus. Two copies can drift apart. Moving turn flow into the engine (deferred) removes the duplicate.
3. **No seeded randomness, cloning or serialization in the engine.** The tests seed `Math.random` from outside, which is enough for reproducible tests but not for saved games or search-based AI.
4. **The tie-break (income, then money) is computed in `UIManager.showGameOver`**, so it is not covered by engine tests.
5. **Hot-seat privacy between humans.** Two human players at one screen still see each other's hands when the turn changes. Only AI hands are hidden. Fixing this would be a UI design change, which is out of scope.
6. **Cosmetic.** During an AI turn the chosen action's button is briefly highlighted. Input is correctly blocked.
7. **AI quality.** The existing heuristic AI is weak: many loans and passes, low scores. It was used only as a test driver, as instructed.

There are **no unresolved rule questions** from the audit. Every item in
section C was settled by the rulebook or by the component art.

## 6. Readiness for Assignment 2

**Ready to begin the engine refactor.**

**Safety net now in place:**
- 74 tests covering setup, all seven actions (legal and illegal), resources, turn flow, scoring and every fixed defect;
- a strict headless driver with state invariants checked after every action;
- a reproducible 300+ game simulation.

The actions now validate their input, which is the main precondition for a
single `getLegalMoves` / `applyMove` interface.

**Not yet ready for search-based AI.** That needs work that was explicitly
deferred:
- seeded randomness, cloning and serialization;
- turn flow in the engine;
- moves that carry the player's choices.

Those are the natural contents of Assignment 2.
