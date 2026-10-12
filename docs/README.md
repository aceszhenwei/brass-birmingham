# Documentation

The [project README](../README.md) covers what the project is, where it comes
from, and how to run it. Everything more technical is here.

## Playing

- [`gameplay.md`](gameplay.md): the turn workflow, interface features, the rules as implemented, and tips.
- [`board-artwork.md`](board-artwork.md): the bundled artwork, using your own board image, calibration mode, and the procedural fallback board.

## Engine and code

- [`architecture.md`](architecture.md): a map of every source file and how the layers fit together.
- [`engine.md`](engine.md): game progression (`getCurrentDecision`, `play`, `runGame`), events, and headless games.
- [`moves.md`](moves.md): the move format, legal moves, and player choices.
- [`state-model.md`](state-model.md): the game state, the seeded random generator, cloning, the save format, and hidden information.

## Quality

- [`testing.md`](testing.md): the test suite, the simulation script, and the CI workflows.
- [`known-limitations.md`](known-limitations.md): the current limitations, the rules interpretations, and open maintenance items.

## Research

- [`research/ai-baseline-audit.md`](research/ai-baseline-audit.md): an audit of the existing AI (Assignment 5). It covers how each difficulty decides; legality, fairness and hidden information; the baseline strength experiments; the measured weaknesses; and recommendations for the AI work.
- [`research/ai-baseline-results.md`](research/ai-baseline-results.md): the full generated result tables.
- [`research/ai-corrections-a6.md`](research/ai-corrections-a6.md): Assignment 6. It covers the fairness correction (the AI decides on the player's observation) and the exact rounds-remaining count; the preserved legacy baseline; the regression tests; and before-and-after experiments. Full tables are in [`research/ai-corrections-a6-results.md`](research/ai-corrections-a6-results.md).
- [`research/ai-loans-a7.md`](research/ai-loans-a7.md): Assignment 7, on why the AI borrows so much. It tests three loan-scoring candidates against pre-registered criteria ([plan](research/ai-loans-a7-plan.md)), validates on held-out seeds, and records the decision to keep the production heuristic. Full tables are in [`research/ai-loans-a7-results.md`](research/ai-loans-a7-results.md).
- [`research/ai-overbuild-a8.md`](research/ai-overbuild-a8.md): Assignment 8, on why the AI overbuilt its own industries. Three candidates were tested under pre-registered criteria ([plan](research/ai-overbuild-a8-plan.md)), and `opportunity` (charging an overbuild for the replaced tile) was adopted after held-out validation (+3.6 to +4.0 VP at every difficulty). Full tables are in [`research/ai-overbuild-a8-results.md`](research/ai-overbuild-a8-results.md).
- [`research/ai-invest-a9.md`](research/ai-invest-a9.md): Assignment 9, on how the AI turns development and building into scored industries. The AI took almost every sale it could, but built most sellable industries where they could not be sold. Three candidates were tested under pre-registered criteria ([plan](research/ai-invest-a9-plan.md)), and `sell-calibrated` (a realistic sale probability for such tiles) was adopted after held-out validation (+9.3 to +10.5 VP at every difficulty). Full tables are in [`research/ai-invest-a9-results.md`](research/ai-invest-a9-results.md).
- [`research/ai-audit-a10.md`](research/ai-audit-a10.md): Assignment 10, closing the Assignment 5 audit. The open findings were measured and six candidates tested ([plan](research/ai-audit-a10-plan.md)). Double rail links and no development in the last two rounds were adopted together (+5.2 to +8.1 VP at every difficulty); discard, resource-source and shortfall rules were neutral and rejected. [`research/ai-audit-checklist.md`](research/ai-audit-checklist.md) gives the status of every original finding. Full tables are in [`research/ai-audit-a10-results.md`](research/ai-audit-a10-results.md).
- [`research/ai-planning-a11.md`](research/ai-planning-a11.md): Assignment 11, a feasibility study of short-horizon planning. Experimental planners that look two or three of the AI's own actions ahead, on the player's observation only, beat the production AI by +31.6 VP (two actions, about 22 ms per decision) and +43.1 VP (three actions, too slow as built) on held-out seeds ([plan](research/ai-planning-a11-plan.md)). It recommends an opt-in two-action planner as Assignment 12. The production AI is unchanged. Full tables are in [`research/ai-planning-a11-results.md`](research/ai-planning-a11-results.md).

## History

These are records of the work on this fork, kept as written at the time.
Later work may have changed some details; the documents above describe the
current state.

- [`history/brass-review-findings.md`](history/brass-review-findings.md): the original rules audit and architecture review of upstream commit `2c1fe1f`, with a status table.
- [`history/assignment-1-report.md`](history/assignment-1-report.md): the test suite and rules fixes.
- [`history/assignment-2-report.md`](history/assignment-2-report.md): deterministic randomness, cloning, and serialization.
- [`history/assignment-3-report.md`](history/assignment-3-report.md): unified legal moves and player choices.
- [`history/assignment-4-report.md`](history/assignment-4-report.md): engine-controlled progression and headless games.
