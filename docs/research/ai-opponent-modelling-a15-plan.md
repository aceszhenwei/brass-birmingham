# Assignment 15 plan: opponent modelling and plan robustness

Written before any diagnostic or competitive game was played. The results are
in [`ai-opponent-modelling-a15.md`](ai-opponent-modelling-a15.md).

## Starting point

- **Assignment 13, section 9.4.** 15–19% of the planner's next-turn steps were illegal when the player's next turn came. 80–90% of those failures were build spaces or links taken by opponents, and 4–6% were beer.
- **How the production planner treats the future** (Assignment 14, `AIPlanner.PRODUCTION`):
  - It plans four of its own actions.
  - Steps inside the current turn are exact.
  - Steps after it (the next turn) assume opponents do nothing in between, and are discounted by γ = 0.6.
  - It replans at every decision.
  - It uses no information about opponents beyond the board itself.

## Models

All three plug into the production planner through a research hook
(`cfg.opponentModel`, inert in production). They see only the planner's
observation, and they affect only steps after the current turn.

| | Model | What it does |
|---|---|---|
| M0 | Production planner | Control |
| M1 | Contested-opportunity weights | A next-turn Build or Network step's value is multiplied by the chance that no opponent takes its target first: the product over the opponent turns before the player's next one of (1 − q·e). The exposure e is 0 if the target is illegal for that opponent ignoring cards. Otherwise it is the chance that a hand of their size, drawn from the unseen cards, allows it. q (per step type) is fitted on diagnostic games and then frozen. |
| M2 | One simulated opponent world | Opponents' hands are sampled from the unseen cards. Each opponent turn before the player's next one is played by the heuristic AI. The player's next-turn steps are then planned on that board. |
| M3 | Robust over sampled worlds | Three worlds (independent hand samples) are used. A plan's next-turn value is the mean of the three values averaged with their minimum. |

**Public information only:**
- **Unseen cards:** the deck list for the player count, minus the player's hand and the face-up discards.
- **Turn order:** opponents still to act this round, then those ahead in the projected next-round order. Players still to act are assumed to spend the mean of those who have acted.
- **Sampling seed:** built from public quantities.

## Stages and budget (at most 1,500 complete games)

### 1. Prediction quality and cost (diagnostic, at most 60 games)

**Games.** Production self-play, 4 games per player count (12), seeds
160000 + 1000 × players + i.

**What is recorded.** At each decision whose plan has a next-turn Build or
Network step:
- each model's prediction that an opponent takes the target first;
- the outcome at the player's next decision.

**Fitting and scoring.** M1's q is fitted on odd games and frozen. All models
are scored on even games, using the Brier score and AUC against the base rate.
Every 4th turn-start position times a full plan per model and records whether
the first move changes.

**A model is dropped before screening if any of these holds:**
- it changes the first move in fewer than 2% of positions (it cannot matter);
- its mean plan time at 4 players is above 1 s, or its 95th percentile above 2 s (on turn-start positions, one process);
- it is no better than chance at finding taken targets (AUC ≤ 0.5).

**One bounded variant is allowed if M3 fails on cost only:** two worlds instead of three.

### 2. Screening (at most 120 games per candidate)

- **Design:** each candidate plays production (`normal@p4-c`), with seats balanced (`ai-baseline.js matchups`).
- **Seeds:** 170000 + 1000 × players + i.
- **Games:** 20 seeds at 2 players (40 games), 7 at 3 (42) and 6 at 4 (36), 118 in all.
- **Promising:** pooled VP difference above 0, pooled win share above 50%, and no player count with its interval entirely below 0.
- **Stopping early:** a candidate is stopped as soon as it can no longer be among the best two.
- **Tie-break:** if candidates are similar, the cheaper one goes first.

### 3. Held-out validation (at most 300 games per promising candidate)

- **Games:** 50 seeds at 2 players (100 games), 17 at 3 (102) and 16 at 4 (96), 298 in all.
- **Seeds:** fresh, 180000 + 1000 × players + i.

### Recommendation for Assignment 16 (the criteria of Assignments 7–14)

A model is recommended only if all of these hold:
- the pooled 95% interval of the VP difference is entirely above 0;
- the pooled win share is above 50%;
- no player count has its interval entirely below 0;
- it stays within the decision-time budget (mean 1 s, 95th percentile 2 s, cut-off 2.5 s, 5 s per two-action turn).

A positive but uncertain result is reported as inconclusive. Better prediction
without a competitive gain is not enough.

**Fairness.** For each model, a test reshuffles opponents' hidden cards while
keeping the player's observation unchanged. It must give an identical plan.
