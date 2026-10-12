# Testing, Simulation and CI

Everything runs on Node.js 22 or later, with no dependencies and no
`npm install`.

## Test suite

```
node --test test/*.test.js
```

It uses Node's built-in test runner and takes about 30 seconds. Pass the files
with the glob rather than the bare `test/` directory, because Node 22 treats a
directory argument as a single file.

The tests load the same `js/` files the browser loads into a Node `vm`
context (`test/helpers/engine.js`). Inside that context `Math.random` throws,
so any gameplay code that bypasses the game's seeded generator fails the suite.

| File | Covers |
|---|---|
| `init.test.js` | Setup: decks, hands, markets, merchants, turn order |
| `actions.test.js` | All seven actions, including rejection of illegal input |
| `resources.test.js` | Coal, iron and beer sourcing, and the coal and iron markets |
| `turns.test.js` | Turn progression, turn order, round counts, era transitions |
| `scoring.test.js` | Income shortfalls, era scoring, the end of the game |
| `regressions.test.js` | The defects confirmed in the [rules audit](history/brass-review-findings.md) |
| `determinism.test.js`, `clone.test.js`, `serialization.test.js` | Seeded randomness, cloning, saves |
| `legal-moves.test.js`, `choices.test.js` | Legal-move soundness and completeness, player choices, fuzzed moves |
| `ui-choices.test.js` | The UI's choice dialogs and engine-driven flow, with a DOM stub |
| `progression.test.js` | Engine-controlled progression, saves at every lifecycle boundary |
| `ai-simulation.test.js` | Complete AI-vs-AI and random legal-move games |

`BRASS_SIM_GAMES=100 node --test test/*.test.js` raises the number of
complete games the suite plays per player count (default 10).

### Helpers and fixtures

| Path | Purpose |
|---|---|
| `test/helpers/engine.js` | Loads the engine into a `vm` context |
| `test/helpers/headless.js` | The strict headless driver: AI games, random games, clone/restore continuation checks |
| `test/helpers/invariants.js` | State invariants checked after every simulated move |
| `test/helpers/scenario.js` | Builders for hand-made test positions |
| `test/helpers/fingerprint.js` | Compact game fingerprints for comparing games |
| `test/helpers/dom.js` | A minimal DOM stub for the UI tests |
| `test/fixtures/assignment1-baseline.json` | 300 games recorded from the Assignment 1 code |

## Simulation

```
node scripts/simulate.js [--games 100] [--players 2,3,4] [--first 1] [--no-a1] [--random 20] [--mixed 30]
```

For each player count, the script plays:

- **`--games` AI games** (seeds `1000 × players + i`), with the difficulty rotating easy, normal and hard by seed. Every game is cloned and saved to JSON part-way through, and the original, the clone and the restored save must finish identically. Unless `--no-a1` is given, each game with a recorded counterpart (seeds 1–100) is also compared with the Assignment 1 baseline.
- **`--mixed` games** with a different difficulty at each seat (easy, normal, hard, normal).
- **`--random` games** choosing at random among every legal move, with all choices expanded and random income-shortfall decisions.

Every game is driven only through `getCurrentDecision` / `play` and is
reported as a problem if:

- a move is rejected or the engine throws;
- a state invariant breaks after any move;
- the game does not finish within 5,000 actions (a stall);
- an era does not last exactly 10 / 9 / 8 rounds for 2 / 3 / 4 players;
- a clone or restored save diverges from the original.

The script prints a summary per player count, lists every problem, and exits
with a non-zero code if there are any. `--first` shifts the AI game seeds, so
a later run can cover new games, for example `--first 101 --no-a1`.

## Continuous integration

Two GitHub Actions workflows live in `.github/workflows/`.

### `ci.yml`: every pull request and every push to `main`

It runs on pull requests (opened, updated, reopened), on pushes to `main`, and
on manual dispatch. It takes about a minute.

| Job | Steps |
|---|---|
| **Tests** (Node 22 and 24) | The full test suite with the `spec` reporter |
| **Smoke checks** (Node 22) | `scripts/check-repo.js`, then a small simulation: 3 AI games, 1 mixed-difficulty game and 1 random game per player count |

`scripts/check-repo.js` checks that every file `index.html` loads exists,
that every `js/` file is loaded, that fixed asset paths in the code exist, and
that every relative Markdown link and heading anchor resolves.

### `simulation.yml`: large simulations, on demand

Start it from the **Actions** tab (*Large simulation* → *Run workflow*). It
runs one job per player count (2, 3 and 4) in parallel. Its inputs are the
number of AI, mixed-difficulty and random games, and the first AI seed. The
defaults are 100, 30 and 20, from seed 1, which takes a few minutes per job.

Each job writes its summary to the run page and uploads the full log as an
artifact (`simulation-<players>p`). Any problem fails the job.

## Running the browser game

There is no automated browser test in CI. After UI changes, open `index.html`
through a local server and play a few turns, including a choice dialog and an
AI turn. The assignment reports describe the Playwright checks used during
development.
