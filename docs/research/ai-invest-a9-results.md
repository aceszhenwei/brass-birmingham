# Investment Research: Results (Assignment 9)

Generated output of the research scripts, used by [the Assignment 9 report](ai-invest-a9.md). The report's [Reproducing the experiments](ai-invest-a9.md#reproducing-the-experiments) section regenerates every number; the raw per-game data is not committed.

Policy names: the experiments ran while the Assignment 8 AI was production, so in these tables `normal`, `easy` and `hard` are **the Assignment 8 AI** (now `<level>^a8`, `AIPlayer.LEGACY_A8`). `^sell-calibrated` was adopted and is now the production AI. `^develop-horizon` and `^sell-connect` are the other candidates ([plan](ai-invest-a9-plan.md)). Columns in §1–3: the candidate's win share and VP difference (candidate − baseline) ± 1.96 SE; pooled = 2, 3 and 4 players weighted equally (`ai-criteria.js`).

# 1. Exploration matchups (seeds 200000 + 1000 × players + i)

Seat-balanced, against `normal`; 2 players: 100 seeds, 3 and 4 players: 40 seeds.

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| normal^develop-horizon vs normal | 2 | 200 | 51.5% ± 6.9 | +1.30 ± 6.08 | includes 0 |
| normal^develop-horizon vs normal | 3 | 240 | 52.9% ± 6.3 | +1.41 ± 4.16 | includes 0 |
| normal^develop-horizon vs normal | 4 | 240 | 55.0% ± 6.3 | +2.71 ± 3.33 | includes 0 |
| normal^develop-horizon vs normal | **pooled** | 680 | 53.1% ± 3.8 | +1.81 ± 2.69 | no improvement |
| normal^sell-calibrated vs normal | 2 | 200 | 63.3% ± 6.7 | +12.66 ± 5.22 | above 0 |
| normal^sell-calibrated vs normal | 3 | 240 | 60.0% ± 6.2 | +11.58 ± 4.03 | above 0 |
| normal^sell-calibrated vs normal | 4 | 240 | 63.8% ± 6.1 | +9.56 ± 2.79 | above 0 |
| normal^sell-calibrated vs normal | **pooled** | 680 | 62.3% ± 3.7 | +11.27 ± 2.39 | **improves** |
| normal^sell-connect vs normal | 2 | 200 | 55.0% ± 6.9 | +6.68 ± 6.07 | above 0 |
| normal^sell-connect vs normal | 3 | 240 | 57.1% ± 6.3 | +3.52 ± 4.11 | includes 0 |
| normal^sell-connect vs normal | 4 | 240 | 61.3% ± 6.2 | +7.23 ± 3.26 | above 0 |
| normal^sell-connect vs normal | **pooled** | 680 | 57.8% ± 3.7 | +5.81 ± 2.67 | **improves** |

# 2. Validation matchups (held-out seeds 500000 + 1000 × players + i)

`sell-calibrated` against the Assignment 8 AI at every difficulty; 2 players: 150 seeds, 3 and 4 players: 60 seeds.

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| easy^sell-calibrated vs easy | 2 | 300 | 58.8% ± 5.6 | +8.03 ± 4.37 | above 0 |
| easy^sell-calibrated vs easy | 3 | 360 | 62.5% ± 5.0 | +9.18 ± 2.94 | above 0 |
| easy^sell-calibrated vs easy | 4 | 360 | 66.9% ± 4.9 | +10.79 ± 2.40 | above 0 |
| easy^sell-calibrated vs easy | **pooled** | 1020 | 62.8% ± 3.0 | +9.33 ± 1.93 | **improves** |
| normal^sell-calibrated vs normal | 2 | 300 | 63.3% ± 5.5 | +11.49 ± 4.69 | above 0 |
| normal^sell-calibrated vs normal | 3 | 360 | 58.5% ± 5.1 | +8.90 ± 3.36 | above 0 |
| normal^sell-calibrated vs normal | 4 | 360 | 61.1% ± 5.0 | +8.15 ± 2.21 | above 0 |
| normal^sell-calibrated vs normal | **pooled** | 1020 | 61.0% ± 3.0 | +9.51 ± 2.06 | **improves** |
| hard^sell-calibrated vs hard | 2 | 300 | 65.7% ± 5.4 | +13.53 ± 4.41 | above 0 |
| hard^sell-calibrated vs hard | 3 | 360 | 63.1% ± 5.0 | +9.67 ± 3.23 | above 0 |
| hard^sell-calibrated vs hard | 4 | 360 | 63.1% ± 5.0 | +8.20 ± 2.25 | above 0 |
| hard^sell-calibrated vs hard | **pooled** | 1020 | 63.9% ± 3.0 | +10.47 ± 1.97 | **improves** |

# 3. Generalisation: different opponents (held-out seeds)

Normal with and without `sell-calibrated` against Hard and Easy (the Assignment 8 AI); 2 players: 100 seeds, 3 and 4 players: 40 seeds.

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| normal^sell-calibrated vs hard | 2 | 200 | 60.8% ± 6.8 | +9.40 ± 5.54 | above 0 |
| normal^sell-calibrated vs hard | 3 | 240 | 57.8% ± 6.3 | +6.60 ± 4.44 | above 0 |
| normal^sell-calibrated vs hard | 4 | 240 | 63.3% ± 6.1 | +8.03 ± 2.80 | above 0 |
| normal^sell-calibrated vs hard | **pooled** | 680 | 60.6% ± 3.7 | +8.01 ± 2.55 | **improves** |
| normal vs hard | 2 | 200 | 49.0% ± 6.9 | -1.31 ± 5.71 | includes 0 |
| normal vs hard | 3 | 240 | 46.7% ± 6.3 | -2.60 ± 4.43 | includes 0 |
| normal vs hard | 4 | 240 | 54.2% ± 6.3 | +0.12 ± 3.00 | includes 0 |
| normal vs hard | **pooled** | 680 | 49.9% ± 3.8 | -1.26 ± 2.61 | no improvement |
| normal^sell-calibrated vs easy | 2 | 200 | 72.3% ± 6.2 | +20.25 ± 5.46 | above 0 |
| normal^sell-calibrated vs easy | 3 | 240 | 60.8% ± 6.2 | +10.00 ± 3.83 | above 0 |
| normal^sell-calibrated vs easy | 4 | 240 | 68.8% ± 5.9 | +12.51 ± 2.68 | above 0 |
| normal^sell-calibrated vs easy | **pooled** | 680 | 67.3% ± 3.5 | +14.25 ± 2.40 | **improves** |
| normal vs easy | 2 | 200 | 53.8% ± 6.9 | +4.30 ± 5.62 | includes 0 |
| normal vs easy | 3 | 240 | 59.2% ± 6.2 | +5.51 ± 4.45 | above 0 |
| normal vs easy | 4 | 240 | 59.6% ± 6.2 | +3.83 ± 2.95 | above 0 |
| normal vs easy | **pooled** | 680 | 57.5% ± 3.7 | +4.55 ± 2.58 | **improves** |

# 4. Paired mirror comparisons (exploration seeds, 100 per player count)

Every seat plays the candidate, against every seat playing `normal` on the same seeds; per player per game, ± 1.96 SE of the paired difference; **bold** = significant.


