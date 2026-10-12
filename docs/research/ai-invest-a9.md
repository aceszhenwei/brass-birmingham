# Assignment 9: Industry Development, Selling and Investment Realisation

**Scope.** This assignment investigates how well the AI turns its investments
into income and victory points. It looks at Develop actions, and at the
industries that score only when sold (cotton mills, manufacturers and
potteries). It then tests three targeted candidates against the production AI
of Assignment 8, under criteria fixed in advance
([`ai-invest-a9-plan.md`](ai-invest-a9-plan.md)). The full generated tables
are in [`ai-invest-a9-results.md`](ai-invest-a9-results.md).

**Decision: `sell-calibrated` is adopted.** When the AI scores building a
sellable industry, it now uses the measured sale probability (0.25) for a tile
that cannot be sold yet, instead of an optimistic 0.6.
- **Validated on 3,060 held-out games**, it gains **+9.3 to +10.5 VP** per game against the Assignment 8 AI at every difficulty, with win shares of 61–64%. Every player count at every difficulty improves.
- **It also gains against different opponents.** Normal with the change beats production Hard by +8.0 VP and Easy by +14.3; without it, Normal is level with Hard.
- **The Assignment 8 AI is preserved** as `AIPlayer.LEGACY_A8`. Its recorded games and all earlier research still reproduce exactly.

**What was wrong.**
- **The AI did not fail to sell. It failed to create the conditions for a sale.**
  - When a sale was legal, the AI took it 92–97% of the time (Easy about 80%).
  - Only 22–38% of the sellable tiles it built could be sold when built. The rest had no connected merchant that buys them (43–71%) or not enough beer (8–19%).
  - Those tiles sold only 16–31% of the time. The build score assumed 0.6 and ignored beer.
- **The cost:** about 40% of sellable tiles were still unsold at the end of their era, leaving **10–13 VP per player per game** unscored.
- **Development is partly wasteful, but not the main bottleneck.** About half of developed industries (48–59%) were built later. Developing in the game's last two rounds was almost pure waste (1–7% built later). Removing it was positive but not significant against the production AI, so it was not adopted.

**What did *not* change:** development scoring, loans and overbuilding. The
AI develops *more* than before (see section 7).

## Contents

