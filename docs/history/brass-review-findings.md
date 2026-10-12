# Brass: Birmingham — Rules Audit & Architecture Review

Original audit of commit `2c1fe1f`. **Status after Assignments 1–4** is summarised below; details are in [`assignment-1-report.md`](assignment-1-report.md), [`assignment-2-report.md`](assignment-2-report.md), [`assignment-3-report.md`](assignment-3-report.md) and [`assignment-4-report.md`](assignment-4-report.md).

| Finding | Status |
|---|---|
| A1 Sell check vs execution (merchant beer) | **Fixed** — `planSell` validates the whole sale before anything changes |
| A2 Failed AI action freezes the game | **Fixed** — interactive UI passes instead; the headless test driver fails loudly |
| A3 Develop removes lightbulb tiles | **Fixed** — engine, UI and AI share `canDevelopTypes` |
| A4 Rail coal ignores the closest mine | **Fixed** — closest from either end; ties stay a player choice |
| A5 Actions don't check legality | **Fixed** — all seven actions (and the double rail link) now reject illegal input without changing state; a supporting change for A1–A4 and the tests |
| A6 Develop/second-rail affordability, AI hand visible | **Fixed** |
| B Missing player choices | **Fixed in Assignment 3:** coal ties, iron works, beer, merchant and shortfall tiles are all player choices, part of every move and asked in the UI ([`moves.md`](../moves.md)) |
| C7 Tile data vs rulebook illustration | **Resolved, no change** — the bundled retail player mat and tile art match `gameData.js` |
| D Engine refactor | **Complete:** seeded RNG, clone and serialize/restore (Assignment 2); one move format with `getLegalMoves` / `applyMove` and player choices (Assignment 3); the engine runs the whole game through `getCurrentDecision` / `play` (Assignment 4, [`engine.md`](../engine.md), [`assignment-4-report.md`](assignment-4-report.md)) |

## How this was checked

- I read every engine file line by line: `gameData.js`, `gameState.js`, `gameLogic.js`, `aiPlayer.js`, `uiManager.js` and `main.js`. I skimmed the render-only files: `boardRenderer.js`, `boardAssets.js` and the icon files. None of the render-only files changes game state.
- **Rulebook:** I checked everything against Roxley's official rulebook (v2018.11), including a zoomed-in look at its player-mat picture on page 5. Section C records what the rulebook settled.
- I loaded the engine (no DOM) into Node and drove it headlessly:
  - **240 AI-vs-AI games** (40 each at 2, 3 and 4 players, two runs).
  - **Targeted scenario scripts** for each suspected bug.
  - "Confirmed" below means I reproduced it.

### Things that checked out (verified in simulation or by reading)
- **Deck sizes:** 40 / 54 / 64 cards at 2 / 3 / 4 players, with one card seeded to each discard pile. Each era lasts exactly **10 / 9 / 8 rounds** in every simulated game.
- **Round structure:** the first Canal round has 1 action; every other round, Rail included, has 2.
- **Turn order:** least money spent goes first, and ties keep their current order (stable sort).
- **Income and loans:**
  - The income track maps spaces to levels correctly.
  - A loan gives £30, drops income 3 levels to the top space of the new level, and is blocked if it would go below −10.
  - A shortfall is covered by selling tiles for half cost, then by losing VP.
- **Markets:**
  - Coal has 14 spaces, iron has 10, with the right starting cubes.
  - When empty, coal costs £8 and iron £6.
  - Cubes are sold into the most expensive empty space.
  - Iron works always sell their cubes to the market; coal mines only do so when connected to a merchant.
- **Building:**
  - Breweries get 1 beer in the Canal Era and 2 in the Rail Era.
  - Canal Era allows one tile per location.
  - Overbuilding rules: you can always overbuild your own tile. You can overbuild an opponent's mine or works only when that resource is exhausted on the board and in the market.
- **Era end:** canal links and all Level 1 tiles are removed, merchant beer is refilled, wild cards are returned, and the deck is rebuilt with no seeded discards.
- **Scoring:**
  - Links score only flipped tiles' link icons, plus 2 for each merchant.
  - Farm-brewery links are handled, including Kidderminster–Worcester running through the southern farm.
  - The tiebreak is income, then money.