### normal^develop-horizon vs normal, 2 players (100 paired seeds)

| Measure (per player per game) | normal | normal^develop-horizon | Difference |
|---|---|---|---|
| Final VP | 46.49 | 48.16 | **+1.67 ± 0.60** |
| Winner VP | 64.87 | 67.09 | **+2.22 ± 0.70** |
| Link VP | 19.29 | 20.37 | **+1.08 ± 0.30** |
| Tile VP | 30.40 | 30.95 | **+0.55 ± 0.42** |
| Income level | -3.71 | -3.30 | **+0.41 ± 0.23** |
| Money left | 11.31 | 12.30 | +0.98 ± 1.33 |
| Loans | 6.09 | 6.07 | -0.03 ± 0.04 |
| Builds | 11.96 | 12.21 | **+0.25 ± 0.08** |
| Develop actions | 6.27 | 5.49 | **-0.78 ± 0.13** |
| Tiles sold | 1.96 | 2.03 | **+0.07 ± 0.04** |
| Networks | 7.08 | 7.46 | **+0.38 ± 0.09** |
| Links built | 7.08 | 7.46 | **+0.38 ± 0.09** |
| Passes | 5.03 | 5.12 | **+0.09 ± 0.05** |
| Shortfall sales | 2.96 | 2.94 | -0.03 ± 0.03 |
| VP lost to shortfalls | 3.52 | 3.50 | -0.02 ± 0.04 |
| Own unflipped overbuilds | 0.11 | 0.13 | **+0.02 ± 0.02** |

### normal^develop-horizon vs normal, 3 players (100 paired seeds)

| Measure (per player per game) | normal | normal^develop-horizon | Difference |
|---|---|---|---|
| Final VP | 44.09 | 46.76 | **+2.66 ± 0.66** |
| Winner VP | 65.78 | 69.05 | **+3.27 ± 0.97** |
| Link VP | 18.34 | 20.00 | **+1.65 ± 0.36** |
| Tile VP | 28.05 | 29.04 | **+0.99 ± 0.40** |
| Income level | -2.78 | -2.15 | **+0.63 ± 0.25** |
| Money left | 11.13 | 14.01 | **+2.88 ± 1.36** |
| Loans | 5.45 | 5.45 | +0.00 ± 0.04 |
| Builds | 11.41 | 11.66 | **+0.25 ± 0.06** |
| Develop actions | 5.68 | 4.75 | **-0.92 ± 0.12** |
| Tiles sold | 1.93 | 2.04 | **+0.11 ± 0.05** |
| Networks | 6.58 | 7.11 | **+0.53 ± 0.09** |
| Links built | 6.58 | 7.11 | **+0.53 ± 0.09** |
| Passes | 3.77 | 3.81 | +0.04 ± 0.05 |
| Shortfall sales | 2.55 | 2.52 | -0.03 ± 0.04 |
| VP lost to shortfalls | 2.53 | 2.52 | -0.01 ± 0.01 |
| Own unflipped overbuilds | 0.08 | 0.10 | +0.01 ± 0.02 |

### normal^develop-horizon vs normal, 4 players (100 paired seeds)

| Measure (per player per game) | normal | normal^develop-horizon | Difference |
|---|---|---|---|
| Final VP | 44.49 | 47.87 | **+3.38 ± 0.59** |
| Winner VP | 67.73 | 71.71 | **+3.98 ± 1.06** |
| Link VP | 18.01 | 19.86 | **+1.85 ± 0.34** |
| Tile VP | 26.72 | 28.13 | **+1.41 ± 0.33** |
| Income level | -0.82 | -0.08 | **+0.74 ± 0.23** |
| Money left | 13.74 | 16.44 | **+2.69 ± 1.18** |
| Loans | 4.86 | 4.87 | +0.02 ± 0.03 |
| Builds | 10.44 | 10.76 | **+0.32 ± 0.06** |
| Develop actions | 5.43 | 4.42 | **-1.00 ± 0.09** |
| Tiles sold | 2.16 | 2.31 | **+0.15 ± 0.04** |
| Networks | 5.94 | 6.46 | **+0.52 ± 0.08** |
| Links built | 5.94 | 6.46 | **+0.52 ± 0.08** |
| Passes | 2.12 | 2.13 | +0.02 ± 0.03 |
| Shortfall sales | 1.67 | 1.67 | -0.00 ± 0.02 |
| VP lost to shortfalls | 1.73 | 1.72 | -0.01 ± 0.02 |
| Own unflipped overbuilds | 0.07 | 0.09 | **+0.03 ± 0.02** |

### normal^sell-calibrated vs normal, 2 players (100 paired seeds)

| Measure (per player per game) | normal | normal^sell-calibrated | Difference |
|---|---|---|---|
| Final VP | 46.49 | 65.33 | **+18.84 ± 5.20** |
| Winner VP | 64.87 | 77.73 | **+12.86 ± 4.58** |
| Link VP | 19.29 | 24.46 | **+5.17 ± 1.51** |
| Tile VP | 30.40 | 41.79 | **+11.39 ± 3.20** |
| Income level | -3.71 | -0.39 | **+3.32 ± 1.15** |
| Money left | 11.31 | 15.00 | **+3.69 ± 2.55** |
| Loans | 6.09 | 5.86 | -0.23 ± 0.25 |
| Builds | 11.96 | 11.47 | **-0.48 ± 0.42** |
| Develop actions | 6.27 | 8.11 | **+1.84 ± 0.37** |
| Tiles sold | 1.96 | 2.93 | **+0.97 ± 0.24** |
| Networks | 7.08 | 8.12 | **+1.03 ± 0.30** |
| Links built | 7.08 | 8.12 | **+1.03 ± 0.30** |
| Passes | 5.03 | 1.61 | **-3.42 ± 1.01** |
| Shortfall sales | 2.96 | 1.85 | **-1.11 ± 0.52** |
| VP lost to shortfalls | 3.52 | 1.41 | **-2.11 ± 0.98** |
| Own unflipped overbuilds | 0.11 | 0.01 | **-0.10 ± 0.04** |

### normal^sell-calibrated vs normal, 3 players (100 paired seeds)

| Measure (per player per game) | normal | normal^sell-calibrated | Difference |
|---|---|---|---|
| Final VP | 44.09 | 57.43 | **+13.34 ± 3.56** |
| Winner VP | 65.78 | 76.08 | **+10.30 ± 3.84** |
| Link VP | 18.34 | 23.18 | **+4.83 ± 1.14** |
| Tile VP | 28.05 | 35.02 | **+6.97 ± 2.17** |
| Income level | -2.78 | -0.08 | **+2.70 ± 0.98** |
| Money left | 11.13 | 14.05 | **+2.92 ± 1.93** |
| Loans | 5.45 | 5.16 | **-0.29 ± 0.21** |
| Builds | 11.41 | 10.62 | **-0.79 ± 0.32** |
| Develop actions | 5.68 | 7.34 | **+1.67 ± 0.28** |
| Tiles sold | 1.93 | 2.48 | **+0.55 ± 0.16** |
| Networks | 6.58 | 7.45 | **+0.87 ± 0.24** |
| Links built | 6.58 | 7.45 | **+0.87 ± 0.24** |
| Passes | 3.77 | 1.60 | **-2.17 ± 0.71** |
| Shortfall sales | 2.55 | 1.37 | **-1.18 ± 0.35** |
| VP lost to shortfalls | 2.53 | 1.23 | **-1.29 ± 0.65** |
| Own unflipped overbuilds | 0.08 | 0.01 | **-0.07 ± 0.04** |

