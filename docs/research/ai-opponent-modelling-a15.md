# Assignment 15: opponent modelling and plan robustness

**Result: Outcome C, close to D.**
- **Prediction:** the simplest model (M1) ranks contested next-turn opportunities better than chance, though it is not well calibrated.
- **Competitive strength:** no model improved on the Assignment 14 production planner.
  - None of the three was promising in screening.
  - M1 was worse at 4 players (−4.9 ± 3.4 VP).
  - The simulation models (M2, and the two-world M3) were level with production at best, and the three-world M3 was too slow.
- **Plan robustness:** simulating opponents did not make plans more robust. Opponents took M2's planned targets as often as production's.

**Recommendation: keep the production planner and do not put opponent
modelling into production in Assignment 16** (section 10). The study used 393
of the 1,500-game budget. The plan was pre-registered in
[`ai-opponent-modelling-a15-plan.md`](ai-opponent-modelling-a15-plan.md).

## 1. Starting point: opponent interference

**Findings from [Assignment 13](human-strategy-a13.md), section 9.4:**
- 15–19% of the planner's next-turn steps were illegal by the player's next turn.
- 80–90% of those failures were build spaces or links taken by opponents; beer was 4–6%.
- Only 20–22% of planned next-turn actions were actually played: the planner replans every action.

**The current planner** (Assignment 14 production, `AIPlanner.PRODUCTION`):
- **Plan length:** four of its own actions.
- **Steps inside the current turn:** exact.
- **Steps after the current turn:**
  - assume opponents pass and no cards are drawn;
  - are discounted by γ = 0.6;
  - stop at the end of the era.
- **Replanning:** at every decision.
- **Opponents:** they appear only as the current board; there is no turn-order or contest reasoning.

**This study's measurements** (production self-play, Build and Network steps
planned for the next turn, 21 games):

| Players | Steps | Taken by an opponent first | Illegal at the next decision (any reason) | Opponent turns before the player's next |
|---|---|---|---|---|
| 2 | 244 | 7–10% | 28–37% | 1.0 |
| 3 | 331 | 14–15% | 36–39% | 1.7 |
| 4 | 376 | 15–20% | 32–41% | 2.4 |

**About the "illegal" column.** It is higher than Assignment 13's 15–19%
because here it covers only Build and Network steps, the ones exposed to
contest. These also become illegal for the player's own reasons: their own
build elsewhere in the place in the Canal Era, money, or coal and iron. Taking
by opponents is the part opponent modelling can address: 7–20% of steps.

## 2. The models

All three are research code (`scripts/research/opponents.js`). They plug into
the production planner through an inert hook, `cfg.opponentModel`; no
production configuration sets it, and the recorded production games still
replay unchanged.

**They change only the valuation of steps after the current turn.** Steps
inside the current turn are exact and untouched, because no opponent can act
before them; a test checks this. The planner still replans every action.

| | Model | What changes |
|---|---|---|
| M0 | Production planner | Control |
| M1 | Contested-opportunity weights | A next-turn Build or Network step's value is multiplied by the chance that no opponent takes its target first: the product over the opponent turns before the player's next one of (1 − q·e). |
| M2 | One simulated opponent world | Opponents' hands are sampled from the unseen cards. Each opponent turn before the player's next one (two actions each) is played by the heuristic AI on that sample. The player's next-turn steps are then planned on the resulting board. A predicted move that the player's own actions this turn made illegal is skipped. |
| M3 | Robust over sampled worlds | As M2 over three independent hand samples. The next-turn value is (mean + minimum) / 2, so a plan that keeps its value whichever scenario happens is preferred, without discarding a plan only because disruption is possible. |
| M3b | M3 bounded | Two worlds instead of three: the pre-registered fallback, since M3 failed on cost (section 6) |

**M1's exposure and q.** For each opponent turn, the exposure e is:
- **0** if the target is illegal for that opponent ignoring cards (network, money, tiles, era);
- **for a link,** 1;
- **for a build,** the chance that a hand of their size, drawn from the unseen cards, holds a location card for that place, or an industry card for the slot's industries if the place is in their network.

q is fitted per step type (maximum likelihood) and frozen: builds 0, links 0.29.

