# Assignment 14 plan: endgame evaluation and candidate selection

Written before any competitive game was played. The results and decisions are
in [`ai-endgame-evaluation-a14.md`](ai-endgame-evaluation-a14.md).

## Weaknesses (from Assignment 13, section 9.1)

1. **Endgame cash.** The position value counts money at £1 = 0.12 VP and
   income at its usual weight in every position, including positions after
   the player's last action of the game. A last-round loan is therefore worth
   about +3.4 to the planner, although money and income only break ties at the
   end. In self-play 25–30% of last-round decisions took no scoring action
   while a link worth 1+ VP was affordable, and players ended with £47–54.
2. **Candidate selection.** The planner searches only the heuristic's
   shortlist: the best move of each type, the next two builds and the top two
   single links by the heuristic's network score. That score counts network
   access, not the VP a link scores, so a 7 VP link ranked 5th was never
   searched (seed 904002, 4 players, player 0, Rail round 8).

## Candidates

All are options of the production four-action planner (`js/aiPlanner.js`).
Their defaults reproduce the Assignment 12 production planner exactly.

| | Option | Change | Reasoning |
|---|---|---|---|
| **A** | `endgame: 'tiebreak'` | In positions after the player's last action of the game, income and money count only as tie-breaks (an income level 0.01, £1 0.00001). The planner also stops a plan at the end of the era, which its documentation states but the code enforced only in the era's last round | The rulebook: leftover money and income only break ties. This is the money-after-the-last-scoring-opportunity case. Money that is unlikely to be spent is covered without a new weight: in the penultimate Rail round, plans reach the end of the game, so money held now is worth 0.12 × (1 − γ) = 0.048 per £ (the γ = 0.6 discount of the next turn). Money that can still be spent keeps its value. No cash target and no loan rule |
| **B** | `scoringLinks: true` | At the plan levels inside the current turn, if the legal single link that would score the most VP now (VP if the era ended now; ties broken by the heuristic) scores at least 1 VP and is not already shortlisted, it is added as one extra candidate | Includes the missed scoring links without re-weighting the heuristic or enumerating moves. Its value is judged by the planner's own position value. At most one extra candidate per level, and only within the current turn (at most two levels), so the cost is bounded (at most about +55% of states, less in practice) |
| **C** | both | A and B together | They target different parts of the same failure: A stops loans looking attractive, B makes the alternative visible |

## Stages and budget (at most 1,500 complete games)

1. **Targeted regression** (`scripts/research/ai-endgame.js`; the 24
   Assignment 13 games, counted as diagnostic games). From the start of each
   player's penultimate Rail turn, the game is played out with that seat
   taken by each policy (the other seats production), paired on the same
   position. Measures: the player's final VP, late loans, scoring links
   missed in the last round, money left, decision time.
   **Eliminate** a candidate that makes an illegal move or fails a test, whose
   paired final-VP difference has its 95% interval entirely below 0, or whose
   decision times exceed the budget.
2. **Screening** (at most 120 games per candidate). Candidate against
   production, seat-balanced (`ai-baseline.js matchups`): 20 seeds at 2 players
   (40 games), 7 at 3 (42) and 6 at 4 (36), 118 games; seeds 140000 + 1000 ×
   players + i. **Promising:** pooled VP difference above 0 and pooled win
   share above 50%, and no player count whose interval is entirely below 0.
   At most two candidates go on, preferring C if it is promising.
3. **Held-out validation** (at most 300 games per candidate): 50 seeds at 2
   players (100 games), 17 at 3 (102) and 16 at 4 (96), 298 games; fresh seeds
   150000 + 1000 × players + i.

**Adoption** (the criteria of Assignments 7–12, applied to stage 3):
- **Improvement:** the pooled VP-difference interval (95%) is entirely
  above 0 and the pooled win share is above 50%.
- **No regression:** no player count, and not the pooled result, has its
  interval entirely below 0.
- **Performance:** decision times stay within the budget (mean 1 s, 95th
  percentile 2 s, cut-off 2.5 s).
- **No major behavioural regression:** income, builds, link VP and game
  completion.
- **Otherwise:** a positive but uncertain result is reported as
  inconclusive, and production stays unchanged.

**Combining stage 1 with stage 3.** Stage 1 measures the paired effect on
final VP of the decisions the candidates change, with much less noise than
whole games. If stage 3 is inconclusive, stage 1 may be used as supporting
evidence, but not as a replacement for the competitive criteria above.