### normal^sell-calibrated vs normal, 4 players (100 paired seeds)

| Measure (per player per game) | normal | normal^sell-calibrated | Difference |
|---|---|---|---|
| Final VP | 44.49 | 55.69 | **+11.21 ± 2.67** |
| Winner VP | 67.73 | 75.25 | **+7.52 ± 3.20** |
| Link VP | 18.01 | 21.87 | **+3.86 ± 0.95** |
| Tile VP | 26.72 | 32.83 | **+6.11 ± 1.57** |
| Income level | -0.82 | 1.30 | **+2.13 ± 0.69** |
| Money left | 13.74 | 15.62 | **+1.88 ± 1.69** |
| Loans | 4.86 | 4.46 | **-0.39 ± 0.15** |
| Builds | 10.44 | 9.74 | **-0.70 ± 0.21** |
| Develop actions | 5.43 | 6.66 | **+1.23 ± 0.19** |
| Tiles sold | 2.16 | 2.44 | **+0.28 ± 0.14** |
| Networks | 5.94 | 6.55 | **+0.60 ± 0.17** |
| Links built | 5.94 | 6.55 | **+0.60 ± 0.17** |
| Passes | 2.12 | 1.01 | **-1.10 ± 0.45** |
| Shortfall sales | 1.67 | 0.94 | **-0.73 ± 0.27** |
| VP lost to shortfalls | 1.73 | 0.75 | **-0.98 ± 0.45** |
| Own unflipped overbuilds | 0.07 | 0.00 | **-0.06 ± 0.02** |

### normal^sell-connect vs normal, 2 players (100 paired seeds)

| Measure (per player per game) | normal | normal^sell-connect | Difference |
|---|---|---|---|
| Final VP | 46.49 | 55.53 | **+9.04 ± 4.29** |
| Winner VP | 64.87 | 72.75 | **+7.88 ± 4.15** |
| Link VP | 19.29 | 22.23 | **+2.94 ± 1.08** |
| Tile VP | 30.40 | 35.66 | **+5.25 ± 2.68** |
| Income level | -3.71 | -1.34 | **+2.37 ± 0.89** |
| Money left | 11.31 | 11.83 | +0.52 ± 2.22 |
| Loans | 6.09 | 5.84 | **-0.25 ± 0.23** |
| Builds | 11.96 | 12.21 | +0.26 ± 0.43 |
| Develop actions | 6.27 | 6.44 | +0.17 ± 0.25 |
| Tiles sold | 1.96 | 2.44 | **+0.48 ± 0.19** |
| Networks | 7.08 | 7.76 | **+0.68 ± 0.24** |
| Links built | 7.08 | 7.76 | **+0.68 ± 0.24** |
| Passes | 5.03 | 3.75 | **-1.28 ± 0.92** |
| Shortfall sales | 2.96 | 2.48 | **-0.49 ± 0.37** |
| VP lost to shortfalls | 3.52 | 2.91 | -0.60 ± 0.94 |
| Own unflipped overbuilds | 0.11 | 0.11 | +0.00 ± 0.05 |

### normal^sell-connect vs normal, 3 players (100 paired seeds)

| Measure (per player per game) | normal | normal^sell-connect | Difference |
|---|---|---|---|
| Final VP | 44.09 | 51.82 | **+7.73 ± 3.40** |
| Winner VP | 65.78 | 74.36 | **+8.58 ± 3.47** |
| Link VP | 18.34 | 20.82 | **+2.48 ± 1.03** |
| Tile VP | 28.05 | 32.82 | **+4.77 ± 1.96** |
| Income level | -2.78 | -0.54 | **+2.24 ± 0.88** |
| Money left | 11.13 | 12.99 | **+1.86 ± 1.85** |
| Loans | 5.45 | 5.23 | **-0.21 ± 0.17** |
| Builds | 11.41 | 11.37 | -0.03 ± 0.29 |
| Develop actions | 5.68 | 5.75 | +0.07 ± 0.21 |
| Tiles sold | 1.93 | 2.42 | **+0.49 ± 0.16** |
| Networks | 6.58 | 7.00 | **+0.42 ± 0.19** |
| Links built | 6.58 | 7.00 | **+0.42 ± 0.19** |
| Passes | 3.77 | 3.08 | **-0.69 ± 0.63** |
| Shortfall sales | 2.55 | 1.90 | **-0.65 ± 0.32** |
| VP lost to shortfalls | 2.53 | 2.14 | -0.39 ± 0.74 |
| Own unflipped overbuilds | 0.08 | 0.07 | -0.01 ± 0.04 |

### normal^sell-connect vs normal, 4 players (100 paired seeds)

| Measure (per player per game) | normal | normal^sell-connect | Difference |
|---|---|---|---|
| Final VP | 44.49 | 48.95 | **+4.46 ± 2.01** |
| Winner VP | 67.73 | 74.55 | **+6.82 ± 2.57** |
| Link VP | 18.01 | 19.58 | **+1.57 ± 0.63** |
| Tile VP | 26.72 | 29.56 | **+2.85 ± 1.22** |
| Income level | -0.82 | 0.69 | **+1.52 ± 0.58** |
| Money left | 13.74 | 14.44 | +0.70 ± 1.58 |
| Loans | 4.86 | 4.59 | **-0.26 ± 0.11** |
| Builds | 10.44 | 10.24 | **-0.20 ± 0.18** |
| Develop actions | 5.43 | 5.38 | -0.05 ± 0.15 |
| Tiles sold | 2.16 | 2.40 | **+0.25 ± 0.12** |
| Networks | 5.94 | 6.29 | **+0.34 ± 0.12** |
| Links built | 5.94 | 6.29 | **+0.34 ± 0.12** |
| Passes | 2.12 | 2.03 | -0.09 ± 0.36 |
| Shortfall sales | 1.67 | 1.45 | **-0.22 ± 0.20** |
| VP lost to shortfalls | 1.73 | 1.80 | +0.07 ± 0.43 |
| Own unflipped overbuilds | 0.07 | 0.06 | -0.00 ± 0.02 |

# 5. Investment probes (`ai-invest.js`, exploration mirror seeds, 100 games each)

## 5.1 Before: the Assignment 8 AI, every level and player count

### easy: 2 players, 100 games

