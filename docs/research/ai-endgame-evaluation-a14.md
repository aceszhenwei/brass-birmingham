# Assignment 14: endgame evaluation and candidate selection

**Outcome: candidate C was adopted.** C combines an end-of-game cash valuation (A)
with scoring-link candidates (B), and is the production AI for Normal and Hard
from this assignment on.

**Validation result.** On 298 held-out games against the Assignment 12
production planner, C scored **+10.5 ± 3.0 VP** per game and won **65.5% ± 5.4%**.
The interval is above 0 at 2, 3 and 4 players.

**Behaviour changes:**
- C takes about 1.4 fewer loans per game.
- It ends with about £23 instead of £54–68.
- It never collapsed to the −10 income floor; the Assignment 12 planner did so 5 times in 445 player-games.
- Decisions take 17–53% longer on average, within every limit of the budget.

**Simulation used:** 650 game equivalents (a budget of 1,500). The pre-registered
plan is [`ai-endgame-evaluation-a14-plan.md`](ai-endgame-evaluation-a14-plan.md).

## 1. The two weaknesses

Both come from [Assignment 13](human-strategy-a13.md), section 9.1.

1. **Endgame cash.**
   - The planner's position value counts £1 as 0.12 VP and income at its usual weight in every position, including positions after the player's last action of the game.
   - Yet the rulebook uses money and income only to break ties.
   - A last-round loan therefore looked worth about +3.4 VP.
2. **Candidate selection.**
   - The planner searches only the heuristic's shortlist.
   - That shortlist ranks links by the network access they give, not the VP they score.
   - So an 8-VP link ranked 5th was never searched (seed 904002, 4 players, player 0, Rail round 8).

## 2. Candidates

Each candidate is an option of the production planner (`js/aiPlanner.js`). With
both options off, the planner reproduces the Assignment 12 planner exactly (its
recorded games still replay).

| | Option | Change |
|---|---|---|
| **A** | `endgame: 'tiebreak'` | After the player's last action of the game, income and money count only as tie-breaks: an income level is worth 0.01 and £1 is worth 0.00001. Plans also stop at the end of the era. |
| **B** | `scoringLinks: true` | At the plan levels inside the current turn, the legal single link that would score the most VP now is added as one extra candidate (if it scores at least 1 VP and is not already shortlisted). |
| **C** | both | A and B together |

**How A handles the three kinds of money.** It adds no new weight:
- **After the last scoring opportunity:** money is worthless, apart from breaking ties.
- **Unlikely to be spent:** in the penultimate Rail round, plans reach the end of the game. So money still held there keeps only the next turn's discounted share, 0.12 × (1 − γ) = 0.048 VP per £.
- **Still useful for productive actions:** keeps its full value.

There is no cash target and no loan rule.

**The era-end stop in A is a safeguard.** The planner's documentation already
said plans never cross an era's end, but the code enforced this only in the
era's last round. In practice it rarely binds: at the end of the game a player
holds exactly as many cards as they have actions left.

**B's design.** It changes neither the heuristic's scores nor its weights. The
extra link is judged by the planner's own position value. It adds at most one
candidate at no more than two levels.

## 3. Targeted regression scenarios (stage 1)

**Method** (`scripts/research/ai-endgame.js`):
- **Games:** the 24 Assignment 13 self-play games (seeds 902001–902010, 903001–903008 and 904001–904006), all replayed with the Assignment 12 planner at every seat.
- **Counterfactuals:** from the start of every player's penultimate Rail turn, the rest of the game is played out with that player's seat taken by each policy and the other seats by the Assignment 12 planner.
- **Pairing:** each comparison is made from the same position.
- **Endings:** 68 in all.

| Players (endings) | Assignment 12 final VP | A | B | C |
|---|---|---|---|---|
| 2 (20) | 103.8 | +2.2 ± 2.5 | +3.1 ± 3.5 | **+5.2 ± 3.7** |
| 3 (24) | 99.2 | **+3.0 ± 1.6** | **+5.5 ± 2.0** | **+5.5 ± 2.2** |
| 4 (24) | 96.5 | **+2.5 ± 1.2** | **+4.1 ± 2.0** | **+6.1 ± 2.1** |