**Public information only:**
- **Unseen cards:** the deck list for the player count, minus the player's own hand and every face-up discard of the era. Wild cards held by opponents are not modelled, a small approximation.
- **Who acts first:** the opponents still to play this round, then those ahead in the projected next-round order. That order follows money spent; players still to act, the planning player included, are assumed to spend the mean of those who have acted.
- **Sampling seed:** built from public quantities only.

## 3. Prediction quality

**The question** (`scripts/research/ai-opponents.js`, production self-play): for
each next-turn Build or Network step, does the model predict that an opponent
takes the target before the player's next turn?

**How it was scored:**
- M1's q was fitted on odd games and every model was scored on the even games.
- **The AUC** is the chance that a taken target is rated above one that was not; 0.5 is chance.
- **The Brier score** measures probability accuracy; lower is better.

| Sample | Steps scored (taken) | Predictor | Brier | AUC | Taken when predicted ≥ 0.5 |
|---|---|---|---|---|---|
| Stage 1 (12 games) | 268 (32, 12%) | Base rate | 0.106 | 0.50 | – |
| | | M1 | 0.105 | **0.63** | none predicted |
| | | M2 | 0.123 | 0.55 | 4 of 9 |
| | | M3 | 0.118 | 0.57 | 3 of 8 |
| Second sample (9 games) | 276 (41, 15%) | Base rate | 0.127 | 0.50 | – |
| | | M1 | 0.128 | **0.65** | 8 of 17 |
| | | M2 | 0.170 | 0.52 | 3 of 12 |
| | | M3 | 0.148 | 0.54 | 2 of 9 |

**Findings:**
- **M1 ranks risk usefully.** Links its exposure marks were taken about 30–50% of the time, against about 9% for unexposed ones.
- **M1's probabilities are not calibrated.** Its Brier score is no better than the base rate.
- **M1's fitted q is unstable.** Builds came out at 0 in stage 1 and 0.38 in the second sample, so the build exposure signal is weak.
- **M2 and M3 are nearly at chance.** Their simulated opponents rarely take exactly the planned target, and are right only about a quarter to half the time when they do. They do change the board the next turn is planned on, so they change decisions more often (next table).
- **Neither model over-predicts interference.** Their mean predictions (0.04–0.14) are at or below the base rate of 12–15%.

**Decisions changed and cost** (turn-start positions in one process: stage 1
plus a timing recheck on 3 fresh games):

| Players | Planner | Positions | Mean ms | 95th percentile ms | Worst ms | First move differs from M0 |
|---|---|---|---|---|---|---|
| 2 | M0 / M1 / M2 | 20 | 324 / 330 / 333 | 849 / 802 / 991 | 849 / 802 / 991 | – / 0% / 15% |
| 2 | M3 / M3b | 20 | 970 / 654 | **2,608** / 1,911 | 2,608 / 1,911 | 15% / 15% |
| 3 | M0 / M1 / M2 | 27 | 253 / 263 / 273 | 570 / 569 / 607 | 590 / 601 / 680 | – / 4% / 15% |
| 3 | M3 / M3b | 27 | 766 / 524 | 1,806 / 1,187 | 1,818 / 1,317 | 15% / 11% |
| 4 | M0 / M1 / M2 | 32 | 273 / 286 / 303 | 784 / 758 / 817 | 786 / 769 / 829 | – / 3% / 19% |
| 4 | M3 / M3b | 32 | 865 / 605 | **2,232** / 1,589 | 2,376 / 1,726 | 25% / 22% |

**Pre-registered stage 1 decisions:**

| Model | Decision | Reason |
|---|---|---|
| M1 | Screened | It changes about 2.5% of first moves with the frozen q, just above the 2% floor |
| M2 | Screened | It costs only 3–11% more time |
| M3 | **Dropped on cost** | Its 95th percentile is above 2 s at 2 and 4 players |
| M3b | Screened in M3's place | Two worlds instead of three |

## 4. Simulation method and game counts