**Development:** 1261 Develop actions (6.30 per player per game) removing 2318 tiles; iron spent £41 per player per game.
- Canal / Rail: 1648 / 670; removed tile Level I 1242 of 2318 (54%), Canal-only 1242 of 2318 (54%)
- The industry was already buildable somewhere: 1146 of 2318 (49%); its top tile was unbuildable in this era (developing was the only way on): 12 of 2318 (1%) (later built 1 of 12 (8%))
- The industry was built later: 1171 of 2318 (51%); and a later tile of it flipped: 455 of 2318 (20%)
- By industry (developed → later built): brewery 740 → 385, cottonMill 565 → 252, coalMine 498 → 345, ironWorks 283 → 127, manufacturer 212 → 61, pottery 20 → 1
- Timing (rounds left in the GAME): 1–2 rounds left: 202 (built later 2%); 3–5 rounds left: 187 (built later 28%); 6–10 rounds left: 281 (built later 38%); 11–20 rounds left: 1648 (built later 61%)
- A Build was available at 1761 of 2318 (76%) of these; Develop outscored the best Build by -0.0 on average

**Selling:** 702 sellable tiles built (3.51 per player per game; 34% of builds); breweries built 1.13 per player per game.
- At build time: sellable 208 of 702 (30%), no merchant 408 of 702 (58%), not enough beer 86 of 702 (12%)
- Outcome: sold 301 of 702 (43%), unsold at era end 273 of 702 (39%), removed first 128 of 702 (18%)
  - built sellable: sold 193 of 208 (93%)
  - built without a merchant: sold 88 of 408 (22%)
  - built short of beer: sold 20 of 86 (23%)
- Unsold tiles' main obstacle over their life: no merchant 210 of 273 (77%), beer 56 of 273 (21%), sellable but not sold 3 of 273 (1%), built in the era's last turn 4 of 273 (1%); VP left unscored 2112 (10.6 per player per game)
- Owner turns while waiting: sellable 386 of 4145 (9%), blocked by merchant 3114 of 4145 (75%), blocked by beer 645 of 4145 (16%)
- By industry (built → sold): manufacturer 122 → 83, cottonMill 309 → 192, pottery 271 → 26
- Sell legal at 368 of 7800 (5%) of turns; taken 296 of 368 (80%); otherwise: loan 16, build 15, pass 14, develop 11, network 10, scout 6

**Examples**
- develop never built: seed 202001, player 0, canal round 5: cottonMill Lv1 (Canal-only); buildable true, next blocked false; develop score 3.6, best other build 3.47
- develop never built: seed 202001, player 0, canal round 8: cottonMill Lv1 (Canal-only); buildable false, next blocked false; develop score 4.0, best other network 2.34
- unsold: seed 202001, player 1, cottonMill Lv1 (1 beer) built canal round 4; at build: merchant; turns sellable/merchant/beer 0/12/0
- unsold: seed 202001, player 1, manufacturer Lv1 (1 beer) built canal round 6; at build: beer; turns sellable/merchant/beer 1/0/8

### normal: 2 players, 100 games

**Development:** 1254 Develop actions (6.27 per player per game) removing 2345 tiles; iron spent £42 per player per game.
- Canal / Rail: 1859 / 486; removed tile Level I 1248 of 2345 (53%), Canal-only 1248 of 2345 (53%)
- The industry was already buildable somewhere: 937 of 2345 (40%); its top tile was unbuildable in this era (developing was the only way on): 4 of 2345 (0%) (later built 1 of 4 (25%))
- The industry was built later: 1359 of 2345 (58%); and a later tile of it flipped: 615 of 2345 (26%)
- By industry (developed → later built): brewery 700 → 460, cottonMill 577 → 298, coalMine 522 → 395, ironWorks 285 → 125, manufacturer 227 → 81, pottery 34 → 0
- Timing (rounds left in the GAME): 1–2 rounds left: 279 (built later 1%); 3–5 rounds left: 134 (built later 26%); 6–10 rounds left: 73 (built later 37%); 11–20 rounds left: 1859 (built later 70%)
- A Build was available at 1665 of 2345 (71%) of these; Develop outscored the best Build by 0.9 on average

**Selling:** 850 sellable tiles built (4.25 per player per game; 36% of builds); breweries built 1.53 per player per game.
- At build time: sellable 275 of 850 (32%), no merchant 483 of 850 (57%), not enough beer 92 of 850 (11%)
- Outcome: sold 388 of 850 (46%), unsold at era end 328 of 850 (39%), removed first 134 of 850 (16%)
  - built sellable: sold 259 of 275 (94%)
  - built without a merchant: sold 102 of 483 (21%)
  - built short of beer: sold 27 of 92 (29%)
- Unsold tiles' main obstacle over their life: no merchant 253 of 328 (77%), beer 70 of 328 (21%), sellable but not sold 0 of 328 (0%), built in the era's last turn 5 of 328 (2%); VP left unscored 2544 (12.7 per player per game)
- Owner turns while waiting: sellable 411 of 4755 (9%), blocked by merchant 3571 of 4755 (75%), blocked by beer 773 of 4755 (16%)
- By industry (built → sold): cottonMill 364 → 234, pottery 295 → 26, manufacturer 191 → 128
- Sell legal at 407 of 7800 (5%) of turns; taken 385 of 407 (95%); otherwise: loan 10, build 8, develop 4

**Examples**
- develop never built: seed 202001, player 0, canal round 6: brewery Lv1 (Canal-only); buildable true, next blocked false; develop score 3.3, best other build 3.01
- develop never built: seed 202001, player 0, canal round 8: brewery Lv1 (Canal-only); buildable true, next blocked false; develop score 3.6, best other build 2.59
- unsold: seed 202001, player 0, pottery Lv1 (1 beer) built canal round 3; at build: merchant; turns sellable/merchant/beer 0/1/14
- unsold: seed 202001, player 1, pottery Lv1 (1 beer) built canal round 6; at build: merchant; turns sellable/merchant/beer 0/9/0

### hard: 2 players, 100 games

**Development:** 1273 Develop actions (6.37 per player per game) removing 2379 tiles; iron spent £39 per player per game.
- Canal / Rail: 1834 / 545; removed tile Level I 1245 of 2379 (52%), Canal-only 1245 of 2379 (52%)
- The industry was already buildable somewhere: 874 of 2379 (37%); its top tile was unbuildable in this era (developing was the only way on): 6 of 2379 (0%) (later built 1 of 6 (17%))
- The industry was built later: 1402 of 2379 (59%); and a later tile of it flipped: 628 of 2379 (26%)
- By industry (developed → later built): brewery 717 → 499, cottonMill 595 → 309, coalMine 522 → 394, ironWorks 255 → 99, manufacturer 248 → 99, pottery 42 → 2
- Timing (rounds left in the GAME): 1–2 rounds left: 318 (built later 2%); 3–5 rounds left: 141 (built later 23%); 6–10 rounds left: 86 (built later 31%); 11–20 rounds left: 1834 (built later 73%)
- A Build was available at 1584 of 2379 (67%) of these; Develop outscored the best Build by 1.2 on average

**Selling:** 866 sellable tiles built (4.33 per player per game; 34% of builds); breweries built 1.84 per player per game.
- At build time: sellable 272 of 866 (31%), no merchant 524 of 866 (61%), not enough beer 70 of 866 (8%)
- Outcome: sold 410 of 866 (47%), unsold at era end 340 of 866 (39%), removed first 116 of 866 (13%)
  - built sellable: sold 258 of 272 (95%)
  - built without a merchant: sold 130 of 524 (25%)
  - built short of beer: sold 22 of 70 (31%)
