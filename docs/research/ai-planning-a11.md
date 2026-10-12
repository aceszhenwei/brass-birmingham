# Assignment 11: Short-Horizon Planning Feasibility

**Scope.** This is a research and feasibility study. It asks whether letting
the AI look a few of its own actions ahead makes it meaningfully stronger, at a
cost a browser can afford.
- The production AI (Assignment 10) is the baseline, and it is **not changed**.
- The planners are experimental code in `scripts/research/planner.js`, outside the game's decision path.
- The plan was fixed before any matchup ([`ai-planning-a11-plan.md`](ai-planning-a11-plan.md)).
- The full generated tables are in [`ai-planning-a11-results.md`](ai-planning-a11-results.md).

**Answer: yes, clearly.** Short-horizon planning is the largest strength gain
in this project so far.

On held-out seeds, 1,020 games per planner against production Normal:

| Planner | VP gain | Win share | Mean / p95 / worst decision time |
|---|---|---|---|
| Two-action (`p2-state`) | **+31.6 ± 1.9** | 88% | 22–25 / 51–61 / 79 ms |
| Three-action (`p3-state`) | **+43.1 ± 1.7** | 96% | 72–77 / 168–176 / 291 ms |

- **Lookahead causes the gain.** Each planner beats its own depth-1 control (same machinery, no lookahead) by +18.0 and +24.2 VP.
- **Three actions beat two:** +9.8 ± 1.8 VP head to head.
- **Every player count improves, against Normal and against Hard.**
- **Speed:**
  - Two-action planning passes every browser criterion.
  - Full three-action planning is too slow on the criteria fixed in advance.
  - A bounded three-action search (4 × 2 candidates) runs at 31–33 ms mean and 99 ms worst. It beat two-action by +6.8 ± 2.0 VP on the exploration seeds, but has not been held-out validated.
- **No failures, no illegal moves, no unfair information.** About 18,000 matchup games ran, and a test shows plans identical when hidden cards are reshuffled.

**Why it works.** Much of the gain comes from evaluating positions better, not
only from looking ahead:
- **Evaluation alone helps.** The planners that judge a position by its value (VP, VP the board would score now, expected VP of unflipped tiles, income and money) beat those that add up the heuristic's own action scores, at every depth. Even with no lookahead, this evaluation gains +12.4 VP in exploration.
- **What changes:** the AI develops 6–9 times less per game, builds 4–6 more links, and builds and sells to flip tiles that score.
- **Lookahead then turns this into coordinated sequences.** Typical sequences are "link, then build there", "build a brewery, then sell with its beer", and "take a loan, then build".

**Recommendation.** Proceed. The smallest defensible next step is a
**two-action, state-evaluation planner** as an optional, bounded AI mode,
validated against production at every difficulty (section 10).

## Contents

