# Assignment 16: long-term valuation

**Result: no change to production.** I tested three additions to the planner's
position value. Two were worse than production in screening. The third, future
link value, made the AI play quite differently and won slightly more often.
On 298 held-out games, though, its VP gain was not clear of zero (+1.8 ± 2.9),
so it doesn't meet the bar for adoption. The options stay in the code, switched
off, for future work.

The plan was written before any game was played:
[`ai-strategic-valuation-a16-plan.md`](ai-strategic-valuation-a16-plan.md).

## The problem

Assignment 13 found three things the planner can't see within its four-action
horizon:

- **H-RAIL.** A link is valued only at what it would score now. Links gain
  another 1.3–2.2 VP on average as nearby tiles flip later.
- **H-ERA.** Level II+ tiles built in the Canal Era stay on the board and score
  again at the end of the Rail Era. The planner only counts the Canal scoring.
- **H-DEV.** Developing has no value unless the build it enables falls inside
  the four-action plan. The AI develops only 0.8–1.4 times a game.

## What I tested

Each candidate is one extra term in the position value (`js/aiPlanner.js`), off
by default and added to the Assignment 14 production planner. Each term has at
most one fixed weight, set in advance, with no tuning.

| | Option | Extra value |
|---|---|---|
| A | `futureLinks` | For each of the player's links: the link icons of adjacent unflipped tiles (anyone's), times their chance of flipping (the heuristic's flip probability) |
| B | `eraValue` | In the Canal Era, the player's Level II+ tiles: their VP again for the Rail Era. Flipped tiles count their VP, unflipped ones VP × flip chance, all × 0.85 (the share of such tiles still on the board at the end in Assignment 13) |
| C | `developValue` | If an industry's top tile changed since the start of the decision (developed or built through): the change in its value × 0.6 (the planner's discount for next-turn steps). It counts only if the player held a card that could build that industry and at least two rounds of the era remain. Tile value is VP and income × a typical flip chance, minus its cost, or 0 if it can't be built this era |

All three use only public information plus the player's own hand.

## Results

### Stage 1: quick check on positions (6 self-play games)

Each candidate replanned every third turn-start position of production
self-play games.

| | First move changed | Time vs production | Notable shift |
|---|---|---|---|
| A | 16–25% | +2–9% | Canal Era: more links as the first move (23 vs 14) |
| B | 8–11% | about 0% | More Level II+ Canal builds (9 vs 4) |
| C | 7–25% | about 0–3% | Slightly more developing (8 vs 6 in the Rail Era), well under the over-development limit |

All three passed: they changed enough decisions, cost little time, and showed no
runaway behaviour.

### Stage 2: screening against production

118 seat-balanced games each (seeds 210000+). Each cell is the VP difference
per game, with a 95% interval.

| | 2 players (40) | 3 players (42) | 4 players (36) | Pooled VP | Win share | Verdict |
|---|---|---|---|---|---|---|
| A, future links | −1.0 ± 8.2 | +3.6 ± 6.9 | +6.0 ± 6.2 | +2.9 ± 4.1 | 54.3% | Promising |
| B, era value | −6.3 ± 13.0 | −5.2 ± 6.1 | −2.3 ± 5.4 | −4.6 ± 5.1 | 45.1% | Rejected |
| C, development | −5.2 ± 8.0 | −1.2 ± 6.7 | −0.5 ± 5.4 | −2.3 ± 3.9 | 44.4% | Rejected |

**B** developed more and built fewer links (−1 to −2 per game). Its extra
Level II+ Canal tiles didn't pay for that.

**C** developed 0.5–0.7 more times a game with no gain: the old problem of
development not paying for itself.

With only one candidate promising, there was no combination to test.

### Stage 3: held-out validation of A

298 games on fresh seeds (220000+).

| Players | Games | Win share | VP difference |
|---|---|---|---|
| 2 | 100 | 54.0% ± 9.8 | +3.2 ± 5.7 |
| 3 | 102 | 53.9% ± 9.7 | −0.4 ± 5.6 |
| 4 | 96 | 59.4% ± 9.9 | +2.7 ± 3.5 |
| **Pooled** | 298 | **55.8% ± 5.7** | **+1.8 ± 2.9** |

