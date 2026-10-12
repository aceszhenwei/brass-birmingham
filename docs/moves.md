# Moves, Legal Actions and Player Choices

Since Assignment 3, every decision a player makes is represented as a plain
JSON **move**. Every move is validated and executed by one engine
(`js/moves.js`, mixed into `GameLogic`). The browser UI, the existing AI and
the tests all go through it, so there is a single implementation of the rules
for each action.

## The move format

| Move | Fields |
|---|---|
| Build | `{ type: 'build', card, location, slot, industry, coal?: [src], iron?: [src] }` |
| Network | `{ type: 'network', card, links: [connId] \| [connId, connId], coal?: [src, src], beer?: src }` |
| Develop | `{ type: 'develop', card, industries: [type] \| [type, type], iron?: [src, src] }` |
| Sell | `{ type: 'sell', card, sales: [{ tile, merchant?, beer?: [src], freeDevelop? }] }` |
| Loan | `{ type: 'loan', card }` |
| Scout | `{ type: 'scout', cards: [i, j, k] }` |
| Pass | `{ type: 'pass', card }` |
| Income shortfall | `{ type: 'shortfall', tile }` |

- **Cards and places.** `card` is an index into the player's hand. `location` is a town id or a farm-brewery id (`'northern'` / `'southern'`). `tile` is a board key (`'birmingham_0'`) or a farm id.
- **Resource sources** are strings:

  | Kind | Values |
  |---|---|
  | coal | `'mine:<tileKey>'` or `'market'` |
  | iron | `'works:<tileKey>'` or `'market'` |
  | beer | `'brewery:<tileKey>'`; farm breweries are `'brewery:farm_<id>'` |

- **`merchant`** is an index into `state.merchantTiles`. It means "sell to this merchant tile and drink its beer barrel, taking its bonus". `'none'` means selling without merchant beer.
- **`freeDevelop`** is Gloucester's bonus: an industry type, or `'skip'`.

**Optional fields.** Every field marked `?` is optional. When it is missing,
the engine completes it legally (see *Completion* below). When it is given, it
is **validated**: an illegal choice rejects the whole move. It is never
silently replaced.

## API (`GameLogic`)

```js
logic.getLegalMoves(playerId)                         // every legal move, choices completed
logic.getLegalMoves(playerId, { expandChoices: true }) // …every legal choice combination too
logic.applyMove(playerId, move)      // -> { success, message, move: <fully specified move> }
logic.resolveMove(playerId, move)    // validate + complete, no state change -> { ok, message, resolved }
logic.getNextChoice(playerId, move)  // the next decision to put to a human, or null
withChoice(move, slot, value)        // a copy of move with one choice filled in
logic.moveFromDecision(aiDecision)   // the existing AI's { action, pendingData, cardIndex } -> move
```

**`applyMove` is atomic.** It either applies the whole move or rejects it
with a message and leaves the state byte-for-byte unchanged. The tests check
this with thousands of fuzzed moves.

**Real games use `play`.** `applyMove` applies one move's effects only. Since
Assignment 4, games are played through `logic.play(playerId, move)`
([`engine.md`](engine.md)). `play` also checks that the move belongs to the
decision that is due, then advances the game: turns, rounds, income,
shortfalls, eras and final scoring.

**The old entry points still work.** `executeBuild`, `executeNetwork`,
`executeNetworkDouble`, `executeDevelop`, `executeSell`, `executeLoan`,
`executeScout` and `executePass` are thin wrappers that build a move and call
`applyMove`. The rules queries (`getValidBuildTargets`,
`getValidNetworkTargets`, `getValidSellTargets`, `getSecondDevelopOptions`,
…) are unchanged and remain the building blocks for the planners.

### `getLegalMoves`

- **What it lists.** One move per distinct decision: card × target, plus pairs of rail links, one- or two-tile develops, every sellable *set* of tiles, Scout card triples and Pass.
- **Choices.** Each listed move is a legal completion of its choices. `expandChoices: true` also lists every distinct legal combination of coal, iron, beer, merchant and bonus choices as a separate move.
- **Duplicates removed:**
  - identical cards are merged unless `allCards: true`;
  - interchangeable resource units are deduplicated;
  - orders with no effect are listed once: Scout card triples, and two different industries in one Develop.
- **During a shortfall.** While an income shortfall is pending, the owing player's only legal moves are `shortfall` moves, and every other player has none.
- **Any player id can be asked.** Use `getCurrentLegalMoves()` for the decision that is actually due; `play` enforces it.
- **Size.** A typical position has up to about 550 expanded moves. A full listing takes about 10–30 ms.

## How a move is checked: planners and choice points

Each move type has a **planner** (`planBuild`, `planNetwork`, `planDevelop`,
`planSellMove`, `planLoan`, `planScout`, `planPass`, `planShortfall`).

