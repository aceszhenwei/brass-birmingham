# Architecture

The project is plain HTML, CSS, and JavaScript, with no build tools,
frameworks, or dependencies. `index.html` loads the files in `js/` as ordinary
scripts, in dependency order. The tests load the same files into a Node `vm`
context, so the browser and the tests run identical code.

## Layers

| Layer | Files | Responsibility |
|---|---|---|
| Data | `gameData.js` | Board, tiles, cards, merchants, and markets: the rulebook constants |
| Randomness | `random.js` | `SeededRandom`: every shuffle, reproducible and serializable |
| State | `gameState.js` | The complete game state, market mechanics, network pathfinding, low-level steps, and clone / serialize / restore |
| Rules queries | `gameLogic.js` | Legal targets, costs, resource sources, and `getDisabledReason()` |
| Moves | `moves.js` | The move format, validation, and player choices |
| Progression | `progression.js` | Who decides next, and every automatic step |
| Consumers | `uiManager.js`, `aiPlayer.js`, `aiPlanner.js`, `test/helpers/headless.js`, `scripts/simulate.js` | Present the game and choose moves |

The engine (data through progression) has no DOM code. The UI and the AI only
choose moves and present what happened; neither advances the game. See
[`engine.md`](engine.md) for the details.

## Files

| File | Purpose |
|---|---|
| `index.html` | Layout: the setup screen, the game screen with the phase bar, the game log, and overlays |
| `css/style.css` | Dark Victorian theme, CSS animations, card-select mode, and transitions |
| `js/gameData.js` | All constants: tiles, cities, connections, cards, merchants, and markets |
| `js/random.js` | `SeededRandom`, the seeded generator behind every shuffle |
| `js/gameState.js` | Game state, market mechanics, network pathfinding, turn management, and clone / serialize / restore ([`state-model.md`](state-model.md)) |
| `js/gameLogic.js` | Rules queries (targets, costs, sources), the older `execute*` wrappers, and `getDisabledReason()` |
| `js/moves.js` | The move engine: move format, planners and choice points, `getLegalMoves` / `applyMove` / `getNextChoice` ([`moves.md`](moves.md)) |
| `js/progression.js` | Game progression: `getCurrentDecision` / `play` / `runGame` ([`engine.md`](engine.md)) |
| `js/aiPlayer.js` | Heuristic AI opponent (Easy / Normal / Hard). It decides on the player's observation (`getObservation`), never the full state. It charges an overbuild of its own tile for the replaced tile's value, values a sellable tile that cannot be sold yet with its measured sale probability, builds double rail links, and stops developing in the game's last two rounds. `AIPlayer.LEGACY_A5`, `LEGACY_A6`, `LEGACY_A8` and `LEGACY_A9` reproduce earlier AIs for research. Since Assignment 12 it is the Easy AI, and the planner's candidate generator |
| `js/aiPlanner.js` | The production AI since Assignment 12 (`AIPlanner.chooseAction`, called by the UI): at Normal and Hard it plans several of the player's own actions ahead on clones of the player's observation, with a search budget ([`research/ai-planning-a12.md`](research/ai-planning-a12.md)). Since Assignment 14 it values money and income only as tie-breaks after the player's last action and always searches the link that would score the most VP now ([`research/ai-endgame-evaluation-a14.md`](research/ai-endgame-evaluation-a14.md)); `AIPlanner.A12` keeps the earlier planner. Easy plays the heuristic |
| `js/industryIcons.js` | Engraved industry illustrations shared by the board and the hand cards |
| `js/actionIcons.js` | Action button icons |
| `js/boardAssets.js` | The bundled board and component artwork, and the measured board layout ([`board-artwork.md`](board-artwork.md)) |
| `js/boardRenderer.js` | The SVG board: procedural terrain, frame and score track, and calibration mode |
| `js/uiManager.js` | Presents the game and collects decisions: card/map-first actions, confirmation, choice dialogs, compact summaries, industry inventory, active-turn snapshots, the log and scoring reviews |
| `js/main.js` | Entry point and setup screen |
| `assets/` | Board, tile, card, and player-mat artwork |
| `screenshots/` | Images used by the README and the docs |
| `test/` | The `node:test` suite, its helpers, and fixtures ([`testing.md`](testing.md)) |
| `scripts/capture-screenshots.js` | Optional browser capture of the current UI for documentation; requires Playwright only when run |
| `scripts/simulate.js` | The headless simulation run ([`testing.md`](testing.md)) |
| `scripts/research/` | AI research experiments ([`research/ai-baseline-audit.md`](research/ai-baseline-audit.md)), including the experimental planner `planner.js` ([`research/ai-planning-a11.md`](research/ai-planning-a11.md)), which the game does not load, the Assignment 13 capability-gap diagnostics `ai-gap.js` and `ai-gap-trace.js` ([`research/human-strategy-a13.md`](research/human-strategy-a13.md)), the Assignment 14 endgame scenarios and timing `ai-endgame.js` ([`research/ai-endgame-evaluation-a14.md`](research/ai-endgame-evaluation-a14.md)), and the Assignment 15 opponent models `opponents.js` with their diagnostics `ai-opponents.js` ([`research/ai-opponent-modelling-a15.md`](research/ai-opponent-modelling-a15.md)), which plug into the planner's inert `opponentModel` hook |
| `.github/workflows/` | Continuous integration ([`testing.md`](testing.md)) |
