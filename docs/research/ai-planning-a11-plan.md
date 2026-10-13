# Assignment 11: Evaluation Plan (fixed before the matchups)

This plan was written after the first measurements of
`scripts/research/ai-plan.js` and before any planner played a matchup. The
results are in [`ai-planning-a11.md`](ai-planning-a11.md).

## Baseline

The production AI of Assignment 10, at Normal (`normal` in the harness).

## Planners

All are experimental policies (`scripts/research/planner.js`), outside the
production decision path. Each decides on the player's observation, takes its
candidate moves from the production heuristic, and plays hypothetical
sequences of its own moves on clones. The assumptions are listed in
`planner.js`.

| Name | Depth | Evaluation | Role |
|---|---|---|---|
| `p1-sum` | 1 | heuristic action scores | **Control A**: the planner's machinery without lookahead (the heuristic without its random noise) |
| `p2-sum` | 2 | heuristic action scores, summed | **Candidate A** (two-action planning) |
| `p3-sum` | 3 | heuristic action scores, summed | **Candidate B** (three-action planning) |
| `p1-state` | 1 | change in a static position value | **Control B** |
| `p2-state` | 2 | change in a static position value | Candidate A with the other evaluation |
| `p3-state` | 3 | change in a static position value | Candidate B with the other evaluation |
| `p2-sum-g0` | 2 | as `p2-sum`, ignoring actions beyond the current turn | Diagnostic: opponent and uncertainty assumption |
| `p2-sum-g1` | 2 | as `p2-sum`, trusting actions beyond the turn fully | Diagnostic: opponent and uncertainty assumption |
| `p2-sum-w3` | 2 | as `p2-sum`, 3 first-level candidates instead of 6 | Diagnostic: branching |

Defaults: 6 first-level candidates and 3 second-level candidates. Actions
beyond the current turn are discounted by 0.6.

## Phases

**1. Exploration** (seeds `200000 + 1000 × players + i`).
- Every planner plays production Normal in seat-balanced matchups (2 players: 100 seeds; 3 and 4 players: 40 each).
- The depth-2 and depth-3 planners also play their own depth-1 control (`p2-sum` and `p3-sum` against `p1-sum`; `p2-state` and `p3-state` against `p1-state`). This separates the effect of lookahead from the effect of removing the heuristic's noise.
- Depth 3 also plays depth 2 directly (`p3-sum` against `p2-sum`; `p3-state` against `p2-state`).

**2. Validation** (held-out seeds `700000 + 1000 × players + i`, never used before).
- The candidate is the depth-2 or depth-3 planner with the best exploration pooled VP difference against production, provided it beats its control.
- It plays production Normal (2 players: 150 seeds; 3 and 4 players: 60 each), and its depth-1 control.
- **Generalisation:** it plays production Hard (2 players: 100 seeds; 3 and 4 players: 40 each).

**Amendments after exploration** (recorded before any held-out game).
- The timing probe showed depth 3 over the time budget: 66–77 ms mean, and 150–176 ms at the 95th percentile.
- `p3-state` (the plan's candidate) is still validated as written.
- `p2-state`, the best depth-2 planner, is also validated on the same seeds and with the same opponents (`p2-state` against its control, and against Hard).
- A bounded depth-3 planner, `p3-state-b` (4 first-level and 2 second-level candidates), is explored on the exploration seeds only, against production Normal and against `p2-state`. It is a feasibility diagnostic.

## Success criteria (all on the held-out seeds)

A planner is judged **worth pursuing** only if:
1. **It beats production.** Pooled VP difference against Normal has a 95% interval entirely above 0, and the pooled win share is above 50%.
2. **Lookahead is the cause.** Against its own depth-1 control, the pooled interval is entirely above 0.
3. **No player count regresses.** No player count has an interval entirely below 0, against Normal or Hard.
4. **It is practical in a browser.** Mean decision time is at most 50 ms; the 95th percentile is at most 150 ms; the worst observed decision is at most 500 ms.
5. **It is correct and fair.** No illegal move or failed game; no mutation of the real state; decisions identical when opponents' hands and the deck are replaced (the fairness probe).

**Three-action planning adds value** only if it beats depth 2 directly with a
pooled interval entirely above 0, and also passes criteria 3–5.

**Not criteria:** how often the planner disagrees with the heuristic, how often
plans are carried out, or the number of states evaluated. These are
diagnostics.

The production AI is not changed whatever the outcome (scope of
Assignment 11).