1. [Development and selling behaviour](#1-development-and-selling-behaviour)
2. [The principal bottlenecks](#2-the-principal-bottlenecks)
3. [Hypotheses and candidates](#3-hypotheses-and-candidates)
4. [Method and acceptance criteria](#4-method-and-acceptance-criteria)
5. [Results, uncertainty and regressions](#5-results-uncertainty-and-regressions)
6. [Decisions](#6-decisions)
7. [Limitations and recommendations](#7-limitations-and-recommendations)
8. [Correctness, fairness and reproducibility](#8-correctness-fairness-and-reproducibility)

## 1. Development and selling behaviour

The investigation script `scripts/research/ai-invest.js` plays all-AI mirror
games and follows every developed tile and every sellable tile to the end of
the game. It ran 100 games at each difficulty and player count (900 games),
on the exploration seeds `200000 + 1000 × players + i`. The figures below are
the ranges over those nine configurations; Normal at 3 players is given where
one example is enough.

### How the AI decides

- **Develop** (`scoreDevelopPlan`) removes one or two tiles. It ranks
  developable industries by `urgency` (2.0 if the tile is Canal-only, else 0.5)
  plus `0.3 × level`. The score is set against the iron cost. Nothing in the
  score asks whether the industry will be built, or how many rounds remain.
- **Build** (`scoreBuildCandidate`) values a tile as its VP and income times
  a flip probability (`estimateFlipProbability`). For a sellable industry this
  was 0.8 with a connected merchant that buys it and 0.6 without one. Beer was
  never checked, and no merchant gives 0.6 even when none could ever connect.
- **Sell** is scored on the VP and income it flips, so once a sale is legal it
  usually wins.

### Development

| Measure (per player per game) | Easy | Normal | Hard |
|---|---|---|---|
| Develop actions | 5.7–6.3 | 5.4–6.3 | 4.3–6.4 |
| Iron spent on developing | £41–43 | £41–42 | £31–39 |

Of all developed tiles (Normal, 3 players: 3,184 tiles):

| Measure | Normal 3p | Range, all configurations |
|---|---|---|
| Level I, Canal-only tile removed | 57% | 52–65% |
| Industry was already buildable somewhere | 44% | 36–53% |
| Top tile unbuildable this era (developing was the only way on) | 0.4% | 0–4% |
| Industry built later | 54% | 48–59% |
| …and a later tile of it flipped | 23% | 18–26% |
| A Build was available instead | 75% | 67–84% |

**Timing is what separates useful from wasteful development.** "Rounds left"
counts the rest of the game, both eras:

| Rounds left in the game | Tiles developed (Normal 3p) | Built later (Normal 3p) | Built later, all configurations |
|---|---|---|---|
| 1–2 | 497 | 2% | 1–7% |
| 3–5 | 229 | 23% | 12–34% |
| 6–10 | 510 | 59% | 31–59% |
| 11–20 | 1,948 | 70% | 58–73% |

By industry (Normal, 3 players), coal mines (71% later built), breweries (51%) and cotton mills
(57%) are developed usefully. Manufacturers (35%), iron works (43%) and
potteries (8%) mostly are not.

**Useful versus wasteful.** Early development of Canal-only Level I tiles is
the AI's way into the Rail Era. It is consistent with the rules: Level I tiles
cannot be built in the Rail Era, so developing them is the only way to reach
the higher levels. Most early developments are later built. In contrast,
9–18% of all development happens with 2 or fewer rounds left. It costs an
action and iron, and almost never leads to a build. That is the clearest
waste.

### Selling

| Measure | Normal 3p | Range, all configurations |
|---|---|---|
| Sellable tiles built, per player per game | 4.31 | 3.5–4.5 |
| Share of all builds | 38% | 34–42% |
| Sale-ready when built | 31% | 20–38% |
| No connected merchant buys it | 54% | 43–71% |
| Merchant, but not enough beer | 15% | 8–19% |

**What happens to them:**

| Condition when built | Sold (Normal 3p) | Sold, range |
|---|---|---|
| Sale-ready | 91% | 89–95% |
| No merchant | 21% | 20–27% |
| Short of beer | 22% | 16–31% |
| **All** | **43%** | **38–50%** |

- **Unsold at the end of their era:** 37–44%. A further 13–21% were overbuilt or removed first.
- **Why unsold tiles stayed unsold** (the obstacle at most of their owner's turns): no merchant 62–83%; beer 14–35%; "sellable but not sold" 0–2%; built in the era's last turn 1–5%.
- **VP left unscored:** 9.8–13.3 per player per game.
- **While waiting,** the owner's turns found the tile blocked by a missing merchant 70–79% of the time and by beer 14–21%.

**Taking sales.** A Sell was legal at only 5–7% of turns. Normal and Hard
took it 92–97% of the time. Easy took it about 80% of the time; when Easy
skipped a sale it mostly took a loan, built or developed, which is its
intended randomness. The AI rarely gives up a sale for something worse.

### Representative traces

From the investigation's example output (`research-a9/invest-a8-3.md`):
- Seed 203001, Normal, player 2 builds a Level 2 cotton mill in Canal round 8 with no connected merchant. It never connects in the remaining two rounds and scores nothing.
- Seed 203001, Normal, player 0 builds a Level 1 cotton mill in Canal round 5 with a merchant but no beer. For nine turns it waits for beer that never comes.
- Seed 203001, Hard, player 1 builds a Level 1 cotton mill in Canal round 3 with no merchant. Nine turns later it connects, but then four more pass without beer.
- Seed 203001, Normal, player 1 develops away a Canal-only brewery in Canal round 3 (score 3.9) instead of the best build (3.2), and never builds a brewery afterwards.

## 2. The principal bottlenecks

1. **Building sellable industries where they cannot be sold (principal).**
   The weakness is in the valuation of one action, not in taking sales. The
   build score treats a tile with no merchant as a 60% sale, and ignores beer
   altogether. Most of these tiles never sell. The AI keeps building them
   because each one looks valuable, so its VP and money go into tiles that
   never score.
2. **Late development (secondary).** Develop is scored without regard to the
   rounds remaining. With 2 or fewer rounds left, almost nothing developed is
   built.
3. **Not an issue: taking sales.** Sales are recognised and taken. Ignoring
   available sales is not a cause of unsold tiles.
4. **Coordination.** A sale needs a merchant link, beer and the tile. The AI
   rarely plans these together. But the evidence points first to the build
   valuation: if the build score is honest about the sale, the AI builds where
   the sale already works, and does not need multi-step plans. That is tested
   directly by comparing `sell-calibrated` (a valuation fix) and
   `sell-connect` (a coordination fix).

## 3. Hypotheses and candidates

| Candidate | Option | Hypothesis | Change |
|---|---|---|---|
| `develop-horizon` | `develop: 'horizon'` | Late Develop actions waste an action and iron | No Develop with 2 or fewer rounds left in the game |
| `sell-calibrated` | `sell: 'calibrated'` | The build score overrates sellable tiles that cannot be sold yet | A sellable tile that is not sale-ready gets a sale probability of 0.25 instead of 0.6 (or instead of 0.8, when a merchant is connected but beer is short) |
| `sell-connect` | `sell: 'connect'` | The AI does not link its unsold tiles to merchants | A Network link earns the rise in sale probability (0.25 → 0.8) times the VP and income of each of the player's unsold sellable tiles it newly connects to a buying merchant |

**Calibration.** The two probabilities are the measured rates, rounded.
Not-ready tiles sold 16–31% of the time (0.25); sale-ready tiles 89–95%
(0.8, the existing value for a connected merchant, kept to change as little
as possible). The late-game penalty (−0.3 with fewer than 2 rounds left) still
applies.

**Sale-ready** means: a connected, non-blank merchant buys the industry, and
the beer the tile needs is available (the player's own breweries, connected
opponents' breweries, plus one merchant barrel). It uses only the public
board, so the AI's information stays fair.

Each candidate is one option in `js/aiPlayer.js`, and each changes exactly one
valuation. `test/ai-invest.test.js` checks this at every decision in three
complete games:
- `horizon` removes the Develop candidate only in the last two rounds;
- `calibrated` only lowers sellable build candidates;
- `connect` only raises Network.

(One deliberate exception: under `calibrated`, overbuilding the player's own
unready sellable tile can score *higher*, because Assignment 8's charge for
the replaced tile uses the same, now lower, sale probability.)

## 4. Method and acceptance criteria

The plan was written after the investigation and before any candidate was
evaluated ([`ai-invest-a9-plan.md`](ai-invest-a9-plan.md)).

- **Baseline:** the production AI of Assignment 8 (`AIPlayer.LEGACY_A8`).
- **Exploration:** exploration seeds; each candidate plays the Normal
  baseline in seat-balanced matchups (2 players: 100 seeds; 3 and 4 players:
  40 seeds each), plus 100 paired mirror games per player count for the
  behaviour measures. Only the candidate with the best pooled VP difference,
  if not negative, goes forward.
- **Validation:** held-out seeds `500000 + 1000 × players + i`, never used
  before. The candidate plays the baseline at every difficulty (2 players:
  150 seeds; 3 and 4 players: 60 seeds each).
- **Generalisation:** Normal with and without the candidate play production
  Hard and Easy (2 players: 100 seeds; 3 and 4 players: 40 seeds each).
- **Seat balance:** every seed is played with the candidate in every seat
  arrangement, so seat and card luck cancel out.
- **Statistics:** "pooled" weights the three player counts equally. Intervals are 95% (±1.96 standard errors).

**Adoption criteria** (all required, on held-out seeds):
1. Normal improves: pooled VP difference interval above 0, pooled win share above 50%.
2. No player count, at any difficulty, has a VP-difference interval entirely below 0.
3. Easy and Hard: pooled VP-difference interval not entirely below 0.
4. Never an illegal move or failed game; the fairness and determinism tests pass.
5. In paired mirror games at Normal, VP lost to income shortfalls does not rise significantly.

**Not criteria:** more sales, fewer Develop actions, fewer unsold tiles. These
are diagnostics; a candidate is judged on winning.

## 5. Results, uncertainty and regressions

### Exploration (against the Normal baseline)

| Candidate | 2p VP | 3p VP | 4p VP | Pooled VP difference | Pooled win share |
|---|---|---|---|---|---|
| `develop-horizon` | +1.30 ± 6.08 | +1.41 ± 4.16 | +2.71 ± 3.33 | +1.81 ± 2.69 (includes 0) | 53.1% |
| **`sell-calibrated`** | +12.66 ± 5.22 | +11.58 ± 4.03 | +9.56 ± 2.79 | **+11.27 ± 2.39** | **62.3%** |
| `sell-connect` | +6.68 ± 6.07 | +3.52 ± 4.11 | +7.23 ± 3.26 | +5.81 ± 2.67 | 57.8% |

`sell-calibrated` went forward. `sell-connect` also improved, but by half as
much. The plan allows one candidate forward, and the two sell candidates are
alternative answers to the same bottleneck.

### Behaviour (paired mirror games at Normal, per player per game)

All four players use the variant, against all four using the baseline on the
same seeds. Differences in **bold** are significant.

| Measure | `sell-calibrated` 2p | 3p | 4p | `sell-connect` 3p | `develop-horizon` 3p |
|---|---|---|---|---|---|
| Final VP | **+18.84** | **+13.34** | **+11.21** | **+7.73** | **+2.66** |
| Link VP | **+5.2** | **+4.8** | **+3.9** | | **+1.65** |
| Tile VP | **+11.4** | **+7.0** | **+6.1** | | **+0.99** |
| Income level | **+3.3** | **+2.7** | **+2.1** | | **+0.63** |
| Loans | −0.23 | **−0.29** | **−0.39** | **−0.21** | +0.00 |
| Builds | **−0.5** | **−0.8** | **−0.7** | −0.03 | **+0.25** |
| Develop actions | **+1.8** | **+1.7** | **+1.2** | +0.07 | **−0.92** |
| Tiles sold | **+0.97** | **+0.55** | **+0.28** | **+0.49** | **+0.11** |
| Networks | **+1.0** | **+0.9** | **+0.6** | | **+0.53** |
| Passes | **−3.4** | **−2.2** | **−1.1** | | +0.04 |
| VP lost to shortfalls | **−2.11** | **−1.29** | **−0.98** | −0.39 | −0.01 |

The full tables with intervals are in the results appendix.

**Investment, re-measured with `sell-calibrated`** (Normal, the same 300 games):

| Measure | Assignment 8 AI | `sell-calibrated` |
|---|---|---|
| Sellable tiles built, per player per game | 4.2–4.3 | 2.6–3.0 |
| Sale-ready when built | 31–38% | 97–99% |
| Sold | 43–50% | 92–98% |
| Unsold at era end | 37–40% | 2–7% |
| VP left unscored, per player per game | 10.7–12.7 | 0.3–0.8 |
| Breweries built, per player per game | 0.9–1.5 | 1.4–2.0 |
| Develop actions, per player per game | 5.4–6.3 | 6.7–8.1 |
| Iron spent on developing | £41–42 | £53–56 |
| Developed industries built later | 49–58% | 53–55% |

**Behavioural versus competitive improvement.** The AI builds fewer sellable
tiles but sells almost all of them, and builds more breweries to supply them.
That alone would not justify adoption, but it comes with a large competitive
gain. The gain is in tile VP, link VP and income; the AI also passes less,
borrows slightly less, and loses fewer VP to shortfalls.

### Validation (held-out seeds, against the baseline at the same level)

| Level | 2 players | 3 players | 4 players | Pooled VP | Pooled win share |
|---|---|---|---|---|---|
| Easy | +8.03 ± 4.37 | +9.18 ± 2.94 | +10.79 ± 2.40 | **+9.33 ± 1.93** | 62.8% |
| Normal | +11.49 ± 4.69 | +8.90 ± 3.36 | +8.15 ± 2.21 | **+9.51 ± 2.06** | 61.0% |
| Hard | +13.53 ± 4.41 | +9.67 ± 3.23 | +8.20 ± 2.25 | **+10.47 ± 1.97** | 63.9% |

3,060 games, none failed. Every interval is above 0.

### Generalisation (held-out seeds)

| Pair | Pooled VP difference | Pooled win share |
|---|---|---|
| Normal + `sell-calibrated` vs Hard | **+8.01 ± 2.55** | 60.6% |
| Normal vs Hard | −1.26 ± 2.61 | 49.9% |
| Normal + `sell-calibrated` vs Easy | **+14.25 ± 2.40** | 67.3% |
| Normal vs Easy | **+4.55 ± 2.58** | 57.5% |

The gain holds against opponents the candidate was not tuned against, and
every player count is above 0.

### Regressions investigated

- **No player count or difficulty regresses** (criterion 2).
- **Shortfalls fall** (criterion 5): −1.0 to −2.1 VP per player per game.
- **Loans fall slightly** (−0.2 to −0.4), although loan scoring is unchanged.
- **More development.** With fewer attractive sellable builds, the AI develops
  1.2–1.8 times more per game and spends £12–14 more iron. The extra
  development is no more wasteful per tile (built later 53–55%, against 49–58%),
  but late development is still common (section 7).
- **Fewer potteries.** Potteries were built 428 times in the baseline (3
  players) and 86 times with the change. Few merchants buy them, so the honest
  score rarely favours them. Since potteries sold only 23% of the time before,
  this is a correction rather than a loss.
- **Develop-horizon in mirror games** gained +1.7 to +3.4 VP, with fewer
  Develop actions and more builds and links. Against the baseline in
  seat-balanced matchups, that did not reach significance.

## 6. Decisions

| Candidate | Decision | Reason |
|---|---|---|
| `sell-calibrated` | **Adopted** | Passes all five criteria at every difficulty on held-out seeds: +9.3 to +10.5 VP, 61–64% win share; generalises |
| `sell-connect` | Not adopted | Positive in exploration (+5.8 VP) but half of `sell-calibrated`. Not taken forward under the plan's one-candidate rule, and not validated |
| `develop-horizon` | Not adopted | +1.8 ± 2.7 VP in exploration: not significant |

**No candidates were combined.** `sell-connect` and `develop-horizon` were not
validated, so neither is part of production. Whether either adds anything on
top of `sell-calibrated` is a question for a new pre-registered experiment.

**Production since Assignment 9** is the Assignment 8 AI with
`sell: 'calibrated'`. `DEFAULT_OPTIONS` is
`{ information: 'player', rounds: 'engine', loan: 'a6', overbuild: 'opportunity', develop: 'a8', sell: 'calibrated' }`.

## 7. Limitations and recommendations

- **Late development remains.** With `sell-calibrated`, about 15–19% of
  developed tiles still go with 2 or fewer rounds left, and 1–2% of them are
  built. `develop-horizon` should be re-tested against the new production AI
  under a new plan. Develop is also scored without asking whether the industry
  will be built; that is a larger change.
- **`sell-connect` may add to `sell-calibrated`**, but with the AI now
  building where sales already work, fewer tiles need connecting. A separate
  pre-registered test would settle it.
- **No multi-action planning.** The AI still does not plan a merchant link,
  beer and a tile together. The evidence here does not require it: the
  valuation fix removed almost all unsold tiles. A coordination study should
  be a separate assignment, if one is wanted.
- **The calibration is approximate.** 0.25 and 0.8 come from one measurement
  of the Assignment 8 AI. The sale-ready check ignores beer that a connection
  would bring, and some overbuild comparisons skip the beer check (they pass
  no tile, so only the merchant is checked).
- **Small residual waste.** Unsold VP dropped from 10–13 to 0.3–0.8 per player
  per game; the remainder is mostly tiles built in the era's last turn or
  waiting for beer.
- **The AI is still heuristic and beatable,** and its difficulty levels are
  close together (Normal vs Hard was level, −1.3 ± 2.6 VP).

## 8. Correctness, fairness and reproducibility

- **Legal, valid and complete.** No illegal move or failed game in any
  experiment (over 8,000 games). `test/ai-invest.test.js` plays complete games
  with each variant, checking the move is legal, that choosing does not change
  the state, the state invariants after every move, and reproducibility.
- **Fair.** The new check reads only the public board (merchants,
  connections, breweries). The fairness audit (`scripts/research/ai-audit.js`)
  on the new production AI found no decision that changes with resampled
  opponent hands or a reshuffled deck, and no illegal or state-changing
  decision (results appendix).
- **The Assignment 8 AI is preserved.** `AIPlayer.LEGACY_A8` (`sell: 'a8'`)
  replays the recorded Assignment 8 games exactly
  (`test/fixtures/assignment8-baseline.json`, unchanged). `LEGACY_A5` and
  `LEGACY_A6` also pin `sell: 'a8'` and still replay their fixtures.
- **The new production AI is pinned** by 30 recorded games
  (`test/fixtures/assignment9-baseline.json`).
- **Earlier research still reproduces.** The harness pins every earlier
  research variant (`-fairinfo`, `-rounds`, `+loan`, `~overbuild`) to the
  selling valuation of its time. Re-running the Assignment 8 2-player
  exploration and audit gave identical output.

### Reproducing the experiments

Everything is deterministic with Node.js 22+. Raw results go to the
git-ignored `research-a9/` folder.

Since Assignment 10 the production AI also builds double rail links and stops
developing in the last two rounds. The `^…` policies below are pinned to the
AI of this report, and the probes take `--legacy a9` (`--baseline a9` for the
audit), as shown.

```
# Investigation (about 1 minute per level and player count)
node scripts/research/ai-invest.js --players 3 --seeds 100 --levels easy,normal,hard --sell a8 --legacy a9 > research-a9/invest-a8-3.md   # and 2, 4
node scripts/research/ai-invest.js --players 3 --seeds 100 --levels normal --legacy a9           # the new production AI; and 2, 4

# Exploration
P=normal^develop-horizon:normal^a8,normal^sell-calibrated:normal^a8,normal^sell-connect:normal^a8
node scripts/research/ai-baseline.js matchups --players 2 --seeds 100 --pairs $P --out research-a9/explore-2.json   # 3, 4: --seeds 40
node scripts/research/ai-baseline.js mirror --players 2 --seeds 100 \
    --levels normal^a8,normal^develop-horizon,normal^sell-calibrated,normal^sell-connect --out research-a9/mirror-2.json   # and 3, 4

# Validation (held-out seeds)
V=easy^sell-calibrated:easy^a8,normal^sell-calibrated:normal^a8,hard^sell-calibrated:hard^a8
node scripts/research/ai-baseline.js matchups --players 2 --seeds 150 --base-seed 500000 --pairs $V --out research-a9/validate-2.json   # 3, 4: --seeds 60

# Generalisation (held-out seeds)
G=normal^sell-calibrated:hard^a8,normal^a8:hard^a8,normal^sell-calibrated:easy^a8,normal^a8:easy^a8
node scripts/research/ai-baseline.js matchups --players 2 --seeds 100 --base-seed 500000 --pairs $G --out research-a9/general-2.json   # 3, 4: --seeds 40

# Tables and probes
node scripts/research/ai-criteria.js research-a9/explore-*.json        # and validate-*, general-*
node scripts/research/ai-compare.js research-a9/mirror-*.json \
    --pairs normal^develop-horizon:normal^a8,normal^sell-calibrated:normal^a8,normal^sell-connect:normal^a8
node scripts/research/ai-audit.js --games 10 --baseline a9                      # the new production AI

# Fixtures (re-record only for an intended AI change)
node scripts/research/record-ai-baseline.js --preset a9        # test/fixtures/assignment9-baseline.json
node scripts/research/record-ai-baseline.js --preset a8        # test/fixtures/assignment8-baseline.json
```

The experiments were run while the Assignment 8 AI was still the production
default, so the original commands named it `normal` (and `easy`, `hard`).
Since Assignment 9 that AI is `normal^a8`, as above.

| New file | Purpose |
|---|---|
| `scripts/research/ai-invest.js` | The development and selling investigation |
| `test/ai-invest.test.js` | Variant mechanics, defaults, legality, and the production fixture |
| `test/fixtures/assignment9-baseline.json` | 30 recorded games of the new production AI |