| Experiment | Seeds | Games |
|---|---|---|
| Development smoke runs (debugging the models) | 160000 + 1000 × players + i | 5 |
| Stage 1 prediction quality and cost: 4 games per player count | same range, i = 1–4 | 12 |
| Timing recheck: 1 game per player count (plus 1 interrupted run, counted) | i = 5 | 4 |
| Plan robustness, M0 and M2 self-play: 3 games per player count each | i = 6–8 | 18 |
| **Diagnostic subtotal** | | **39** (of 60) |
| Screening, M1, M2 and M3b against production: 118 each, seat-balanced (20 seeds at 2 players, 7 at 3, 6 at 4) | 170000 + 1000 × players + i | **354** |
| Held-out validation | 180000 range, reserved | 0: no candidate qualified |
| **Total** | | **393** (of 1,500) |

**Determinism.** All games ran with no wall-clock cut-off.

**Opponents.** The production planner, not the heuristic: every screening game
seats the candidate against `normal@p4-c`, the Assignment 14 production
configuration.

**No mixed-policy tables.** With no candidate ahead of production in screening,
they would have added no useful evidence.

## 5. Competitive results (screening)

Candidate seats minus production seats in the same games, per game, with 95%
intervals:

| Model | 2 players (40) | 3 players (42) | 4 players (36) | Pooled VP | Pooled win share | Verdict |
|---|---|---|---|---|---|---|
| M1 | −2.0 ± 8.5 | +1.9 ± 4.2 | **−4.9 ± 3.4** | −1.7 ± 3.3 | 49.6% ± 9.0 | Not promising; regression at 4 players |
| M2 | +1.2 ± 9.3 | −5.2 ± 7.1 | +2.3 ± 5.9 | −0.6 ± 4.4 | 45.1% ± 9.0 | Not promising |
| M3b | +6.6 ± 8.6 | −1.8 ± 5.4 | −3.1 ± 4.8 | +0.6 ± 3.7 | 49.8% ± 9.0 | Not promising |

**Behaviour** (same comparison; bold means the interval excludes 0):
- **M1 at 4 players:** lower income (**−1.6 ± 1.5 levels**) and industry VP (**−3.7 ± 3.4**).
- **M3b at 4 players:** fewer loans (**−0.4 ± 0.4**).
- **Everything else** (link VP, builds, links built, loans) shows no significant change for any model.

**Reading the M1 regression.** M1 changes only about 2.5% of decisions, so a
4 VP loss per game is large for its footprint. Part of it is likely chance,
from three player counts and three models. It meets the pre-registered
regression criterion, so it is reported as one.

**Plan validity and realisation** (9 self-play games each, same seeds):

| Players | Taken by an opponent (M0 / M2) | Illegal at the next decision (M0 / M2) | Realised next turn (M0 / M2) |
|---|---|---|---|
| 2 | 10% / 11% | 37% / 32% | 22% / 20% |
| 3 | 14% / 15% | 36% / 39% | 17% / 20% |
| 4 | 20% / 18% | 41% / 39% | 25% / 20% |

**Simulating opponents did not make the plans more robust:**
- Opponents took M2's planned targets about as often as production's.
- About a fifth of planned next-turn steps were realised either way.
- So the planner's existing replanning already absorbs interference. Valuing the next turn on a predicted board neither avoided contested targets nor produced better decisions.

## 6. Performance

The figures are in section 3's cost table:
- **M1 and M2** add 2–11% to decision time, within budget.
- **M3 (three worlds)** fails the budget: its 95th percentile is 2.2–2.6 s at 2 and 4 players, and its worst decision is 2.6 s, above the 2.5 s cut-off.
- **M3b (two worlds)** is within it: mean 0.5–0.65 s and 95th percentile at most 1.9 s. That is about 2–2.2 times production's time, leaving little headroom on slow devices.

**Scaling with player count.** The cost of M2 and M3 grows with the number of
opponent turns simulated: on average 1.0, 1.7 and 2.4 at 2, 3 and 4 players.
Each opponent turn adds two heuristic decisions per sampled world. That part is
small next to replanning the next turn in each world, which drives M3's cost.

**No caching or optimisation was attempted,** since no model justified it. No
browser benchmark was run, because no model is a candidate for production.

## 7. Fairness and correctness

