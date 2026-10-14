# Assignment 16 plan: long-term strategic valuation

Written before any diagnostic or competitive game was played. The results are
in [`ai-strategic-valuation-a16.md`](ai-strategic-valuation-a16.md).

## Candidates

Each is one extra term in the production planner's position value
(`js/aiPlanner.js`, Assignment 14 configuration), off by default. They use
public information only: the board, the player's own hand and tiles.

| | Option | Hypothesis | Term |
|---|---|---|---|
| A | `futureLinks` | H-RAIL | Each of the player's links is credited with the link icons of adjacent unflipped tiles (any owner's), times the heuristic's flip probability for that tile. |
| B | `eraValue` | H-ERA | In the Canal Era, each of the player's Level II+ tiles is credited with the VP it would score again at the end of the Rail Era. A flipped tile counts its VP; an unflipped one its VP times its flip probability. Both are discounted by 0.85, the share of Level II+ Canal tiles still on the board at the end in Assignment 13 self-play (76–94%). |
| C | `developValue` | H-DEV | When the top tile of an industry differs from the decision's start, the change in its value is credited, discounted by γ = 0.6 (like a step planned for the next turn). A tile's value is its VP and income times a typical flip probability, less its cost, or 0 if it cannot be built in the current era. The credit applies only if the player held a card that could build that industry and at least two rounds of the era remain. |

**Why each term does not double-count:**
- **A** counts link icons the position value does not yet include: those of unflipped tiles. The existing terms cover flipped icons (era score) and the tile's own VP and income.
- **B** counts the second scoring only. The current era score and the expected VP of unflipped tiles cover the first.
- **C** counts only the change since the decision's start. A build realised inside the plan is already valued directly, and a card spent on a build does not remove an option value.

**One weight per term, all set before testing:**
- A: none.
- B: 0.85, measured in Assignment 13.
- C: γ, the planner's own discount.

There is no tuning.

## Stages and budget (at most 1,500 complete games)

### 1. Position-level diagnostics (at most 60 diagnostic games)

**Games.** Production self-play, 2 games per player count, seeds
190000 + 1000 × players + i.

**What is recorded.** At every 3rd turn-start position, each candidate plans on
the same observation. The script records:
- decision time;
- whether the first move differs from production;
- the action types of the differing moves.

**A candidate is dropped if any of these holds:**
- it changes fewer than 2% of first moves;
- its decision times exceed the budget (mean 1 s, 95th percentile 2 s);
- its changed decisions are dominated by its target behaviour in a way that repeats a known failure. Specifically, C choosing Develop at more than 3 times production's rate in the positions sampled, which would mean the over-development of Assignments 9–10.

### 2. Screening (at most 120 games per candidate)

- **Design:** each candidate plays production (`normal@p4-c`), with seats balanced.
- **Seeds:** 200000 + 1000 × players + i would collide with the Assignment 5 exploration seeds, so screening uses 210000 + 1000 × players + i.
- **Games:** 20 seeds at 2 players (40 games), 7 at 3 (42) and 6 at 4 (36), 118 in all.
- **Promising:** pooled VP difference above 0, pooled win share above 50%, and no player count with its interval entirely below 0.
- **Stopping early:** a candidate is stopped as soon as it cannot be promising.

### 3. Combination (only if two or more candidates are promising)

The promising candidates together are screened the same way, at 118 games.

### 4. Held-out validation (at most 300 games per configuration)

- **Which configurations:** at most two. These are the best promising single candidate and, if it screened better than every single, the combination.
- **Games:** 50 seeds at 2 players (100 games), 17 at 3 (102) and 16 at 4 (96), 298 in all.
- **Seeds:** fresh, 220000 + 1000 × players + i.

### Adoption (the criteria of Assignments 7–14)

All of these must hold:
- on held-out games, the pooled 95% interval of the VP difference is entirely above 0, and the pooled win share is above 50%;
- no player count, and not the pooled result, has its interval entirely below 0;
- decision time stays within the budget;
- there is no major behavioural regression in income, loans, shortfalls or game completion.

**Otherwise:** a positive but uncertain result is reported as inconclusive, and
production stays unchanged.

**Measures reported for every screened candidate:**
- win share and VP;
- link VP and industry VP;
- links, builds and developments;
- loans, income and shortfalls;
- money left at the end.
