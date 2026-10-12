# Assignment 2 — Deterministic Game State, Cloning and Serialization

Scope:
- seeded randomness;
- independent state copies;
- versioned, validated serialization;
- the tests and simulations that prove them.

Out of scope:
- no AI strategy, difficulty or search work;
- no legal-move API;
- no turn-flow redesign;
- no UI redesign.

`index.html` still opens directly from disk with no build step and no
dependencies. The state model and save format are documented in
[`state-model.md`](../state-model.md).

## 1. What was implemented

### Deterministic randomness (`js/random.js`, `GameState.rng`)
- **The generator.** `SeededRandom` (mulberry32) holds its whole state in two 32-bit integers. It provides `next()`, `int(n)`, `shuffle(arr)`, `getState()`, `fromState()` and `clone()`.
- **Gameplay randomness.**
  - `GameState` owns one generator, seeded through `new GameState(n, names, ai, { seed })`.
  - Every gameplay random draw uses it: the initial turn order, merchant tiles, the setup shuffle and the Rail Era reshuffle.
  - Without a seed, an unpredictable one is chosen, so normal play is unchanged, and it is kept in `state.rng.seed`.
- **AI randomness.** The AI's difficulty noise draws from its own optional stream: `AIPlayer.chooseAction(…, rng)`.
  - The UI derives that stream from the game seed, so a seeded game with AI seats is reproducible end to end.
  - It is separate on purpose. If the AI shared the game's generator, AI thinking would change future shuffles, and the same seed plus the same *actions* would no longer reproduce the same game.
  - The AI's strategy is unchanged.
- **Enforcement.** No gameplay code calls `Math.random` any more. The only remaining use is the fallback seed when `crypto` is unavailable. The test engine makes `Math.random` throw, so a regression would be caught immediately.

### Cloning (`state.clone()`)
- **What it does.** A fully independent copy at the same point, including the generator position. It is about 70 µs for a 4-player mid-game state.
- **How.** It is implemented as `deserialize(serialize())`, so cloning and saving can't drift apart.
- **What the tests prove.** No object is shared between clone and original (they walk both object graphs). The tests also cover:
  - mutation in both directions;
  - continuation under identical decisions;
  - rollouts to the end of the game on clones, which leave the original untouched;
  - clones at the start of the game, at the era boundary and at game over.

### Serialization (`serialize()`, `GameState.deserialize()`)
- **Content.** Complete, JSON-compatible and versioned (`format: 'brass-birmingham/game-state'`, `version: 1`), at about 7–8 KB per game.
- **Restore.** `deserialize` accepts either the object or its JSON string.
- **Validation.** Before rebuilding, it validates:
  - format and version (newer versions are rejected);
  - player count, turn order and era;
  - every card, tile, slot, level, owner, link and connection;
  - market, merchant and pile ranges;
  - the generator state.

  Problems raise a `GameStateError` with specific messages; 28 malformed cases are tested.
- **Compact storage.** Tiles are saved as type + level and rebuilt from `INDUSTRY_DATA`, so a save can't carry tampered tile values.
- **Hidden information.**
  - `serialize()` is engine-only, because it contains every hand, the deck order, face-down discards and the generator state.
  - The new `getPlayerView(viewerId)` redacts all of these. It cannot be loaded as a save.
  - The existing `toJSON()` / `render_game_to_text` remain a summary with no hidden data. A test checks this.

### State-model changes (details in `state-model.md`)

| Change | Reason |
|---|---|
| `GameState.rng` added | Deterministic, serializable randomness |
| `players[].discardPile` added (face-down setup card + discarded cards) | Required for a complete save. The setup and discarded cards used to vanish. The invariants now check card conservation: deck + hands + discards = the full deck |
| `hasWildLocation`/`hasWildIndustry` flags removed → `playerHasWildCard()` | They duplicated the hand and could disagree with it |
| Dead UI fields removed from `GameState` (`selectedCardIndex`, `selectedAction`, `pendingAction`) | Unused; would have polluted saves |

The only UI change is one line in `UIManager`, which creates the AI's seeded
stream and passes it to the AI. `index.html` has one new `<script>` tag for
`random.js`.

## 2. Tests

```
node --test test/*.test.js                     # 108 tests, ~14 s
node scripts/simulate.js --games 100           # the large regression run below
```

**Result: 108 tests, 108 passing.** That is the 74 tests from Assignment 1, all
retained, plus 34 new ones.

| New / extended file | What it proves |
|---|---|
| `determinism.test.js` (17) | See the breakdown below this table |
| `clone.test.js` (7) | Every component preserved; no shared references; isolation in both directions; generator position copied; identical continuation; simulations on clones never mutate the original; clones at the start, the era boundary and game over |
| `serialization.test.js` (10) | See the breakdown below this table |
| `ai-simulation.test.js` (3, extended) | Full AI games per player count. Each one is cloned and saved part-way through (anywhere from Canal round 1 into the Rail Era), and the original, the clone and the restored game must finish byte-identical |
| `helpers/invariants.js` (extended) | Card conservation across deck, hands and discards; no wild cards in discard piles |

**`determinism.test.js` covers:**
- generator sequences, and resuming a saved generator;
- identical initial states from the same seed, for 2, 3 and 4 players;
- 40 seeds giving 40 different decks, plus varied merchant layouts and turn orders;
- unseeded games working and being reproducible from the seed they chose;
- `Math.random` never being used;
- AI choices not advancing the game's generator;
- complete AI games being reproducible from the seed;
- a recorded action sequence replayed without the AI reproducing the game;
- the Rail Era reshuffle following the seed;
- recorded Assignment 1 games being replayed bit-for-bit.

