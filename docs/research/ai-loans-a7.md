# Assignment 7: Loan Decision-Making and Economic Sustainability

**Scope.** This assignment investigates the loan decisions of the corrected
(Assignment 6) AI. It then tests three targeted loan-scoring candidates
against that AI under criteria fixed in advance
([`ai-loans-a7-plan.md`](ai-loans-a7-plan.md)). The full generated tables are
in [`ai-loans-a7-results.md`](ai-loans-a7-results.md).

**Decision: no candidate is adopted.**
- **Production behaviour is unchanged.** The production AI keeps the Assignment 6 loan heuristic. A recorded-game fixture now pins it, and the fixture is identical when recorded from `main`.
- **Validation.** The best candidate (`enabling`) was validated on held-out seeds at every difficulty. It was statistically indistinguishable from the current AI: about +0.3 VP pooled, with a 95% interval of about ±1.9 VP. It therefore fails the pre-registered criterion of a clear improvement.

**Why the AI borrows so much.** These figures cover Easy, Normal and Hard at
2–4 players, over 900 games and about 14,200 loans:

- **It borrows because it is broke.**
  - Normal and Hard borrow with £1.40–1.60 in hand on average. In 95–98% of their loans no Build or Network was affordable.
  - Almost every loan (99–100%) made one affordable.
  - The usual alternative was **Pass** (in 60–79% of loans, Pass was the best other action). The loan then funds the next action, a Build in 73–81% of loans.
- **Borrowing is productive for this AI.**
  - Only 9–11% of Normal and Hard loans leave the money idle for two actions.
  - Without loans (the `never` ablation) the AI loses **14–21 VP per game** against the current AI, with win shares of 17–39%. In mirror games it passes 16–21 more times and builds 8–10 fewer tiles per game.
  - The cost is real but much smaller: 26–39% of loans are followed by an income shortfall in the same era, and shortfalls cost 1.6–3.1 VP per player per game.
- **Assignment 5's defect D3 is real but practically harmless.**
  - The "cash crunch" test can only fire when nothing is affordable, so it really means "a loan would make something affordable".
  - This is almost always true at that moment, so the flat +4 bonus selects the right situations. It does so without weighing what the loan buys, or what it costs.
- **The root cause lies outside the loan heuristic.** The AI is chronically cash-starved because of how it *spends*:
  - development paid for with market iron;
  - overbuilding its own unflipped tiles;
  - low income.

  Loans are the symptom that keeps it playing, not the disease. Those heuristics are out of scope here; the interaction is documented in §6.

---

## 1. The loan heuristic and its observed behaviour

### 1.1 The heuristic

`scoreLoanResult` in `js/aiPlayer.js`, unchanged since upstream except for
inputs corrected in Assignment 6:

```
base             = 0.12 × (£30 × 0.25)  −  3 income levels × incomeWeight
                   (incomeWeight = 0.35 × rounds left in this era / 5)
cashCrunchBonus  = +4.0 if money < cheapest affordable Build/Network
                   (in practice: if nothing is affordable)
alreadyFlush     = −2.5 if money > 2.5 × the cheapest affordable target
incomeFloor      = −2.5 if income level ≤ −5
score            = base + cashCrunchBonus − alreadyFlush − incomeFloor
```

**What the terms come to.**
- **The base** is between about −1.2 and +0.7, and it **ignores** the income lost in later eras.
- **The +4** makes the loan beat Pass (−0.5), Scout and most Develops whenever the AI is broke.

### 1.2 Investigation

`scripts/research/ai-loans.js` plays mirror games with the AI's diagnostics on.
A new behaviour-neutral `explain` option reports every candidate action's
score and the loan score's parts. For each loan it records:
- **the situation:** era, rounds left, income payments still to come, cash, income level, the loan's number for that player;
- **whether anything was affordable** before the loan, and what the loan made affordable;
- **the competition:** the best alternative action and its score;
- **the outcome:** the player's next two actions and what they cost, and whether the player owed an income shortfall later in the same era.

Loans are classed as:

| Class | Meaning |
|---|---|
| **Enabling** | Needed for the next Build or Network |
| **Investment** | At least £15 spent on Build, Network or Develop within two actions |
| **Idle** | Neither |