Differences are paired, with 95% intervals; bold means the interval is entirely
above 0. The behaviour behind these gains, summed over the endings:

| Players | Late loans¹ (A12 / A / B / C) | Missed scoring links² (A12 / A / B / C) | Money left at the end (A12 / C) |
|---|---|---|---|
| 2 | 17 / 1 / 16 / 1 | 12 / 2 / 14 / 1 | £46.5 / £19.4 |
| 3 | 21 / 1 / 8 / 1 | 14 / 0 / 6 / 0 | £53.9 / £26.1 |
| 4 | 18 / 4 / 12 / 2 | 12 / 0 / 6 / 0 | £46.8 / £23.1 |

¹ Loans taken in the last two rounds.
² Last-round loans, developments, scouts and passes taken while a link worth 1+ VP was legal.

**Findings:**
- **The two Assignment 13 cases are fixed.** Saved as test fixtures, both positions show the Assignment 12 planner taking a loan first.
  - **Seed 904002:** C plays the sale and then the 8-VP Derby–Uttoxeter link, scoring 116 against 108 at the end of the turn.
  - **Seed 903002:** with £123 in hand, C builds two links, scoring 116 against 111.
- **A and B fix different things:**
  - A removes the last-round loans but cannot see the best links.
  - B finds better links but still borrows when no link is available, for example 4 loans and 0 links for seed 903004 player 0, where C instead builds 4 links.
- **No candidate was eliminated.** None made an illegal move, failed a test, or had an interval below 0.
- **Changes can hurt individual games.** C finished below the Assignment 12 planner in 1–2 endings per player count, for example −10 VP for seed 902006 player 0.

## 4. Simulation method and game counts

**Screening (stage 2).**
- **Design:** each candidate played the Assignment 12 planner (`normal@p4-state`), with seats balanced (`ai-baseline.js matchups`).
- **Seeds:** 140000 + 1000 × players + i, never used before.
- **Games per candidate:** 20 seeds at 2 players, 7 at 3 and 6 at 4, which is 118 games.

**Held-out validation (stage 3).**
- **Seeds:** 150000 + 1000 × players + i, also fresh.
- **Games:** 50 seeds at 2 players, 17 at 3 and 16 at 4, which is 298 games.

**Determinism.** Every game ran with no wall-clock cut-off, so every result is
reproducible.

| Experiment | Games |
|---|---|
| Stage 1: Assignment 13 games replayed (with their 68 × 4 partial play-outs), plus 3 partial replays to build test fixtures | 27 |
| Screening: C 118, B 118, A 82 (stopped early, see below) | 318 |
| Validation: C | 298 |
| Timing: 6 self-play games (one per player count for the Assignment 12 planner and for C), plus 1 browser game | 7 |
| **Total** | **650** (budget 1,500; diagnostic games 34 of 60) |

**Stopping decisions, both under the plan's rule.** At most two candidates go to
validation, with C preferred.
- **A's screening stopped after 82 games** (+1.6 ± 5.7 VP, 52% wins), because A could no longer take the second validation slot from B. At 2 players B was ahead by about 9 VP.
- **B was not validated**, because C passed. B would have been the fallback had C been inconclusive.

## 5. Competitive results

**Screening:**

| Candidate | 2 players | 3 players | 4 players | Pooled VP | Pooled win share |
|---|---|---|---|---|---|
| A | +1.2 ± 9.0 | +2.1 ± 7.2 | not run | +1.6 ± 5.7 | 52.4% ± 10.9 |
| B | +10.6 ± 7.9 | +6.8 ± 8.1 | +5.9 ± 5.7 | **+7.7 ± 4.2** | 65.9% ± 8.7 |
| C | +12.7 ± 7.6 | +10.3 ± 7.8 | +7.4 ± 5.7 | **+10.2 ± 4.1** | 65.9% ± 8.7 |

**Held-out validation of C** (298 games):