- Unsold tiles' main obstacle over their life: no merchant 282 of 340 (83%), beer 46 of 340 (14%), sellable but not sold 0 of 340 (0%), built in the era's last turn 12 of 340 (4%); VP left unscored 2641 (13.2 per player per game)
- Owner turns while waiting: sellable 449 of 5021 (9%), blocked by merchant 3930 of 5021 (78%), blocked by beer 642 of 5021 (13%)
- By industry (built → sold): cottonMill 358 → 244, manufacturer 204 → 131, pottery 304 → 35
- Sell legal at 424 of 7800 (5%) of turns; taken 396 of 424 (93%); otherwise: build 10, network 8, loan 8, scout 2

**Examples**
- develop never built: seed 202001, player 0, rail round 4: brewery Lv3; buildable false, next blocked false; develop score 3.7, best other loan 3.43
- develop never built: seed 202001, player 1, rail round 5: brewery Lv3; buildable false, next blocked false; develop score 2.4, best other scout 0.00
- unsold: seed 202001, player 1, cottonMill Lv1 (1 beer) built canal round 8; at build: merchant; turns sellable/merchant/beer 0/6/0
- unsold: seed 202001, player 1, cottonMill Lv3 (1 beer) built rail round 8; at build: merchant; turns sellable/merchant/beer 0/4/0


### easy: 3 players, 100 games

**Development:** 1759 Develop actions (5.86 per player per game) removing 3220 tiles; iron spent £43 per player per game.
- Canal / Rail: 2217 / 1003; removed tile Level I 1821 of 3220 (57%), Canal-only 1821 of 3220 (57%)
- The industry was already buildable somewhere: 1703 of 3220 (53%); its top tile was unbuildable in this era (developing was the only way on): 57 of 3220 (2%) (later built 18 of 57 (32%))
- The industry was built later: 1532 of 3220 (48%); and a later tile of it flipped: 582 of 3220 (18%)
- By industry (developed → later built): brewery 1065 → 482, coalMine 745 → 474, cottonMill 734 → 350, ironWorks 426 → 162, manufacturer 222 → 62, pottery 28 → 2
- Timing (rounds left in the GAME): 1–2 rounds left: 319 (built later 6%); 3–5 rounds left: 317 (built later 34%); 6–10 rounds left: 715 (built later 46%); 11–20 rounds left: 1869 (built later 58%)
- A Build was available at 2637 of 3220 (82%) of these; Develop outscored the best Build by -0.0 on average

**Selling:** 1126 sellable tiles built (3.75 per player per game; 40% of builds); breweries built 0.73 per player per game.
- At build time: sellable 345 of 1126 (31%), no merchant 602 of 1126 (53%), not enough beer 179 of 1126 (16%)
- Outcome: sold 457 of 1126 (41%), unsold at era end 453 of 1126 (40%), removed first 216 of 1126 (19%)
  - built sellable: sold 309 of 345 (90%)
  - built without a merchant: sold 119 of 602 (20%)
  - built short of beer: sold 29 of 179 (16%)
- Unsold tiles' main obstacle over their life: no merchant 302 of 453 (67%), beer 122 of 453 (27%), sellable but not sold 8 of 453 (2%), built in the era's last turn 21 of 453 (5%); VP left unscored 2971 (9.9 per player per game)
- Owner turns while waiting: sellable 577 of 5547 (10%), blocked by merchant 3861 of 5547 (70%), blocked by beer 1109 of 5547 (20%)
- By industry (built → sold): cottonMill 459 → 204, pottery 427 → 82, manufacturer 240 → 171
- Sell legal at 582 of 10500 (6%) of turns; taken 461 of 582 (79%); otherwise: loan 40, build 21, develop 18, pass 18, scout 14, network 10

**Examples**
- develop never built: seed 203001, player 0, canal round 4: cottonMill Lv1 (Canal-only); buildable true, next blocked false; develop score 3.5, best other build 5.04
- develop never built: seed 203001, player 2, canal round 5: brewery Lv1 (Canal-only); buildable false, next blocked false; develop score 1.7, best other network 1.44
- unsold: seed 203001, player 2, cottonMill Lv1 (1 beer) built canal round 1; at build: merchant; turns sellable/merchant/beer 0/16/0
- unsold: seed 203001, player 2, pottery Lv2 (1 beer) built rail round 9; at build: merchant; turns sellable/merchant/beer 0/1/0

### normal: 3 players, 100 games

**Development:** 1703 Develop actions (5.68 per player per game) removing 3184 tiles; iron spent £41 per player per game.
- Canal / Rail: 2347 / 837; removed tile Level I 1809 of 3184 (57%), Canal-only 1809 of 3184 (57%)
- The industry was already buildable somewhere: 1402 of 3184 (44%); its top tile was unbuildable in this era (developing was the only way on): 13 of 3184 (0%) (later built 6 of 13 (46%))
- The industry was built later: 1721 of 3184 (54%); and a later tile of it flipped: 727 of 3184 (23%)
- By industry (developed → later built): brewery 1033 → 526, cottonMill 769 → 435, coalMine 688 → 491, ironWorks 420 → 181, manufacturer 248 → 86, pottery 26 → 2
- Timing (rounds left in the GAME): 1–2 rounds left: 497 (built later 2%); 3–5 rounds left: 229 (built later 23%); 6–10 rounds left: 510 (built later 59%); 11–20 rounds left: 1948 (built later 70%)
- A Build was available at 2373 of 3184 (75%) of these; Develop outscored the best Build by 0.8 on average

**Selling:** 1294 sellable tiles built (4.31 per player per game; 38% of builds); breweries built 1.16 per player per game.
- At build time: sellable 407 of 1294 (31%), no merchant 693 of 1294 (54%), not enough beer 194 of 1294 (15%)
- Outcome: sold 560 of 1294 (43%), unsold at era end 524 of 1294 (40%), removed first 210 of 1294 (16%)
  - built sellable: sold 371 of 407 (91%)
  - built without a merchant: sold 146 of 693 (21%)
  - built short of beer: sold 43 of 194 (22%)
- Unsold tiles' main obstacle over their life: no merchant 378 of 524 (72%), beer 140 of 524 (27%), sellable but not sold 1 of 524 (0%), built in the era's last turn 5 of 524 (1%); VP left unscored 3509 (11.7 per player per game)
- Owner turns while waiting: sellable 599 of 6529 (9%), blocked by merchant 4554 of 6529 (70%), blocked by beer 1376 of 6529 (21%)
- By industry (built → sold): cottonMill 551 → 233, manufacturer 315 → 229, pottery 428 → 98
- Sell legal at 590 of 10500 (6%) of turns; taken 567 of 590 (96%); otherwise: build 11, loan 8, develop 3, scout 1

**Examples**
- develop never built: seed 203001, player 1, canal round 3: brewery Lv1 (Canal-only); buildable true, next blocked false; develop score 3.9, best other build 3.23
- develop never built: seed 203001, player 0, canal round 5: cottonMill Lv1 (Canal-only); buildable true, next blocked false; develop score 3.3, best other build 3.12
- unsold: seed 203001, player 0, cottonMill Lv1 (1 beer) built canal round 5; at build: beer; turns sellable/merchant/beer 0/0/9
- unsold: seed 203001, player 2, cottonMill Lv2 (1 beer) built canal round 8; at build: merchant; turns sellable/merchant/beer 0/2/0