Results: 100 games per level and player count; Normal shown, ranges cover all
levels and player counts ([results §4](ai-loans-a7-results.md#4-loan-probes-ai-loansjs-exploration-mirror-seeds-100-games-each)).

| Measure | Normal 2 / 3 / 4 players | Notes |
|---|---|---|
| Loans per player per game | 6.08 / 5.46 / 4.80 | Easy 4.5–5.6, Hard 5.2–6.2 |
| Cash before the loan | £1.6 / £1.6 / £1.6 | Easy £3.7–4.0 (some of its loans are random picks) |
| No Build or Network affordable | 97% / 96% / 95% | Hard 97–98%, Easy 79–83% |
| The loan made one affordable | 99% / 99% / 99% | All levels 92–100% |
| Pass was the best alternative | 65% / 74% / 78% | Then Scout, Develop |
| Without the +4, the loan would have lost | 64% / 54% / 36% of crunch loans | Usually to Pass |
| Next action | Build 77% / 75% / 73% | Then Develop, Network |
| Enabling / investment / idle | 72 / 19 / 10% · 68 / 23 / 9% · 67 / 22 / 11% | Easy: idle 18–22% |
| Income payments still to come | 9.2 / 8.2 / 7.2 | So a loan's −3 income levels cost £21–29 for the £30 raised; 28–47% of loans cost more than they raise |
| Taken in the first third of an era / its last two rounds | 42 / 45 / 35% · 20 / 23 / 27% | — |
| Followed by an income shortfall in the same era | 34% / 34% / 26% | Enabling loans 29–44%, idle 6–23% |

**A representative trace.** Seed 203004, 3 players, all Normal, player 1
(`ai-trace.js`). Each loan is taken at £0–6 and immediately funds a build or
link:

```
canal r 3  P1 £  2 inc   2  loan
canal r 3  P1 £ 32 inc  -1  build    pottery at coventry (iron from the market)
canal r 5  P1 £  2 inc   3  loan
canal r 6  P1 £ 32 inc   0  develop  cottonMill + manufacturer (market iron)
canal r 6  P1 £ 23 inc   0  build    cottonMill at stone
rail  r 5  P1 £  0 inc   3  loan
rail  r 6  P1 £ 30 inc   0  network  birmingham-coventry
rail  r 6  P1 £ 25 inc   0  build    manufacturer at birmingham
```

The player took 6 loans and finished third on 61 VP. The winner took 3 loans
and finished with income 12.

### 1.3 Interpretation: necessary, productive or harmful?

**Mostly necessary and productive.** Most loans are taken by a player with no
money and nothing affordable, and are spent at once on a build or link.
Without them, the turn would have been a Pass.

**What the heuristic gets wrong** is not *when* it borrows but *what it
considers*:
- **The value of the enabled action is ignored.** The +4 is flat, whatever the loan makes possible.
- **The cost is under-counted.** The base counts the income loss for the current era only, at a heavily discounted rate. A Canal-Era loan keeps costing £3 per round all through the Rail Era.
- **Shortfall risk is ignored.** A third of loans are followed by a shortfall.

**Loans and results.** In mirror games the number of loans and final VP are
positively correlated at 2 players (r = 0.45), weakly at 3 (0.27) and not at 4
(−0.08). Winners did not borrow less. This is correlation only: strong
positions both earn and spend more.

**Assessment.** The Assignment 5 framing of a "loan spiral" is half right.
Loans do drive the negative income, and in turn the shortfalls. But they are
a rational response to a cash-starved economy, not the cause of it. Assignment
6 already showed the rounds error was not the cause.

## 2. Hypotheses and candidates

| Id | Hypothesis | Candidate | Change |
|---|---|---|---|
| H-A | The loan is under-priced: its income cost runs to the end of the game, not the era | `cashflow` | The money value becomes the real cash flow, `£30 − £3 × income payments still to come`, at the AI's existing rate of 0.12 per £. This replaces the 25% discount and the era-only income term. No new weights |
| H-B | A flat +4 borrows to fund poor actions and ignores better ones it could fund | `enabling` | The +4 and the "flush" penalty are replaced by the loan's *enabling value*: how much more the best newly affordable Build or Network scores than the best one affordable now (or Pass, if nothing is). It uses the AI's existing Build and Network scorers |
| — | Both together | `cashflow+enabling` | — |
| — | Diagnostic: how much are loans worth to this AI? | `never` | Never borrow. An ablation, not a candidate |

**Considered and not tested.** A literal fix of D3, comparing against targets
that are not yet affordable, would change almost nothing: in 99–100% of crunch
loans, the loan already enabled something.

All variants are `options.loan` switches in `js/aiPlayer.js`. The game never
sets them, and they run on the fair observation like the rest of the AI.

## 3. Method and pre-registered criteria

The method is that of Assignments 5 and 6:
- **Harness.** The deterministic harness (`scripts/research/harness.js`), where every game is reproducible from its seed.
- **Seat balance.** Every arrangement of the two policies over the seats is played on every seed.
- **Statistics.** Intervals are 95% (± 1.96 standard errors). "Pooled" weights 2, 3 and 4 players equally (`scripts/research/ai-criteria.js`).

**Phases**, as fixed in [`ai-loans-a7-plan.md`](ai-loans-a7-plan.md) before
any candidate was run:

1. **Exploration** on seeds `200000 + 1000 × players + i`, at Normal against the production AI:
   - matchups: 2 players 100 seeds, 3 and 4 players 40 seeds;
   - mirror games: 100 seeds per player count.

   Only the candidate with the best non-negative pooled VP difference goes forward.
2. **Validation** on held-out seeds `300000 + 1000 × players + i`, at every difficulty: 2 players 150 seeds, 3 and 4 players 60 seeds.

**Adoption requires all of:**
1. a Normal pooled VP-difference interval entirely above 0, and a pooled win share above 50%;
2. no player count or difficulty with an interval entirely below 0;
3. no pooled regression at Easy or Hard;
4. no illegal moves or failures, and the fairness and determinism tests pass;
5. no significant rise in VP lost to shortfalls.

Fewer loans or more income were explicitly **not** criteria.

**Games played** (no failures, no illegal moves):

| Experiment | Games |
|---|---|
| Exploration matchups | 2,720 |
| Exploration mirror games | 1,500 |
| Validation | 3,060 |
| Loan probes | 1,200 |

## 4. Results

### 4.1 Exploration: Normal against the production AI

Each cell gives the candidate's win share (95% interval), then the VP difference.

| Candidate | 2 players | 3 players | 4 players | Pooled |
|---|---|---|---|---|
| `cashflow` | 50.0%, −0.9 ± 5.2 | 49.6%, −1.2 ± 3.8 | 47.9%, −1.2 ± 3.0 | 49.2% ± 3.8, **−1.08 ± 2.39** |
| `enabling` | 53.5%, +2.4 ± 5.0 | 52.1%, +0.5 ± 3.9 | 49.2%, 0.0 ± 2.8 | 51.6% ± 3.8, **+0.95 ± 2.31** |
| `cashflow+enabling` | 44.3%, −2.4 ± 5.0 | 44.2%, −2.0 ± 3.7 | 43.8%, −1.6 ± 2.7 | **44.1% ± 3.8** (below 50%), −1.97 ± 2.24 |
| `never` (ablation) | 38.5%, −14.0 ± 4.3 | 27.1%, −18.2 ± 3.4 | 17.1%, −20.7 ± 2.6 | 27.6% ± 3.3, **−17.65 ± 2.02** |

Under the plan, only `enabling` went forward.

### 4.2 Behaviour changes (paired mirror games, Normal)

Per player per game, at 2 / 3 / 4 players. Bold marks an interval that excludes 0.
([Results §3](ai-loans-a7-results.md#3-paired-mirror-comparisons-exploration-seeds-100-per-player-count).)

| Measure | `cashflow` | `enabling` | `cashflow+enabling` | `never` |
|---|---|---|---|---|
| Loans | +0.1 / **+0.3** / **+0.3** | +0.1 / +0.2 / **+0.3** | **+0.9 / +1.1 / +1.6** | **−6.1 / −5.5 / −4.8** |
| Final income level | **−1.5 / −1.1 / −1.0** | **−1.0** / −0.3 / **−1.3** | **−3.9 / −3.9 / −5.6** | **+7.4 / +6.9 / +5.9** |
| Money left at the end | **+4.4 / +4.8 / +8.2** | +0.6 / −0.4 / +0.9 | **+22.9 / +26.3 / +42.1** | **−9.2 / −10.4 / −11.2** |
| Network actions | **−0.4 / −0.3 / −0.3** | **−0.7 / −0.6 / −0.6** | **−0.8 / −0.9 / −1.0** | **−2.0 / −1.5 / −0.8** |
| Builds | +0.1 / **+0.2 / +0.2** | **+0.5** / +0.3 / 0.0 | +0.1 / 0.0 / −0.3 | **−9.6 / −8.9 / −7.8** |
| Passes | **+0.7** / +0.1 / 0.0 | +0.8 / +0.2 / +0.4 | **+0.8** / +0.5 / +0.3 | **+21.3 / +19.0 / +15.7** |
| VP lost to shortfalls | +0.4 / 0.0 / 0.0 | 0.0 / +0.1 / +0.2 | +0.4 / +0.3 / +0.4 | **−3.1 / −2.4 / −1.6** |
| Final VP (mirror) | −3.1 / **−1.4** / −0.7 | −2.1 / −0.4 / **−2.5** | **−4.6 / −3.4 / −4.9** | **−25.8 / −24.4 / −21.7** |

### 4.3 Validation of `enabling` (held-out seeds, every difficulty)

Each cell gives the win share, then the VP difference against the same level's production AI.

| Level | 2 players | 3 players | 4 players | Pooled |
|---|---|---|---|---|
| Easy | 51.2%, −1.1 ± 3.9 | 54.2%, +2.7 ± 3.0 | 50.6%, −0.7 ± 2.3 | 52.0% ± 3.1, +0.29 ± 1.81 |
| Normal | 50.0%, +1.3 ± 4.4 | 52.0%, 0.0 ± 3.2 | 51.7%, −0.3 ± 2.3 | 51.2% ± 3.1, **+0.33 ± 1.95** |
| Hard | 50.7%, −1.4 ± 4.1 | 50.6%, +0.9 ± 3.1 | 53.9%, +1.5 ± 2.4 | 51.7% ± 3.1, +0.32 ± 1.88 |

**Criteria:**

| Criterion | Result |
|---|---|
| 1 | **Fails.** The Normal pooled interval [−1.6, +2.3] includes 0 |
| 2 | Passes: no interval entirely below 0 |
| 3 | Passes |
| 4 | Passes: 0 failures in 3,060 games, and the tests pass |
| 5 | Passes: no significant rise in VP lost to shortfalls |

## 5. Interpretation and decision

| Candidate | Decision | Reason |
|---|---|---|
| `cashflow` | **Rejected** (exploration) | Pricing the loan's whole cost makes **late** loans look profitable: £30 against one or two payments. The AI then borrows a little *more*, ends with more unspent money and lower income, and is no stronger. Exact cash-flow accounting is not what this AI lacks; the money it raises late has nothing to buy |
| `enabling` | **Rejected** (validation) | It values loans by what they buy, which is the more principled rule. It changes behaviour (fewer links, slightly more loans) but **not strength**, at any level or player count, on 3,060 held-out games. Adopting it would change production play without measurable benefit |
| `cashflow+enabling` | **Rejected** (exploration) | The two changes interact badly: borrowing rises (+0.9 to +1.6 loans), money is hoarded (+£23–42 unspent), and the win share falls significantly below 50% |
| `never` | Diagnostic | Loans are worth about 18 VP per game to this AI. Any loan change must not make it materially more reluctant to borrow when broke |

**Conclusion.** The current heuristic's crude rule (borrow when broke) is close
to the best a loan rule can do for **this** AI, because:
- its loans are nearly all taken when broke and spent immediately;
- refining their price or their value changes little.

The loan count is high because the AI is chronically cash-starved. That
starvation comes from its spending decisions, which this assignment does not
change.

**Confirmed findings:**
- the loan situations, classes and costs in §1.2;
- that loans are strongly beneficial to this AI (§4.1, `never`);
- that none of the three candidates improves strength (§4.1, §4.3);
- the behaviour changes marked significant in §4.2.

**Hypotheses** (inferred, not tested here):
- the cash-starvation causes in §6;
- the explanation of why `cashflow` hoards.

## 6. Remaining economic weaknesses (outside the loan heuristic)

1. **Cash starvation from spending.** The Assignment 5 probes measured:
   - Develop takes 13–28% of spending;
   - 80–94% of iron is bought at market prices;
   - 41–54% of developed industries are never built afterwards;
   - own-tile overbuilds destroy about £12–13 each (more since Assignment 6).

   **Hypothesis:** fixing overbuild scoring (D4) and over-development (W2) would reduce the *need* for loans more than any loan rule can.
2. **Shortfall management.** 26–39% of loans are followed by an income shortfall, settled by the engine's default policy (unflipped tiles first, then the lowest VP). Whether a better shortfall choice, or keeping a cash reserve before the last round, is worth VP is untested.
3. **Late-game money has no use.** A late loan's cash often has nothing to buy, as `cashflow` showed. That points at end-of-game planning, not at loan pricing.
4. **D3 remains a latent code defect.** The crunch test compares against already-affordable targets. It is harmless in practice (§1.3) and is kept, because changing it alone has no measurable effect. If the loan rule is revisited together with the spending fixes, `enabling` is the cleaner formulation to start from.

**Recommended next step.** Address D4, the overbuild scoring, as Assignment 6
recommended. Then re-measure loans with `ai-loans.js`. A smaller loan count
then would be a *consequence* of better spending, which is the right order.

## 7. Correctness, fairness and reliability

| Check | Result |
|---|---|
| Production behaviour | **Unchanged.** `test/fixtures/assignment6-baseline.json` (30 games, all levels, 2–4 players) was recorded on this branch and is byte-identical when recorded from `main`. `test/ai-loans.test.js` replays it |
| `explain` diagnostics | They don't change decisions (tested); the default loan option equals `'a6'` (tested) |
| Research variants | Legal, pure (choosing never changes the state) and reproducible complete games, with invariants after every move (tested). They run on the fair observation, so they use no hidden information |
| Test suite | 170 / 170 pass |
| `simulate.js` | Passes (clone and restore continuations, the Assignment 1 comparison through the legacy baseline) |
| Experiments | 0 failures and 0 rejected moves in about 8,500 games |
| Engine, rules, UI | Unchanged |

## 8. Limitations

- **Resolution.** The validation can resolve pooled differences of about ±2 VP and ±3 win-share points. Smaller effects of `enabling` cannot be excluded.
- **Correlated games.** Games sharing a seed are correlated, so the intervals are somewhat optimistic.
- **Opponents.** Candidates were tested against the current AI and in mirror games, not against human players or stronger agents. A better loan rule might matter more for an AI that spends well.
- **Proxies.** "Enabling", "investment" and "idle" use a two-action window and a £15 threshold.
- **Causes are partly inferred.** The causes of cash starvation come from Assignment 5's probes and were not re-tested here.

## Reproducing the experiments

Everything is deterministic with Node.js 22+. Raw results go to the
git-ignored `research-a7/` folder.

```
# Investigation (about 1-2 min per player count)
node scripts/research/ai-loans.js --players 3 --seeds 100 --levels easy,normal,hard     # and 2, 4
node scripts/research/ai-loans.js --players 3 --seeds 100 --levels normal --loan enabling   # each candidate
node scripts/research/ai-trace.js --players 3 --seed 203004 --seats normal,normal,normal --player 1

# Exploration (exploration seeds)
P=normal+cashflow:normal+a6,normal+enabling:normal+a6,normal+cashflow+enabling:normal+a6,normal+never:normal+a6
node scripts/research/ai-baseline.js matchups --players 2 --seeds 100 --pairs $P --out research-a7/explore-2.json
node scripts/research/ai-baseline.js matchups --players 3 --seeds 40 --pairs $P --out research-a7/explore-3.json
node scripts/research/ai-baseline.js matchups --players 4 --seeds 40 --pairs $P --out research-a7/explore-4.json
node scripts/research/ai-baseline.js mirror --players 2 --seeds 100 \
    --levels normal+a6,normal+cashflow,normal+enabling,normal+cashflow+enabling,normal+never --out research-a7/mirror-2.json   # and 3, 4

# Validation (held-out seeds)
V=easy+enabling:easy+a6,normal+enabling:normal+a6,hard+enabling:hard+a6
node scripts/research/ai-baseline.js matchups --players 2 --seeds 150 --base-seed 300000 --pairs $V --out research-a7/validate-2.json
node scripts/research/ai-baseline.js matchups --players 3 --seeds 60 --base-seed 300000 --pairs $V --out research-a7/validate-3.json
node scripts/research/ai-baseline.js matchups --players 4 --seeds 60 --base-seed 300000 --pairs $V --out research-a7/validate-4.json

# Tables
node scripts/research/ai-criteria.js research-a7/explore-*.json
node scripts/research/ai-criteria.js research-a7/validate-*.json
node scripts/research/ai-compare.js research-a7/mirror-*.json \
    --pairs normal+cashflow:normal+a6,normal+enabling:normal+a6,normal+cashflow+enabling:normal+a6,normal+never:normal+a6
```

| New file | Purpose |
|---|---|
| `scripts/research/ai-loans.js` | The loan investigation: situations, reasons, follow-ups, classes |
| `scripts/research/ai-criteria.js` | Applies the pre-registered criteria: per-count and pooled win shares and VP differences |
| `scripts/research/record-a6-baseline.js` | Records the production-AI fixture |
| `test/ai-loans.test.js` | Pins the production AI and checks the research variants and diagnostics |