`test/ai-opponents.test.js` runs on positions in both eras at 3 and 4 players.
It checks five things:
- **Identical plans:** every model gives the same plan when the opponents' hidden cards, the deck order and face-down discards are reshuffled, with the player's observation unchanged.
- **The real game is never touched** by planning with any model.
- **The current turn is untouched:** a two-action plan at the start of a turn is unchanged by every model.
- **Unseen cards:** the model's unseen cards (derived from public information) number exactly the cards the player cannot see.
- **Opponent turns:** the simulated opponents are the right ones (before the player's next turn, never the player), and every predicted opponent move is legal when replayed.

**Determinism and isolation in production:**
- Production behaviour is unchanged: the recorded production games still replay, and the hook defaults to no model.
- The models are deterministic: sampling uses a seed built from public quantities.
- Hypothetical opponent moves run only on copies of the observation.

## 8. Decisions

| Model | Decision | Reason |
|---|---|---|
| M1 | Rejected | It predicts best, but changes few decisions and was not promising in screening; regression at 4 players |
| M2 | Rejected | Not promising in screening (−0.6 ± 4.4 VP, 45% wins); no gain in plan robustness |
| M3 | Rejected | Over the decision-time budget |
| M3b | Rejected | Not promising in screening (+0.6 ± 3.7 VP, 50% wins) at about twice the decision time |

**No candidate went to held-out validation.**

## 9. Limitations

- **Screening has wide intervals** (±3–4 VP pooled). A true effect of about ±3 VP per game, either way, cannot be ruled out for M2 or M3b. Large gains can be: an effect like Assignment 14's +10 VP would have shown.
- **The simulated opponents are the heuristic AI, not the planner.** Predicting planner-level opponents would need a full planner search per simulated opponent action: about 250 ms each, against a few milliseconds for a heuristic decision. It might predict better, but it would not fit the time budget alongside four-action planning.
- **Only the next turn is affected.** With γ = 0.6 already discounting it, and replanning every action, the planner's exposure to interference is limited. That may be why modelling it gains little.
- **Wild cards held by opponents are not modelled,** and the next-round turn order is a projection.
- **M1's take rates came from small samples** (about 20–40 taken targets per fit) and were unstable between samples.
- **Beer and resource competition** were covered only implicitly (M2 and M3 play opponents' sales and builds). Assignment 13 found beer causes 4–6% of failures.

## 10. Recommendation for Assignment 16

**Do not put opponent modelling into production:**
- None of the tested forms gave a credible competitive benefit.
- The simple form (M1) regressed at 4 players.
- The forms that simulate opponents cost 3–120% more time for no measured gain.

The production planner of Assignment 14 should stay as it is.

**Further opponent-modelling research is not a priority.** The evidence
suggests that, for this planner, replanning every action already handles most
interference. If it is revisited, the most informative experiment would be
targeted: discount only links, in 3- and 4-player games, where M1's signal is
strongest. Test it against a larger held-out sample, because the likely effect
is small.

**Better uses of Assignment 16,** from Assignment 13's catalogue (section 10),
all evaluator changes at little cost:
- H-RAIL: expected future link value;
- H-ERA: era-aware valuation of Level II+ tiles;
- H-DEV: development tied to attainable builds.

## Reproducing

```
node scripts/research/ai-opponents.js --games 4 --every 4 > research-a15/stage1.md                       # prediction and cost
node scripts/research/ai-opponents.js --games 1 --first 5 --every 2 --models M1,M2,M3,M3b > research-a15/stage1-timing.md
node scripts/research/ai-opponents.js --games 3 --first 6 --every 0 --policy M0 > research-a15/robust-m0.md
node scripts/research/ai-opponents.js --games 3 --first 6 --every 0 --policy M2 > research-a15/robust-m2.md
node scripts/research/ai-baseline.js matchups --players 2 --seeds 20 --base-seed 170000 \
  --pairs normal@p4-m2:normal@p4-c --out research-a15/screen-m2-2.json        # 3 players: --seeds 7, 4: --seeds 6; p4-m1, p4-m3b likewise
node scripts/research/ai-criteria.js research-a15/screen-m2-*.json             # win share and VP difference
node scripts/research/ai-seatstats.js research-a15/screen-m2-*.json            # behaviour
node --test test/ai-opponents.test.js                                         # fairness and correctness
```

`research-a15/screen.sh` runs the nine screening runs, at most four at once.
