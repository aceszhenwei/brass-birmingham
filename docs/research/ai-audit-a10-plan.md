# Assignment 10: Evaluation Plan (fixed before the matchups)

This plan was written after the measurement run of
`scripts/research/ai-close.js` and before any candidate played a matchup.
The results are in [`ai-audit-a10.md`](ai-audit-a10.md).

## Baseline

The production AI of Assignment 9 (`sell: 'calibrated'`), named `<level>` in
the harness.

## Candidates

Each is one option in `js/aiPlayer.js`. The defaults reproduce Assignment 9
exactly.

| Candidate | Option | Audit finding | Change |
|---|---|---|---|
| `double` | `network: 'double'` | W5: double rail links never built | In the Rail Era, also score two-link Networks: the best first link's score plus the second's with the first in place, less the extra £5 and a barrel of beer (1 VP) |
| `useful-cards` | `cards: 'useful'` | W4: careless discards | For Network, Develop, Sell, Loan and Pass, discard the least useful card (`cardUsefulness`, +1 if it could build now) instead of the first |
| `own-sources` | `sourcing: 'own'` | W5 / H4: resource choices left to the engine | Where coal (equally close mines), iron (any works) or beer can come from several sources, take the player's own first |
| `value-shortfall` | `shortfall: 'value'` | Shortfall tile choice (audit §1.2) | Sell the tile whose loss costs least (a flipped tile's VP; an unflipped tile's flip probability × its VP and income) instead of "unflipped first, lowest VP" |
| `develop-horizon` | `develop: 'horizon'` | W2: over-development (re-test recommended by Assignment 9) | No Develop with 2 or fewer rounds left in the game |

**Added during exploration** (declared here before it played): `buildable-cards`
(`cards: 'buildable'`). `useful-cards` failed exploration. This narrower variant
targets the audit's exact finding: discard the first card that could not build
now, and keep cards that could. It is explored and judged like the others.

Not candidates, from the measurement run:
- **Two-tile development:** 86% of Develop actions already remove two tiles, and no single-tile Develop had a legal same-industry pair.
- **Merchant choice:** the engine's default already takes the merchant with the best bonus.
- **Gloucester's free develop:** the default takes Canal-only tiles first, then the lowest level, which is close to the AI's own Develop ranking (Canal-only first). It arises about 0.6 times per player per game.

## Phases

**1. Exploration** (seeds `200000 + 1000 × players + i`).
- Each candidate plays production Normal in seat-balanced matchups (2 players: 100 seeds; 3 and 4 players: 40 each).
- Each also plays 100 paired mirror games per player count, for the behaviour measures.

**2. Combination.** The assignment allows related improvements to be combined.
- Candidates whose exploration pooled VP difference is positive with an interval not including 0 are combined into one candidate, `combined`.
- If two or more qualify, `combined` is also explored.
- Candidates that did not qualify are not combined.

**3. Validation** (held-out seeds `600000 + 1000 × players + i`, never used before).
- What is validated: `combined` if it has the best exploration pooled VP difference; otherwise the single best candidate.
- It plays production at every difficulty (2 players: 150 seeds; 3 and 4 players: 60 each).
- **Generalisation:** Normal with and without the change, each against production Hard and Easy (2 players: 100 seeds; 3 and 4 players: 40 each).

## Adoption criteria (all required, on held-out seeds)

1. **Normal improves.** The pooled VP difference has a 95% interval entirely above 0, and the pooled win share is above 50%.
2. **No player count regresses.** No player count, at any difficulty, has an interval entirely below 0.
3. **No other difficulty regresses.** For Easy and Hard, the pooled interval is not entirely below 0.
4. **Legal, fair and reliable.** No illegal move or failed game; the fairness, purity and determinism tests pass.
5. **Decision time stays reasonable.** Mean decision time is no more than 3 times production's.

**Not criteria:** more double links, fewer wasteful discards, more own sources.
If nothing passes, production stays as it is.