- **Board data:** all 20 towns' slot layouts and all merchant bonuses match the board.

---

## A. Confirmed bugs

### A1. Sell check and sell execution disagree on merchant beer — **High**
`gameLogic.js:779` vs `gameLogic.js:833–878`

- **What goes wrong:**
  - `getValidSellTargets` counts **every** connected merchant barrel as available beer. Oxford has two tiles, so that is two barrels.
  - `executeSell` uses **at most one** merchant barrel per tile, then looks for the rest in breweries.
  - It also spends the merchant barrel and awards the bonus **before** checking that enough brewery beer exists. If it doesn't, the tile is skipped with `continue`.
- **Reproduced:** Pottery III (needs 2 beer) connected only to Oxford, with both Oxford barrels full and no reachable brewery.
  - The check says the tile is sellable.
  - The sale returns *"Nothing could be sold"*.
  - Even so, one Oxford barrel is gone, the player gained +2 income from the bonus, and the card was not discarded.
- **Same partial-change problem in multi-tile sales:** tile 1 can use up brewery beer that tile 2 was counted against. Tile 2 then burns its merchant barrel and bonus without being sold.

### A2. Any failed AI action freezes the game — **High**
`uiManager.js:1169–1176`

- When an action fails, `completeAction` calls `cancelAction()` and returns. It never calls `runAITurnLoop()` again.
- For a human that just means a toast. For an AI seat nothing happens next, so the game stalls.
- **Reproduced:** A1 triggered this in **1 of 40 four-player AI games** (the AI chose the invalid Oxford sale).
- Any future mismatch between the legal-move checks and the action code will freeze the game the same way.

### A3. Develop can remove tiles that can't be developed (the "no-develop" icon tiles) — **Medium**
`uiManager.js:847–851`, `aiPlayer.js:245`, `gameLogic.js:691`

- When the second develop is the same industry as the first, both the UI and the AI only check that *a* second tile exists. They don't check that it is developable.
- `executeDevelop` doesn't check `canDevelop` at all.
- **Reproduced:** with Pottery I gone, "develop Pottery + Pottery" removes Pottery II **and Pottery III**, which carries the no-develop icon.

### A4. Rail-link coal ignores the "closest mine" rule across the link's two ends — **Medium**
`gameLogic.js:631–649`

- `findCheapestCoalForLink` collects mines from end 0 (sorted by distance), then from end 1, and then sorts **only by price**. Every board mine has price 0, so end 0's list always wins.
- **Reproduced:** building Stoke–Stone with a mine **at Stone** (distance 0) and a mine at Leek (distance 1 from Stoke) takes the cube from **Leek**.
- **Effects:**
  - The wrong owner's mine gets emptied and flipped, so income goes to the wrong player.
  - The player can't choose between mines at the same distance.

### A5. The action functions don't check that a move is legal — **Medium (not reachable through the current UI; matters for the AI and tests)**

The `execute*` functions trust whoever calls them. Results I reproduced:

| Call | Accepted? |
|---|---|
| `executeBuild` Cotton in Birmingham using a **Worcester** location card | ✅ accepted |
| `executeBuild` Cotton into a **Manufacturer-only** slot | ✅ accepted |
| `executeScout` while already holding wild cards | ✅ accepted (the wild piles go down to 2) |
| `executeDevelop` on a tile that can't be developed | ✅ accepted |
| `executeNetwork` (rail) with no coal reachable | builds anyway (`if (src)` at :416 just skips paying for coal) |

The human UI hides these paths: it only offers valid targets, and invalid cards have `pointer-events:none`. But the AI, a test suite or a future network or replay layer would hit them directly. A1 shows what happens when the checks and the actions drift apart.

### A6. Minor / UX
- **Develop modal:** `canAffordTwo = ironSources.length >= 2` (`uiManager.js:856`) is always true, because the code always appends six £6 General Supply iron sources. A player who can't pay for a second market iron is offered a second develop anyway. Choosing it gives an error toast and cancels the whole action.
- **Second rail link list:** `getValidSecondRailLinks` doesn't check that the player can afford £15 plus both coals. It also prices the second coal as if the first coal hadn't been taken. So it can offer a choice that then fails.
- **Hidden information:** the hand panel always shows the current seat, so during an AI turn the human sees the AI's hand.