| Players | Games | Win share | VP difference (C seats − Assignment 12 seats, per game) |
|---|---|---|---|
| 2 | 100 | 63.0% ± 9.5 | **+10.8 ± 6.0** |
| 3 | 102 | 65.7% ± 9.3 | **+11.8 ± 6.0** |
| 4 | 96 | 67.7% ± 9.4 | **+8.9 ± 3.3** |
| **Pooled** | 298 | **65.5% ± 5.4** | **+10.5 ± 3.0** |

**Reading the VP difference.** It is the gap between C's seats and the Assignment
12 planner's seats in the same games, so in a 2-player game it counts both C's
gain and the opponent's loss. Stage 1 isolates C's own gain from the last two
rounds alone: +5 to +6 VP per player.

**Behaviour in validation** (C seats minus Assignment 12 seats, per game; bold
means the interval excludes 0):

| Measure | 2 players | 3 players | 4 players |
|---|---|---|---|
| Link VP | **+16.0 ± 3.3** | **+16.5 ± 3.4** | **+11.3 ± 2.2** |
| Industry VP | −5.0 ± 5.2 | **−5.3 ± 4.6** | **−2.8 ± 2.6** |
| Links built | **+3.3 ± 0.9** | **+3.2 ± 0.7** | **+2.4 ± 0.5** |
| Builds | **−1.7 ± 0.6** | **−1.7 ± 0.5** | **−0.8 ± 0.4** |
| Loans | **−1.3 ± 0.6** | **−1.4 ± 0.4** | **−1.5 ± 0.3** |
| Final income level | +1.6 ± 1.9 | +1.6 ± 1.6 | **+2.9 ± 1.1** |
| Money left (mean, C / Assignment 12) | £23 / £54 | £24 / £60 | £22 / £68 |
| Develop actions, sales, shortfalls | no significant change | no significant change | no significant change |

**What the behaviour shows:**
- **B acts throughout the game, not only at the end.** Whenever a link scores now, the planner can compare it with the alternatives. C builds about 3 more links per game, at the cost of about one industry build, and gains on balance.
- **Industry VP falls by 3–5 at 3 and 4 players.** That is a trade-off within a net gain, not a regression.
- **Game completion:** all 298 validation games and all 318 screening games finished.
- **Collapses:**
  - C ended at the −10 income floor in 0 of 445 player-games; the Assignment 12 planner did so in 5.
  - Very low scores (below 40 VP) were rare for both: 3 for C, 2 for the Assignment 12 planner.

## 6. Performance

**Node** (one process on an otherwise idle machine, production cut-off of
2.5 s, one self-play game per player count, seed 140900 + players):

| Players | Planner | Mean ms | 95th percentile | Worst | Cut off | Longest two-action turn |
|---|---|---|---|---|---|---|
| 2 | Assignment 12 | 301 | 641 | 840 | 0 | 1.3 s |
| 2 | C | 352 | 948 | 1,382 | 0 | 2.2 s |
| 3 | Assignment 12 | 283 | 632 | 916 | 0 | 1.7 s |
| 3 | C | 335 | 827 | 1,005 | 0 | 1.7 s |
| 4 | Assignment 12 | 254 | 574 | 1,013 | 0 | 1.3 s |
| 4 | C | 388 | 1,267 | 1,612 | 0 | 3.0 s |

**Browser smoke test** (Chromium, 3 players, one game through the real UI, CPU
not throttled):
- **Decisions:** 105, mean 316 ms, 95th percentile 962 ms, worst 1,126 ms; no decision hit the cut-off.
- **Turns:** the longest took 1.6 s.
- **Health:** no page errors; the heap went from 2.9 to 5.4 MB.

**Assessment:**
- **Every limit is met:** mean 1 s, 95th percentile 2 s, cut-off 2.5 s, 5 s per two-action turn.
- **The cost is a 17–53% higher mean,** largest at 4 players, where more links score.
- **Slow devices** (Assignment 12 measured 0.8–0.9 s per decision at 4× throttle) will see the same relative increase. The 2.5 s cut-off still bounds every decision. A throttled browser benchmark was not repeated.

## 7. Decisions

