# Assignment 9: Evaluation Plan (fixed before validation)

This plan was written after the development and selling investigation
(`scripts/research/ai-invest.js`, 900 games) and before any candidate was
evaluated. The results are in [`ai-invest-a9.md`](ai-invest-a9.md).

## Candidates

Each candidate is a research variant of the current production AI (the
Assignment 8 AI) and changes exactly one valuation. The development and
selling candidates are evaluated separately.

| Candidate | Option | Change |
|---|---|---|
| `develop-horizon` | `develop: 'horizon'` | No Develop when 2 or fewer rounds remain in the game. Industries developed then were built later only 1–7% of the time |
| `sell-calibrated` | `sell: 'calibrated'` | In the build score, a sellable tile that could not be sold yet gets a sale (flip) probability of 0.25 instead of 0.6. "Could not be sold" means no connected merchant buys it, or there is not enough beer. Such tiles sold 16–31% of the time; sale-ready ones sold 87–95% |
| `sell-connect` | `sell: 'connect'` | A Network link earns the rise in sale probability (0.25 → 0.8) times the VP and income value of each of the player's own unsold sellable tiles that it newly connects to a buying merchant |

No candidates are combined unless each has passed on its own.

## Phases

**1. Exploration.** Seeds `200000 + 1000 × players + i`, the seeds of the investigation.
- Each candidate plays the production Normal (`normal`) in seat-balanced matchups:
  - 2 players: 100 seeds;
  - 3 and 4 players: 40 seeds each.
- Each candidate also plays mirror games, 100 seeds per player count, for the behaviour measures.
- At most **one** candidate goes forward: the one with the best pooled VP difference, provided that difference is not negative.

**2. Validation.** Held-out seeds `500000 + 1000 × players + i`, never used before.
- The candidate plays the production AI at every difficulty, each against the same level, in seat-balanced matchups:
  - 2 players: 150 seeds;
  - 3 and 4 players: 60 seeds each.
- **Generalisation:** Normal with and without the candidate each play the production Hard and Easy (2 players: 100 seeds; 3 and 4 players: 40 seeds).

## Adoption criteria (all required, measured on the held-out seeds)

1. **Normal improves.** The pooled VP difference against `normal` (2, 3 and 4 players weighted equally) has a 95% interval entirely above 0, and the pooled win share is above 50%.
2. **No regression at any player count.** No player count, at any difficulty, has a VP-difference interval entirely below 0.
3. **No regression at the other difficulties.** For Easy and Hard, the pooled VP-difference interval is not entirely below 0.
4. **Correct and reliable.** The candidate never makes an illegal move, never fails a game, and passes the fairness and determinism tests.
5. **No economic harm.** In paired mirror games at Normal, VP lost to income shortfalls does not rise significantly.

**Not criteria:** more sales, fewer Develop actions, or fewer unsold tiles. If
nothing passes, production stays as it is and the negative result is
documented.