**`serialization.test.js` covers:**
- the format and version fields, and that a save is plain JSON;
- round trips from both an object and a string;
- tile data being rebuilt from the tables;
- a restored game continuing identically, with the AI using its restored stream;
- the generator continuing correctly after a restore, through the Rail Era reshuffle;
- restored states sharing no references with the input;
- player views hiding hands, the deck, face-down discards and the generator;
- player views being refused as saves;
- `toJSON` containing no hidden data;
- 28 malformed or incompatible saves being rejected with `GameStateError`.

## 3. Headless simulation results

`scripts/simulate.js` plays every game through the strict driver:
- **Failures are fatal.** Any failed action or exception, any broken invariant after any action, or a wrong round count fails the run.
- **Checkpoint.** It clones and saves each game at a checkpoint that varies by seed.
- **Three continuations from the checkpoint:**
  - the original plays on with the AI;
  - the clone replays the original's decisions;
  - the restored save plays on with the AI using its restored random stream.
- **Comparison.** All three must end byte-identical, and the restored AI must make the same decisions.

| Run | 2 players | 3 players | 4 players | Problems |
|---|---|---|---|---|
| `--games 100` (seeds ×001–×100) | 100/100 | 100/100 | 100/100 | **0** |
| `--games 200 --first 101` (new seeds) | 200/200 | 200/200 | 200/200 | **0** |

- **Rounds.** Every game ended with exactly 10 / 9 / 8 rounds per era.
- **Clone and restore.** All 900 originals, clones and restored saves finished identically.
- **Game length and score.** Average game length is unchanged from Assignment 1: 78 / 105 / 124 actions. Average winning VP is about 50–52 / 60 / 61–64.

### Comparison with Assignment 1 (equivalent initial conditions and actions)

- **The baseline.** `test/fixtures/assignment1-baseline.json` records 300 games (100 per player count) played by the **Assignment 1 code** (merged PR #1, `25e5b89`) under its test harness. That harness drew every random number, both shuffles and AI noise, from one seeded `Math.random`.
- **Equivalent conditions.** Replaying the same seeds with the AI deliberately sharing the game's generator (`sharedRng`) reproduces exactly the same sequence of random draws.
- **Result.** All 300 games match the baseline fingerprint. That fingerprint covers:
  - every board tile, link, market and merchant;
  - every player's money, VP, income, hand size and tiles used;
  - the turn order;
  - the number of actions of each kind.

  So the refactor changed no gameplay behaviour at all.
- **In the test suite.** `determinism.test.js` repeats this check for the first 10 games per player count.

**Browser check.** A Playwright run of `index.html` (1 human + 2 AI seats):
- played to Canal round 7 with no console errors and no AI recoveries;
- the game picked an unpredictable 32-bit seed;
- `serialize()` → `deserialize()` round-tripped inside the page;
- `render_game_to_text` contained no hidden fields.

## 4. Remaining architectural limitations

1. **Turn flow still lives in `UIManager`.** Advancing turns, ending an era (`endCanalEra`/`endGame`) and the AI's Gloucester bonus are driven from the UI. The headless driver mirrors this, so there are two copies. A clone or save taken between actions is exact, but "apply one move" is not yet a single engine call.
2. **No unified move model.** Actions are separate `execute*` calls with their own argument shapes, and the list of legal moves is spread across several `getValid*` methods. Game-tree search needs `getLegalMoves(state)` / `applyMove(state, move)`.
3. **Player choices are still automatic** (audit B1–B5): iron works, beer source, merchant tile, shortfall tiles and ties between equally close coal mines. These choices are not part of any move yet, so a search could not explore them.
4. **Mid-action state can't be saved.** The Gloucester free-develop prompt for human players is held in UI state, not in `GameState`. A save is complete only *between* actions, which is fine for AI simulation but matters for a future save/load UI.
5. **The AI ignores information boundaries.** The existing "hard" AI reads opponents' hands directly (`denialBonus`). A future AI should see only `getPlayerView(id)`, and should sample the hidden cards (determinization) when it simulates. That is a design point for the AI work, not a defect in the state layer.
6. **Clone speed.** Cloning costs about 70 µs (it goes through serialization). That is fine for thousands of rollouts. A specialised copy could be several times faster if deep search needs it later.
7. **Unchanged from before:**
   - the tie-break is still computed in the UI;
   - there is no save/load UI;
   - the debugging globals (`window.gameState`) still expose everything to anyone using the developer console.

## 5. Readiness for Assignment 3

**Ready.**

What is in place:
- the state is deterministic for a given seed and actions;
- it can be copied cheaply and with complete isolation;
- it can be saved and restored, with validation and versioning;
- 108 tests and a 900-game simulation run (clone/restore checks plus Assignment 1 equivalence) protect all of this.

Those are the preconditions for moving turn flow into the engine and building
a unified `getLegalMoves` / `applyMove` API on top. That is where the
remaining limitations 1–4 would be addressed.

Two notes for that work:
- the headless driver's `applyDecision` + `advance` pair is effectively the first draft of `applyMove`;
- once moves are explicit, the clone/serialize continuation tests can run on recorded move lists directly.