| Candidate | Decision | Reason |
|---|---|---|
| A | Not adopted alone; part of C | Stage 1: +2.2 to +3.0 VP per player. Screening was too uncertain to show a competitive gain, and it cannot find the better links |
| B | Not adopted alone; part of C | It passed screening, but was weaker than C there and in stage 1, and still borrows late |
| **C** | **Adopted** | It meets every pre-registered criterion on held-out games: pooled interval above 0, win share above 50%, no player count below 0. It fixes both Assignment 13 cases and stays within the performance budget |

## 8. Production changes

**Planner** (`js/aiPlanner.js`):
- `AIPlanner.PRODUCTION` is now the Assignment 12 configuration with `endgame: 'tiebreak'` and `scoringLinks: true`.
- `AIPlanner.A12` keeps the Assignment 12 planner for research and regression. Its recorded games, `test/fixtures/assignment12-baseline.json`, still replay unchanged.

**Engine** (`js/gameState.js`): `GameState.linkValue(connId)` returns the VP a
link would score now. It was extracted from the era scoring, which now uses it;
the rules are unchanged.

**Tests:**
- `test/ai-endgame.test.js` with `test/fixtures/assignment14-endgame.json` (the Assignment 13 positions):
  - both options, and production, avoid the last-round loan and score more;
  - the 8-VP link is found;
  - money and income only break ties after the last action;
  - plans stop at the end of the game;
  - the options default off;
  - `linkValue` agrees with era scoring.
- `test/ai-planner-production.test.js` replays the new production games (`test/fixtures/assignment14-baseline.json`) and, separately, the Assignment 12 planner's.
- The existing fairness test (identical plans when hidden cards are reshuffled) now runs on the new production configuration.
- **Suite result:** 257 tests pass.

**Research scripts:**
- `scripts/research/ai-endgame.js`: stage 1 and timing.
- Candidate configurations `p4-a`, `p4-b` and `p4-c` in `harness.js`.
- `ai-gap.js` and `ai-gap-trace.js` now name `AIPlanner.A12`, so the Assignment 13 diagnostics reproduce as before.

## 9. Remaining limitations

- **Effect size is uncertain.** The ±3 VP interval at 298 games is wide: the true gain may be anywhere from about +7 to +14 VP per game in seat-balanced play against the Assignment 12 planner.
- **Single opponent tested.** C has not been measured against the heuristic or in mixed tables. It is expected to beat the heuristic by more than the Assignment 12 planner did, but that was not tested.
- **B's link is chosen by immediate VP only.** It ignores future flips (Assignment 13, H-RAIL) and double links. B also helps outside the endgame, which shows the heuristic's network ranking undervalues scoring in general. Re-weighting that score was out of scope.
- **A leaves mid-game cash valuation as it was.** Money is still valued at 0.12 VP per £ whenever actions remain. Players still end with about £23; where that money comes from was not analysed.
- **Industry VP is lower** (about −3 to −5 at 3 and 4 players), traded for link VP. Whether a better balance exists is a question for later evaluation work.
- **Performance on slow devices.** Decision time rose 17–53% in Node. The throttled-browser figures of Assignment 12 were not re-measured.
- **Out of scope:** opponent modelling and long-term strategy (Assignment 13, sections 11–12).

## Reproducing

```
node scripts/research/ai-endgame.js --examples 10 > research-a14/stage1.md        # stage 1 (about 40 min)
node scripts/research/ai-endgame.js --timing > research-a14/timing.md             # performance (idle machine)
node scripts/research/ai-baseline.js matchups --players 2 --seeds 20 --base-seed 140000 \
  --pairs normal@p4-c:normal@p4-state --out research-a14/screen-c-2.json          # screening; 3 players: --seeds 7, 4: --seeds 6; p4-a, p4-b likewise
node scripts/research/ai-baseline.js matchups --players 2 --seeds 50 --base-seed 150000 \
  --pairs normal@p4-c:normal@p4-state --out research-a14/validate-c-2.json        # validation; 3 players: --seeds 17, 4: --seeds 16
node scripts/research/ai-criteria.js research-a14/validate-c-*.json               # win share and VP difference
node scripts/research/ai-seatstats.js research-a14/validate-c-*.json              # behaviour
PW=$(npm root -g)/playwright node scripts/research/ai-browser.js --players 3 --games 1
```