### hard: 3 players, 100 games

**Development:** 1463 Develop actions (4.88 per player per game) removing 2740 tiles; iron spent £32 per player per game.
- Canal / Rail: 2091 / 649; removed tile Level I 1659 of 2740 (61%), Canal-only 1659 of 2740 (61%)
- The industry was already buildable somewhere: 1073 of 2740 (39%); its top tile was unbuildable in this era (developing was the only way on): 17 of 2740 (1%) (later built 6 of 17 (35%))
- The industry was built later: 1502 of 2740 (55%); and a later tile of it flipped: 552 of 2740 (20%)
- By industry (developed → later built): brewery 924 → 515, cottonMill 644 → 334, coalMine 606 → 464, ironWorks 312 → 111, manufacturer 231 → 78, pottery 23 → 0
- Timing (rounds left in the GAME): 1–2 rounds left: 401 (built later 1%); 3–5 rounds left: 146 (built later 17%); 6–10 rounds left: 470 (built later 58%); 11–20 rounds left: 1723 (built later 70%)
- A Build was available at 2023 of 2740 (74%) of these; Develop outscored the best Build by 1.4 on average

**Selling:** 1362 sellable tiles built (4.54 per player per game; 38% of builds); breweries built 1.23 per player per game.
- At build time: sellable 303 of 1362 (22%), no merchant 913 of 1362 (67%), not enough beer 146 of 1362 (11%)
- Outcome: sold 523 of 1362 (38%), unsold at era end 559 of 1362 (41%), removed first 280 of 1362 (21%)
  - built sellable: sold 271 of 303 (89%)
  - built without a merchant: sold 208 of 913 (23%)
  - built short of beer: sold 44 of 146 (30%)
- Unsold tiles' main obstacle over their life: no merchant 448 of 559 (80%), beer 98 of 559 (18%), sellable but not sold 2 of 559 (0%), built in the era's last turn 11 of 559 (2%); VP left unscored 3667 (12.2 per player per game)
- Owner turns while waiting: sellable 577 of 8418 (7%), blocked by merchant 6627 of 8418 (79%), blocked by beer 1214 of 8418 (14%)
- By industry (built → sold): cottonMill 628 → 234, manufacturer 312 → 201, pottery 422 → 88
- Sell legal at 554 of 10500 (5%) of turns; taken 509 of 554 (92%); otherwise: build 21, loan 15, network 7, develop 2

**Examples**
- develop never built: seed 203001, player 1, canal round 3: brewery Lv1 (Canal-only); buildable true, next blocked false; develop score 3.9, best other network 3.19
- develop never built: seed 203001, player 0, canal round 6: brewery Lv1 (Canal-only); buildable false, next blocked false; develop score 3.2, best other build 2.90
- unsold: seed 203001, player 2, cottonMill Lv1 (1 beer) built canal round 1; at build: sellable; turns sellable/merchant/beer 0/0/16
- unsold: seed 203001, player 1, cottonMill Lv1 (1 beer) built canal round 3; at build: merchant; turns sellable/merchant/beer 0/9/4


### easy: 4 players, 100 games

**Development:** 2284 Develop actions (5.71 per player per game) removing 4218 tiles; iron spent £43 per player per game.
- Canal / Rail: 2634 / 1584; removed tile Level I 2404 of 4218 (57%), Canal-only 2404 of 4218 (57%)
- The industry was already buildable somewhere: 2177 of 4218 (52%); its top tile was unbuildable in this era (developing was the only way on): 163 of 4218 (4%) (later built 71 of 163 (44%))
- The industry was built later: 2004 of 4218 (48%); and a later tile of it flipped: 936 of 4218 (22%)
- By industry (developed → later built): brewery 1440 → 642, coalMine 1006 → 588, cottonMill 915 → 441, ironWorks 524 → 225, manufacturer 304 → 108, pottery 29 → 0
- Timing (rounds left in the GAME): 1–2 rounds left: 618 (built later 7%); 3–5 rounds left: 595 (built later 32%); 6–10 rounds left: 1281 (built later 51%); 11–20 rounds left: 1724 (built later 65%)
- A Build was available at 3552 of 4218 (84%) of these; Develop outscored the best Build by 0.2 on average

**Selling:** 1522 sellable tiles built (3.81 per player per game; 42% of builds); breweries built 0.76 per player per game.
- At build time: sellable 553 of 1522 (36%), no merchant 716 of 1522 (47%), not enough beer 253 of 1522 (17%)
- Outcome: sold 735 of 1522 (48%), unsold at era end 585 of 1522 (38%), removed first 202 of 1522 (13%)
  - built sellable: sold 498 of 553 (90%)
  - built without a merchant: sold 190 of 716 (27%)
  - built short of beer: sold 47 of 253 (19%)
- Unsold tiles' main obstacle over their life: no merchant 364 of 585 (62%), beer 193 of 585 (33%), sellable but not sold 11 of 585 (2%), built in the era's last turn 17 of 585 (3%); VP left unscored 3926 (9.8 per player per game)
- Owner turns while waiting: sellable 933 of 6475 (14%), blocked by merchant 3940 of 6475 (61%), blocked by beer 1602 of 6475 (25%)
- By industry (built → sold): cottonMill 672 → 391, pottery 536 → 123, manufacturer 314 → 221
- Sell legal at 914 of 12400 (7%) of turns; taken 734 of 914 (80%); otherwise: loan 43, build 39, develop 34, pass 23, network 21, scout 20

**Examples**
- develop never built: seed 204001, player 0, canal round 2: brewery Lv1 (Canal-only); buildable true, next blocked false; develop score 4.4, best other build 3.33
- develop never built: seed 204001, player 3, canal round 2: brewery Lv1 (Canal-only); buildable true, next blocked false; develop score 4.1, best other network 3.69
- unsold: seed 204001, player 3, pottery Lv1 (1 beer) built canal round 5; at build: merchant; turns sellable/merchant/beer 0/7/0
- unsold: seed 204001, player 3, pottery Lv3 (2 beer) built rail round 2; at build: beer; turns sellable/merchant/beer 0/0/12

### normal: 4 players, 100 games

**Development:** 2172 Develop actions (5.43 per player per game) removing 4025 tiles; iron spent £41 per player per game.
- Canal / Rail: 2812 / 1213; removed tile Level I 2377 of 4025 (59%), Canal-only 2377 of 4025 (59%)
- The industry was already buildable somewhere: 1725 of 4025 (43%); its top tile was unbuildable in this era (developing was the only way on): 55 of 4025 (1%) (later built 33 of 55 (60%))
- The industry was built later: 1989 of 4025 (49%); and a later tile of it flipped: 989 of 4025 (25%)
- By industry (developed → later built): brewery 1300 → 589, cottonMill 942 → 527, coalMine 906 → 550, ironWorks 540 → 212, manufacturer 298 → 111, pottery 39 → 0
- Timing (rounds left in the GAME): 1–2 rounds left: 720 (built later 2%); 3–5 rounds left: 347 (built later 22%); 6–10 rounds left: 1055 (built later 57%); 11–20 rounds left: 1903 (built later 68%)
- A Build was available at 3133 of 4025 (78%) of these; Develop outscored the best Build by 0.9 on average