1. [Limits of single-action evaluation](#1-limits-of-single-action-evaluation)
2. [Missed multi-action opportunities](#2-missed-multi-action-opportunities)
3. [The planners and their assumptions](#3-the-planners-and-their-assumptions)
4. [Search space and performance](#4-search-space-and-performance)
5. [Method and success criteria](#5-method-and-success-criteria)
6. [Competitive results](#6-competitive-results)
7. [Depth comparison](#7-depth-comparison)
8. [What did not work, and why](#8-what-did-not-work-and-why)
9. [Recommendation](#9-recommendation)
10. [Proposed scope for Assignment 12](#10-proposed-scope-for-assignment-12)
11. [Correctness, fairness and reproducibility](#11-correctness-fairness-and-reproducibility)

## 1. Limits of single-action evaluation

The production AI scores each legal action type on its own, from the current
position, and takes the best (Assignments 5–10). It has no notion of a
follow-up, so the next action's value is only present where a hand-made term
anticipates it:
- the network score's "cards newly in network" and "exploration" bonuses;
- the develop score's "urgency";
- the build score's flip probability.

Two kinds of weakness follow.

**1. Enabling actions are judged by proxies.** A link that lets the player
build a valuable tile next action is worth that tile, but it is scored by a
fixed bonus per card it brings into the network. A brewery that lets a waiting
mill sell is scored as a brewery.

**2. The action scores are a weak measure of value.** Over whole production
games (`ai-plan.js evaluate`, 120 games), how well each measure, taken at the
start of a phase's last round, predicts a player's final VP:

| Snapshot | Static position value V (r / pairs ranked right) | Sum of the AI's action scores so far |
|---|---|---|
| Early (Canal rounds 1–4) | 0.17–0.29 / 50–60% | 0.17–0.28 / 56–58% |
| Middle | **0.57–0.80** / 63–75% | 0.34–0.58 / 55–63% |
| Late | **0.96–0.97** / 88–91% | 0.68–0.79 / 60–72% |

The heuristic's own scores rank the players of a game correctly only 55–72% of
the time even late in the game. The position value does much better from the
middle of the game on. Nothing predicts the result well in the early Canal
Era, which is the limit for any short-horizon evaluation.

## 2. Missed multi-action opportunities

`ai-plan.js missed` replays production games (60 games, 2–4 players). At every
decision it asks what each planner would do. Where the planner disagrees with
the heuristic's best action:

| Planner | Disagrees | Of which the follow-up is in the same turn (exact) | Most common first two actions |
|---|---|---|---|
| `p2-sum` | 22–26% | 61–64% | network → build; build → sell; build → loan |
| `p3-sum` | 31–33% | 59–60% | network → build; loan → build; build → sell |
| `p2-state` | 55–59% | 51–52% | network → build; loan → build; build → build |
| `p3-state` | 55–62% | 50–51% | network → build; loan → build; build → build |

**Reproducible examples** (seed 203001, 3 players; `ai-plan.js missed --players 3 --seeds 1`):
- **Brewery before selling** (Canal round 2, player 1, first action of the turn). The heuristic sells now. The state planners first build a brewery at Coalbrookdale, then sell, so the sale has beer for more tiles. Both actions fall in the same turn, so no opponent can interfere.
- **Link to reach a build** (Canal round 5, player 1, last action of the turn). The heuristic develops. The planner links Burton-on-Trent to Walsall and then builds iron works at Walsall.
- **Build while it is possible, develop after** (Canal round 2, player 0). The heuristic develops a brewery and a coal mine. The planner first builds iron works at Stoke-on-Trent (its card is usable now), then develops.
- **Loan, then build** (Canal round 3, players 0 and 1, state planners). The heuristic links. The planner takes a loan and immediately builds a coal mine with it in the same turn.

**Genuine or unrealistic?**
- **Within the turn (about half of all disagreements), the plan is exact.** The player acts twice in a row, so no opponent moves between the actions, the cards are those in hand, and every move is checked by the engine's planner.
- **Plans that cross into the next turn rely on assumptions** (section 3). Measured in planner games (`ai-plan.js realise`, 4 players), the planned next-turn follow-up was still legal after the opponents moved 81–93% of the time.
- **Plans are re-made every action, not committed to.** The sum planners played their planned same-turn follow-up 88–91% of the time; the state planners did so 55–58% of the time.

## 3. The planners and their assumptions

**Search.** The planner (`scripts/research/planner.js`) runs on
`state.getObservation(playerId)`, so it never sees hidden cards. For each
decision:
1. **Candidates.** It takes candidate moves from the production heuristic (`explain`): the best move of each action type, plus the next two builds and links. It keeps the top 6.
2. **Hypothetical play.** It applies each candidate to a clone of the observation with `logic.applyMove`. This is the engine's own rule-checked execution, without advancing the turn.
3. **Depth 2.** It then scores the best follow-up (the heuristic's best move in the new position).
4. **Depth 3.** It expands the top 3 follow-ups and adds the best third action.
5. **Choice.** It plays the first move of the best plan.

States evaluated per decision: about 6 at depth 2 and 21 at depth 3 (25 at most).

**Evaluation.**
- `sum`: the heuristic's own action scores, added along the plan.
- `state`: the change in a **position value V**:
  - VP so far;
  - plus the VP the era's scoring would add now (links and flipped tiles);
  - plus each unflipped tile's VP and income times the heuristic's flip probability;
  - plus income and money in the heuristic's units.
- Both reuse the AI's own valuation terms; nothing is newly tuned.

**Assumptions** (also listed in `planner.js`):
1. **Within the current turn the model is exact:** the player's own consecutive actions, with the cards in hand.
2. **Beyond the current turn, opponents are assumed not to move, no income is paid and no cards are drawn.** Only the cards in hand now can be used, so plans are conservative about cards and money. Their value is discounted by 0.6.
3. **No plan crosses the end of an era.** Canal links and Level I tiles are removed then.
4. **The planner does not model opponents at all.** It never needs their hidden hands.

**Controls and diagnostics:**
- `p1-sum` and `p1-state`: the same machinery at depth 1. These separate lookahead from the other changes; `p1-sum` is the heuristic without its random noise.
- `p2-sum-g0` and `p2-sum-g1`: no trust and full trust in moves beyond the turn.
- `p2-sum-w3`: a narrower search.
- `p3-state-b`: a bounded depth 3 (4 × 2 candidates).

## 4. Search space and performance

**The legal-move space** (`ai-plan.js search`, 30 production games):

| Phase | Legal moves (median / p95 / max) | With resource choices expanded (max) | `getLegalMoves` time (median / max) |
|---|---|---|---|
| Early | 197–206 / 438–444 / 517 | 540 | 2.1–2.2 / 15 ms |
| Middle | 124–162 / 473–754 / 3,536 | 11,651 | 2.4–2.7 / 425 ms |
| Late | 154–216 / 1,415–2,383 / 3,660 | 22,702 | 83–119 / 450 ms |

**Exhaustive search is impractical.**
- Listing all legal moves alone takes up to 450 ms late in the game, and the Rail Era's double links multiply the branching. Depth 2 over every move would mean millions of states.
- The planner therefore never lists legal moves. It searches the heuristic's handful of candidates instead.

**The engine primitives are cheap:**

| Primitive | Time per call |
|---|---|
| `getObservation` | 0.08–0.17 ms |
| `clone` | 0.05–0.09 ms |
| `applyMove` | 0.10–0.17 ms |
| One heuristic decision | 1.7–4.5 ms (median) |

So the planner's cost is almost all heuristic evaluations of hypothetical positions.

**Planner decision times** (Node 22, measured one planner at a time, 8 games at 2 and 4 players):

| Planner | Mean | Median | 95th percentile | Worst | Per game (planner's seat) |
|---|---|---|---|---|---|
| Production heuristic | – | 1.7–4.5 | – | 29 | about 0.1 s |
| `p2-sum` | 20–21 | 18 | 43–49 | 76 | 0.7–0.8 s |
| `p2-state` | 22–25 | 19–22 | 51–61 | 79 | 0.8–0.9 s |
| `p3-state-b` (bounded) | 31–33 | 28–29 | 64–68 | 99 | 1.0–1.2 s |
| `p3-sum` | 66–70 | 54–63 | 150–158 | 230 | 2.1–2.7 s |
| `p3-state` | 72–77 | 62 | 168–176 | 291 | 2.4–2.8 s |

All times are in ms unless shown. Late-game decisions are the slowest: they
take about 1.7–1.9 times the early ones, because the Rail Era has more targets and
double links. The worst observed decision for every depth-2 planner is under
0.1 s, which is invisible next to the UI's own animation. Decisions are
synchronous, so a slower device scales these linearly.

## 5. Method and success criteria

The plan was fixed before the matchups ([`ai-planning-a11-plan.md`](ai-planning-a11-plan.md)).

**Exploration** (seeds `200000 + 1000 × players + i`). Every planner played
production Normal in seat-balanced matchups (2 players: 100 seeds; 3 and 4
players: 40 each). The depth-2 and depth-3 planners also played their controls
and each other.

**Validation** (held-out seeds `700000 + 1000 × players + i`; 2 players: 150 seeds, 3 and 4 players: 60 each):
- the planner with the best exploration result (`p3-state`) played production Normal, its control and `p2-state`;
- `p2-state` played production Normal and its control;
- **generalisation:** both played production Hard.

**Amendments, recorded before any held-out game:**
- After exploration showed depth 3 over the time budget, `p2-state` was added to validation.
- `p3-state-b` was added as an exploration-only diagnostic.

**Success criteria (all on held-out seeds):**
1. It beats production (pooled interval above 0, win share above 50%).
2. It beats its own depth-1 control.
3. No player count regresses, against Normal or Hard.
4. **Browser-practical:** mean at most 50 ms, 95th percentile at most 150 ms, worst at most 500 ms.
5. Correct and fair.

Three-action planning adds value only if it beats two-action directly and also
passes 3–5.

## 6. Competitive results

### Exploration (pooled VP difference against production Normal)

| Planner | Pooled VP | Win share |
|---|---|---|
| `p1-sum` (control A: no lookahead) | −0.14 ± 2.42 | 49.8% |
| `p2-sum` | **+17.43 ± 2.26** | 72.0% |
| `p3-sum` | **+23.19 ± 2.26** | 82.8% |
| `p1-state` (control B) | **+12.40 ± 2.68** | 72.6% |
| `p2-state` | **+30.49 ± 2.16** | 88.1% |
| `p3-state` | **+42.13 ± 2.02** | 95.0% |
| `p2-sum-g0` (within the turn only) | +14.89 ± 2.24 | 70.8% |
| `p2-sum-g1` (full trust beyond the turn) | +18.61 ± 2.20 | 73.9% |
| `p2-sum-w3` (3 candidates) | +13.19 ± 2.24 | 66.8% |
| `p3-state-b` (bounded depth 3) | +36.26 ± 2.11 | 93.3% |

### Validation (held-out seeds)

| Pair | 2 players | 3 players | 4 players | Pooled VP | Win share |
|---|---|---|---|---|---|
| `p3-state` vs production Normal | +41.25 ± 3.74 | +48.96 ± 2.64 | +39.11 ± 1.89 | **+43.11 ± 1.65** | 95.9% |
| `p3-state` vs its control | +30.58 ± 4.19 | +22.58 ± 3.08 | +19.48 ± 2.01 | **+24.21 ± 1.86** | 80.5% |
| `p2-state` vs production Normal | +27.00 ± 4.51 | +36.75 ± 3.00 | +31.17 ± 1.99 | **+31.64 ± 1.92** | 88.1% |
| `p2-state` vs its control | +20.68 ± 4.88 | +19.30 ± 3.25 | +14.11 ± 2.08 | **+18.03 ± 2.07** | 72.3% |
| `p3-state` vs production Hard | +38.02 ± 4.74 | +44.71 ± 3.13 | +40.04 ± 2.17 | **+40.92 ± 2.03** | 95.2% |
| `p2-state` vs production Hard | +29.07 ± 4.67 | +36.53 ± 3.50 | +33.45 ± 2.24 | **+33.02 ± 2.08** | 89.6% |

**Criteria:**

| Criterion | `p3-state` | `p2-state` |
|---|---|---|
| 1. Beats production | Passes | Passes |
| 2. Beats its control | Passes | Passes |
| 3. No regression | Passes | Passes |
| 4. Browser-practical | **Fails:** mean 72–77 ms, p95 168–176 ms | Passes |
| 5. Correct and fair | Passes | Passes |

**Consistency.** The gains hold at every player count and against both
opponents. They are smallest at 2 players for `p2-state`, but still +27 VP.

### What the planners do differently

Planner seats minus production seats in the same validation games, per game:

| Measure | `p2-state` 2p / 3p / 4p | `p3-state` 2p / 3p / 4p |
|---|---|---|
| Final VP | +27.0 / +36.8 / +31.2 | +41.3 / +49.0 / +39.1 |
| Income level | +1.2 / **+2.8** / **+2.0** | **+2.7** / **+4.8** / **+3.8** |
| Develop actions | **−8.5 / −7.2 / −6.1** | **−9.0 / −8.0 / −6.3** |
| Links built | **+4.6 / +4.6 / +3.9** | **+6.0 / +5.4 / +4.6** |
| Tiles sold | **−0.9 / −0.3** / +0.2 | **−0.8** / +0.1 / **+0.4** |
| Loans | **+1.1 / +0.6 / +0.4** | **+0.9** / +0.1 / **−0.3** |

Exploration also shows that the `state` planners score 22–29 more link VP and
2–16 more industry VP.

## 7. Depth comparison

| Comparison | Seeds | Pooled VP |
|---|---|---|
| `p2-sum` vs `p1-sum` (2 actions vs 1) | exploration | **+17.39 ± 2.32** |
| `p3-sum` vs `p2-sum` (3 vs 2) | exploration | **+8.49 ± 1.96** |
| `p2-state` vs `p1-state` | held-out | **+18.03 ± 2.07** |
| `p3-state` vs `p2-state` | held-out | **+9.79 ± 1.77** |
| `p3-state-b` (bounded) vs `p2-state` | exploration | **+6.75 ± 2.03** (4 players: +2.0 ± 2.3) |

**Each extra action of lookahead helps, with diminishing returns:** about
+18 VP for the second action and +9 to +10 for the third. The bounded depth-3
search keeps about two thirds of the third action's gain at less than half its
cost, but its gain over depth 2 vanishes at 4 players.

**Depth is not the only lever.** At every depth, the position evaluation beats
the summed action scores: +12.5 at depth 1, +13.1 at depth 2 and +18.9 at
depth 3 (exploration, against the same production baseline).

## 8. What did not work, and why

- **Removing the heuristic's randomness does nothing.** `p1-sum` is level with production (−0.1 ± 2.4). The heuristic's noise is not what holds it back, so the planners' gains come from lookahead and evaluation.
- **Summing the heuristic's action scores is the weaker evaluation.** At each depth it gains 13–19 VP less than the position value. The action scores are good at ranking moves within a position, but poor at comparing positions:
  - They correlate only 0.34–0.58 with final VP at mid-game.
  - They over-value Develop, whose "urgency" counts as VP although development scores nothing by itself.
  - They count anticipated follow-ups (the network bonuses) that the lookahead then counts again.
- **The position value alone is not enough at 2 players.** `p1-state` is level at 2 players (+0.1 ± 6.3) and loses income (−6 levels), though it gains +18 to +19 at 3 and 4. It barely develops, and spends to score links immediately. Lookahead repairs this: `p2-state` keeps its income level and gains at every count. **The evaluation and the search need each other.**
- **Narrow search loses value.** Three candidates instead of six cost 4 VP (`p2-sum-w3`: +13.2 against +17.4). The heuristic's first choice is often not the best start of a plan, so candidate selection matters more than depth beyond 3.
- **The opponent assumption is not the bottleneck.**
  - Ignoring everything beyond the current turn (`g0`) costs 2.5 VP.
  - Trusting it fully (`g1`) gains 1.2 VP (both within noise of the default).
  - Opponents rarely invalidate a planned next action (it stays legal 81–93% of the time), so planning without modelling them is adequate at this horizon.
- **Plans are not stable.** The state planners carry out only 55–58% of their own planned same-turn follow-ups. Re-planning with one more action of lookahead often changes the second action. This is the usual "horizon effect"; it costs little because every decision is re-planned.
- **Full depth 3 is too slow** for the pre-registered browser budget, though not by much (p95 168–176 ms against 150).

**Which cause limits the planners?** Evaluation first, then depth:
- The largest single improvement is switching to a better evaluation.
- Depth then adds about +18, then about +10.
- Candidate width adds about +4.
- Opponent modelling adds about nothing measurable.

## 9. Recommendation

| Question | Answer |
|---|---|
| 1. Does short-horizon planning outperform the heuristic? | **Yes**, by +31.6 VP (depth 2) and +43.1 VP (depth 3) on held-out seeds, with 88–96% win shares |
| 2. Is two-action planning sufficient? | It captures most of the value (+18 of the +24 that depth 3 gains over the control) and is the only depth that passes every criterion. Three-action planning adds about +10 VP but needs a bounded search to be fast enough |
| 3. Is the gain consistent? | Yes: every player count, against Normal and Hard, in all three phases of play |
| 4. Is it worth the cost? | Yes. Depth 2 costs about 22 ms per decision (79 ms worst) and under 1 s per game for the planner's seat |
| 5. Depth or evaluation? | Evaluation first: the heuristic's action scores misjudge positions (development especially). Depth matters second, width third |
| 6. Is the engine suitable? | Yes, without change. Observation, clone and `applyMove` are fast, rule-checked and fair. Only full legal-move lists are too slow for search, and the planner does not need them |
| 7. Smallest next step? | A two-action, state-evaluation planner as an opt-in AI mode (below) |

**Caveats:**
- **Every planner game was against the production AI.** The size of the gain against stronger opponents (people, or other planners) is unknown. Part of it may come from exploiting the heuristic's habits.
- **The position value ignores the hand and the value of development.** The planner therefore rarely develops. That worked against this opposition, but may not against opponents who block cheap industries.
- **Times were measured in Node.** A slow phone could be 2–4 times slower, which still keeps depth 2 under 0.3 s worst case.

## 10. Proposed scope for Assignment 12

**Goal:** turn the two-action planner into an opt-in production AI mode, and
validate it, without replacing the heuristic.

1. **Move the planner into the browser build.** Load it as a script beside `aiPlayer.js`, reusing `getObservation`, `clone` and `applyMove`, behind an AI option (for example a separate AI style).
   - Keep the heuristic as candidate generator and fallback.
   - Keep a hard time budget per decision: stop expanding after N ms and take the best plan so far.
2. **Settle the evaluation.** Validate the position value V as the planner's evaluation, with two small, separately tested fixes:
   - a value for cards in hand;
   - a value for development that unlocks tiles the player can build.
   Then re-check the 2-player income loss of the depth-1 version.
3. **Re-test depth 3 within the budget.** Use `p3-state-b` or an anytime search, on held-out seeds, against depth 2. Adopt it only if it beats depth 2 at every player count.
4. **Validate against stronger opposition:**
   - planner against planner (mirror games);
   - planner seats against a mix of planner and production seats;
   - each difficulty. A decision is needed on how difficulty levels map onto planning: for example Easy = heuristic, Normal = depth 1 + V, Hard = depth 2.
5. **Browser performance:** measure in the browser, including a throttled CPU. Keep the UI responsive (the decision can run between animation frames).
6. **Fairness and regression:** the alternate-world probe for every planner mode; recorded-game fixtures; the existing suites.

**Out of scope for Assignment 12:** MCTS, rollouts, opponent modelling, and
search beyond three actions. This study found no evidence that they are needed
yet.

## 11. Correctness, fairness and reproducibility

- **Legal and complete.** About 18,000 matchup games (6,120 exploration, 4,080 depth comparisons, 5,100 validation, 1,360 generalisation, 1,360 bounded), plus the measurement runs, ran with no illegal move and no failed game. The harness checks every move with the engine's resolver.
- **No mutation of the real game.** `test/ai-planner.test.js` plays complete games and checks the serialised state before and after every planning decision. It also checks the invariants after every move, and that the same seed gives the same decisions.
- **Fairness.** The planner sees only `getObservation(playerId)`.
  - The test also plans in an "alternate world" with opponents' hands and the deck reshuffled and the game's random generator replaced. The plans were identical at every decision (two planners, a complete 2-player game).
  - Hypothetical play never draws a card, so placeholder cards are never used.
- **The production AI is unchanged.** The only change to `js/aiPlayer.js` is research support:
  - `explain` now also lists each candidate's move and every link's score;
  - `AIPlayer.research` exposes the flip probability and value helpers.
  - The game never calls either. Every recorded-game fixture (Assignments 1, 6, 8, 9 and 10) still replays exactly, and a test checks that `explain` never changes a decision.

### Reproducing the experiments

Everything is deterministic with Node.js 22+. Raw results go to the
git-ignored `research-a11/` folder.

```
# Measurements (about 1-10 min each)
node scripts/research/ai-plan.js search  --players 3 --seeds 10      # and 2, 4
node scripts/research/ai-plan.js missed  --players 3 --seeds 20 --examples 8
node scripts/research/ai-plan.js evaluate --players 3 --seeds 40
node scripts/research/ai-plan.js realise --players 4 --seeds 8 --planner p2-state   # each planner; timing: run one at a time

# Exploration (about 1-2 h per player count on one core)
P=normal@p1-sum:normal,normal@p2-sum:normal,normal@p3-sum:normal,normal@p1-state:normal,normal@p2-state:normal,normal@p3-state:normal,normal@p2-sum-g0:normal,normal@p2-sum-g1:normal,normal@p2-sum-w3:normal
node scripts/research/ai-baseline.js matchups --players 2 --seeds 100 --pairs $P --out research-a11/explore-2.json   # 3, 4: --seeds 40
D=normal@p2-sum:normal@p1-sum,normal@p3-sum:normal@p1-sum,normal@p2-state:normal@p1-state,normal@p3-state:normal@p1-state,normal@p3-sum:normal@p2-sum,normal@p3-state:normal@p2-state
node scripts/research/ai-baseline.js matchups --players 2 --seeds 100 --pairs $D --out research-a11/depth-2.json     # 3, 4: --seeds 40
node scripts/research/ai-baseline.js matchups --players 2 --seeds 100 --pairs normal@p3-state-b:normal,normal@p3-state-b:normal@p2-state --out research-a11/bounded-2.json

# Validation and generalisation (held-out seeds)
node scripts/research/ai-baseline.js matchups --players 2 --seeds 150 --base-seed 700000 \
    --pairs normal@p3-state:normal,normal@p3-state:normal@p1-state,normal@p3-state:normal@p2-state --out research-a11/validate3-2.json   # 3, 4: --seeds 60
node scripts/research/ai-baseline.js matchups --players 2 --seeds 150 --base-seed 700000 \
    --pairs normal@p2-state:normal,normal@p2-state:normal@p1-state --out research-a11/validate2-2.json
node scripts/research/ai-baseline.js matchups --players 2 --seeds 100 --base-seed 700000 \
    --pairs normal@p3-state:hard,normal@p2-state:hard --out research-a11/general-2.json   # 3, 4: --seeds 40

# Tables
node scripts/research/ai-criteria.js research-a11/validate3-*.json research-a11/validate2-*.json   # and the others
node scripts/research/ai-seatstats.js research-a11/validate3-*.json research-a11/validate2-*.json --pairs normal@p3-state:normal,normal@p2-state:normal
```

| New file | Purpose |
|---|---|
| `scripts/research/planner.js` | The experimental planner (depth 1–3, two evaluations) |
| `scripts/research/ai-plan.js` | Search space, missed opportunities, evaluation quality, plan realisation and timing |
| `scripts/research/ai-seatstats.js` | Behaviour of candidate seats against baseline seats in matchups |
| `test/ai-planner.test.js` | Planner legality, purity, determinism and fairness; `explain` never changes a decision |
