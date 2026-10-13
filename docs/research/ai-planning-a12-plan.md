# Assignment 12: Evaluation Plan (fixed before the matchups)

This plan was written after the planner moved into the game
(`js/aiPlanner.js`) and after the first timing measurements, and before any
four-action planner played a matchup. The results are in
[`ai-planning-a12.md`](ai-planning-a12.md).

## Policies

Every planner uses the Assignment 11 framework: candidates from the heuristic
AI of Assignment 10, the position-value evaluation (`state`), and gains
beyond the current turn discounted by 0.6. They differ only in depth and in
how many candidates are kept at each level (the last level always takes the
heuristic's single best move).

| Name | Depth | Candidates per level | Role |
|---|---|---|---|
| `p2-state` | 2 | 6 | Two-action reference |
| `p3-state` | 3 | 6, 3 | **The new production AI** (Normal and Hard) |
| `p4-state` | 4 | 6, 3, 3 | Full four-action planning |
| `p4-state-b` | 4 | 4, 2, 2 | Bounded four-action planning (uniformly narrower) |
| `p4-state-n` | 4 | 6, 3, 1 | Bounded four-action planning (full first two levels, a single third-level move) |
| `normal` | – | – | The heuristic AI of Assignment 10 (historical reference) |

## Phases

**1. Exploration** (seeds `200000 + 1000 × players + i`; 2 players: 100 seeds; 3 and 4 players: 40 each; seat-balanced matchups).
- Each four-action planner against `p3-state`.
- Full against bounded: `p4-state` against `p4-state-b` and against `p4-state-n`.
- **Depth 3 against depth 2** was measured in Assignment 11 on these seeds with identical code (`ai-planning-a11.md`, +9.7 VP; the moved planner reproduces the Assignment 11 decisions exactly). It is re-measured on the held-out seeds in phase 2.
- **Self-play:** production `p3-state` in every seat (2, 3 and 4 players; 50 seeds each), with the heuristic's own mirror games as the reference.

**2. Validation** (held-out seeds `800000 + 1000 × players + i`, never used before; 2 players: 150 seeds; 3 and 4 players: 60 each).
- **The four-action candidate.** Of the four-action planners whose exploration pooled VP difference against `p3-state` has an interval entirely above 0, the cheapest one that is not significantly worse than the strongest (in the full-versus-bounded matchups). If none qualifies, none is validated.
- It plays `p3-state`. `p3-state` plays `p2-state` on the same seeds.
- **Mixed tables** (held-out seeds; 40 seeds × every rotation): 3 players `candidate, p3-state, p2-state`; 4 players `candidate, p3-state, p2-state, normal`. If there is no candidate, `p3-state` takes its place and `p4-state` joins as the fourth seat in place of `normal` for reference.

## Decision criteria (all on held-out seeds)

A four-action planner replaces `p3-state` in production only if:
1. **It is stronger.** The pooled VP difference against `p3-state` has a 95% interval entirely above 0, and the pooled win share is above 50%.
2. **No player count regresses** against `p3-state`.
3. **It is fast enough:**
   - Node: mean decision time at most 1 s, 95th percentile at most 2 s, worst at most 2.5 s, worst two-action turn at most 5 s.
   - In the browser (desktop, and with the CPU throttled 4× to stand in for a phone): mean at most 1 s and 95th percentile at most 2 s. No decision may exceed the 2.5 s cutoff by more than one heuristic evaluation.
4. **It is correct and fair:** no illegal move or failed game, no mutation of the real game, and identical plans when hidden cards are reshuffled.

**Outcomes:**
- **A or B:** if the candidate passes, it is adopted. B applies when the candidate is a bounded planner.
- **C:** if no four-action planner beats `p3-state`, production stays at three actions.
- **D:** if one is stronger but fails criterion 3, production stays at three actions, and the limits are documented.

**Not criteria:** the number of states evaluated, how often the planner
disagrees with three-action planning, and plan realisation. These are
diagnostics.
