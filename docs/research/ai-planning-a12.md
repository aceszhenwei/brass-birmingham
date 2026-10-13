# Assignment 12: Production Planning AI and Four-Action Search

**Scope.**
- The planner from Assignment 11 is now part of the game (`js/aiPlanner.js`), behind a single production entry point.
- It was tested in self-play and against other planning depths.
- Four-action planning was investigated, in full and bounded forms.
- Every plan was checked against browser performance budgets, using the real page.

The plan, fixed before any four-action matchup, with amendments recorded
before any held-out game: [`ai-planning-a12-plan.md`](ai-planning-a12-plan.md).
Full tables: [`ai-planning-a12-results.md`](ai-planning-a12-results.md).

**Decision: Outcome A, full four-action planning in production.**
- **Normal and Hard** now plan four of the AI's own actions ahead, keeping 6, 3 and 3 candidates at the first three levels, with a 2.5 s cut-off per decision.
- **Easy** keeps the heuristic.
- **Strength:** on 1,020 held-out games, it beats three-action planning by **+2.2 ± 1.7 VP** (53.9% win share). No player count regresses.
- **Browser speed:** it stays within every pre-registered budget.
  - Desktop: 140–201 ms per decision on average, 633 ms worst.
  - With the CPU throttled 4× to stand in for a phone: 0.83–0.93 s average, 95th percentile 1.66–1.98 s.
  - The phone margins are thin, and section 8 gives the details.
- **Bounded four-action search does not work:** both narrower variants lost the gain entirely.
- **Previous AIs are preserved:**
  - three-action planning is `AIPlanner.THREE_ACTION`;
  - the heuristic AI of Assignment 10 is `AIPlayer.chooseAction`;
  - all earlier recorded games still replay exactly.

| Comparison | Seeds | Pooled VP | Win share |
|---|---|---|---|
| Three actions vs two (`p3-state` vs `p2-state`) | held-out, Assignment 11 | **+9.79 ± 1.77** | 65.8% |
| Four actions vs three (`p4-state` vs `p3-state`) | held-out | **+2.21 ± 1.71** | 53.9% |
| Full vs bounded four-action (4/2/2) | exploration | **+7.55 ± 1.82** | 63.3% |
| Full vs bounded four-action (6/3/1) | exploration | **+3.16 ± 1.95** | 54.2% |

## Contents

