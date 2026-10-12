# Assignment 10: Closing the Original AI Audit

**Scope.** Assignments 6–9 resolved the fairness defect, the rounds estimate,
overbuilding and selling. This assignment takes the findings of the
[Assignment 5 audit](ai-baseline-audit.md) that were still open:
- double rail links (W5);
- two-tile development;
- discards (W4);
- the choices left to the engine: coal, iron and beer sources, the merchant, Gloucester's free develop, and shortfall tiles;
- the remaining over-development (W2).

It measures each on the current AI, tests targeted candidates under criteria
fixed in advance ([`ai-audit-a10-plan.md`](ai-audit-a10-plan.md)), and adopts
what the evidence supports. Every original finding now has a status in the
[audit checklist](ai-audit-checklist.md). The full generated tables are in
[`ai-audit-a10-results.md`](ai-audit-a10-results.md).

**Decision: two changes are adopted together.**
- **Double rail links:** in the Rail Era the AI also considers building two rail links in one action.
- **Develop horizon:** no Develop with 2 or fewer rounds left in the game.

Validated on 3,060 held-out games against the Assignment 9 AI:

| Level | Pooled VP gain | Win share |
|---|---|---|
| Easy | **+5.2 ± 1.9** | 59.7% |
| Normal | **+7.5 ± 2.1** | 64.2% |
| Hard | **+8.1 ± 1.9** | 65.9% |

- Every player count at every difficulty improves.
- The gain also holds against other opponents: Normal with the changes beats production Hard by +7.8 VP and Easy by +9.4. Without them, Normal is level with Hard (+0.7 ± 2.3).
- Decisions take about 1.5 times as long: 2.8–3.2 ms against 1.9–2.1 ms.
- The Assignment 9 AI is kept as `AIPlayer.LEGACY_A9`, and all earlier research still reproduces.

**Investigated, not changed:** discards, resource sourcing, shortfall tile
choice, two-tile development, merchant choice and Gloucester's develop. Each was
neutral, or not a real weakness. **Deferred:** the separation of the difficulty
levels (W6) and search (H5).

## 1. What was open, and how much it mattered

`scripts/research/ai-close.js` measured each open finding on the Assignment 9
AI (`--legacy a9`), in 450 mirror games: 50 at each difficulty and player count.

| Finding | Measured on the Assignment 9 AI | Likely impact |
|---|---|---|
| **Double rail links never built** (W5) | A two-link Network was legal and affordable at 52–60% of Rail-Era decisions where Network was legal; the AI built none | High: links are a main VP source, and one action could place two |
| **Late development** (W2) | 9–19% of developed tiles went with 2 or fewer rounds left; 1–7% of those were ever built (Assignment 9) | Medium: an action and iron wasted each time |
| **Discards** (W4) | 16–25% of discarding actions threw away a card usable for a build now while holding one that was not (3.9–5.6 per player per game) | Unknown: the proxy may not measure real harm |
| **Shortfall tile choice** | 0.7–2.4 tiles sold per player per game. A flipped tile was sold in 7–16% of cases (0.4–2.1 VP per player per game) | Low |
| **Resource sources** | Coal from an opponent's equally close mine when the AI's own was available: 0.16–0.29 times per player per game. Iron and beer choices are rarer | Low |
| **Two-tile development** | 86–91% of Develop actions already remove two tiles. A same-industry pair was legal for a single-tile Develop in 3 of 1,096 cases | None: not a weakness |
| **Merchant choice** | 1.4–2.0 choices per player per game. The engine's default takes the merchant with the best bonus | None |
| **Gloucester's free develop** | 0.4–0.8 per player per game. The default takes Canal-only tiles first, close to the AI's own ranking | Very low |

## 2. Candidates and why

| Candidate | Change | Reason |
|---|---|---|
| `double` | In the Rail Era, score two-link Networks: the best first link (of the top 3), plus the best second link with the first in place, less the extra £5 and 1 VP for the barrel of beer. The engine's planner checks the pair before it is proposed | The audit's largest unused option |
| `develop-horizon` | No Develop with 2 or fewer rounds left in the game | Not significant against the Assignment 8 AI in Assignment 9 (+1.8 ± 2.7), which recommended re-testing it on the new AI |
| `useful-cards` | Discard the least useful card (`cardUsefulness`, +1 if it could build now) for Network, Develop, Sell, Loan and Pass | The audit's suggestion for W4 |
| `buildable-cards` | Discard the first card that cannot build now; keep cards that can | A narrower W4 fix, added (and declared in the plan) after `useful-cards` failed |
| `own-sources` | Where coal, iron or beer may come from several sources, take the player's own first | Audit hypothesis H4 |
| `value-shortfall` | Sell the tile whose loss costs least: a flipped tile's VP, or an unflipped tile's flip probability × its value | The audit noted the fixed shortfall policy |

