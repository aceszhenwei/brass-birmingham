# Assignment 7: Evaluation Plan (fixed before validation)

This plan was written after the loan investigation and before any candidate
was evaluated. The results are in [`ai-loans-a7.md`](ai-loans-a7.md).

## Candidates

Each candidate is a loan-scoring variant of the corrected Assignment 6 AI
(`options.loan` in `js/aiPlayer.js`). Nothing else changes.

| Candidate | Change |
|---|---|
| `cashflow` | Price the loan by its actual cash flow: £30 now minus £3 for each income payment still to come in the game. This replaces the flat 25% discount and the current-era-only income term |
| `enabling` | Instead of a flat +4 whenever no Build or Network is affordable, value the loan by how much better the best Build or Network it newly makes affordable scores than the best one affordable now (or Pass) |
| `cashflow+enabling` | Both changes |

`never` (no loans) is a diagnostic ablation, not a candidate.

## Phases

**1. Exploration.** Seeds `200000 + 1000 × players + i`, the same range as Assignments 5 and 6.
- Each candidate plays the A6 baseline (`normal+a6`) in seat-balanced matchups:
  - 2 players: 100 seeds;
  - 3 and 4 players: 40 seeds each.
- Each candidate also plays mirror games, 100 seeds per player count, for the behaviour measures.
- At most **one** candidate goes forward: the one with the best pooled VP difference against the baseline, provided that difference is not negative.

**2. Validation.** Held-out seeds `300000 + 1000 × players + i`, never used before.
- The candidate plays the baseline at **every difficulty** (Easy, Normal and Hard each against the same level's A6 version) in seat-balanced matchups:
  - 2 players: 150 seeds;
  - 3 and 4 players: 60 seeds each.

## Adoption criteria (all required, measured on the held-out seeds)

1. **Normal improves.** The VP difference against `normal+a6`, pooled over 2, 3 and 4 players with each player count weighted equally, has a 95% interval entirely above 0, and the pooled win share is above 50%.
2. **No regression at any player count.** No player count, at any difficulty, has a VP-difference interval entirely below 0.
3. **No regression at the other difficulties.** For Easy and Hard, the pooled VP-difference interval is not entirely below 0.
4. **Correct and reliable.** The candidate never makes an illegal move, never fails a game, and passes the fairness and determinism tests.
5. **Economically sound.** In paired mirror games at Normal, VP lost to income shortfalls does not rise significantly.

Fewer loans or higher income are **not** criteria. If no candidate meets every
criterion, the production AI keeps the Assignment 6 loan heuristic, and the
negative result is documented.