1. [Production integration](#1-production-integration)
2. [Four-action planning: design and assumptions](#2-four-action-planning-design-and-assumptions)
3. [Search space and performance](#3-search-space-and-performance)
4. [Self-play](#4-self-play)
5. [Head-to-head results across depths](#5-head-to-head-results-across-depths)
6. [Competitive improvement and uncertainty](#6-competitive-improvement-and-uncertainty)
7. [Behaviour and remaining weaknesses](#7-behaviour-and-remaining-weaknesses)
8. [Browser performance and reliability](#8-browser-performance-and-reliability)
9. [Production selection](#9-production-selection)
10. [Recommendations](#10-recommendations)
11. [Tests, fairness and reproducibility](#11-tests-fairness-and-reproducibility)

## 1. Production integration

**The planner is now game code.** `js/aiPlanner.js` is loaded by `index.html`
after `aiPlayer.js`.

- **Entry point.** `AIPlanner.chooseAction(state, logic, playerId, difficulty, rng, opts)` is the production AI. It has the heuristic's signature, so the UI's AI turn loop changed by one line.
  - **Easy** returns the heuristic's decision.
  - **Normal and Hard** return the first move of the best plan, as a decision carrying that move. One legal action is played, and the next decision is planned afresh.
  - Normal and Hard are now identical. They were within noise of each other before (Assignment 10), and no new levels were added.
- **One implementation.** The research planner (`scripts/research/planner.js`) is now a thin wrapper around the same module. The moved planner reproduces the Assignment 11 planner's plans and values exactly (412 of 412 decisions in a direct comparison), so the Assignment 11 results still stand.
- **The heuristic is unchanged in behaviour.**
  - It now remembers the build and link scores it has already computed for its `explain` output instead of recomputing them. This is a speed change only: every heuristic fixture still replays exactly.
  - It remains the Easy AI, the planner's candidate generator and fallback, and the research baseline.
- **Search budget.**
  - Each decision has a wall-clock limit (`maxMs`, 2.5 s in production) and an optional limit on the number of states it evaluates (`maxStates`).
  - When the budget runs out, the planner stops expanding and plays the best plan whose evaluation completed.
  - If none completed, it plays the heuristic's best move, which was already applied successfully to a clone and so is legal.
  - A timeout can never leave a partial change: hypothetical play only ever touches clones.
- **Fixtures and tests use a deterministic budget.** They lift the wall-clock limit, so recorded games do not depend on the speed of the machine.

## 2. Four-action planning: design and assumptions

The Assignment 11 framework is unchanged; only depth and width vary.

**How a plan is built:**
- Candidates come from the heuristic.
- Each candidate is applied to a clone of the player's observation.
- Positions are judged by the static position value: VP, the VP the board would score now, the expected VP of unflipped tiles, income and money.
- At each level the planner keeps a fixed number of candidates, and the last level takes the heuristic's single best move.

| Planner | Depth | Candidates per level | States evaluated per decision (mean / max) |
|---|---|---|---|
| `p2-state` | 2 | 6 | about 6 / 7 |
| `p3-state` | 3 | 6, 3 | 22 / 25 |
| **`p4-state`** (production) | 4 | 6, 3, 3 | 64 / 79 |
| `p4-state-n` (bounded) | 4 | 6, 3, 1 | 36 / 43 |
| `p4-state-b` (bounded) | 4 | 4, 2, 2 | 25 / 29 |

**Assumptions, unchanged from Assignment 11:**
- **The current turn is modelled exactly:** at most two actions with the cards in hand, and no opponent moves in between.
- **Actions beyond the current turn assume opponents do nothing**, no income is paid and no cards are drawn, so only the cards in hand now can be used. Their gains are discounted by 0.6.
- **No plan crosses an era's end.**

With two actions per turn, a four-action plan is always "this turn, plus the
next turn" or "this action, the next turn, then one more". At least two of
its four actions are assumed rather than exact.

**Does uncertainty undermine four-action plans?** The measured answers:
- Planned next-turn actions stayed legal after the opponents' moves 81–93% of the time (Assignment 11).
- Every decision is re-planned, so a plan the opponents spoil costs only the evaluation spent on it.
- The four-action planner improved most at 4 players, where opponents interfere most (+3.3 VP).
- Opponent interference therefore did not erase the benefit, and no mitigation was needed.

**Hidden information.** The planner never sees hidden information:
- It works only on `state.getObservation(playerId)`.
- Hypothetical play never draws a card, so placeholder cards are never used.
- A test checks every decision of a complete game against an "alternate world" with the hidden cards reshuffled (section 11).

## 3. Search space and performance

**Node decision times** (Node 22, one planner at a time, 8 games per player count):

| Planner | Mean | Median | 95th percentile | Worst | Per game (one seat) |
|---|---|---|---|---|---|
| Three-action (`p3-state`) | 66–83 ms | 57–69 | 152–197 | 275 | 2.6–2.7 s |
| **Four-action (`p4-state`)** | **191–227 ms** | 155–190 | 439–549 | 753 | 6.8–7.4 s |
| `p4-state-n` | 97–119 ms | 94–106 | 208–237 | 453 | 3.7–3.8 s |
| `p4-state-b` | 69–77 ms | 64–66 | 134–159 | 227 | 2.4–2.7 s |

- **Where the time goes.** Late-game (Rail Era) decisions are the slowest: about 1.6–2.3 times the early ones, because the Rail Era has more targets and double links. Almost all of the time is spent in the heuristic's candidate evaluations; cloning and applying moves are cheap (Assignment 11).
- **Worst decision.** The worst single decision observed in Node was 1.3 s, in one production game of `simulate.js`. It is still within the 2.5 s cut-off.
- **The legal-move space is unchanged from Assignment 11:** up to 3,660 moves, or 22,702 with resource choices expanded. The planner never lists them.

## 4. Self-play

**The setup.** The production planner of the time (`p3-state`) played every seat: 50 games at each of 2, 3 and 4 players, 150 games in all, with no failures. The reference is the Assignment 10 heuristic's own self-play (100 games per count).

| Per player per game | 2p planner | 3p planner | 4p planner | Heuristic self-play (2p / 3p / 4p) |
|---|---|---|---|---|
| Final VP | 98.5 ± 5.2 | 100.4 ± 3.3 | 96.5 ± 2.4 | 76.0 / 68.6 / 66.3 |
| Winner's VP | 112.5 | 115.4 | 113.2 | 89.7 / 87.0 / 86.6 |
| Income level at the end | 7.9 | 8.7 | 9.3 | 2.3 / 2.3 / 3.8 |
| Money left at the end | £50 | £67 | £63 | £17 / £20 / £21 |
| Loans | 6.5 | 5.9 | 4.9 | 5.9 / 5.2 / 4.4 |
| Builds / Networks / Develops | 17.4 / 9.6 / 1.4 | 15.8 / 9.2 / 0.9 | 13.6 / 8.5 / 0.6 | 12.0 / 8.7 / 6.9 (2p) |
| Tiles sold | 4.1 | 4.5 | 4.7 | 3.1 / 2.7 / 2.8 |
| Link VP (Canal + Rail) | 42 | 43 | 41 | – |
| Unflipped tiles at the end | 4.5 | 3.1 | 2.1 | 2.9 / 3.1 / 2.5 |

**Findings:**
- **Higher scores against equal opposition.** Planners facing planners still score about 25–30 VP more per player than heuristics facing heuristics. Both eras produce more: about 31–38 VP from the Canal Era and 56–67 from the Rail Era.
- **Seat position does not matter.** Win shares by turn-order position were 50 / 50 (2 players) and 36 / 32 / 32 (3 players), within chance.
- **Repeated patterns, two of them clear weaknesses:**
  - **Money is hoarded.** The planner finishes with £50–67 unspent, about three times the heuristic. The position value counts money at a fixed rate even in the last round, when money scores nothing. **This is a weakness.**
  - **Occasional collapse.** 4 of 450 player-games ended below 40 VP (0, 5, 7 and 19 VP). Each time income sank to the −8 floor after 4–5 loans and 6–9 shortfall sales. Late in the game the position value prices a loan's £30 above its lost income. **This is a weakness.**
  - **Hardly any development** (0.6–1.4 actions per game). The position value gives development no direct value. It has not hurt so far: the planners use Level I and II tiles efficiently and gain strongly. But it is a blind spot.
- **No equal-planner result is read as strength or weakness.** As the assignment required, equal win shares between identical planners are not evidence either way.

## 5. Head-to-head results across depths

### Exploration (seeds `200000 + 1000 × players + i`; 2p 100 seeds, 3p and 4p 40 each; seat-balanced)

| Matchup | 2 players | 3 players | 4 players | Pooled VP | Win share |
|---|---|---|---|---|---|
| `p4-state` vs `p3-state` | +4.01 ± 4.49 | +2.99 ± 3.03 | +2.80 ± 2.15 | **+3.26 ± 1.94** | 56.8% |
| `p4-state-n` vs `p3-state` | −3.04 ± 4.49 | +0.23 ± 2.93 | +0.14 ± 2.11 | −0.89 ± 1.92 | 47.3% |
| `p4-state-b` vs `p3-state` | −5.41 ± 4.38 | −4.42 ± 3.27 | −3.50 ± 2.05 | **−4.44 ± 1.95** | 43.3% |
| `p4-state` vs `p4-state-b` | +8.05 ± 4.11 | +8.65 ± 2.93 | +5.93 ± 2.08 | **+7.55 ± 1.82** | 63.3% |
| `p4-state` vs `p4-state-n` | +6.11 ± 4.31 | +2.87 ± 3.29 | +0.50 ± 2.18 | **+3.16 ± 1.95** | 54.2% |
| `p3-state` vs `p2-state` (Assignment 11) | +11.46 | +10.25 | +7.39 | **+9.70 ± 2.18** | 63.1% |

### Validation (held-out seeds `800000 + 1000 × players + i`; 2p 150 seeds, 3p and 4p 60 each)

| Matchup | 2 players | 3 players | 4 players | Pooled VP | Win share |
|---|---|---|---|---|---|
| **`p4-state` vs `p3-state`** | +1.26 ± 3.93 | +2.04 ± 2.72 | **+3.32 ± 1.84** | **+2.21 ± 1.71** | 53.9% |
| `p3-state` vs `p2-state` (Assignment 11, seeds 700000, reused) | +10.51 ± 4.10 | +10.39 ± 2.85 | +8.48 ± 1.83 | **+9.79 ± 1.77** | 65.8% |

### Mixed tables (held-out seeds; 40 seeds × every rotation of the seats)

| Table | Planner | Win share | Mean rank | VP relative to the table mean |
|---|---|---|---|---|
| 3 players | `p4-state` | **48.3%** | 1.73 | **+5.20 ± 2.70** |
| | `p3-state` | 33.3% | 1.98 | +0.61 ± 2.88 |
| | `p2-state` | 18.3% | 2.28 | −5.80 ± 2.67 |
| 4 players | `p4-state` | **41.3%** | 1.86 | **+12.68 ± 2.28** |
| | `p3-state` | 35.0% | 2.02 | +10.64 ± 2.53 |
| | `p2-state` | 23.1% | 2.40 | +2.27 ± 2.75 |
| | heuristic (Assignment 10) | 0.6% | 3.71 | −25.59 ± 2.27 |

In tables with other planners present, the strength order is the depth order.
The heuristic AI wins 1 game in 160 against planners.

## 6. Competitive improvement and uncertainty

**Each extra action of lookahead adds less:**

| Step | Pooled VP gain |
|---|---|
| One action to two (Assignment 11, against its control) | about +18 |
| Two to three (held-out) | about +10 |
| Three to four (held-out) | about +2 |

**The four-action gain is real but small:**
- Its held-out interval (+0.5 to +3.9) excludes 0.
- Exploration found +3.3 ± 1.9. Held-out validation found less, +2.2 ± 1.7, consistent with a small regression toward a smaller true effect.
- It is clearest at 4 players (+3.3 ± 1.8 held-out; +2.8 ± 2.2 in exploration) and not individually significant at 2 or 3 players. No player count regresses.
- The mixed tables agree. `p4-state` gains +4.6 VP over `p3-state` at 3-player tables and +2.0 at 4-player tables, with the highest win share in both.

**By game stage.** VP per era was not compared head-to-head. The behaviour
measures (section 7) show the four-action planner's gains as slightly more
income, more tiles sold and fewer loans, which pay off mostly in the Rail Era.

## 7. Behaviour and remaining weaknesses

**What four-action planning changes** (held-out matchups; four-action seats
minus three-action seats in the same games; **bold** is significant):

| Measure | 2 players | 3 players | 4 players |
|---|---|---|---|
| Final VP | +1.26 | +2.04 | **+3.32** |
| Income level | +0.74 | **+1.12** | **+0.78** |
| Industry VP | +0.30 | +1.46 | **+1.82** |
| Link VP | +0.99 | +0.56 | **+1.30** |
| Tiles sold | +0.20 | **+0.27** | **+0.41** |
| Loans | −0.27 | **−0.35** | **−0.26** |
| Unflipped tiles at the end | −0.01 | −0.09 | **−0.17** |
| Builds, links, developments | about 0 | about 0 | about 0 |

**Investment realisation is more coherent:**
- **Flipping:** the four-action planner flips slightly more of what it builds, with more sales and fewer unflipped tiles at the end.
- **Borrowing:** it borrows less (about 0.3 fewer loans per game) and ends with more income.
- **Action mix:** this is not a change in which actions it takes, since it builds, links and develops as often as three-action planning. It chooses sequences that complete.
- **Typical sequences:** the extra action lets a plan cover "build now, then the following turn's link and sale" as one sequence. Three-action planning sees only part of that.

**Why bounded four-action search failed:**
- `p4-state-b` (4, 2, 2) has fewer first-level options than `p3-state` (6, 3), and it lost 4.4 VP. Shallow breadth matters more than depth.
- The diagnosis shows in its behaviour. In exploration, `p4-state-b` took about 1.1–1.4 fewer loans and reached 1.1–3.2 higher income than three-action planning, yet scored less.
  - With few candidates per level, its plans lean on longer, more speculative sequences that the position value rates highly (income now) but the game does not reward.
- `p4-state-n` (6, 3, 1) keeps the first two levels and adds only a greedy third. It was no better than three-action planning.
- **Depth helps only with enough breadth at the third level.** This matches Assignment 11's finding that candidate width matters.

**Remaining weaknesses** (for future work, none fixed here):
1. **Late-game money is overvalued** (self-play: £50–67 left unspent).
2. **Rare loan and shortfall collapse** (about 1% of player-games).
3. **No value for development or for the cards in hand** in the position value.
4. **The position value is static.** It cannot tell a strong position from a merely rich one early in the game (Assignment 11: correlation with final VP about 0.2 in the early Canal Era).
5. **Normal and Hard are identical.** Easy is the heuristic, far weaker than either.

## 8. Browser performance and reliability

`scripts/research/ai-browser.js` plays complete all-AI games through the real
page (`index.html` in Chromium, via Playwright), with every seat at Normal. It
times each `AIPlanner.chooseAction` call and tracks the longest gap between
animation frames. It measures the JS heap after garbage collection at the start
and end of each game. The AI's pacing delay is shortened to 50 ms; everything
else runs as in play.

| Configuration | Mean | 95th percentile | Worst decision | Longest two-action turn | Median turn | Longest frame gap | Budget hits |
|---|---|---|---|---|---|---|---|
| Three-action, desktop (2–4p) | 60–66 ms | 116–152 ms | 221 ms | 404 ms | 90–114 ms | 250 ms | 0 |
| Three-action, CPU 4×, phone viewport (2p, 4p) | 206–342 ms | 430–718 ms | 898 ms | 1.75 s | 433–623 ms | 1.08 s | 0 |
| **Four-action, desktop (2–4p)** | **140–201 ms** | **297–461 ms** | **633 ms** | **1.12 s** | **242–327 ms** | **650 ms** | 0 |
| **Four-action, CPU 4×, phone viewport (2–4p)** | **832–926 ms** | **1.66–1.98 s** | **2.52 s** | **4.81 s** | **1.26–1.70 s** | **2.70 s** | 2 of 307 |

**Against the targets:**

| Target | Desktop | CPU 4× |
|---|---|---|
| Mean ≤ 1 s | Pass | Pass (0.93 s worst) |
| 95th percentile ≤ 2 s | Pass | Pass (1.98 s worst) |
| Hard cut-off 2.5 s | Pass | Pass: hit twice, worst 2.52 s, the cut-off plus one candidate evaluation |
| Two-action turn ≤ 5 s | Pass | Pass (4.81 s worst) |
| Typical turn ≤ 2 s | Pass | Pass (median 1.26–1.70 s) |

**Reliability:**
- 7 complete browser games with the four-action planner and 5 with three-action, with no page errors and no AI failures. Every game finished, with no stalls.
- **Responsiveness.** The planner runs on the main thread, between the UI's paced AI actions.
  - On desktop the page is never blocked for more than 0.65 s.
  - On the throttled CPU the page freezes for up to 2.7 s during the slowest late-game decisions. That is acceptable for a turn-based game while the AI overlay is shown, but noticeable.
  - Moving the search to a Web Worker is the next step if phone responsiveness matters more (section 10). It was not necessary to meet the targets.
- **Memory.** The heap goes from 2.8 MB to 5.0–5.3 MB over a game, the growth of the game state and log, with no leak. Decision times rise from the first third of a game to the last (for example 562 → 1,222 ms throttled). That is the late game's larger move space, not degradation: the same pattern appears in Node with fresh processes.
- **Caveat.** These figures come from Chromium in a container with CPU throttling, not a real phone. A slower device than "4× this machine" would hit the 2.5 s cut-off more often; the planner then plays the best complete plan found so far (section 1).

## 9. Production selection

Against the pre-registered criteria, on held-out seeds:

| Criterion | Full four-action (`p4-state`) |
|---|---|
| 1. Stronger than three-action (pooled interval above 0, win share above 50%) | **Pass:** +2.21 ± 1.71, 53.9% |
| 2. No player count regresses | **Pass** (+1.3, +2.0, +3.3) |
| 3. Fast enough (Node; browser desktop and 4×) | **Pass**: the 4× results are close to the limits |
| 4. Correct and fair | **Pass:** 0 failures in about 4,700 games involving four-action planners; fairness, purity and budget tests pass |

**Outcome A: four-action planning is adopted.**
- **Why A rather than B:** neither bounded variant beat three-action planning, so the full planner is the only valid four-action choice.
- **Why not C or D:** it passed the strength and speed criteria.

**Is it worth it?** The decision rests on held-out strength and measured
browser responsiveness, not on depth:
- **Strength:** the gain is small (+2.2 VP), but it was confirmed independently and agrees with the mixed tables.
- **Speed:** it is comfortably responsive on desktop, and within the agreed targets on a slow CPU, with the cut-off guaranteeing progress.
- **Fallback:** if phone responsiveness proves a problem in practice, three-action planning (`AIPlanner.THREE_ACTION`) is a one-line change back, about 2.2 VP weaker and about three times faster.

## 10. Recommendations

1. **Fix the evaluation before searching deeper.** The two clearest weaknesses are both in the position value: late-game money, and loans at the end of the game.
   - A narrowly scoped, separately validated correction is the cheapest next gain: for example, discounting money by the rounds remaining.
   - Depth has nearly stopped paying (+2 VP for the fourth action).
2. **Move the search to a Web Worker** only if real phones show the throttled behaviour. The planner already works on a cloned observation, which makes the move straightforward.
3. **Decide what Easy, Normal and Hard should be.** For example: Easy the heuristic, Normal three-action, Hard four-action. That needs a product decision, not research.
4. **No deeper search for now.** Five actions or wider search would cost roughly 3× more per step for diminishing gains. They should wait for a better evaluator.

## 11. Tests, fairness and reproducibility

**New tests** (`test/ai-planner-production.test.js`):
- **Recorded games:** the production AI replays its recorded games exactly (`test/fixtures/assignment12-baseline.json`; 2 games per player count, at Normal and Hard).
- **Levels:**
  - Easy equals the heuristic.
  - Normal and Hard equal the research four-action planner.
  - `planner: 'none'` gives the heuristic.
- **Turn progression:** every decision returns one legal action and leaves the real game and the turn untouched, and plans look beyond the action played.
- **Budget:**
  - With no time at all, the planner returns the heuristic's best move, legal and flagged as timed out.
  - A small state budget gives a legal, reproducible result within budget.
  - Whole games play with a tiny budget.
- **Fairness:** plans are identical when opponents' hands and the deck are reshuffled, at every decision of a complete game.

**Existing tests:**
- All pass: 213 tests.
- Every earlier fixture (Assignments 1, 6, 8, 9 and 10) still replays exactly.
- The Assignment 11 planner tests run on the moved planner.

**Simulation.** `scripts/simulate.js` now also plays production-planner games
(`--planner`, default 2 per player count), and CI runs them.

### Reproducing the experiments

Everything is deterministic with Node.js 22+ (except wall-clock timings).
Raw results go to the git-ignored `research-a12/` folder.

**Policy names:**
- `normal@p3-state` and `normal@p4-state` are the research forms of the planners. `normal@p4-state` equals production without the wall-clock cut-off.
- `normal` is the heuristic AI of Assignment 10.

```
# Exploration (several hours on 4 cores)
for g in p4-state p4-state-b p4-state-n; do
  node scripts/research/ai-baseline.js matchups --players 2 --seeds 100 --pairs normal@$g:normal@p3-state --out research-a12/explore-$g-2.json   # 3, 4: --seeds 40
done
node scripts/research/ai-baseline.js matchups --players 2 --seeds 100 \
    --pairs normal@p4-state:normal@p4-state-b,normal@p4-state:normal@p4-state-n --out research-a12/bounded-2.json   # 3, 4: --seeds 40

# Validation, mixed tables and self-play (held-out seeds 800000)
node scripts/research/ai-baseline.js matchups --players 2 --seeds 150 --base-seed 800000 --pairs normal@p4-state:normal@p3-state --out research-a12/validate-2.json   # 3, 4: --seeds 60
node scripts/research/ai-baseline.js mixed --players 3 --seeds 40 --base-seed 800000 --levels normal@p4-state,normal@p3-state,normal@p2-state --out research-a12/mixed-3.json
node scripts/research/ai-baseline.js mixed --players 4 --seeds 40 --base-seed 800000 --levels normal@p4-state,normal@p3-state,normal@p2-state,normal --out research-a12/mixed-4.json
node scripts/research/ai-baseline.js mirror --players 2,3,4 --seeds 50 --levels normal@p3-state --out research-a12/selfplay.json

# Tables
node scripts/research/ai-criteria.js research-a12/validate-*.json            # and explore-*, bounded-*
node scripts/research/ai-seatstats.js research-a12/validate-*.json
node scripts/research/ai-mixed.js research-a12/mixed-3.json research-a12/mixed-4.json
node scripts/research/ai-report.js research-a12/selfplay.json

# Timing (run one at a time)
node scripts/research/ai-plan.js realise --players 4 --seeds 8 --planner p4-state   # and p3-state, p4-state-b, p4-state-n; 2, 3 players
PW=$(npm root -g)/playwright node scripts/research/ai-browser.js --players 3 --games 1                      # production, desktop
PW=$(npm root -g)/playwright node scripts/research/ai-browser.js --players 3 --games 1 --throttle 4 --mobile # production, CPU 4x
PW=$(npm root -g)/playwright node scripts/research/ai-browser.js --players 3 --games 1 --depth 3 --widths 6,3 # three-action

# Fixtures
node scripts/research/record-ai-baseline.js --preset current   # test/fixtures/assignment12-baseline.json
node scripts/research/record-ai-baseline.js --preset a10       # test/fixtures/assignment10-baseline.json
```

| New file | Purpose |
|---|---|
| `js/aiPlanner.js` | The production planner and AI entry point |
| `scripts/research/ai-browser.js` | Real-browser benchmark: decision and turn times, frame gaps, heap, errors |
| `scripts/research/ai-mixed.js` | Mixed-table summary (the new `ai-baseline.js mixed` experiment) |
| `test/ai-planner-production.test.js` | Production integration, budget, turn progression and fairness tests |
| `test/fixtures/assignment12-baseline.json` | Recorded games of the production AI |
