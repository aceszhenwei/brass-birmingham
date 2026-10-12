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
| Consumers | `uiManager.js`, `aiPlayer.js`, `test/helpers/headless.js`, `scripts/simulate.js` | Present the game and choose moves |

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
| `js/aiPlayer.js` | Heuristic AI opponent (Easy / Normal / Hard) |
| `js/industryIcons.js` | Engraved industry illustrations shared by the board and the hand cards |
| `js/actionIcons.js` | Action button icons |
| `js/boardAssets.js` | The bundled board and component artwork, and the measured board layout ([`board-artwork.md`](board-artwork.md)) |
| `js/boardRenderer.js` | The SVG board: procedural terrain, frame and score track, and calibration mode |
| `js/uiManager.js` | Presents the game and collects decisions: the phase bar, cards, choice dialogs, the log, and scoring screens |
| `js/main.js` | Entry point and setup screen |
| `assets/` | Board, tile, card, and player-mat artwork |
| `screenshots/` | Images used by the README and the docs |
| `test/` | The `node:test` suite, its helpers, and fixtures ([`testing.md`](testing.md)) |
| `scripts/simulate.js` | The headless simulation run ([`testing.md`](testing.md)) |
| `scripts/research/` | AI research experiments ([`research/ai-baseline-audit.md`](research/ai-baseline-audit.md)) |
| `.github/workflows/` | Continuous integration ([`testing.md`](testing.md)) |
