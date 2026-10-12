# Assignment 6: AI Correctness, Fairness and Baseline Preservation

**Scope.** This assignment corrects the two foundational defects confirmed in
the [Assignment 5 audit](ai-baseline-audit.md):
- **F1:** Hard reads opponents' hands;
- **D2:** the rounds-remaining estimate is wrong for half of every era.

It also preserves the audited AI as a reproducible research baseline, and
measures each correction separately. No heuristic weight was changed. The
loan logic, overbuild scoring, development, selling and discards are left for
later work. The full generated tables are in
[`ai-corrections-a6-results.md`](ai-corrections-a6-results.md).

**Summary.**

- **Fair information, by construction.** Every difficulty now decides on `state.getObservation(playerId)`. That is a copy of the game holding exactly what the player view shows:
  - opponents' hands, the deck order and face-down discards are placeholders;
  - the game's random generator is replaced.

  A test plays complete games and, at every decision, checks that each difficulty decides identically in an "alternate world" the player cannot tell apart. It finds 0 differences for every difficulty. The same test detects the leak in the legacy Hard.
- **Exact rounds remaining.** The AI uses the engine's `getRoundsRemaining()`. It is checked against the round ends that actually follow at every decision of complete 2–4-player games, in both eras.
- **The baseline is preserved.** `AIPlayer.LEGACY_A5` reproduces the audited AI bit for bit:
  - all 300 recorded Assignment 1 games;
  - every Assignment 5 mirror game, with all its statistics.

  It is a research baseline and **not a fair benchmark**: its Hard still reads hidden hands.
- **Effect on strength.**
  - Neither correction changes head-to-head strength against the baseline measurably, at any difficulty or player count. Every win share is within its interval of 50%.
  - The information correction changes 2–3% of Hard's decisions and nothing else: Easy and Normal are bit-identical.
  - The rounds correction changes 6–14% of all decisions.
- **Effect on behaviour.** The rounds correction shifts every level from Network and Develop to Build: about +1 Build, −1 Develop and −0.5 to −1 Network per player per game.
  - It sells slightly more (+0.25 to +0.5 tiles).
  - It **overbuilds its own unflipped tiles more** (+0.15 to +0.38).
  - It builds **fewer links, so scores fewer link VP**.
  - With every seat corrected, Hard games end about 5 VP lower per player.
- **Difficulty levels.** Hard's edge over Normal at 3–4 players (about 4–5 VP) survives the information correction but **disappears with the rounds correction**. After both corrections:
  - Easy is below Normal at every player count;
  - Normal and Hard are indistinguishable;
  - Hard is no longer clearly above Easy at 3–4 players.
- **Newly identified.**
  - The old rounds error was masking a calibration gap: once income is valued over the correct horizon, Build scores crowd out Network.
  - It also hid how often the AI overbuilds its own tiles (D4).
  - The loan spiral is **not** caused by the rounds error (A5 hypothesis H2 is refuted): loans are unchanged.

---

## 1. Root causes

### F1: Hard read opponents' hands

`denialBonus` in `js/aiPlayer.js` looped over `p.hand` for every opponent.
- **Root cause.** The AI was handed the live `GameState`, which holds every hand, the deck order and the random generator, so nothing stopped it reading them.
- **Effect.** Only Hard did so, but any future code path could have.

### D2: Rounds remaining

`estimateRoundsRemaining` returned `drawDeck.length / numPlayers`, clamped to
1–10.