## B. Missing mechanics (player choices the code makes automatically)

The rules give the active player each of these choices. The engine silently picks one. This matters for strategy, and it also matters for an AI's set of possible moves.

1. **Coal source when two mines are equally close.**
2. **Which iron works supplies iron.** The code picks whichever comes first in the data. That decides whose works flips and who gets the income.
3. **Beer source:** the code always uses your own breweries first. Players often want to drink an opponent's connected beer to keep their own.
4. **Which merchant tile/barrel to sell to:** the code picks the best bonus automatically (`merchantBonusValue`).
5. **Which tiles to sell to cover an income shortfall:** auto-chosen at `gameState.js:703`.

## C. Open questions, now settled by the rulebook (v2018.11)

| # | Question | Rulebook says | What it means for the code |
|---|---|---|---|
| C1 | Loans after the Rail Era deck runs out | The Loan rules (p.11) only forbid going below income −10 | **Code is correct.** I withdraw this suspicion. |
| C2 | Merchants not used at this player count | A coal mine sells to the market if it is "connected to any Merchant space (even those without Merchant tiles)" (p.9). Market coal needs a connection to the icon "shown on Warrington, Shrewsbury, Nottingham, Gloucester, and Oxford" (p.8). | **Code is correct.** Withdrawn. |
| C3 | How much merchant beer a tile can use | Beer may come from "the space beside a Merchant tile that you are selling to" (p.8, p.10). That is one barrel, from the one tile you sell to. | The **sale code is right and the sell check is wrong.** This confirms A1 and decides its fix. |
| C4 | Single-icon space first | "If possible, place it on a space displaying only that industry's icon" (p.9) | **Code is correct.** |
| C5 | Pottery I in the Rail Era | "Unlike the other level 1 Industry tiles, the level 1 Pottery tile may be built during the Rail Era" (p.12) | **Code is correct.** The player-mat picture also shows the Rail-only mark on Brewery IV and Pottery V, which matches the code. |
| C6 | Income after the final Rail round | "Income is not collected at the end of the final round of the game" (p.6) | **Code is correct.** |
| B5 | Covering an income shortfall | "You may remove any of your Industry tiles, but must stop as soon as you have acquired enough money" (p.6) | **Confirmed missing player choice:** the code picks the tiles automatically. |
| B1–B3 | Choosing coal, iron and beer sources | Coal mines at equal distance: "choose one". Iron: "any unflipped Iron Works". Beer: three allowed sources, "each beer may be consumed from a different source" (p.8). | **Confirmed missing player choices.** |
| A3 | Develop | Remove "the lowest level tile of the chosen industry (as it is removed)". Pottery tiles with the lightbulb icon "may not be developed" (p.11). | **Confirms A3.** |
| A4 | Rail-link coal | "The closest (fewest Link tiles distant)" mine, with each rail link "connected to a source of coal (after it is placed)" (p.8, p.11). | **Confirms A4.** |

### C7. NEW: the tile data may not match the player mat shown in the rulebook (check before changing)

I zoomed into the player-mat picture on page 5. Most tile values match `gameData.js`, including all Coal Mine tiles, Breweries I–IV, Cotton II–IV, Pottery II–IV and Manufacturers III and V–VIII. These don't match:

| Tile | `gameData.js` | Rulebook mat picture | How readable |
|---|---|---|---|
| Manufacturer IV | cost **£8**, income **6** | cost **£14**, income **7** | £14 is clear |
| Pottery V | income **5** | income **1** | clear |
| Pottery I | income **5** | income **2** | fairly clear |
| Manufacturer II | VP **5**, income **1** | VP **3**, income **0** | VP clear, income blurry |
| Cotton Mill I | income **5** | income **6** | blurry |

Rulebook pictures are sometimes made from prototype artwork, so **please check these against your physical player mat before I change anything.** If the mat agrees with the picture, these are data bugs that change scoring and income every game.