**Selling:** 1683 sellable tiles built (4.21 per player per game; 40% of builds); breweries built 0.92 per player per game.
- At build time: sellable 637 of 1683 (38%), no merchant 728 of 1683 (43%), not enough beer 318 of 1683 (19%)
- Outcome: sold 845 of 1683 (50%), unsold at era end 620 of 1683 (37%), removed first 218 of 1683 (13%)
  - built sellable: sold 574 of 637 (90%)
  - built without a merchant: sold 193 of 728 (27%)
  - built short of beer: sold 78 of 318 (25%)
- Unsold tiles' main obstacle over their life: no merchant 382 of 620 (62%), beer 216 of 620 (35%), sellable but not sold 3 of 620 (0%), built in the era's last turn 19 of 620 (3%); VP left unscored 4274 (10.7 per player per game)
- Owner turns while waiting: sellable 885 of 7029 (13%), blocked by merchant 4052 of 7029 (58%), blocked by beer 2092 of 7029 (30%)
- By industry (built → sold): cottonMill 759 → 443, manufacturer 366 → 277, pottery 558 → 125
- Sell legal at 866 of 12400 (7%) of turns; taken 840 of 866 (97%); otherwise: build 10, loan 8, develop 5, network 3

**Examples**
- develop never built: seed 204001, player 0, canal round 2: brewery Lv1 (Canal-only); buildable true, next blocked false; develop score 4.1, best other build 3.53
- develop never built: seed 204001, player 2, canal round 5: cottonMill Lv1 (Canal-only); buildable true, next blocked false; develop score 3.2, best other network 3.19
- unsold: seed 204001, player 2, pottery Lv1 (1 beer) built canal round 4; at build: merchant; turns sellable/merchant/beer 0/9/0
- unsold: seed 204001, player 3, pottery Lv1 (1 beer) built rail round 2; at build: merchant; turns sellable/merchant/beer 0/13/0

### hard: 4 players, 100 games

**Development:** 1735 Develop actions (4.34 per player per game) removing 3256 tiles; iron spent £31 per player per game.
- Canal / Rail: 2387 / 869; removed tile Level I 2113 of 3256 (65%), Canal-only 2113 of 3256 (65%)
- The industry was already buildable somewhere: 1183 of 3256 (36%); its top tile was unbuildable in this era (developing was the only way on): 73 of 3256 (2%) (later built 24 of 73 (33%))
- The industry was built later: 1615 of 3256 (50%); and a later tile of it flipped: 653 of 3256 (20%)
- By industry (developed → later built): brewery 1116 → 605, coalMine 701 → 415, cottonMill 700 → 349, ironWorks 393 → 142, manufacturer 309 → 102, pottery 37 → 2
- Timing (rounds left in the GAME): 1–2 rounds left: 544 (built later 2%); 3–5 rounds left: 206 (built later 12%); 6–10 rounds left: 966 (built later 53%); 11–20 rounds left: 1540 (built later 69%)
- A Build was available at 2439 of 3256 (75%) of these; Develop outscored the best Build by 1.6 on average

**Selling:** 1810 sellable tiles built (4.53 per player per game; 40% of builds); breweries built 1.08 per player per game.
- At build time: sellable 361 of 1810 (20%), no merchant 1289 of 1810 (71%), not enough beer 160 of 1810 (9%)
- Outcome: sold 714 of 1810 (39%), unsold at era end 801 of 1810 (44%), removed first 295 of 1810 (16%)
  - built sellable: sold 314 of 361 (87%)
  - built without a merchant: sold 369 of 1289 (29%)
  - built short of beer: sold 31 of 160 (19%)
- Unsold tiles' main obstacle over their life: no merchant 616 of 801 (77%), beer 169 of 801 (21%), sellable but not sold 4 of 801 (0%), built in the era's last turn 12 of 801 (1%); VP left unscored 5324 (13.3 per player per game)
- Owner turns while waiting: sellable 748 of 10349 (7%), blocked by merchant 7788 of 10349 (75%), blocked by beer 1813 of 10349 (18%)
- By industry (built → sold): cottonMill 902 → 414, manufacturer 335 → 197, pottery 573 → 103
- Sell legal at 729 of 12400 (6%) of turns; taken 701 of 729 (96%); otherwise: build 15, loan 7, develop 3, network 3

**Examples**
- develop never built: seed 204001, player 3, canal round 5: ironWorks Lv1 (Canal-only); buildable false, next blocked false; develop score 4.0, best other network 3.19
- develop never built: seed 204001, player 2, canal round 8: cottonMill Lv1 (Canal-only); buildable false, next blocked false; develop score 3.2, best other build 2.49
- unsold: seed 204001, player 2, pottery Lv1 (1 beer) built canal round 4; at build: merchant; turns sellable/merchant/beer 0/9/0
- unsold: seed 204001, player 2, manufacturer Lv2 (1 beer) built canal round 6; at build: beer; turns sellable/merchant/beer 0/0/5


## 5.2 After: `sell-calibrated` (Normal)

### normal (sell: calibrated): 2 players, 100 games

**Development:** 1622 Develop actions (8.11 per player per game) removing 3063 tiles; iron spent £54 per player per game.
- Canal / Rail: 2135 / 928; removed tile Level I 1326 of 3063 (43%), Canal-only 1326 of 3063 (43%)
- The industry was already buildable somewhere: 1307 of 3063 (43%); its top tile was unbuildable in this era (developing was the only way on): 7 of 3063 (0%) (later built 0 of 7 (0%))
- The industry was built later: 1689 of 3063 (55%); and a later tile of it flipped: 1056 of 3063 (34%)
- By industry (developed → later built): cottonMill 927 → 484, brewery 863 → 585, coalMine 596 → 379, manufacturer 389 → 108, ironWorks 288 → 133
- Timing (rounds left in the GAME): 1–2 rounds left: 475 (built later 1%); 3–5 rounds left: 283 (built later 23%); 6–10 rounds left: 170 (built later 34%); 11–20 rounds left: 2135 (built later 73%)
- A Build was available at 2153 of 3063 (70%) of these; Develop outscored the best Build by 1.1 on average

**Selling:** 600 sellable tiles built (3.00 per player per game; 26% of builds); breweries built 1.99 per player per game.
- At build time: sellable 593 of 600 (99%), no merchant 7 of 600 (1%), not enough beer 0 of 600 (0%)
- Outcome: sold 585 of 600 (98%), unsold at era end 14 of 600 (2%), removed first 1 of 600 (0%)
  - built sellable: sold 585 of 593 (99%)
  - built without a merchant: sold 0 of 7 (0%)
  - built short of beer: sold 0 of 0 (0%)
- Unsold tiles' main obstacle over their life: no merchant 6 of 14 (43%), beer 4 of 14 (29%), sellable but not sold 0 of 14 (0%), built in the era's last turn 4 of 14 (29%); VP left unscored 69 (0.3 per player per game)
- Owner turns while waiting: sellable 586 of 729 (80%), blocked by merchant 35 of 729 (5%), blocked by beer 108 of 729 (15%)
- By industry (built → sold): cottonMill 335 → 331, manufacturer 230 → 228, pottery 35 → 26
- Sell legal at 587 of 7800 (8%) of turns; taken 586 of 587 (100%); otherwise: loan 1

