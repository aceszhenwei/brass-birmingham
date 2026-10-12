# Game State Model, Randomness and Saved-State Format

This describes the engine's game state after Assignment 2: what it contains,
where randomness comes from, and how it is cloned and serialized.

## Where the state lives

`GameState` (`js/gameState.js`) holds the whole game. Every field below is
captured by `serialize()` and restored by `GameState.deserialize()`.

| Field | Contents |
|---|---|
| `rng` | `SeededRandom`: the source of all gameplay randomness (see below) |
| `numPlayers`, `playerNames` | 2–4; names (also on each player) |
| `era`, `round` | `'canal'` / `'rail'`; the round within the era |
| `turnOrder`, `currentPlayerIndex` | Player ids in turn order; whose turn it is |
| `actionsThisTurn`, `actionsPerTurn`, `isFirstRound` | Turn progress (1 action in Canal round 1, otherwise 2) |
| `moneySpentThisRound` | `{ playerId: £ }`, used for the next turn order |
| `gameOver` | Set by `endGame()` |
| `players[]` | See below |
| `boardIndustries` | `{ 'city_slot': tile }` |
| `breweryFarmTiles` | `{ 'northern' \| 'southern': tile }` |
| `boardLinks` | `{ connectionId: { playerId, type: 'canal' \| 'rail' } }` |
| `coalMarket`, `ironMarket` | Number of cubes in each market |
| `merchantTiles[]` | `{ location, buys, hasBeer }` |
| `drawDeck[]` | Remaining cards; the **last** element is drawn next |
| `wildLocationPile`, `wildIndustryPile` | Wild cards available (0–4 each) |
| `lastRoundEvents[]` | End-of-round messages (shortfall sales) for the UI to log |

**Player:**
- `name`, `isAI`, `aiDifficulty`;
- `money`, `incomeSpace` (0–99; the income *level* is derived from it), `vp`. Money is negative only while the player owes an **income-shortfall decision**: they must choose tiles to sell, using `shortfall` moves (see [`moves.md`](moves.md)). `getPendingShortfalls()` derives this, so the state holds no extra field;
- `hand[]`;
- `discardPile[]`: new in Assignment 2. It starts with the face-down setup card (`faceDown: true`), then holds every card discarded for an action, oldest first. Wild cards go back to their piles instead;
- `industryTiles`: the player mat, one stack per industry, each tile marked `used` once built or developed;
- `linksRemaining { canal, rail }`;
- display-only `id`, `color`, `bgColor` and `colorName`, which come from the seat index.

**Board tile:** `{ playerId, type, tileData, flipped, resourceCubes }`. `tileData` is the printed data for that industry level (cost, VP, income, link VP and so on).

**Card:** `{ type: 'location', location }`, `{ type: 'industry', industryTypes: [...] }`, `{ type: 'wildLocation' }` or `{ type: 'wildIndustry' }`, each with a display `name`.

## Changes to the state model in Assignment 2

| Change | Why |
|---|---|
| Added `rng` (`SeededRandom`, `js/random.js`); `shuffleArray` now uses it | Deterministic, reproducible, copyable randomness |
| Added `players[].discardPile` | The rules have discard piles, and a full saved state needs them. Before this, discarded cards and the face-down setup cards simply vanished. Now every card can be accounted for: the test invariants check that deck + hands + discard piles always equal the deck for that player count |
| Removed `players[].hasWildLocation` / `hasWildIndustry`; added `GameState.playerHasWildCard(id, type?)` | The flags duplicated information already in the hand and could fall out of sync. Wild-card status is now derived from the hand |
| Removed `GameState.selectedCardIndex`, `selectedAction` and `pendingAction` | They were dead fields (the UI keeps its own selection state) and would have polluted saves |
| Added `serialize()`, `GameState.deserialize()`, `clone()`, `getPlayerView()` and `GameState.validateSaved()` | See below |

No game rule changed. With equivalent random draws, the engine replays all
300 recorded Assignment 1 games bit-for-bit (see
[`assignment-2-report.md`](history/assignment-2-report.md)).

## Randomness

All gameplay randomness comes from `state.rng`. That covers the initial turn
order, the merchant tiles, the deck shuffle at setup and the Rail Era
reshuffle.