Each is one option in `js/aiPlayer.js`, and the defaults reproduced the
Assignment 9 AI exactly. `test/ai-close.test.js` checks each one:
- legal moves, a pure choice (the state is unchanged), invariants after every move, and reproducibility;
- the variant's own property: double links only in the Rail Era; no buildable card discarded while a dead one is kept; own sources taken where available; shortfall tiles always the player's own.

**A bug found and fixed during exploration.** `value-shortfall` first crashed
in 12 exploration and mirror games: farm breweries are keyed by farm name, not `farm_<name>`.
It was fixed, a regression test replays the game that crashed, and its
exploration was re-run. Only the re-run is reported.

## 3. Method

The plan is in [`ai-audit-a10-plan.md`](ai-audit-a10-plan.md). It is the
method of Assignments 7–9:
- **Exploration:** exploration seeds; seat-balanced matchups against production Normal (2 players: 100 seeds; 3 and 4 players: 40 each), and 100 paired mirror games per player count.
- **Combination:** candidates whose pooled VP interval was above 0 were combined. Candidates that failed were not.
- **Validation:** held-out seeds `600000 + 1000 × players + i`, at every difficulty (2 players: 150 seeds; 3 and 4 players: 60 each).
- **Generalisation:** Normal with and without the change, each against production Hard and Easy.

**Adoption criteria:**
- Normal improves (pooled interval above 0, win share above 50%).
- No player count or difficulty regresses.
- Legal, fair and reproducible.
- Decision time at most 3 times production's.

## 4. Results

### Exploration (pooled VP difference against production Normal)

| Candidate | 2p | 3p | 4p | Pooled | Win share |
|---|---|---|---|---|---|
| **`double`** | +3.40 ± 4.60 | +4.10 ± 3.90 | +4.29 ± 2.55 | **+3.93 ± 2.18** | 55.9% |
| **`develop-horizon`** | +3.15 ± 4.65 | +3.37 ± 4.20 | +4.52 ± 2.65 | **+3.68 ± 2.27** | 56.7% |
| `useful-cards` | −2.37 ± 4.76 | −3.32 ± 3.76 | +0.21 ± 2.54 | −1.82 ± 2.19 | 49.0% |
| `buildable-cards` | +0.43 ± 4.64 | +0.61 ± 3.83 | +0.23 ± 2.66 | +0.43 ± 2.19 | 50.2% |
| `own-sources` | +0.28 ± 4.61 | −0.07 ± 4.07 | +0.10 ± 2.55 | +0.10 ± 2.22 | 50.5% |
| `value-shortfall` | −1.14 ± 4.64 | −2.05 ± 4.08 | +0.32 ± 2.57 | −0.95 ± 2.23 | 48.9% |
| **`combined`** (`double` + `develop-horizon`) | +7.04 ± 4.72 | +7.27 ± 3.99 | +8.33 ± 2.61 | **+7.55 ± 2.24** | 62.0% |

The two effects add up almost exactly (+3.9 and +3.7, against +7.6 combined),
so they are independent improvements.

### Behaviour (paired mirror games at Normal, per player per game)

Differences in **bold** are significant.

| Measure | `double` 3p | `develop-horizon` 3p | `combined` 2p | `combined` 3p | `combined` 4p |
|---|---|---|---|---|---|
| Final VP | **+6.43** | **+4.14** | **+10.66** | **+11.14** | **+10.60** |
| Income level | **+1.44** | | **+2.71** | **+2.43** | **+2.51** |
| Links built | **+0.35** | **+0.83** | **+1.30** | **+1.25** | **+1.05** |
| Network actions | **−0.23** | **+0.83** | **+0.56** | **+0.66** | **+0.49** |
| Develop actions | **+0.32** | **−1.38** | **−1.17** | **−1.19** | **−1.19** |
| Builds | +0.10 | | **+0.48** | **+0.46** | **+0.42** |
| Tiles sold | **+0.15** | | **+0.21** | **+0.26** | **+0.35** |
| Loans | +0.06 | | +0.02 | −0.00 | −0.04 |
| Shortfall sales | | | −0.29 | **−0.35** | **−0.18** |
| Money left at the end | | | +2.40 | **+5.84** | **+4.84** |