**Not adopted.** The VP interval includes zero. The win share is just above
50%, so A may be slightly better, but this sample can't show it.

**What A changes**, per game: A's seats minus production's seats in the
validation games. Bold means the interval excludes zero.

| | 2 players | 3 players | 4 players |
|---|---|---|---|
| Links built | **+3.6** | **+2.9** | **+2.0** |
| Link VP | **+14.2** | **+12.7** | **+10.3** |
| Builds | **−1.7** | **−2.2** | **−1.6** |
| Industry VP | **−10.1** | **−12.5** | **−6.8** |
| Final income level | −1.0 | **−3.5** | **−2.8** |
| Unflipped tiles at the end | **−0.6** | **−0.5** | **−0.5** |
| Money at the end (A / production) | £19 / £25 | £22 / £28 | £24 / £29 |

A swaps industry for links. That's a large change in style but only a small
net change in score.

**Other effects:**
- Shortfall sales rose slightly at 4 players (+0.3 a game, with almost no VP lost).
- One A player in 445 ended at the −10 income floor; production had none.
- All games completed.

## Performance and fairness

**Decision time** (Stage 1, one process on a quiet machine):

| | Mean | 95th percentile | Worst |
|---|---|---|---|
| A | 298–315 ms | 701–834 ms | 975 ms |
| B | 277–310 ms | ≤ 743 ms | ≤ 904 ms |
| C | 279–309 ms | ≤ 812 ms | ≤ 845 ms |
| Production | 280–310 ms | – | – |

All three are well within the budget. No browser test was run, since nothing
was adopted.

**Fairness and correctness** (`test/ai-strategic.test.js`):
- Each option plans identically when opponents' hidden cards and the deck are reshuffled.
- No option changes the real game.
- Each term values only what it should:
  - A: only unflipped neighbours; zero once every tile is flipped.
  - B: only Level II+ tiles, only in the Canal Era.
  - C: only a changed top tile, with a usable card and rounds left.
- With the options off, the planner is unchanged, and the recorded production games still replay.

## Game count

| Experiment | Games |
|---|---|
| Stage 1 diagnostics (seeds 190000+) | 6 |
| Screening: A, B and C, 118 each | 354 |
| Validation: A | 298 |
| **Total** | **658** of 1,500 |

## Decision and what's left

- **Production unchanged.** None of the three met the adoption criteria. The options remain in `js/aiPlanner.js`, off by default (`futureLinks`, `eraValue`, `developValue`), for anyone revisiting this.
- **A is the only lead.** It probably isn't harmful, and it may be slightly better at 4 players (+2.7 ± 3.5 VP, 59% wins). Proving a 1–3 VP effect would need roughly 1,000 more games. A cheaper next step would be a version that values future links without giving up industry. A currently overshoots: it builds 2–4 more links, at the cost of about 2 builds and 3 income levels.
- **B and C made the AI worse.** Rewarding long-term investment directly pushed it into actions (Level II+ Canal tiles, development) that don't pay off in practice. This fits Assignments 9–10: the planner's current short-term view of development is roughly right.
- **Remaining long-term weaknesses** are still unaddressed: how it values cards in hand, and turn order. None of this assignment's evidence points to a need for deeper planning.

## Reproducing

```
node scripts/research/ai-strategic.js --games 2 --every 3 > research-a16/stage1.md          # stage 1
# screening, for X in fl, era, dev and (players, seeds) in (2, 20), (3, 7), (4, 6):
node scripts/research/ai-baseline.js matchups --players 2 --seeds 20 --base-seed 210000 \
  --pairs normal@p4-X:normal@p4-c --out research-a16/screen-X-2.json
# validation of A; 3 players: --seeds 17, 4 players: --seeds 16
node scripts/research/ai-baseline.js matchups --players 2 --seeds 50 --base-seed 220000 \
  --pairs normal@p4-fl:normal@p4-c --out research-a16/validate-fl-2.json
node scripts/research/ai-criteria.js research-a16/validate-fl-*.json                      # win share and VP
node scripts/research/ai-seatstats.js research-a16/validate-fl-*.json                     # behaviour
node --test test/ai-strategic.test.js
```

I ran the nine screening runs four at a time (one per CPU).
