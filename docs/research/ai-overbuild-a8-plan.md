# Assignment 8: Evaluation Plan (fixed before validation)

This plan was written after the overbuild investigation (`ai-overbuild.js`)
and before any candidate was evaluated. The results are in
[`ai-overbuild-a8.md`](ai-overbuild-a8.md).

## Candidates

Each candidate is an overbuild-scoring variant of the current production AI
(`options.overbuild` in `js/aiPlayer.js`). Each changes only how a Build that
replaces one of the player's **own** tiles is scored. Overbuilding opponents'
tiles is unchanged.

| Candidate | Change |
|---|---|
| `opportunity` | Subtract the replaced tile's own future value, using the same terms the build score uses for a new tile. For a flipped tile, that is the VP it would still score (its income is already earned). For an unflipped tile, it is its expected VP and income times its flip probability, plus its cubes. The old tile's cost is sunk and is not counted |
| `opportunity-unflipped` | The same, applied to unflipped tiles only. Replacing a flipped tile keeps its income, and the investigation suggests those upgrades may be productive |
| `no-unflipped` | A rule rather than a valuation: never overbuild one's own unflipped tile |

## Phases

**1. Exploration.** Seeds `200000 + 1000 × players + i`.
- Each candidate plays the production Normal (`normal~a6`) in seat-balanced matchups:
  - 2 players: 100 seeds;
  - 3 and 4 players: 40 seeds each.
- Each candidate also plays mirror games, 100 seeds per player count, for the behaviour measures.
- At most **one** candidate goes forward: the one with the best pooled VP difference, provided that difference is not negative.

**2. Validation.** Held-out seeds `400000 + 1000 × players + i`, never used before.
- The candidate plays the production AI at every difficulty, each against the same level, in seat-balanced matchups:
  - 2 players: 150 seeds;
  - 3 and 4 players: 60 seeds each.

## Adoption criteria (all required, measured on the held-out seeds)

1. **Normal improves.** The pooled VP difference against `normal~a6` (2, 3 and 4 players weighted equally) has a 95% interval entirely above 0, and the pooled win share is above 50%.
2. **No regression at any player count.** No player count, at any difficulty, has a VP-difference interval entirely below 0.
3. **No regression at the other difficulties.** For Easy and Hard, the pooled VP-difference interval is not entirely below 0.
4. **Correct and reliable.** The candidate never makes an illegal move, never fails a game, and passes the fairness and determinism tests.
5. **No economic harm.** In paired mirror games at Normal, VP lost to income shortfalls does not rise significantly.

Fewer overbuilds are **not** a criterion. Unsuccessful candidates are not
combined to produce a change. If nothing passes, production stays as it is
and the negative result is documented.