- **`double`** puts more links on the board in fewer Network actions. That frees actions for building and developing, and the extra link income raises the income level by about 1.5. The AI built a double in about 15% of its Rail-Era Networks (74–111 per 50 games).
- **`develop-horizon`** replaces late Develop actions with links: −1.3 Develop and +0.8 Network actions per game.
- **Development now pays off more often.** With the new production AI (`ai-invest.js`, Normal, 50 games per player count), 67–68% of developed industries are built later, against 53–55% for the Assignment 9 AI. Iron spent on developing falls to £38–41 per player per game, from £53–56.
- **The other candidates** made no significant difference in matchups. In mirror games, `own-sources` lost 0.8 VP at 2 players (significant) and was level at 3 and 4. Its other effects were too small to matter.

### Validation (held-out seeds, `combined` against production at each level)

| Level | 2 players | 3 players | 4 players | Pooled VP | Win share |
|---|---|---|---|---|---|
| Easy | +4.85 ± 4.10 | +4.94 ± 3.27 | +5.73 ± 2.24 | **+5.17 ± 1.90** | 59.7% |
| Normal | +7.94 ± 4.82 | +7.37 ± 3.22 | +7.20 ± 2.20 | **+7.50 ± 2.07** | 64.2% |
| Hard | +5.87 ± 4.14 | +8.80 ± 3.13 | +9.58 ± 2.35 | **+8.08 ± 1.90** | 65.9% |

3,060 games, none failed. Every interval is above 0.

### Generalisation (held-out seeds)

| Pair | Pooled VP | Win share |
|---|---|---|
| Normal + `combined` vs Hard | **+7.83 ± 2.33** | 66.9% |
| Normal vs Hard | +0.72 ± 2.31 | 53.4% |
| Normal + `combined` vs Easy | **+9.43 ± 2.48** | 66.4% |
| Normal vs Easy | **+2.83 ± 2.32** | 56.6% |

### Correctness, fairness and cost

- **Legal and complete.** Over 14,000 games ran with no illegal move, and no failed game once the `value-shortfall` bug was fixed.
- **Fairness audit** (`ai-audit.js --games 10`) of the new production AI: 0 illegal moves, 0 state changes, and 0 decisions that change with resampled opponent hands or a reshuffled deck. The double-link search uses only the observation.
- **Decision time:** production 2.8–3.2 ms per decision, against 1.9–2.1 ms for the Assignment 9 AI (4 players, measured one level at a time).

## 5. Decisions

| Candidate | Decision | Why |
|---|---|---|
| `double` | **Adopted** (in `combined`) | +3.9 VP alone; part of the validated combination |
| `develop-horizon` | **Adopted** (in `combined`) | +3.7 VP alone; part of the validated combination |
| `useful-cards` | Rejected | −1.8 ± 2.2 VP. `cardUsefulness` rates industry cards (1.5) below location cards (2), so it throws away the more flexible industry cards |
| `buildable-cards` | Rejected | +0.4 ± 2.2 VP: removes every "wasteful" discard the audit counted, with no measurable effect. "Usable for a build now" is a weak proxy: a card that cannot build now often can later, after the network grows |
| `own-sources` | Rejected | +0.1 ± 2.2 VP. Using an opponent's coal or iron spends their cubes and keeps the AI's own for opponents to buy, which also flips the AI's tile. Neither choice is clearly better |
| `value-shortfall` | Rejected | −1.0 ± 2.2 VP. The default already sells unflipped tiles first, and the cases where the rules differ are rare |

**What production does now** (`DEFAULT_OPTIONS`):
`network: 'double'` and `develop: 'horizon'`. The rejected options stay
available for research, with the defaults `cards: 'first'`,
`sourcing: 'engine'` and `shortfall: 'a9'`.

## 6. Remaining limitations