**Root cause.** It ignored the cards in hand, and every round uses two cards
per player, not one. Once the deck runs out the estimate reads 1, while up to
four rounds remain ([A5 §4, D2](ai-baseline-audit.md#d2-the-rounds-remaining-estimate-is-wrong-for-half-of-every-era-confirmed)).

**Effect on valuations.** The estimate feeds two places:
- `incomeWeight`, so income is valued at its minimum for half of every era;
- the late-game penalty on sellable industries.

## 2. Changes

| Change | Where | Notes |
|---|---|---|
| `GameState.getObservation(viewerId)` | `js/gameState.js` | A `clone()` with the player-view rules from Assignment 2 applied: other players' hands, the draw deck and face-down discards become `{ type: 'hidden' }` placeholders, with counts kept; `rng` becomes a fixed `SeededRandom(0)`. It is a playable `GameState`, so the rules queries work on it unchanged |
| `GameState.getRoundsRemaining()` | `js/gameState.js`, `ROUNDS_PER_ERA` in `js/gameData.js` | Rounds left in the era, counting the current one: 10 / 9 / 8 in round 1, 1 in the last, 0 when the era's cards are all played or the game is over. The era still ends by its cards; the constant is the round count the deck sizes produce |
| The AI decides on the observation | `AIPlayer.chooseAction` | It builds `getObservation(playerId)` and a `GameLogic` for it, then runs the unchanged heuristic. The real state is never passed to the heuristic, so the AI can't read hidden information or change the game. The UI and every caller keep the same signature |
| The AI uses the engine's rounds | `estimateRoundsRemaining` | `Math.max(1, state.getRoundsRemaining())`. The heuristic formulas that consume it are unchanged |
| Hard's denial bonus uses expectations | `denialBonus` | It uses the same weights (0.6 per location card, 0.3 per industry card), applied to the **expected** number of matching cards in opponents' hands (see below) |
| Legacy baseline | `AIPlayer.LEGACY_A5`; the `options` argument of `chooseAction` | `{ information: 'full', rounds: 'deck-estimate' }` restores the Assignment 5 code paths exactly. The two switches can also be set one at a time, for the isolated experiments. The game never passes options |

**How the expectation is computed.** The cards a player cannot see are the
era's deck (`CARD_DECK`) minus every card it can see: its own hand and the
face-up discards. Opponents hold their hand counts of those cards, and every
unseen card is equally likely to be in any of them. The expected number of
opponent cards matching the build is therefore
`matching unseen cards × opponent hand cards ÷ unseen cards`.

**Why this replacement.**
- It keeps the bonus's intent and scale and stays deterministic, as Hard was.
- Assignment 5 found that a *sampled* plausible hand plays as well as the real one, and the expectation is the average of such samples.
- The alternative, dropping the bonus, would change Hard into the Normal heuristic without noise. That is a strategy change outside this assignment.

**Why options instead of a second copy.** The corrections are two small,
local changes. A frozen copy of the 500-line AI would duplicate the
production heuristic. Two documented switches keep one implementation, allow
isolated experiments, and keep the baseline exact. The tests prove that
exactness.

## 3. Regression tests

| Test | What it proves |
|---|---|
| `test/ai-fairness.test.js` | **Observations:** they match the player view exactly; opponents' hands, the deck and face-down cards are hidden; the game RNG is not revealed; rules queries run on them; changing one leaves the game untouched |
| | **Alternate worlds:** complete 2, 3 and 4-player games are played at each difficulty, about 300 decisions per difficulty. At every decision, an alternate world is built that the player cannot tell apart: every unseen card is reshuffled into the same places, and the RNG is replaced. The test then checks that the player views and observations are identical, and that **Easy, Normal and Hard each choose the same move with the same AI random stream** |
| | **No state changes and a working detector:** choosing never changes the state, and the legacy Hard is still detected as depending on hidden hands |
| `test/ai-rounds.test.js` | **Exactness:** at every decision of complete games (2, 3 and 4 players, several seeds), `getRoundsRemaining()` equals the number of round ends of that era still to come |
| | **Boundaries:** round 1 of each era gives 10 / 9 / 8, the last round gives 1, the transition into the Rail Era restarts the count, and a finished era or game gives 0 |
| | **Consistency and the legacy defect:** the observation reports the same count, and the AI uses it. The legacy option keeps the old formula and reproduces its underestimate (1 while three or more rounds remain) |
| `test/determinism.test.js` | **The legacy baseline is exact:** it replays the recorded Assignment 1 games bit for bit (300 with `BRASS_SIM_GAMES=100`) |
| Existing suites, unchanged | **Clone and restore:** the AI is called through the headless driver, and clone and save/restore continuation still finish identically |
| | **Legality:** the AI's moves are still among the legal moves |
| | **Determinism:** the AI never advances the game RNG, and complete games run headlessly |

`node --test test/*.test.js` runs **162 tests: 162 pass and none are `todo`**.
The Assignment 5 `todo` test for F1 is now a passing test.

## 4. Experiments

### 4.1 Method

The method is that of [Assignment 5 §3.1](ai-baseline-audit.md#31-method):
- `scripts/research/harness.js` plays games through the engine;
- seeds are `200000 + 1000 × players + i`;
- every arrangement of the two policies over the seats is played on every seed, so seats and starting positions are balanced.

**Policies:**

| Policy | Meaning |
|---|---|
| `<level>-a5` | The baseline |
| `<level>-fairinfo` | The baseline with only the information correction |
| `<level>-rounds` | The baseline with only the rounds correction |
| `<level>` | Both corrections (the game's AI) |

**Experiments** (none failed):

| Experiment | Detail | Games |
|---|---|---|
| Matchups: 10 pairs × 3 player counts | 2 players: 100 seeds; 3 and 4 players: 40 seeds | 6,800 |
| Hard-gap follow-up | 4 pairs at 3 and 4 players, 80 seeds | 3,840 |
| Three-way | — | 300 |
| Mirror games | 10 policies × 3 player counts × 100 seeds | 3,000 |
| Audit probe | — | 270 |
| Decision probes | — | 900 |

**Isolation, checked directly.** With only the information correction, Easy
and Normal are bit-identical to the baseline: 60 of 60 seeded games each,
including every statistic. Only Hard changes, in 2.1–3.1% of its decisions
([results §3](ai-corrections-a6-results.md#3-legality-fairness-and-decision-sensitivity-probe)).

### 4.2 Strength against the baseline

Each cell gives the corrected policy's win share against the same level's
baseline (95% interval; 50% means equal), then the VP difference.
([Results §1](ai-corrections-a6-results.md#1-seat-balanced-matchups).)

| Correction (A) vs baseline (B) | 2 players | 3 players | 4 players |
|---|---|---|---|
| Hard, information only | 49.5% [43–56], −1.0 ± 5.3 | 47.9% [42–54], −3.4 ± 3.9 | 50.4% [44–57], +0.9 ± 2.7 |
| Easy, rounds only (= both corrections) | 49.0% [42–56], +2.4 ± 4.9 | 49.6% [43–56], +0.1 ± 3.6 | 51.7% [45–58], +1.1 ± 2.6 |
| Normal, rounds only (= both corrections) | 48.0% [41–55], −0.5 ± 5.4 | 48.3% [42–55], +2.2 ± 3.8 | 50.8% [45–57], 0.0 ± 2.9 |
| Hard, rounds only | 48.8% [42–56], −1.0 ± 5.6 | 45.1% [39–51], −1.5 ± 4.1 | 50.8% [45–57], +0.5 ± 2.5 |
| Hard, both corrections | 50.8% [44–58], −2.0 ± 5.4 | 48.3% [42–55], −2.1 ± 3.9 | 44.6% [38–51], −2.0 ± 2.7 |

**Finding (confirmed at this resolution).** No correction changes strength
against its own baseline detectably. The experiments can resolve differences
of about 3–5 VP and 6–7 win-share points; smaller effects cannot be ruled
out.

### 4.3 The difficulty levels after the corrections

Each cell gives A's win share (95% interval), then the VP difference.

| A vs B | 2 players | 3 players | 4 players |
|---|---|---|---|
| Easy vs Normal | 41.3% [35–48], **−8.1 ± 4.8** | 42.9% [37–49], **−5.1 ± 3.8** | 45.4% [39–52], **−4.6 ± 2.7** |
| Normal vs Hard | 50.8% [44–58], +0.1 ± 5.1 | 50.6% [46–55], +2.5 ± 2.8 (80 seeds) | 51.7% [47–56], +1.2 ± 2.0 (80 seeds) |
| Easy vs Hard | 41.8% [35–49], **−6.5 ± 5.3** | 48.3% [42–55], −3.5 ± 3.6 | 52.1% [46–58], −2.5 ± 2.8 |

In three-way 3-player games:

| Level | Win share | Mean VP |
|---|---|---|
| Easy | 31.0% | 33.1 |
| Normal | 30.7% | 36.1 |
| Hard | 38.3% | 37.5 |

Assignment 5's three-way results were Easy 27.7%, Normal 28.3% and Hard 44.0%.

**Which correction removed Hard's edge** (3 and 4 players, 80 seeds per arrangement):

| Normal baseline (A) vs B | 3 players | 4 players |
|---|---|---|
| Hard baseline | 44.4% [40–49], **−5.2 ± 2.7** | 44.0% [40–48], **−4.4 ± 2.1** |
| Hard with the information correction | 44.0% [40–48], **−4.0 ± 2.8** | 45.2% [41–50], **−5.0 ± 2.1** |
| Hard with the rounds correction | 48.3% [44–53], +0.1 ± 2.8 | 49.2% [45–54], −0.8 ± 1.9 |

**Findings.**
- **Confirmed: the fairness correction costs Hard nothing.** It keeps its full edge, as Assignment 5 predicted.
- **Confirmed: the rounds correction removes Hard's edge.** That leaves Normal and Hard indistinguishable, and Hard is no longer clearly above Easy at 3–4 players (48.3% and 52.1%).
- **Hypothesis: why.** Hard's only difference from Normal is a bonus to Build. Under the corrected horizon, Build already wins more often, so the extra bias overshoots. The corrected Hard mirror makes the most own-tile overbuilds, the fewest links and takes more loans ([§4.4](#44-behaviour-changes)).

### 4.4 Behaviour changes

These are paired mirror comparisons: the same seed, every seat the same
policy, per player per game. Bold marks an interval that excludes 0
([results §2](ai-corrections-a6-results.md#2-paired-mirror-comparisons)).

| Measure | Normal: rounds correction (2 / 3 / 4 players) | Hard: both corrections (2 / 3 / 4 players) |
|---|---|---|
| Builds | **+1.2 / +1.2 / +1.6** | **+1.0 / +0.8 / +1.2** |
| Develop actions | **−0.9 / −1.1 / −1.2** | **−0.5 / −1.1 / −1.1** |
| Network actions | **−0.5 / −0.9 / −0.9** | **−0.6 / −1.0 / −1.0** |
| Tiles sold | **+0.27 / +0.24 / +0.29** | +0.04 / −0.01 / +0.03 |
| Own unflipped tiles overbuilt | **+0.24 / +0.23 / +0.15** | **+0.38 / +0.27 / +0.20** |
| Link VP | −0.3 / **−2.0** / **−1.8** | −1.0 / **−2.8** / **−3.1** |
| Final VP (mirror) | +0.5 / −3.1 / −2.7 | −2.6 / **−5.1** / **−5.1** |
| Income level | +0.7 / −0.7 / −0.3 | −0.5 / **−1.1** / **−1.5** |
| Loans | +0.1 / +0.2 / 0.0 | +0.2 / +0.1 / **+0.4** |

**Notes.**
- **The information correction alone changes no behaviour measure significantly** at any player count.
- **Easy** shows the same pattern as Normal: +0.7 to +1.1 Builds, −0.8 to −1.1 Develops, +0.15 to +0.49 tiles sold.

**Interpretation.**
- **Mirror VP measures how productive a game is** when everyone plays a policy. It does not measure relative strength, which is unchanged in head-to-head play (§4.2).
- **The lower mirror scores come mostly from link VP.** Corrected players build fewer links and more, often redundant, tiles.

### 4.5 Unexpected regressions and checks

- **Overbuilding (D4) is amplified.** It was not fixed here, but the corrected AI overbuilds its own unflipped tiles 15–40% more often, because Build wins more decisions. At 4 players, Hard: 441 overbuilds in 400 player-games, up from 360.
- **Loans unchanged; H2 refuted.** Loans (about 5 per player per game, 95–98% of them taken with nothing else affordable) are unchanged for Easy and Normal and slightly higher for Hard at 4 players. Assignment 5's hypothesis H2, that fixing D2 removes most of the loan spiral, is refuted: the spiral comes from the loan logic (D3).
- **Selling: H1 only marginally supported.** It rises by about 0.25 tiles per player per game but remains rare: legal at 5–7% of turns. The rounds error is not the main cause of the low sell rate.
- **No reliability regressions:**
  - 0 illegal moves in about 15,000 games and 9,210 probed decisions;
  - 0 state changes during decisions;
  - all games finished with exact round counts;
  - clone and restore still continue identically.
- **Speed.** A decision now clones the state (about 70 µs). Games take about 1.5–2× as long (0.3–0.4 s for a whole game), which is still fast.

## 5. Reliability and compatibility

| Check | Result |
|---|---|
| Test suite | 162 / 162 pass, including the 300 recorded Assignment 1 games replayed bit for bit by the legacy baseline (`BRASS_SIM_GAMES=100`) |
| `node scripts/simulate.js` | All games passed (mixed difficulties, random games, clone + JSON restore continuations, Assignment 1 comparison through the baseline) |
| Browser (`index.html`, Playwright) | **4-AI game:** played to the end, Canal scoring and game over shown, no console errors or AI recoveries. **3-player game with Easy / Normal / Hard selected on the setup screen:** played to the end, no errors |
| Engine architecture | Unchanged. Two read-only `GameState` queries were added; the save format is unchanged (version 1) |
| CI | The existing workflows run the new tests |

## 6. Limitations

- **Statistical resolution.**
  - Head-to-head matchups resolve about ±3–5 VP and ±6–7 win-share points. Smaller strength effects of either correction cannot be excluded.
  - Games that share a seed are correlated, so the intervals are somewhat optimistic.
- **The expected-card bonus is one fair reading of Hard's intent.** Other fair versions would play differently: sampling hands with an AI-owned random stream, or a public-information proxy.
- **Opponents' wild cards are not modelled.** The observation hides wild cards in opponents' hands, as the player view does. The expectation treats all opponent cards as drawn from the unseen deck.
- **Mechanisms are inferred.** The explanations for the loss of link VP and of Hard's edge are inferred from the behaviour measures. They have not been tested by changing heuristics.
- **No human baseline,** as in Assignment 5.

## 7. Recommendations for the next stage

The order follows the evidence:

1. **D3, the loan logic.** It is now the clearest confirmed defect: loans are taken when nothing is affordable and beat Pass by default. This assignment shows the defect is independent of the rounds error.
2. **D4, overbuild scoring.** The rounds correction has made it more frequent. Subtracting the replaced tile is a correctness fix, not tuning.
3. **Re-establish the difficulty levels deliberately, after 1 and 2.** Normal and Hard are now equal. Decide what separates the levels (noise, the denial bonus, or later look-ahead), and accept a level only with a measured gap.
4. **Network vs Build calibration (new, hypothesis).** The corrected horizon exposed that network value doesn't scale with the time left while income does. Investigate with the paired mirror and matchup tools before changing any weight.
5. **Then:** over-development, the selling pipeline and the discard choice, as listed in Assignment 5.

**Process.**
- Keep `LEGACY_A5` for reproducing past results only. Compare future work with the **current corrected AI**, which is the fair baseline.
- Change one thing at a time, and report paired mirror measures alongside seat-balanced matchups.

## Reproducing the experiments

Everything is deterministic with Node.js 22+ and no dependencies. Raw results
go to the git-ignored `research-a6/` folder. Times are for one core.

Since Assignment 8 changed the production AI, the corrected AI of this report
is `<level>~a6` (`AIPlayer.LEGACY_A6`). The commands below use those names
and reproduce this report's numbers exactly.

```
# Matchups: corrections in isolation and together vs the baseline, then the corrected ladder
# (default pairs; about 6 / 9 / 11 min)
node scripts/research/ai-baseline.js matchups --players 2 --seeds 100 --out research-a6/matchups-2.json
node scripts/research/ai-baseline.js matchups --players 3 --seeds 40 --out research-a6/matchups-3.json
node scripts/research/ai-baseline.js matchups --players 4 --seeds 40 --out research-a6/matchups-4.json

# Which correction removed Hard's edge (about 10 min each)
P=normal-a5:hard-a5,normal-a5:hard-fairinfo,normal-a5:hard-rounds,normal~a6:hard~a6
node scripts/research/ai-baseline.js matchups --players 3 --seeds 80 --pairs $P --out research-a6/hardgap-3.json
node scripts/research/ai-baseline.js matchups --players 4 --seeds 80 --pairs $P --out research-a6/hardgap-4.json

node scripts/research/ai-baseline.js threeway --players 3 --seeds 50 --levels easy~a6,normal~a6,hard~a6 --out research-a6/threeway-3.json

# Mirror games for the paired behaviour comparison (about 4-5 min per player count)
L=easy~a6,normal~a6,hard~a6,easy-a5,normal-a5,hard-a5,easy-rounds,normal-rounds,hard-rounds,hard-fairinfo
node scripts/research/ai-baseline.js mirror --players 2 --seeds 100 --levels $L --out research-a6/mirror-2.json   # and 3, 4

# Tables
node scripts/research/ai-report.js research-a6/matchups-*.json research-a6/threeway-3.json research-a6/hardgap-*.json
node scripts/research/ai-compare.js research-a6/mirror-*.json

# Probes: legality, hidden information, decision sensitivity; decision-level behaviour
node scripts/research/ai-audit.js --games 10 --baseline a6
node scripts/research/ai-probes.js --players 3 --seeds 100 --levels easy~a6,normal~a6,hard~a6   # and 2, 4
```

`scripts/research/ai-compare.js` (new) produces the paired before/after
mirror tables. The other scripts are described in
[Assignment 5](ai-baseline-audit.md#reproducing-the-experiments). They now
accept the variant policy names, and `ai-audit.js --baseline a5` probes the
baseline.