- **Algorithm.** `SeededRandom` (`js/random.js`) is mulberry32. Its whole state is `{ seed, state }`, two 32-bit integers.
- **Seed.** `new GameState(n, names, ai, { seed })` uses the given seed. Without one, it picks an unpredictable seed from `crypto.getRandomValues`, or falls back to `Math.random`. Normal play therefore behaves as before, and `state.rng.seed` still reproduces the game.
- **What is deterministic.** The same seed plus the same sequence of actions produces the same game, byte for byte.
- **The AI's randomness.** The AI's difficulty noise is not gameplay, and it must not move the game's random stream. Otherwise a human replaying the same actions would get different shuffles. `AIPlayer.chooseAction(state, logic, playerId, difficulty, rng)` therefore takes its own optional `SeededRandom`:
  - The UI creates one per game, seeded with `(gameSeed ^ 0x9E3779B9) >>> 0`, so a seeded AI game is reproducible end to end.
  - Without an `rng`, the AI falls back to `Math.random`, as before.
- **Enforcement.** Inside the test engine, `Math.random` throws, so any gameplay code that bypasses the seeded generator fails the test suite.

## Cloning

`state.clone()` returns a fully independent `GameState` at the same point,
with the random generator at the same position. It is
`deserialize(serialize())` without validation, which takes about 70 µs for a
4-player mid-game state.

The tests check that:
- no object is shared between a clone and its original (by walking both object graphs);
- mutations do not leak in either direction;
- a clone continues identically to its original under the same decisions.

Use it with a fresh logic object: `new GameLogic(state.clone())`.

## Saved-state format (version 1)

`state.serialize()` returns plain JSON-compatible data:

```js
{
  format: 'brass-birmingham/game-state', version: 1,
  numPlayers, era, round, currentPlayerIndex, actionsThisTurn, actionsPerTurn,
  isFirstRound, gameOver, turnOrder, moneySpentThisRound,
  rng: { seed, state },
  players: [{ name, isAI, aiDifficulty, money, incomeSpace, vp,
              hand: [card], discardPile: [card], linksRemaining: { canal, rail },
              mat: { cottonMill: [used, used, …], coalMine: […], … } }],
  boardIndustries:  { 'city_slot': { playerId, type, level, flipped, resourceCubes } },
  breweryFarmTiles: { 'northern':  { … same … } },
  boardLinks: { connectionId: { playerId, type } },
  coalMarket, ironMarket,
  merchantTiles: [{ location, buys, hasBeer }],
  drawDeck: [card], wildLocationPile, wildIndustryPile, lastRoundEvents: [...]
}
```

**What is stored compactly.** Board tiles store only `type` + `level`, and
player mats store only the `used` flags. The printed tile data is rebuilt from
`INDUSTRY_DATA` on load, so a save cannot carry stale or tampered tile values.

**Loading.** `GameState.deserialize(dataOrJsonString)` validates the data and
then rebuilds a working state. Anything malformed or incompatible throws a
`GameStateError` that names the problems. Validation checks:
- **Format and version:** the format name; versions newer than this code are rejected.
- **Players and turns:** the player count; the turn-order permutation; the current player; the era and round values.
- **Cards and player data:** card shapes and known locations/industries; wild cards only in hands; hand size; money, income and VP ranges (negative money only for a player who owns tiles, i.e. a pending shortfall); mat shape.
- **Board:** industry spaces exist and allow that industry; levels exist; owners are valid; links are on real connections and of a type that line allows.
- **Markets, merchants and piles:** market ranges; merchant tiles; wild-card piles.
- **RNG:** the generator state.

**Compatibility.** When the layout changes incompatibly, bump
`GAME_STATE_VERSION` and teach `deserialize` to migrate older versions.

## Hidden information

`serialize()` contains everything needed to continue the game exactly. That
includes hidden information: every hand, the order of the draw deck,
face-down discards and the random-generator state, which predicts future
shuffles. It is an engine and AI facility. It is not shown to players and is
not wired to any UI.

There are two player-facing views:
- **`state.toJSON()`.** Used by `window.render_game_to_text` and by `JSON.stringify(state)`. Unchanged: a summary with hand and deck sizes only.
- **`state.getPlayerView(viewerId)`.** New. It returns the same shape as a save, with:
  - every hand except the viewer's removed (`handCount` instead);
  - the deck reduced to `drawDeckCount`;
  - face-down discards replaced by `{ faceDown: true }`, hidden from their owner too;
  - the random-generator state removed.

  `viewerId = null` gives a spectator view. A player view has a different `format` and cannot be loaded as a save.

The debugging globals that `main.js` already exposes (`window.gameState` and
the others) can of course reach everything. They are a developer convenience,
unchanged from before.
