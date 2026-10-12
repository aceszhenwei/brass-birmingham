# Assignment 8: Overbuilding Decisions and Investment Preservation

**Scope.** This assignment investigates how the AI overbuilds its own
industries. It then tests three targeted scoring candidates against the
production AI of Assignments 6–7, under criteria fixed in advance
([`ai-overbuild-a8-plan.md`](ai-overbuild-a8-plan.md)), and adopts the one
that passed. The full generated tables are in
[`ai-overbuild-a8-results.md`](ai-overbuild-a8-results.md).

**Decision: `opportunity` is adopted.** The AI now charges an overbuild of its
own tile for the future value of the tile it replaces.
- **Validated on 3,060 held-out games**, it gains about **+3.6 to +4.0 VP** per game against the previous AI at every difficulty, with win shares of 54–57%.
- **It also gains against a different opponent,** with no regression at any player count or difficulty.
- **The previous AI is preserved** as `AIPlayer.LEGACY_A6`. All earlier research still reproduces exactly.

**What was wrong.**
- **The score ignored the tile being replaced.** `scoreBuildCandidate` scored an overbuild exactly like a build on an empty space, so the AI never weighed what it destroyed.
- **Overbuilding was common:** 16–24% of all builds replaced the player's own tile, 1.5–3.1 times per player per game.
- **The damage, per player per game:**
  - 4.4–6.6 VP that replaced flipped tiles would still have scored;
  - 0.9–3.6 discarded resource cubes;
  - £18–39 of spending on the replacements.
- **Not all of it was a mistake.** About half the overbuilds upgraded flipped tiles, which keeps their income, and their new tiles flipped more often than average. That is why the decision is a valuation, not a ban.

**What did *not* change:** loans. The AI borrows exactly as before (about 5
per player per game). This refutes Assignment 7's hypothesis that fixing
overbuilding would reduce the need to borrow (§6).

---

## 1. The overbuild heuristic and observed behaviour

### 1.1 The heuristic

`getValidBuildTargets` lists every legal build, including overbuilding one's
own tile with a higher level of the same industry (rulebook p.9). The
targets don't carry the tile being replaced.
`scoreBuildCandidate` (`js/aiPlayer.js`) values the **new** tile only:
- its VP and income, weighted by an estimated flip probability;
- half its link VP, if the player has an adjacent link;
- 0.15 per resource cube;
- a small bonus for adjacent unbuilt links;
- minus its cost.

When the tile is placed, the engine removes the old tile and any cubes on it.
So an overbuild scores exactly like a build on an empty space at the same
place:
- **flipped old tile:** the VP it would still score is lost;
- **unflipped old tile:** its chance to flip and its cubes are lost.

### 1.2 Investigation

`scripts/research/ai-overbuild.js` plays mirror games with a new
behaviour-neutral diagnostic, which lists every build target's score and the
tile it would replace. Every own-tile overbuild is put in one class:

| Class | Meaning |
|---|---|
| canal-level1 | An unflipped Level I tile in the Canal Era, which would be removed at the era's end anyway |
| flipped | A flipped tile |
| cubes | An unflipped Coal Mine or Iron Works with cubes still on it |
| unflipped | Any other unflipped tile |

For each overbuild the script also records:
- the era and rounds left;
- the best build that would *not* replace anything;
- what became of the new tile by the era's end.