**Resolution (Assignment 1):** the repository bundles high-resolution retail component art: `assets/player-mat.jpg` and both faces of every industry tile in `assets/tiles/`. All of it agrees with `gameData.js` on every disputed value: Manufacturer II is VP 5 / +1, Manufacturer IV is £8 / +6, Pottery I is +5, Pottery V is +5, and Cotton Mill I is +5. Two independent component sources agree, while the rulebook render disagrees with both, so the rulebook picture is treated as a pre-production illustration. **No tile values were changed.**

---

## D. Architecture assessment

### What's already good
- **The engine is separate from the DOM.** `GameState`/`GameLogic` don't touch the DOM, and the renderer never writes to state. I loaded the engine in Node with about 10 lines of `vm` glue. That makes testing and AI work far easier than in most hobby codebases.
- **Data and rules are kept apart.** `gameData.js` is pure data.
- **The AI is stateless** (`chooseAction(state, logic, pid)`) and only uses public queries.

### What blocks testing and a stronger AI
1. **Turn flow lives in the UI.**
   - `advanceTurn` → era end → `endCanalEra`/`endGame` → surfacing round events → the Gloucester free-develop prompt are all run from `UIManager.completeAction`.
   - A headless game or test has to re-implement that, which my simulator had to do.
2. **There's no single `applyMove` with validation.**
   - Legality is computed in one place (`getValid*`) and enforced nowhere else (`execute*`).
   - A1 and A2 are what happens when those two drift apart.
3. **Moves don't record the player's choices.** The section B choices aren't part of a move, so neither a human nor an AI can make them.
4. **The state can't be cloned or replayed.**
   - It uses `Math.random` directly, with no seed.
   - `toJSON()` returns only a summary.
   - Some data is stored twice and can disagree, e.g. `hasWildLocation` flags vs the hand contents, and `tileData` copies.
   - So there is no save/load, no undo, no reproducible test, and no way for an AI to look ahead with search or Monte-Carlo playouts.
5. **There's no test harness at all:** no `package.json` and no tests.

### Recommendation: a **focused engine refactor**, not a rewrite

Leave the renderer, CSS, assets and most of the UI as they are. The changes are concentrated in about 2,100 lines of engine code.

| Step | Change | Why |
|---|---|---|
| 0 | Add `node:test` with no dependencies, plus a small loader. The engine files get a `if (typeof module!=='undefined') module.exports=…` footer, so they still work as classic `<script>` tags and `index.html` still opens from `file://`. | Tests become possible without a build step |
| 1 | Pass a **seeded RNG** into `GameState`. Make the state plain data with `clone()`/`serialize()`. Work out derived flags from the state instead of storing them. | Reproducible tests, save/load, AI look-ahead |
| 2 | Add one engine entry point, `getLegalMoves(state)` / `applyMove(state, move) → {ok, events}`. `applyMove` validates against the same code that lists legal moves. Moves are explicit objects such as `{type:'build', city, slot, industry, card, coal?:[…], iron?:[…]}`. Choices left out get the current automatic defaults. | Fixes A1, A2 and A5 at the root and adds section B |
| 3 | Move turn and era flow into the engine. Interrupts become state, e.g. `state.pending = {type:'freeDevelop', n}` or `{type:'shortfall'}`. The UI just sends moves and redraws from events. | The UI and the AI drive the game the same way |
| 4 | Rebuild the AI on `getLegalMoves`/`clone`. Keep the current heuristic as "Normal" and add search-based levels later. | Stronger AI with the same API |

Steps 0–1 are low-risk and pay off immediately. Steps 2–3 are the real refactor. They can be done one action at a time behind the current method names, so the UI keeps working throughout.

### Proposed order of work (for your approval)
1. Add the test harness and write **failing regression tests for A1–A4**.
2. Fix A1–A4 and A6 inside the current structure (small, local patches), plus an A2 safety net: retry with Pass when an AI action fails.
3. Fix the tile data in C7 once you've checked it against your physical player mat.
4. Do refactor steps 1 → 3, with the regression tests and a headless AI-vs-AI test (checking round counts and that no game stalls) keeping each step safe.
5. Then work on the AI.