A planner checks the move against the rules and works out exactly what it
will consume, **without changing the state**. A ledger records cubes, market
cubes, merchant barrels and mat tiles already claimed earlier in the same move.
That is how a two-coal build, a double rail link or a multi-tile sale sees its
own earlier consumption.

**Choice points.** Wherever the rulebook leaves a decision to the player,
the planner calls `choose(kind, slot, options)`. The options are always
exactly the legal ones at that moment:

| Choice | Legal options (rulebook) |
|---|---|
| Coal (build, rail link) | The **closest** connected unflipped mine(s) with coal (fewest links; for a link, measured from either end with the link in place). Ties are the player's choice. If no mine is connected: the market, which needs a merchant connection. If a mine runs out mid-move: the next closest (p.8, p.11) |
| Iron (build, develop) | **Any** unflipped Iron Works with iron, no connection needed; the market only if none has iron (p.8) |
| Beer (sale) | Own unflipped breweries anywhere; opponents' unflipped breweries connected to the tile being sold. Each barrel may come from a different source (p.8) |
| Merchant (sale needing beer) | Any connected merchant tile that buys the good **and still has its barrel** (selling there drinks it and grants its bonus), or `'none'` (p.10) |
| Free develop (Gloucester) | Any industry whose lowest tile can be developed (no lightbulb Pottery), or `'skip'` |
| Beer (double rail) | Own breweries anywhere; opponents' breweries connected to the **second** link; never merchant beer (p.11) |
| Shortfall | Any of the owing player's industry tiles, board or farm (p.6) |

The same planner code serves four purposes:

1. **Validation:** a value given in the move must be among the options at its choice point.
2. **Completion** (`resolveMove`, `applyMove`): missing values are filled with the defaults, which reproduce the engine's previous automatic choices. If those defaults cannot work, for example when a sale's beer runs out because the first tile took the only barrel the second could use, the engine searches the alternatives depth-first, changing the latest choices first. It only rejects the move when no legal completion exists.
3. **Expansion** (`getLegalMoves({ expandChoices: true })`): the same search enumerates every legal completion.
4. **Prompting** (`getNextChoice`): the UI asks the next undecided choice point, offering only options that can still lead to a legal move, and fills in single options automatically.

## Player choices restored (audit B1–B5)

| Audit | Before | Now |
|---|---|---|
| B1 Coal ties (builds; rail links since A4) | First mine in search order | Player chooses among equally close mines |
| B2 Which Iron Works | First in board order | Player chooses any works with iron |
| B3 Beer source | Own breweries always first | Player chooses each barrel among the eligible ones |
| B4 Which merchant | Best bonus automatically; a yes/no merchant-beer checkbox | Player chooses the merchant tile (with its bonus) or none |
| B5 Shortfall tiles | Automatic: unflipped tiles first, then lowest VP | Player chooses each tile to sell |
| Gloucester bonus | Asked after the sale through a UI-only prompt | Part of the Sell move (`freeDevelop`), so it can be saved, replayed and searched |

**Interpretation.** The Gloucester bonus may be skipped. The rulebook
describes the bonus without saying it is compulsory, and the previous version
of the game allowed skipping.

## Income shortfalls

- **How a shortfall becomes pending.** At the end of a round, a player whose income takes their money below zero keeps the negative balance if they own tiles. That is the pending decision. The engine adds no separate flag; `state.getPendingShortfalls()` lists such players.
- **Resolving it.** Each `shortfall` move sells one chosen tile for half its cost. The decision ends as soon as the money is ≥ 0. If the last tile is sold and money is still negative, the player loses 1 VP per £1 owed (never below 0 VP).
- **No tiles at all.** A player with no tiles loses VP at once, because there is nothing to choose.
- **What is blocked.** While any shortfall is pending, no other move can be applied, and `endCanalEra()` refuses to score the era.
- **Who decides.** The engine reports the shortfall as the current decision (`getCurrentDecision()` → `{ type: 'shortfall', playerId, owed }`) and waits.
  - The UI asks human players with a prompt.
  - AI seats use `logic.defaultShortfallMove(id)`: unflipped tiles first, then the lowest VP. This is the previous automatic policy.
  - The headless driver does the same.
- **Saving.** A game saved mid-shortfall restores correctly, with the decision still pending.

## The UI flow

1. The player picks an action and a target (build space, link, tiles to sell, tiles to develop), exactly as before.
2. `UIManager.proceedWithMove(move)` asks `getNextChoice` for each remaining decision and shows it as a choice dialog (Choose Coal / Iron / Beer / Merchant, Free Develop).
3. It then moves to the card step. Positions where the rules allow only one option never show a dialog.
4. The card click completes the move, and `playMove` calls `logic.play`.
5. AI decisions go through the same `playMove` after `moveFromDecision`.
6. After every move, `continueGame` asks the engine for the next decision: a shortfall prompt, an AI turn or a human turn. See [`engine.md`](engine.md).