- **The difficulty levels are still close.** Normal and Hard are level (+0.7 ± 2.3); Easy is 2.8 VP behind Normal. Hard's only difference is its "denial" bonus. This audit finding (W6) needs a decision on what each level should be, so it is deferred.
- **The AI still plans one action at a time.** It does not plan a merchant link, beer and a sellable tile together, or save cards for later builds. Those need multi-action planning or search (H5), which this assignment excludes.
- **Develop is still scored without asking whether the industry will be built.** The horizon removes the clearest waste; about a third of developed industries are still never built. The rest needs a better valuation, not a rule.
- **Discards are judged by a weak proxy.** Neither card rule helped. A better card value would need to estimate the network's future reach.
- **Cumulative progress.** In seat-balanced games the current AI beats the audited Assignment 5 AI (`<level>-a5`) by +19.2 ± 3.8 VP at Normal and +19.6 ± 3.4 at Hard (win shares 72% and 78%; 2 players: 50 seeds, 3 and 4 players: 20 each).
- **Loans** are unchanged (about 4.5–5.9 per player per game). Assignment 7 showed they are a symptom of low cash. Both adopted changes raised income and money left, but did not reduce borrowing. That refutes audit hypothesis H3 (over-development causes the cash shortage).

## 7. Reproducing the experiments

Everything is deterministic with Node.js 22+. Raw results go to the
git-ignored `research-a10/` folder.

The experiments ran while the Assignment 9 AI was production, so the original
commands named it `normal`. It is now `normal%a9` (`AIPlayer.LEGACY_A9`), as
below. `%combined` is the new production AI.

```
# Measurement of the open findings (about 2 min per player count)
node scripts/research/ai-close.js --players 3 --seeds 50 --levels easy,normal,hard --legacy a9   # and 2, 4
node scripts/research/ai-close.js --players 3 --seeds 50 --levels normal                         # the new production AI
node scripts/research/ai-invest.js --players 3 --seeds 50 --levels normal --examples 0           # development payoff; and 2, 4

# Exploration
P=normal%double:normal%a9,normal%useful-cards:normal%a9,normal%own-sources:normal%a9,normal%value-shortfall:normal%a9,normal%develop-horizon:normal%a9
node scripts/research/ai-baseline.js matchups --players 2 --seeds 100 --pairs $P --out research-a10/explore-2.json   # 3, 4: --seeds 40
# and the same for normal%buildable-cards:normal%a9 and normal%combined:normal%a9
node scripts/research/ai-baseline.js mirror --players 2 --seeds 100 \
    --levels normal%a9,normal%double,normal%useful-cards,normal%own-sources,normal%value-shortfall,normal%develop-horizon,normal%buildable-cards,normal%combined \
    --out research-a10/mirror-2.json   # and 3, 4

# Validation and generalisation (held-out seeds)
V=easy%combined:easy%a9,normal%combined:normal%a9,hard%combined:hard%a9
node scripts/research/ai-baseline.js matchups --players 2 --seeds 150 --base-seed 600000 --pairs $V --out research-a10/validate-2.json   # 3, 4: --seeds 60
G=normal%combined:hard%a9,normal%a9:hard%a9,normal%combined:easy%a9,normal%a9:easy%a9
node scripts/research/ai-baseline.js matchups --players 2 --seeds 100 --base-seed 600000 --pairs $G --out research-a10/general-2.json   # 3, 4: --seeds 40

# The current AI against the Assignment 5 AI
node scripts/research/ai-baseline.js matchups --players 2 --seeds 50 --pairs normal:normal-a5,hard:hard-a5 --out research-a10/vs-a5-2.json   # 3, 4: --seeds 20

# Tables, audit and fixtures
node scripts/research/ai-criteria.js research-a10/explore-*.json      # and validate-*, general-*
node scripts/research/ai-compare.js research-a10/mirror-*.json --pairs normal%combined:normal%a9,normal%double:normal%a9   # …
node scripts/research/ai-audit.js --games 10                                # the new production AI
node scripts/research/record-ai-baseline.js --preset current   # test/fixtures/assignment10-baseline.json
node scripts/research/record-ai-baseline.js --preset a9        # test/fixtures/assignment9-baseline.json
```

**Preservation.**
- All earlier fixtures (Assignments 1, 6, 8 and 9) re-record identically through their presets.
- The Assignment 9 2-player exploration and Normal investment probe reproduce exactly, through the pinned `^` policies and `--legacy a9`.
- The earlier reports' reproduction commands were updated to name the AI of their time.

| New file | Purpose |
|---|---|
| `scripts/research/ai-close.js` | Measures the open audit findings and decision time |
| `test/ai-close.test.js` | Variant mechanics, defaults, legality and purity, the farm-brewery regression, and the production fixture |
| `test/fixtures/assignment10-baseline.json` | 30 recorded games of the new production AI |
| [`ai-audit-checklist.md`](ai-audit-checklist.md) | The status of every Assignment 5 finding |