**Examples**

### normal (sell: calibrated): 3 players, 100 games

**Development:** 2203 Develop actions (7.34 per player per game) removing 4138 tiles; iron spent £56 per player per game.
- Canal / Rail: 2935 / 1203; removed tile Level I 1985 of 4138 (48%), Canal-only 1985 of 4138 (48%)
- The industry was already buildable somewhere: 1926 of 4138 (47%); its top tile was unbuildable in this era (developing was the only way on): 5 of 4138 (0%) (later built 0 of 5 (0%))
- The industry was built later: 2226 of 4138 (54%); and a later tile of it flipped: 1254 of 4138 (30%)
- By industry (developed → later built): brewery 1204 → 783, cottonMill 1185 → 497, coalMine 873 → 613, ironWorks 483 → 206, manufacturer 391 → 127, pottery 2 → 0
- Timing (rounds left in the GAME): 1–2 rounds left: 748 (built later 1%); 3–5 rounds left: 334 (built later 15%); 6–10 rounds left: 629 (built later 63%); 11–20 rounds left: 2427 (built later 73%)
- A Build was available at 3156 of 4138 (76%) of these; Develop outscored the best Build by 1.1 on average

**Selling:** 784 sellable tiles built (2.61 per player per game; 25% of builds); breweries built 1.86 per player per game.
- At build time: sellable 764 of 784 (97%), no merchant 17 of 784 (2%), not enough beer 3 of 784 (0%)
- Outcome: sold 742 of 784 (95%), unsold at era end 34 of 784 (4%), removed first 8 of 784 (1%)
  - built sellable: sold 740 of 764 (97%)
  - built without a merchant: sold 1 of 17 (6%)
  - built short of beer: sold 1 of 3 (33%)
- Unsold tiles' main obstacle over their life: no merchant 12 of 34 (35%), beer 17 of 34 (50%), sellable but not sold 0 of 34 (0%), built in the era's last turn 5 of 34 (15%); VP left unscored 144 (0.5 per player per game)
- Owner turns while waiting: sellable 754 of 1216 (62%), blocked by merchant 73 of 1216 (6%), blocked by beer 389 of 1216 (32%)
- By industry (built → sold): cottonMill 342 → 323, manufacturer 356 → 349, pottery 86 → 70
- Sell legal at 755 of 10500 (7%) of turns; taken 743 of 755 (98%); otherwise: build 6, loan 4, develop 2

**Examples**

### normal (sell: calibrated): 4 players, 100 games

**Development:** 2664 Develop actions (6.66 per player per game) removing 5022 tiles; iron spent £53 per player per game.
- Canal / Rail: 3488 / 1534; removed tile Level I 2591 of 5022 (52%), Canal-only 2591 of 5022 (52%)
- The industry was already buildable somewhere: 2356 of 5022 (47%); its top tile was unbuildable in this era (developing was the only way on): 16 of 5022 (0%) (later built 7 of 16 (44%))
- The industry was built later: 2671 of 5022 (53%); and a later tile of it flipped: 1536 of 5022 (31%)
- By industry (developed → later built): brewery 1579 → 906, cottonMill 1351 → 645, coalMine 1112 → 702, ironWorks 616 → 286, manufacturer 363 → 132, pottery 1 → 0
- Timing (rounds left in the GAME): 1–2 rounds left: 972 (built later 2%); 3–5 rounds left: 461 (built later 17%); 6–10 rounds left: 1120 (built later 64%); 11–20 rounds left: 2469 (built later 75%)
- A Build was available at 3912 of 5022 (78%) of these; Develop outscored the best Build by 1.1 on average

**Selling:** 1061 sellable tiles built (2.65 per player per game; 27% of builds); breweries built 1.44 per player per game.
- At build time: sellable 1029 of 1061 (97%), no merchant 29 of 1061 (3%), not enough beer 3 of 1061 (0%)
- Outcome: sold 971 of 1061 (92%), unsold at era end 73 of 1061 (7%), removed first 17 of 1061 (2%)
  - built sellable: sold 965 of 1029 (94%)
  - built without a merchant: sold 5 of 29 (17%)
  - built short of beer: sold 1 of 3 (33%)
- Unsold tiles' main obstacle over their life: no merchant 16 of 73 (22%), beer 39 of 73 (53%), sellable but not sold 2 of 73 (3%), built in the era's last turn 16 of 73 (22%); VP left unscored 306 (0.8 per player per game)
- Owner turns while waiting: sellable 999 of 1851 (54%), blocked by merchant 153 of 1851 (8%), blocked by beer 699 of 1851 (38%)
- By industry (built → sold): cottonMill 556 → 513, manufacturer 378 → 359, pottery 127 → 99
- Sell legal at 1002 of 12400 (8%) of turns; taken 974 of 1002 (97%); otherwise: build 14, loan 6, develop 6, network 2

**Examples**


# 6. Legality and fairness probe of the new production AI (`ai-audit.js --games 10`)

| Players | Difficulty | Decisions | Illegal | State changed | Changes with resampled opponent hands | Changes with reshuffled deck | Moves leaving a choice to the engine | Rail networks with a double link legal | Changed by the information correction | Changed by the rounds correction |
|---|---|---|---|---|---|---|---|---|---|---|
| 2 | easy | 780 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 22 (2.8%) (coal 5, merchant 9, freeDevelop 3, beer 5) | 27 of 48 | 0 (0.0%) | 37 (4.7%) |
| 2 | normal | 780 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 38 (4.9%) (freeDevelop 3, merchant 16, beer 11, coal 8) | 26 of 74 | 0 (0.0%) | 60 (7.7%) |
| 2 | hard | 780 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 38 (4.9%) (merchant 20, beer 7, coal 7, freeDevelop 1, iron 3) | 27 of 68 | 16 (2.1%) | 54 (6.9%) |
| 3 | easy | 1050 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 56 (5.3%) (merchant 14, freeDevelop 10, coal 25, beer 5, iron 2) | 36 of 109 | 0 (0.0%) | 62 (5.9%) |
| 3 | normal | 1050 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 59 (5.6%) (merchant 21, coal 16, freeDevelop 12, beer 10) | 34 of 106 | 0 (0.0%) | 109 (10.4%) |
| 3 | hard | 1050 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 61 (5.8%) (merchant 20, coal 22, beer 10, freeDevelop 9) | 27 of 98 | 34 (3.2%) | 105 (10.0%) |
| 4 | easy | 1240 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 66 (5.3%) (freeDevelop 10, merchant 29, coal 24, beer 3) | 65 of 125 | 0 (0.0%) | 116 (9.4%) |
| 4 | normal | 1240 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 70 (5.6%) (freeDevelop 9, coal 23, merchant 27, beer 10, iron 1) | 44 of 131 | 0 (0.0%) | 152 (12.3%) |
| 4 | hard | 1240 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 99 (8.0%) (merchant 36, coal 35, beer 13, freeDevelop 9, iron 6) | 41 of 126 | 50 (4.0%) | 140 (11.3%) |