These cover 900 games: Easy, Normal and Hard at 2, 3 and 4 players
([results §5.1](ai-overbuild-a8-results.md#51-before-the-ai-of-assignments-67-every-level-and-player-count)).
The 3-player Normal row is shown, with ranges over all levels and player counts.

| Measure | 3-player Normal | All levels and player counts |
|---|---|---|
| Own overbuilds | 654 in 3,523 builds (18.6%), 2.18 per player per game | 16–24% of builds; 1.5–3.1 per player per game |
| Classes: flipped / cubes / unflipped / canal-level1 | 51% / 23% / 18% / 7% | Flipped 41–64% |
| Mostly | Iron Works (flipped), Coal Mines (with cubes), breweries and potteries (unflipped) | Same at every level |
| VP the replaced flipped tiles would still have scored | 1,488 (5.0 per player per game) | 4.4–6.6 per player per game |
| Cubes discarded | 560 (1.9 per player per game) | 0.9–3.6 |
| Spent on own overbuilds | £8,343 (£28 per player per game) | £18–39, out of roughly £200 spent per player per game |
| New tile flipped by the era's end | 35%; flipped class 57%, cubes 14%, unflipped 10%, canal-level1 13% | Builds on empty spaces: 24–38% |
| A build on an empty space was also possible | 91% | 88–93% |
| How much the overbuild outscored the best empty-space build | Mean 1.0, median 0.6 | Mean 1.0–1.1, median 0.4–0.7 |

**A representative case.** Seed 203002, 3 players, Rail round 3, player 0
(`ai-overbuild.js` examples). Coal Mine Level 2 with **3 cubes still on it**
→ Level 3, for £12. Its score was 3.7; the best empty-space build scored 3.6.
Destroying three cubes changed nothing in the score.

### 1.3 Interpretation

The behaviour is **systematic.** It occurs at every level and player count,
in both eras, and mostly with 5 or more rounds left. It has three
ingredients:

1. **Missing opportunity cost (confirmed in code).** The replaced tile's future value is never subtracted. The margins over the best empty-space build are small (median 0.4–0.7 in score units), so even a modest charge would change most of these decisions.
2. **Not all overbuilds are mistakes.** Flipped-tile upgrades keep the old tile's income, and their new tiles flip more often than average (54–65%). Iron Works sell their cubes straight to the market, so they often flip at once. The loss there is the old tile's remaining VP. **Unflipped** overbuilds look clearly harmful: their new tiles rarely flip (5–24%), and they discard cubes or a tile that never paid off.
3. **Why own spaces outscore empty ones (hypothesis).** The build score favours sites already inside the player's network: half the link VP for an adjacent own link, cheaper coal nearby, and the network-expansion bonus. In the Canal Era a player may hold only one tile per town, so with a card for a town where it already has a tile, the only build there is an overbuild.

**Consequence.** This decision is consequential: 12–19% of all spending, and
about 5 VP of scoring tiles per player per game, are destroyed. That is large
compared with the 34–44 VP per player these AIs score.

## 2. Hypotheses and candidates

Each candidate is an `options.overbuild` switch. Only own-tile overbuilds
are affected.

| Id | Hypothesis | Candidate | Change |
|---|---|---|---|
| H1 | The AI loses value because it ignores what it destroys | `opportunity` | Subtract the replaced tile's own future value, using the build score's own terms. Flipped: the VP it would still score. Unflipped: its VP and income times its flip probability, plus its cubes. Cost is sunk and not counted. No new weights |
| H2 | Only *unflipped* overbuilds are harmful; flipped upgrades are productive | `opportunity-unflipped` | The same charge, for unflipped tiles only |
| H3 | A simple rule is enough | `no-unflipped` | Never overbuild one's own unflipped tile |

## 3. Method and pre-registered criteria

The method is that of Assignments 5–7:
- the deterministic harness, where every game is reproducible from its seed;
- every arrangement of the two policies over the seats played on every seed;
- 95% intervals (± 1.96 standard errors); "pooled" weights 2, 3 and 4 players equally (`ai-criteria.js`).

**Phases**, as in [`ai-overbuild-a8-plan.md`](ai-overbuild-a8-plan.md),
which was written before any candidate was run:

1. **Exploration** (seeds `200000 + …`), at Normal against the previous production AI:
   - matchups: 2 players 100 seeds, 3 and 4 players 40 seeds;
   - mirror games: 100 seeds per player count.

   Only the best non-negative pooled candidate goes forward.
2. **Validation** on held-out seeds `400000 + …`, never used before, at every difficulty: 2 players 150 seeds, 3 and 4 players 60 seeds.

**Adoption requires all of:**
1. a Normal pooled VP-difference interval entirely above 0, and a win share above 50%;
2. no player count or difficulty with an interval entirely below 0;
3. no pooled regression at Easy or Hard;
4. legal, reliable play, with the fairness and determinism tests passing;
5. no significant rise in VP lost to shortfalls.

Fewer overbuilds was explicitly **not** a criterion.

**Generalisation check** (beyond the plan): on the held-out seeds, Normal
with and without the candidate each played the previous Hard and Easy.

**Games played** (no failures, no illegal moves):

| Experiment | Games |
|---|---|
| Exploration matchups | 2,040 |
| Exploration mirror games | 1,200 |
| Validation | 3,060 |
| Generalisation | 2,720 |
| Probes | about 1,800 |

## 4. Results

### 4.1 Exploration: Normal against the previous production AI

Each cell gives the candidate's win share (95% interval), then the VP difference.

| Candidate | 2 players | 3 players | 4 players | Pooled |
|---|---|---|---|---|
| `opportunity` | 53.3%, +3.6 ± 5.8 | 55.0%, +3.8 ± 3.8 | 55.0%, **+4.1 ± 3.2** | 54.4% ± 3.8, **+3.84 ± 2.55** |
| `opportunity-unflipped` | 52.0%, +0.2 ± 5.2 | 51.3%, +2.7 ± 4.0 | 50.4%, +1.7 ± 2.9 | 51.2% ± 3.8, +1.54 ± 2.39 |
| `no-unflipped` | 54.0%, +1.6 ± 5.1 | 52.1%, +1.6 ± 4.0 | 47.9%, +1.4 ± 2.9 | 51.3% ± 3.8, +1.51 ± 2.38 |

Under the plan, `opportunity` went forward.

### 4.2 Validation: held-out seeds, every difficulty

Each cell gives the win share, then the VP difference against the same level's previous AI.

| Level | 2 players | 3 players | 4 players | Pooled |
|---|---|---|---|---|
| Easy | 55.7%, **+5.5 ± 4.2** | 55.8%, **+4.0 ± 3.2** | 58.1%, +2.4 ± 2.5 | 56.5% ± 3.1, **+3.96 ± 1.95** |
| Normal | 56.7%, **+6.4 ± 4.5** | 52.2%, +2.4 ± 3.5 | 54.7%, +1.9 ± 2.5 | 54.5% ± 3.1, **+3.56 ± 2.07** |
| Hard | 57.5%, **+4.8 ± 4.5** | 54.2%, +2.6 ± 3.4 | 53.1%, **+3.4 ± 2.5** | 54.9% ± 3.1, **+3.58 ± 2.05** |

**Criteria:**

| Criterion | Result |
|---|---|
| 1 | **Passes:** Normal pooled +3.56, interval [+1.5, +5.6], win share 54.5% |
| 2 | **Passes:** no interval below 0; every point estimate is positive |
| 3 | **Passes:** Easy and Hard improve too |
| 4 | **Passes:** 0 failures; 178 / 178 tests pass with the candidate as production |
| 5 | **Passes:** VP lost to shortfalls +0.45 / +0.13 / +0.17, none significant (§4.4) |

### 4.3 Generalisation: against a different opponent (held-out seeds)

Pooled VP difference for Normal, without and with the candidate, against each opponent:

| Opponent | Previous Normal | Normal with `opportunity` | Change |
|---|---|---|---|
| Previous Hard | −0.80 ± 2.40 (win share 50.3%) | **+2.78 ± 2.56** (53.5%) | about +3.6 |
| Previous Easy | +4.03 ± 2.38 (53.9%) | **+6.92 ± 2.42** (57.2%) | about +2.9 |

The gain is of the same size against other opponents as head-to-head, so it
is not specific to playing a copy of itself.

### 4.4 Behaviour changes (paired mirror games, Normal)

Per player per game, at 2 / 3 / 4 players. Bold marks an interval that excludes 0.
([Results §4](ai-overbuild-a8-results.md#4-paired-mirror-comparisons-exploration-seeds-100-per-player-count).)

| Measure | `opportunity` | `opportunity-unflipped` | `no-unflipped` |
|---|---|---|---|
| Final VP (mirror) | **+5.0 / +4.9 / +3.5** | **+4.1** / +1.0 / **+1.5** | +2.9 / **+2.2 / +2.3** |
| Link VP | **+2.3 / +2.5 / +2.1** | **+1.3** / +0.2 / +0.4 | **+1.1** / +0.6 / **+0.7** |
| Tile VP | **+3.1 / +2.5** / +1.4 | **+2.0** / +0.7 / +0.8 | +1.6 / **+1.4 / +1.2** |
| Own unflipped overbuilds | **−1.42 / −0.98 / −0.73** (to about 0.1) | **−1.43 / −1.00 / −0.75** | **−1.53 / −1.06 / −0.80** (to 0) |
| Builds | **−0.7 / −0.3 / −0.7** | −0.2 / −0.2 / **−0.3** | −0.4 / −0.1 / **−0.3** |
| Network actions | **+0.3 / +0.5 / +0.4** | **+0.2** / +0.1 / +0.1 | **+0.2** / +0.1 / **+0.2** |
| Income level | −0.3 / +0.4 / +0.2 | **+1.2 / +1.3 / +0.9** | **+1.1 / +1.2 / +0.9** |
| Loans | 0.0 / 0.0 / +0.1 | −0.1 / **−0.2 / −0.1** | **−0.2** / −0.1 / **−0.1** |
| VP lost to shortfalls | +0.5 / +0.1 / +0.2 | **−0.6** / −0.2 / −0.1 | −0.1 / −0.2 / −0.3 |

**With `opportunity`**
([results §5.2](ai-overbuild-a8-results.md#52-after-opportunity-normal)):
- **Overbuilds almost disappear:** 0.10–0.20 per player per game, 0.9–1.7% of builds, down from 17–23%. The few left are mostly late flipped Iron Works and unflipped Rail-Era potteries.
- **Its other builds flip more often:** 38–44% of builds on empty spaces flip by the era's end, against 27–34% before.

## 5. Interpretation and decision

| Candidate | Decision | Reason |
|---|---|---|
| `opportunity` | **Adopted** | It passed every pre-registered criterion on held-out seeds at all three difficulties, and generalises to other opponents. The gain (+3.6 to +4.0 VP) comes from scoring, not from a single metric: more link VP and tile VP, and fewer, better builds. The money that used to replace tiles goes into new tiles and links |
| `opportunity-unflipped` | Rejected (exploration) | Keeping flipped upgrades raises income by about 1 level, but gains less VP (+1.5 pooled, not significant). The VP that flipped tiles would still have scored is worth more to this AI than the income their upgrades add, so the flipped part of H2 is refuted |
| `no-unflipped` | Rejected (exploration) | It behaves like `opportunity-unflipped` (+1.5). A rule removes the harmful cases but also the occasional good one, and ignores flipped tiles |

The adoption follows the plan's selection rule. The unsuccessful candidates
were not combined with anything. `opportunity` was also the most principled
candidate: it adds no weights, and values the old tile with the same terms
the AI already uses for a new one.

**Confirmed findings:**
- the overbuild frequencies, classes and losses in §1.2;
- the missing opportunity cost (§1.1);
- the strength gain of `opportunity` (§4.2, §4.3);
- the behaviour changes marked significant in §4.4;
- that loans did not change (§6).

**Hypotheses:**
- that the build score's network-adjacency terms draw the AI to its own spaces (§1.3, item 3);
- that flipped-tile VP outweighs the upgrade income for this AI *generally*. This was observed here, through the comparison of `opportunity` with `opportunity-unflipped`, and may depend on the AI's other weaknesses.

## 6. Implementation and preservation

- **Production.** `DEFAULT_OPTIONS.overbuild = 'opportunity'` in `js/aiPlayer.js`. `replacedTileValue()` values the replaced tile with the build score's own terms. This is about 25 lines.
- **Previous AI.** `AIPlayer.LEGACY_A6 = { overbuild: 'a6' }` is the AI of Assignments 6–7. `test/fixtures/assignment6-baseline.json` still replays exactly through it.
- **Assignment 5 baseline.** `AIPlayer.LEGACY_A5` now also pins `overbuild: 'a6'`, so it still replays the 300 recorded Assignment 1 games bit for bit.
- **Research names.**
  - `<level>~a6` is the previous AI.
  - The Assignment 6 variants (`-fairinfo`, `-rounds`) and Assignment 7's `+` variants are pinned to the old overbuild scoring.
  - Sampled checks reproduce the earlier tables exactly: Assignment 5 mirror games 90/90, Assignment 6 matchups 60/60, Assignment 7 exploration 60/60.
  - The reproduction commands in the [Assignment 6](ai-corrections-a6.md#reproducing-the-experiments) and [Assignment 7](ai-loans-a7.md#reproducing-the-experiments) reports now use these names.
- **New production fixture.** `test/fixtures/assignment8-baseline.json`: 30 games of the new production AI, replayed by `test/ai-overbuild.test.js`.
- **Rejected candidates** (`opportunity-unflipped`, `no-unflipped`) stay as documented research switches; the game never sets them.

**Loans after the change** (Normal, 2 / 3 / 4 players, 100 games each).
Borrowing is unchanged: 6.09 / 5.45 / 4.86 loans per player per game, against
6.08 / 5.46 / 4.80 before. Still 94–96% are taken with nothing affordable,
and 26–34% are followed by a shortfall. Assignment 7 expected better spending
to reduce borrowing. Instead, the money no longer spent on replacements goes
into other builds and links, and the AI is just as broke when it borrows.
**The cash shortage is not caused by overbuilding.**

## 7. Correctness, fairness and reliability

| Check | Result |
|---|---|
| Legality and fairness of the new production AI (`ai-audit.js`, 270 games, 9,210 decisions) | 0 illegal moves; 0 state changes; 0 decisions depending on opponents' hands or the deck order |
| Test suite | 178 / 178 pass. New: `test/ai-overbuild.test.js`. It checks that the variants re-score only own-tile overbuilds, in the intended direction; that production is `opportunity` and `LEGACY_A6` is `a6`; that the diagnostics don't change decisions; that every variant plays legal, pure and reproducible games; and that the production fixture replays exactly |
| `simulate.js` | Passes (clone and restore continuations; the Assignment 1 comparison through the legacy baseline) |
| Browser | A full Easy / Normal / Hard game in `index.html` ran with no errors and no AI failures |
| Overbuild rules | Unchanged: candidates only re-score legal targets from `getValidBuildTargets` |
| Engine, rules, UI | Unchanged |

## 8. Limitations and next steps

**Limitations.**
- **Resolution.** Pooled differences of about ±2 VP can be resolved; single player counts only about ±2.5–4.5 VP. The 3- and 4-player Normal results are positive but individually not significant.
- **Correlated games.** Games sharing a seed are correlated, so the intervals are somewhat optimistic.
- **Opponents.** All comparisons are against this family of heuristic AIs, with no human games.
- **The valuation reuses the AI's own estimates.** Its flip probabilities and its 0.12-per-£ rate are crude. A better estimate of the old tile's value might do better still.
- **Mechanisms are partly inferred.** Why own spaces outscore empty ones, and why flipped-tile VP outweighs upgrade income, are inferences (§5).

**Recommended next steps** (not started):
1. **Over-development (W2 in Assignment 5).** Develop actions spend 13–23% of the AI's money, and about half the developed industries are never built. This is now the largest measured waste.
2. **The selling pipeline (W3).** Selling remains rare, at about 5% of turns.
3. **Discard choice (W4).** It is cheap and independent.
4. **Re-establish the difficulty levels** after these fixes, as Assignment 6 recommended.

For each, use the same pre-registered, held-out procedure.

## Reproducing the experiments

Everything is deterministic with Node.js 22+. Raw results go to the
git-ignored `research-a8/` folder.

Since Assignment 9 the production AI sells differently. The `<level>~…`
policies below are pinned to the selling of their time, so they reproduce
unchanged. Commands that ran the production AI of Assignment 8 now need
`--sell a8 --legacy a9` (or `--baseline a8`), as shown (`--legacy a9` since
Assignment 10 changed networking and late development).

```
# Investigation (about 20 s per level and player count)
node scripts/research/ai-overbuild.js --players 3 --seeds 100 --levels easy,normal,hard --overbuild a6 --sell a8 --legacy a9   # and 2, 4
node scripts/research/ai-overbuild.js --players 3 --seeds 100 --levels normal --overbuild opportunity --sell a8 --legacy a9   # and 2, 4

# Exploration
P=normal~opportunity:normal~a6,normal~opportunity-unflipped:normal~a6,normal~no-unflipped:normal~a6
node scripts/research/ai-baseline.js matchups --players 2 --seeds 100 --pairs $P --out research-a8/explore-2.json
node scripts/research/ai-baseline.js matchups --players 3 --seeds 40 --pairs $P --out research-a8/explore-3.json
node scripts/research/ai-baseline.js matchups --players 4 --seeds 40 --pairs $P --out research-a8/explore-4.json
node scripts/research/ai-baseline.js mirror --players 2 --seeds 100 \
    --levels normal~a6,normal~opportunity,normal~opportunity-unflipped,normal~no-unflipped --out research-a8/mirror-2.json   # and 3, 4

# Validation (held-out seeds)
V=easy~opportunity:easy~a6,normal~opportunity:normal~a6,hard~opportunity:hard~a6
node scripts/research/ai-baseline.js matchups --players 2 --seeds 150 --base-seed 400000 --pairs $V --out research-a8/validate-2.json
node scripts/research/ai-baseline.js matchups --players 3 --seeds 60 --base-seed 400000 --pairs $V --out research-a8/validate-3.json
node scripts/research/ai-baseline.js matchups --players 4 --seeds 60 --base-seed 400000 --pairs $V --out research-a8/validate-4.json

# Generalisation (held-out seeds)
G=normal~opportunity:hard~a6,normal~a6:hard~a6,normal~opportunity:easy~a6,normal~a6:easy~a6
node scripts/research/ai-baseline.js matchups --players 2 --seeds 100 --base-seed 400000 --pairs $G --out research-a8/general-2.json   # 3, 4: --seeds 40

# Tables and probes
node scripts/research/ai-criteria.js research-a8/explore-*.json        # and validate-*, general-*
node scripts/research/ai-compare.js research-a8/mirror-*.json \
    --pairs normal~opportunity:normal~a6,normal~opportunity-unflipped:normal~a6,normal~no-unflipped:normal~a6
node scripts/research/ai-loans.js --players 3 --seeds 100 --levels normal --sell a8 --legacy a9   # loans after the change; and 2, 4
node scripts/research/ai-audit.js --games 10 --baseline a8                      # the Assignment 8 production AI

# Fixtures (re-record only for an intended AI change)
node scripts/research/record-ai-baseline.js --preset a8        # test/fixtures/assignment8-baseline.json
node scripts/research/record-ai-baseline.js --preset a6        # test/fixtures/assignment6-baseline.json
```

| New file | Purpose |
|---|---|
| `scripts/research/ai-overbuild.js` | The overbuild investigation: classes, losses, alternatives, outcomes |
| `scripts/research/record-ai-baseline.js` | Records a fixture for the production AI or `LEGACY_A6` (it replaces `record-a6-baseline.js`) |
| `test/ai-overbuild.test.js` | Variant mechanics, defaults, diagnostics, legality, and the production fixture |
| `test/fixtures/assignment8-baseline.json` | 30 recorded games of the new production AI |
