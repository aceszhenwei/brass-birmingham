# Overbuild Research: Results (Assignment 8)

Generated output of the research scripts, used by [the Assignment 8 report](ai-overbuild-a8.md). The report's [Reproducing the experiments](ai-overbuild-a8.md#reproducing-the-experiments) section regenerates every number; the raw per-game data is not committed.

Policy names: `<level>~a6` is the AI of Assignments 6–7 (production before this assignment; `AIPlayer.LEGACY_A6`). `~opportunity` was adopted and is now the production AI. `~opportunity-unflipped` and `~no-unflipped` are the other candidates ([plan](ai-overbuild-a8-plan.md)). Columns in §1–3: the candidate's win share and VP difference (candidate − baseline) ± 1.96 SE; pooled = 2, 3 and 4 players weighted equally (`ai-criteria.js`).

# 1. Exploration matchups (seeds 200000 + 1000 × players + i)

Seat-balanced, against `normal~a6`; 2 players: 100 seeds, 3 and 4 players: 40 seeds.

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| normal~opportunity vs normal~a6 | 2 | 200 | 53.3% ± 6.9 | +3.63 ± 5.80 | includes 0 |
| normal~opportunity vs normal~a6 | 3 | 240 | 55.0% ± 6.3 | +3.81 ± 3.83 | includes 0 |
| normal~opportunity vs normal~a6 | 4 | 240 | 55.0% ± 6.3 | +4.08 ± 3.18 | above 0 |
| normal~opportunity vs normal~a6 | **pooled** | 680 | 54.4% ± 3.8 | +3.84 ± 2.55 | **improves** |
| normal~opportunity-unflipped vs normal~a6 | 2 | 200 | 52.0% ± 6.9 | +0.20 ± 5.20 | includes 0 |
| normal~opportunity-unflipped vs normal~a6 | 3 | 240 | 51.3% ± 6.3 | +2.70 ± 3.95 | includes 0 |
| normal~opportunity-unflipped vs normal~a6 | 4 | 240 | 50.4% ± 6.3 | +1.70 ± 2.93 | includes 0 |
| normal~opportunity-unflipped vs normal~a6 | **pooled** | 680 | 51.2% ± 3.8 | +1.54 ± 2.39 | no improvement |
| normal~no-unflipped vs normal~a6 | 2 | 200 | 54.0% ± 6.9 | +1.55 ± 5.12 | includes 0 |
| normal~no-unflipped vs normal~a6 | 3 | 240 | 52.1% ± 6.3 | +1.57 ± 3.99 | includes 0 |
| normal~no-unflipped vs normal~a6 | 4 | 240 | 47.9% ± 6.3 | +1.41 ± 2.94 | includes 0 |
| normal~no-unflipped vs normal~a6 | **pooled** | 680 | 51.3% ± 3.8 | +1.51 ± 2.38 | no improvement |

# 2. Validation matchups (held-out seeds 400000 + 1000 × players + i)

`opportunity` against the previous production AI at every difficulty; 2 players: 150 seeds, 3 and 4 players: 60 seeds.

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| easy~opportunity vs easy~a6 | 2 | 300 | 55.7% ± 5.6 | +5.52 ± 4.24 | above 0 |
| easy~opportunity vs easy~a6 | 3 | 360 | 55.8% ± 5.1 | +3.99 ± 3.19 | above 0 |
| easy~opportunity vs easy~a6 | 4 | 360 | 58.1% ± 5.1 | +2.36 ± 2.45 | includes 0 |
| easy~opportunity vs easy~a6 | **pooled** | 1020 | 56.5% ± 3.1 | +3.96 ± 1.95 | **improves** |
| normal~opportunity vs normal~a6 | 2 | 300 | 56.7% ± 5.6 | +6.38 ± 4.47 | above 0 |
| normal~opportunity vs normal~a6 | 3 | 360 | 52.2% ± 5.2 | +2.41 ± 3.53 | includes 0 |
| normal~opportunity vs normal~a6 | 4 | 360 | 54.7% ± 5.1 | +1.88 ± 2.48 | includes 0 |
| normal~opportunity vs normal~a6 | **pooled** | 1020 | 54.5% ± 3.1 | +3.56 ± 2.07 | **improves** |
| hard~opportunity vs hard~a6 | 2 | 300 | 57.5% ± 5.6 | +4.75 ± 4.51 | above 0 |
| hard~opportunity vs hard~a6 | 3 | 360 | 54.2% ± 5.2 | +2.59 ± 3.37 | includes 0 |
| hard~opportunity vs hard~a6 | 4 | 360 | 53.1% ± 5.2 | +3.42 ± 2.51 | above 0 |
| hard~opportunity vs hard~a6 | **pooled** | 1020 | 54.9% ± 3.1 | +3.58 ± 2.05 | **improves** |

# 3. Generalisation: a different opponent (held-out seeds)

Normal with and without the candidate, each against the previous Hard and Easy; 2 players: 100 seeds, 3 and 4 players: 40 seeds.

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| normal~opportunity vs hard~a6 | 2 | 200 | 48.0% ± 6.9 | -1.57 ± 5.64 | includes 0 |
| normal~opportunity vs hard~a6 | 3 | 240 | 55.4% ± 6.3 | +6.32 ± 4.26 | above 0 |
| normal~opportunity vs hard~a6 | 4 | 240 | 57.1% ± 6.3 | +3.60 ± 3.02 | above 0 |
| normal~opportunity vs hard~a6 | **pooled** | 680 | 53.5% ± 3.8 | +2.78 ± 2.56 | **improves** |
| normal~a6 vs hard~a6 | 2 | 200 | 45.0% ± 6.9 | -6.05 ± 5.22 | **below 0** |
| normal~a6 vs hard~a6 | 3 | 240 | 52.1% ± 6.3 | +2.58 ± 4.05 | includes 0 |
| normal~a6 vs hard~a6 | 4 | 240 | 53.8% ± 6.3 | +1.09 ± 2.84 | includes 0 |
| normal~a6 vs hard~a6 | **pooled** | 680 | 50.3% ± 3.8 | -0.80 ± 2.40 | no improvement; **regression** |
| normal~opportunity vs easy~a6 | 2 | 200 | 54.8% ± 6.9 | +6.75 ± 5.22 | above 0 |
| normal~opportunity vs easy~a6 | 3 | 240 | 58.1% ± 6.2 | +8.75 ± 3.86 | above 0 |
| normal~opportunity vs easy~a6 | 4 | 240 | 58.8% ± 6.2 | +5.28 ± 3.23 | above 0 |
| normal~opportunity vs easy~a6 | **pooled** | 680 | 57.2% ± 3.7 | +6.92 ± 2.42 | **improves** |
| normal~a6 vs easy~a6 | 2 | 200 | 52.5% ± 6.9 | +4.77 ± 5.17 | includes 0 |
| normal~a6 vs easy~a6 | 3 | 240 | 57.9% ± 6.3 | +3.82 ± 3.89 | includes 0 |
| normal~a6 vs easy~a6 | 4 | 240 | 51.3% ± 6.3 | +3.50 ± 3.04 | above 0 |
| normal~a6 vs easy~a6 | **pooled** | 680 | 53.9% ± 3.7 | +4.03 ± 2.38 | **improves** |

# 4. Paired mirror comparisons (exploration seeds, 100 per player count)

Every seat plays the same policy; each candidate is compared with `normal~a6` seed by seed (`ai-compare.js`). Difference = candidate − baseline per player per game ± 1.96 SE; bold when the interval excludes 0.

### normal~opportunity vs normal~a6, 2 players (100 paired seeds)

| Measure (per player per game) | normal~a6 | normal~opportunity | Difference |
|---|---|---|---|
| Final VP | 41.54 | 46.49 | **+4.96 ± 4.60** |
| Winner VP | 56.50 | 64.87 | **+8.37 ± 4.61** |
| Link VP | 16.98 | 19.29 | **+2.31 ± 1.21** |
| Tile VP | 27.34 | 30.40 | **+3.06 ± 2.82** |
| Income level | -3.44 | -3.71 | -0.26 ± 0.92 |
| Money left | 10.89 | 11.31 | +0.42 ± 2.28 |
| Loans | 6.08 | 6.09 | +0.01 ± 0.25 |
| Builds | 12.70 | 11.96 | **-0.74 ± 0.49** |
| Develop actions | 6.35 | 6.27 | -0.08 ± 0.32 |
| Tiles sold | 2.03 | 1.96 | -0.07 ± 0.20 |
| Networks | 6.79 | 7.08 | **+0.29 ± 0.27** |
| Links built | 6.79 | 7.08 | **+0.29 ± 0.27** |
| Passes | 4.32 | 5.03 | +0.71 ± 1.09 |
| Shortfall sales | 2.77 | 2.96 | +0.20 ± 0.46 |
| VP lost to shortfalls | 3.07 | 3.52 | +0.45 ± 1.00 |
| Own unflipped overbuilds | 1.53 | 0.11 | **-1.42 ± 0.18** |

### normal~opportunity vs normal~a6, 3 players (100 paired seeds)

| Measure (per player per game) | normal~a6 | normal~opportunity | Difference |
|---|---|---|---|
| Final VP | 39.22 | 44.09 | **+4.88 ± 3.03** |
| Winner VP | 59.65 | 65.78 | **+6.13 ± 3.68** |
| Link VP | 15.80 | 18.34 | **+2.54 ± 0.94** |
| Tile VP | 25.53 | 28.05 | **+2.52 ± 1.79** |
| Income level | -3.17 | -2.78 | +0.39 ± 0.76 |
| Money left | 12.04 | 11.13 | -0.91 ± 1.83 |
| Loans | 5.46 | 5.45 | -0.01 ± 0.18 |
| Builds | 11.74 | 11.41 | **-0.34 ± 0.31** |
| Develop actions | 5.64 | 5.68 | +0.04 ± 0.22 |
| Tiles sold | 1.94 | 1.93 | -0.01 ± 0.14 |
| Networks | 6.12 | 6.58 | **+0.45 ± 0.22** |
| Links built | 6.12 | 6.58 | **+0.45 ± 0.22** |
| Passes | 3.88 | 3.77 | -0.11 ± 0.64 |
| Shortfall sales | 2.50 | 2.55 | +0.05 ± 0.35 |
| VP lost to shortfalls | 2.40 | 2.53 | +0.13 ± 0.68 |
| Own unflipped overbuilds | 1.06 | 0.08 | **-0.98 ± 0.10** |

### normal~opportunity vs normal~a6, 4 players (100 paired seeds)

| Measure (per player per game) | normal~a6 | normal~opportunity | Difference |
|---|---|---|---|
| Final VP | 41.02 | 44.49 | **+3.46 ± 2.36** |
| Winner VP | 63.10 | 67.73 | **+4.63 ± 2.99** |
| Link VP | 15.92 | 18.01 | **+2.09 ± 0.78** |
| Tile VP | 25.36 | 26.72 | +1.36 ± 1.36 |
| Income level | -0.98 | -0.82 | +0.15 ± 0.62 |
| Money left | 13.10 | 13.74 | +0.64 ± 1.77 |
| Loans | 4.80 | 4.86 | +0.06 ± 0.13 |
| Builds | 11.13 | 10.44 | **-0.69 ± 0.22** |
| Develop actions | 5.31 | 5.43 | +0.12 ± 0.19 |
| Tiles sold | 2.03 | 2.16 | +0.13 ± 0.13 |
| Networks | 5.59 | 5.94 | **+0.35 ± 0.17** |
| Links built | 5.59 | 5.94 | **+0.35 ± 0.17** |
| Passes | 2.10 | 2.12 | +0.01 ± 0.42 |
| Shortfall sales | 1.64 | 1.67 | +0.03 ± 0.23 |
| VP lost to shortfalls | 1.57 | 1.73 | +0.17 ± 0.50 |
| Own unflipped overbuilds | 0.80 | 0.07 | **-0.73 ± 0.08** |

### normal~opportunity-unflipped vs normal~a6, 2 players (100 paired seeds)

| Measure (per player per game) | normal~a6 | normal~opportunity-unflipped | Difference |
|---|---|---|---|
| Final VP | 41.54 | 45.60 | **+4.07 ± 3.13** |
| Winner VP | 56.50 | 60.93 | **+4.43 ± 3.44** |
| Link VP | 16.98 | 18.28 | **+1.30 ± 0.91** |
| Tile VP | 27.34 | 29.38 | **+2.04 ± 1.92** |
| Income level | -3.44 | -2.30 | **+1.15 ± 0.79** |
| Money left | 10.89 | 12.88 | +1.99 ± 2.14 |
| Loans | 6.08 | 5.98 | -0.10 ± 0.17 |
| Builds | 12.70 | 12.52 | -0.17 ± 0.33 |
| Develop actions | 6.35 | 6.76 | **+0.41 ± 0.27** |
| Tiles sold | 2.03 | 2.21 | **+0.18 ± 0.16** |
| Networks | 6.79 | 7.02 | **+0.23 ± 0.22** |
| Links built | 6.79 | 7.02 | **+0.23 ± 0.22** |
| Passes | 4.32 | 3.81 | -0.51 ± 0.71 |
| Shortfall sales | 2.77 | 2.77 | +0.00 ± 0.36 |
| VP lost to shortfalls | 3.07 | 2.45 | **-0.62 ± 0.61** |
| Own unflipped overbuilds | 1.53 | 0.10 | **-1.43 ± 0.18** |

### normal~opportunity-unflipped vs normal~a6, 3 players (100 paired seeds)

| Measure (per player per game) | normal~a6 | normal~opportunity-unflipped | Difference |
|---|---|---|---|
| Final VP | 39.22 | 40.17 | +0.95 ± 1.79 |
| Winner VP | 59.65 | 60.12 | +0.47 ± 2.18 |
| Link VP | 15.80 | 15.96 | +0.16 ± 0.60 |
| Tile VP | 25.53 | 26.18 | +0.65 ± 1.12 |
| Income level | -3.17 | -1.87 | **+1.30 ± 0.63** |
| Money left | 12.04 | 11.04 | -1.00 ± 1.75 |
| Loans | 5.46 | 5.26 | **-0.20 ± 0.15** |
| Builds | 11.74 | 11.58 | -0.17 ± 0.21 |
| Develop actions | 5.64 | 5.96 | **+0.32 ± 0.16** |
| Tiles sold | 1.94 | 2.08 | **+0.14 ± 0.11** |
| Networks | 6.12 | 6.21 | +0.09 ± 0.16 |
| Links built | 6.12 | 6.21 | +0.09 ± 0.16 |
| Passes | 3.88 | 3.68 | -0.20 ± 0.40 |
| Shortfall sales | 2.50 | 2.49 | -0.01 ± 0.24 |
| VP lost to shortfalls | 2.40 | 2.19 | -0.21 ± 0.44 |
| Own unflipped overbuilds | 1.06 | 0.07 | **-1.00 ± 0.10** |

### normal~opportunity-unflipped vs normal~a6, 4 players (100 paired seeds)

| Measure (per player per game) | normal~a6 | normal~opportunity-unflipped | Difference |
|---|---|---|---|
| Final VP | 41.02 | 42.51 | **+1.49 ± 1.44** |
| Winner VP | 63.10 | 64.74 | +1.64 ± 2.02 |
| Link VP | 15.92 | 16.36 | +0.44 ± 0.52 |
| Tile VP | 25.36 | 26.18 | +0.81 ± 0.85 |
| Income level | -0.98 | -0.07 | **+0.91 ± 0.49** |
| Money left | 13.10 | 13.22 | +0.12 ± 1.36 |
| Loans | 4.80 | 4.68 | **-0.12 ± 0.10** |
| Builds | 11.13 | 10.80 | **-0.33 ± 0.17** |
| Develop actions | 5.31 | 5.56 | **+0.25 ± 0.15** |
| Tiles sold | 2.03 | 2.18 | **+0.14 ± 0.10** |
| Networks | 5.59 | 5.70 | +0.10 ± 0.14 |
| Links built | 5.59 | 5.70 | +0.10 ± 0.14 |
| Passes | 2.10 | 2.06 | -0.04 ± 0.29 |
| Shortfall sales | 1.64 | 1.51 | -0.13 ± 0.15 |
| VP lost to shortfalls | 1.57 | 1.45 | -0.12 ± 0.30 |
| Own unflipped overbuilds | 0.80 | 0.05 | **-0.75 ± 0.08** |

### normal~no-unflipped vs normal~a6, 2 players (100 paired seeds)

| Measure (per player per game) | normal~a6 | normal~no-unflipped | Difference |
|---|---|---|---|
| Final VP | 41.54 | 44.45 | +2.92 ± 3.11 |
| Winner VP | 56.50 | 59.54 | +3.04 ± 3.71 |
| Link VP | 16.98 | 18.05 | **+1.08 ± 0.87** |
| Tile VP | 27.34 | 28.91 | +1.57 ± 1.98 |
| Income level | -3.44 | -2.31 | **+1.14 ± 0.75** |
| Money left | 10.89 | 11.33 | +0.43 ± 2.23 |
| Loans | 6.08 | 5.87 | **-0.20 ± 0.17** |
| Builds | 12.70 | 12.35 | -0.35 ± 0.36 |
| Develop actions | 6.35 | 6.69 | **+0.34 ± 0.29** |
| Tiles sold | 2.03 | 2.22 | **+0.19 ± 0.16** |
| Networks | 6.79 | 7.03 | **+0.24 ± 0.20** |
| Links built | 6.79 | 7.03 | **+0.24 ± 0.20** |
| Passes | 4.32 | 4.14 | -0.18 ± 0.73 |
| Shortfall sales | 2.77 | 2.75 | -0.02 ± 0.33 |
| VP lost to shortfalls | 3.07 | 2.93 | -0.14 ± 0.71 |
| Own unflipped overbuilds | 1.53 | 0.00 | **-1.53 ± 0.18** |

### normal~no-unflipped vs normal~a6, 3 players (100 paired seeds)

| Measure (per player per game) | normal~a6 | normal~no-unflipped | Difference |
|---|---|---|---|
| Final VP | 39.22 | 41.39 | **+2.17 ± 2.10** |
| Winner VP | 59.65 | 61.45 | +1.80 ± 2.47 |
| Link VP | 15.80 | 16.44 | +0.64 ± 0.73 |
| Tile VP | 25.53 | 26.91 | **+1.38 ± 1.28** |
| Income level | -3.17 | -1.94 | **+1.23 ± 0.68** |
| Money left | 12.04 | 11.67 | -0.37 ± 1.67 |
| Loans | 5.46 | 5.32 | -0.14 ± 0.14 |
| Builds | 11.74 | 11.69 | -0.05 ± 0.24 |
| Develop actions | 5.64 | 5.95 | **+0.31 ± 0.17** |
| Tiles sold | 1.94 | 2.13 | **+0.19 ± 0.13** |
| Networks | 6.12 | 6.26 | +0.14 ± 0.18 |
| Links built | 6.12 | 6.26 | +0.14 ± 0.18 |
| Passes | 3.88 | 3.45 | -0.43 ± 0.46 |
| Shortfall sales | 2.50 | 2.34 | -0.16 ± 0.27 |
| VP lost to shortfalls | 2.40 | 2.19 | -0.21 ± 0.52 |
| Own unflipped overbuilds | 1.06 | 0.00 | **-1.06 ± 0.10** |

### normal~no-unflipped vs normal~a6, 4 players (100 paired seeds)

| Measure (per player per game) | normal~a6 | normal~no-unflipped | Difference |
|---|---|---|---|
| Final VP | 41.02 | 43.28 | **+2.26 ± 1.52** |
| Winner VP | 63.10 | 65.06 | +1.96 ± 1.97 |
| Link VP | 15.92 | 16.59 | **+0.67 ± 0.53** |
| Tile VP | 25.36 | 26.53 | **+1.17 ± 0.90** |
| Income level | -0.98 | -0.13 | **+0.85 ± 0.48** |
| Money left | 13.10 | 14.01 | +0.91 ± 1.52 |
| Loans | 4.80 | 4.69 | **-0.11 ± 0.10** |
| Builds | 11.13 | 10.81 | **-0.32 ± 0.18** |
| Develop actions | 5.31 | 5.59 | **+0.28 ± 0.16** |
| Tiles sold | 2.03 | 2.24 | **+0.21 ± 0.10** |
| Networks | 5.59 | 5.75 | **+0.16 ± 0.14** |
| Links built | 5.59 | 5.75 | **+0.16 ± 0.14** |
| Passes | 2.10 | 1.88 | -0.22 ± 0.32 |
| Shortfall sales | 1.64 | 1.54 | -0.10 ± 0.17 |
| VP lost to shortfalls | 1.57 | 1.25 | -0.32 ± 0.37 |
| Own unflipped overbuilds | 0.80 | 0.00 | **-0.80 ± 0.08** |

# 5. Overbuild probes (`ai-overbuild.js`, exploration mirror seeds, 100 games each)

## 5.1 Before: the AI of Assignments 6–7, every level and player count

### easy: 2 players, 100 games: 463 own overbuilds in 2111 builds (21.9%; 2.31 per player per game), 1 opponent overbuilds

| Class | Overbuilds | Canal / Rail | Mean rounds left | Industries | Cubes lost | Old tile VP | Spent | New tile flipped by era end | Fresh build available | Same industry available fresh |
|---|---|---|---|---|---|---|---|---|---|---|
| canal-level1 | 36 | 36 / 0 | 5.3 | pottery 18, coalMine 8, ironWorks 4, brewery 3, cottonMill 2, manufacturer 1 | 28 | 0 (flipped) | £179 | 1 of 36 (3%) | 18 of 36 (50%) | 13 of 36 (36%) |
| flipped | 244 | 159 / 85 | 4.5 | ironWorks 176, cottonMill 33, coalMine 21, manufacturer 11, brewery 2, pottery 1 | 0 | 1157 (flipped) | £3145 | 135 of 241 (56%) | 238 of 244 (98%) | 105 of 244 (43%) |
| cubes | 115 | 33 / 82 | 6.5 | coalMine 101, ironWorks 14 | 335 | 0 (flipped) | £1421 | 19 of 115 (17%) | 107 of 115 (93%) | 94 of 115 (82%) |
| unflipped | 68 | 6 / 62 | 4.2 | brewery 45, pottery 16, cottonMill 4, manufacturer 3 | 79 | 0 (flipped) | £1068 | 9 of 67 (13%) | 66 of 68 (97%) | 33 of 68 (49%) |
| all | 463 | 234 / 229 | 5.0 | ironWorks 194, coalMine 130, brewery 50, cottonMill 39, pottery 35, manufacturer 15 | 442 | 1157 (flipped) | £5813 | 164 of 459 (36%) | 429 of 463 (93%) | 245 of 463 (53%) |

For comparison, builds on empty spaces flipped by their era's end: 415 of 1648 (25%).
Where a build on an empty space was also possible, the overbuild outscored the best one by 1.0 on average (median 0.4).
Timing: 1–2 rounds left: 84, 3–4 rounds left: 123, 5–10 rounds left: 256.

**Examples**
- canal-level1: seed 202001, player 0, canal round 7 (4 left): brewery Lv1, 1 cubes → Lv2 for £7; score 3.1, best empty-space build 2.9, best other action develop 3.88; new tile: unflipped
- canal-level1: seed 202003, player 1, canal round 9 (2 left): pottery Lv1 → Lv2 for £1; score 1.1, best empty-space build –, best other action pass -0.50; new tile: replaced or sold
- flipped: seed 202001, player 1, rail round 5 (6 left): ironWorks Lv3 (flipped) → Lv4 for £12; score 6.5, best empty-space build 3.6, best other action develop 2.50; new tile: flipped
- flipped: seed 202001, player 0, rail round 8 (3 left): cottonMill Lv2 (flipped) → Lv3 for £22; score 6.2, best empty-space build 3.8, best other action network 2.16; new tile: flipped
- cubes: seed 202002, player 1, canal round 6 (5 left): ironWorks Lv2, 1 cubes → Lv3 for £12; score 5.4, best empty-space build 3.3, best other action develop 2.38; new tile: replaced or sold
- cubes: seed 202002, player 1, canal round 8 (3 left): coalMine Lv2, 3 cubes → Lv3 for £11; score 2.8, best empty-space build 2.6, best other action develop 1.66; new tile: replaced or sold
- unflipped: seed 202001, player 0, rail round 6 (5 left): brewery Lv2, 1 cubes → Lv4 for £9; score 5.4, best empty-space build 4.2, best other action develop 3.10; new tile: unflipped
- unflipped: seed 202002, player 0, rail round 8 (3 left): brewery Lv2, 2 cubes → Lv4 for £12; score 4.8, best empty-space build 4.6, best other action develop 2.08; new tile: unflipped

### normal: 2 players, 100 games: 589 own overbuilds in 2539 builds (23.2%; 2.94 per player per game), 3 opponent overbuilds

| Class | Overbuilds | Canal / Rail | Mean rounds left | Industries | Cubes lost | Old tile VP | Spent | New tile flipped by era end | Fresh build available | Same industry available fresh |
|---|---|---|---|---|---|---|---|---|---|---|
| canal-level1 | 30 | 30 / 0 | 5.2 | pottery 15, ironWorks 5, coalMine 4, manufacturer 3, cottonMill 3 | 18 | 0 (flipped) | £167 | 4 of 30 (13%) | 12 of 30 (40%) | 5 of 30 (17%) |
| flipped | 283 | 176 / 107 | 4.8 | ironWorks 177, cottonMill 54, coalMine 24, manufacturer 14, brewery 11, pottery 3 | 0 | 1320 (flipped) | £3638 | 164 of 283 (58%) | 269 of 283 (95%) | 95 of 283 (34%) |
| cubes | 146 | 53 / 93 | 6.7 | coalMine 131, ironWorks 15 | 414 | 0 (flipped) | £1837 | 34 of 146 (23%) | 139 of 146 (95%) | 114 of 146 (78%) |
| unflipped | 130 | 5 / 125 | 4.6 | brewery 85, pottery 39, cottonMill 6 | 158 | 0 (flipped) | £1890 | 11 of 126 (9%) | 116 of 130 (89%) | 49 of 130 (38%) |
| all | 589 | 264 / 325 | 5.2 | ironWorks 197, coalMine 159, brewery 96, cottonMill 63, pottery 57, manufacturer 17 | 590 | 1320 (flipped) | £7532 | 213 of 585 (36%) | 536 of 589 (91%) | 263 of 589 (45%) |

For comparison, builds on empty spaces flipped by their era's end: 530 of 1950 (27%).
Where a build on an empty space was also possible, the overbuild outscored the best one by 1.1 on average (median 0.5).
Timing: 1–2 rounds left: 95, 3–4 rounds left: 154, 5–10 rounds left: 340.

**Examples**
- canal-level1: seed 202001, player 0, canal round 4 (7 left): pottery Lv1 → Lv2 for £1; score 1.6, best empty-space build –, best other action pass -0.50; new tile: unflipped
- canal-level1: seed 202002, player 0, canal round 6 (5 left): manufacturer Lv1 → Lv2 for £14; score 3.6, best empty-space build 3.0, best other action develop 3.52; new tile: replaced or sold
- flipped: seed 202001, player 1, canal round 7 (4 left): ironWorks Lv2 (flipped) → Lv3 for £12; score 4.7, best empty-space build 3.9, best other action network 3.69; new tile: flipped
- flipped: seed 202002, player 1, canal round 7 (4 left): ironWorks Lv2 (flipped) → Lv3 for £12; score 4.7, best empty-space build 2.7, best other action develop 2.74; new tile: flipped
- cubes: seed 202001, player 0, rail round 2 (9 left): coalMine Lv2, 3 cubes → Lv3 for £13; score 4.3, best empty-space build 4.0, best other action network 3.00; new tile: replaced or sold
- cubes: seed 202001, player 1, rail round 2 (9 left): coalMine Lv2, 2 cubes → Lv3 for £14; score 4.1, best empty-space build 4.0, best other action network 1.85; new tile: replaced or sold
- unflipped: seed 202002, player 1, rail round 4 (7 left): brewery Lv2, 2 cubes → Lv3 for £15; score 3.6, best empty-space build 3.4, best other action develop 1.06; new tile: replaced or sold
- unflipped: seed 202002, player 1, rail round 6 (5 left): brewery Lv3, 2 cubes → Lv4 for £15; score 4.8, best empty-space build 4.3, best other action develop 1.36; new tile: unflipped

### hard: 2 players, 100 games: 620 own overbuilds in 2612 builds (23.7%; 3.10 per player per game), 2 opponent overbuilds

| Class | Overbuilds | Canal / Rail | Mean rounds left | Industries | Cubes lost | Old tile VP | Spent | New tile flipped by era end | Fresh build available | Same industry available fresh |
|---|---|---|---|---|---|---|---|---|---|---|
| canal-level1 | 55 | 55 / 0 | 7.0 | ironWorks 33, pottery 15, cottonMill 6, manufacturer 1 | 66 | 0 (flipped) | £421 | 14 of 55 (25%) | 37 of 55 (67%) | 1 of 55 (2%) |
| flipped | 253 | 166 / 87 | 5.1 | ironWorks 162, cottonMill 44, coalMine 26, manufacturer 14, brewery 5, pottery 2 | 0 | 1168 (flipped) | £3292 | 153 of 251 (61%) | 246 of 253 (97%) | 76 of 253 (30%) |
| cubes | 160 | 73 / 87 | 6.2 | coalMine 130, ironWorks 30 | 463 | 0 (flipped) | £2001 | 39 of 160 (24%) | 149 of 160 (93%) | 114 of 160 (71%) |
| unflipped | 152 | 9 / 143 | 5.0 | brewery 101, pottery 44, cottonMill 4, manufacturer 3 | 186 | 0 (flipped) | £2102 | 10 of 152 (7%) | 130 of 152 (86%) | 70 of 152 (46%) |
| all | 620 | 303 / 317 | 5.6 | ironWorks 225, coalMine 156, brewery 106, pottery 61, cottonMill 54, manufacturer 18 | 715 | 1168 (flipped) | £7816 | 216 of 618 (35%) | 562 of 620 (91%) | 261 of 620 (42%) |

For comparison, builds on empty spaces flipped by their era's end: 492 of 1992 (25%).
Where a build on an empty space was also possible, the overbuild outscored the best one by 1.1 on average (median 0.7).
Timing: 1–2 rounds left: 76, 3–4 rounds left: 154, 5–10 rounds left: 390.

**Examples**
- canal-level1: seed 202001, player 0, canal round 6 (5 left): pottery Lv1 → Lv2 for £0; score 1.6, best empty-space build –, best other action pass -0.50; new tile: replaced or sold
- canal-level1: seed 202002, player 0, canal round 9 (2 left): pottery Lv1 → Lv2 for £2; score 1.2, best empty-space build –, best other action develop 1.34; new tile: unflipped
- flipped: seed 202001, player 1, rail round 3 (8 left): coalMine Lv2 (flipped) → Lv4 for £13; score 4.3, best empty-space build 4.3, best other action network 2.91; new tile: unflipped
- flipped: seed 202002, player 1, canal round 7 (4 left): ironWorks Lv2 (flipped) → Lv3 for £9; score 5.3, best empty-space build 4.8, best other action develop 2.86; new tile: replaced or sold
- cubes: seed 202001, player 0, rail round 2 (9 left): coalMine Lv2, 3 cubes → Lv3 for £14; score 4.2, best empty-space build 3.9, best other action network 2.25; new tile: replaced or sold
- cubes: seed 202002, player 1, rail round 4 (7 left): coalMine Lv2, 3 cubes → Lv3 for £11; score 3.9, best empty-space build 3.9, best other action network 2.45; new tile: replaced or sold
- unflipped: seed 202001, player 0, canal round 7 (4 left): pottery Lv2 → Lv3 for £22; score 7.8, best empty-space build 4.2, best other action develop 3.16; new tile: unflipped
- unflipped: seed 202002, player 0, rail round 3 (8 left): brewery Lv3, 2 cubes → Lv4 for £11; score 5.3, best empty-space build 2.7, best other action develop 2.80; new tile: unflipped

### easy: 3 players, 100 games: 565 own overbuilds in 3024 builds (18.7%; 1.88 per player per game), 6 opponent overbuilds

| Class | Overbuilds | Canal / Rail | Mean rounds left | Industries | Cubes lost | Old tile VP | Spent | New tile flipped by era end | Fresh build available | Same industry available fresh |
|---|---|---|---|---|---|---|---|---|---|---|
| canal-level1 | 34 | 34 / 0 | 4.6 | pottery 15, coalMine 6, cottonMill 5, ironWorks 4, manufacturer 4 | 19 | 0 (flipped) | £229 | 2 of 34 (6%) | 19 of 34 (56%) | 13 of 34 (38%) |
| flipped | 332 | 188 / 144 | 4.4 | ironWorks 211, cottonMill 37, coalMine 34, manufacturer 33, pottery 14, brewery 3 | 0 | 1531 (flipped) | £4122 | 178 of 331 (54%) | 311 of 332 (94%) | 122 of 332 (37%) |
| cubes | 128 | 10 / 118 | 6.2 | coalMine 121, ironWorks 7 | 362 | 0 (flipped) | £1566 | 21 of 128 (16%) | 126 of 128 (98%) | 111 of 128 (87%) |
| unflipped | 71 | 8 / 63 | 3.8 | pottery 35, brewery 28, manufacturer 4, cottonMill 4 | 47 | 0 (flipped) | £1127 | 8 of 69 (12%) | 59 of 71 (83%) | 23 of 71 (32%) |
| all | 565 | 240 / 325 | 4.8 | ironWorks 222, coalMine 161, pottery 64, cottonMill 46, manufacturer 41, brewery 31 | 428 | 1531 (flipped) | £7044 | 209 of 562 (37%) | 515 of 565 (91%) | 269 of 565 (48%) |

For comparison, builds on empty spaces flipped by their era's end: 712 of 2459 (29%).
Where a build on an empty space was also possible, the overbuild outscored the best one by 1.0 on average (median 0.5).
Timing: 1–2 rounds left: 106, 3–4 rounds left: 163, 5–10 rounds left: 296.

**Examples**
- canal-level1: seed 203002, player 2, canal round 2 (8 left): ironWorks Lv1, 2 cubes → Lv2 for £9; score 4.7, best empty-space build 3.0, best other action develop 4.60; new tile: flipped
- canal-level1: seed 203006, player 2, canal round 6 (4 left): pottery Lv1 → Lv2 for £2; score 0.9, best empty-space build 0.9, best other action pass -0.50; new tile: unflipped
- flipped: seed 203001, player 1, canal round 5 (5 left): manufacturer Lv1 (flipped) → Lv2 for £16; score 3.4, best empty-space build 3.0, best other action develop 3.16; new tile: unflipped
- flipped: seed 203002, player 2, canal round 6 (4 left): ironWorks Lv3 (flipped) → Lv4 for £15; score 6.5, best empty-space build 5.7, best other action develop 3.64; new tile: flipped
- cubes: seed 203001, player 1, rail round 1 (9 left): coalMine Lv2, 3 cubes → Lv3 for £11; score 4.5, best empty-space build 4.3, best other action network 3.02; new tile: replaced or sold
- cubes: seed 203001, player 1, rail round 2 (8 left): coalMine Lv3, 4 cubes → Lv4 for £13; score 4.4, best empty-space build 4.3, best other action network 3.02; new tile: unflipped
- unflipped: seed 203001, player 1, rail round 9 (1 left): brewery Lv2, 2 cubes → Lv3 for £15; score 2.8, best empty-space build 0.7, best other action develop 1.06; new tile: unknown
- unflipped: seed 203004, player 0, rail round 8 (2 left): manufacturer Lv4 → Lv5 for £18; score 5.9, best empty-space build 5.5, best other action develop 2.74; new tile: unflipped

### normal: 3 players, 100 games: 654 own overbuilds in 3523 builds (18.6%; 2.18 per player per game), 11 opponent overbuilds

| Class | Overbuilds | Canal / Rail | Mean rounds left | Industries | Cubes lost | Old tile VP | Spent | New tile flipped by era end | Fresh build available | Same industry available fresh |
|---|---|---|---|---|---|---|---|---|---|---|
| canal-level1 | 47 | 47 / 0 | 3.8 | cottonMill 22, pottery 11, manufacturer 8, ironWorks 4, coalMine 2 | 11 | 0 (flipped) | £525 | 6 of 47 (13%) | 36 of 47 (77%) | 17 of 47 (36%) |
| flipped | 335 | 207 / 128 | 4.7 | ironWorks 192, cottonMill 45, manufacturer 43, coalMine 38, pottery 12, brewery 5 | 0 | 1488 (flipped) | £4096 | 190 of 335 (57%) | 315 of 335 (94%) | 125 of 335 (37%) |
| cubes | 152 | 19 / 133 | 6.6 | coalMine 142, ironWorks 10 | 449 | 0 (flipped) | £2010 | 22 of 152 (14%) | 149 of 152 (98%) | 117 of 152 (77%) |
| unflipped | 120 | 6 / 114 | 4.1 | brewery 57, pottery 45, cottonMill 13, manufacturer 5 | 100 | 0 (flipped) | £1712 | 12 of 118 (10%) | 98 of 120 (82%) | 50 of 120 (42%) |
| all | 654 | 279 / 375 | 5.0 | ironWorks 206, coalMine 182, cottonMill 80, pottery 68, brewery 62, manufacturer 56 | 560 | 1488 (flipped) | £8343 | 230 of 652 (35%) | 598 of 654 (91%) | 309 of 654 (47%) |

For comparison, builds on empty spaces flipped by their era's end: 872 of 2869 (30%).
Where a build on an empty space was also possible, the overbuild outscored the best one by 1.0 on average (median 0.6).
Timing: 1–2 rounds left: 112, 3–4 rounds left: 188, 5–10 rounds left: 354.

**Examples**
- canal-level1: seed 203001, player 0, canal round 7 (3 left): cottonMill Lv1 → Lv2 for £14; score 4.0, best empty-space build 3.1, best other action network 1.84; new tile: unflipped
- canal-level1: seed 203002, player 0, canal round 8 (2 left): cottonMill Lv1 → Lv2 for £16; score 2.4, best empty-space build 2.2, best other action network 1.89; new tile: flipped
- flipped: seed 203001, player 2, rail round 4 (6 left): ironWorks Lv2 (flipped) → Lv3 for £10; score 6.1, best empty-space build 5.7, best other action network 3.28; new tile: flipped
- flipped: seed 203002, player 0, canal round 3 (7 left): ironWorks Lv1 (flipped) → Lv2 for £7; score 4.5, best empty-space build 3.7, best other action develop 3.88; new tile: replaced or sold
- cubes: seed 203001, player 2, rail round 6 (4 left): coalMine Lv3, 3 cubes → Lv4 for £11; score 3.8, best empty-space build 3.6, best other action network 2.66; new tile: unflipped
- cubes: seed 203002, player 0, rail round 3 (7 left): coalMine Lv2, 3 cubes → Lv3 for £12; score 3.7, best empty-space build 3.6, best other action network 3.50; new tile: replaced or sold
- unflipped: seed 203002, player 2, rail round 7 (3 left): pottery Lv2 → Lv3 for £22; score 4.8, best empty-space build 2.2, best other action network 2.20; new tile: unflipped
- unflipped: seed 203002, player 1, rail round 7 (3 left): cottonMill Lv2 → Lv3 for £20; score 3.9, best empty-space build 3.9, best other action develop 1.84; new tile: unflipped

### hard: 3 players, 100 games: 698 own overbuilds in 3598 builds (19.4%; 2.33 per player per game), 10 opponent overbuilds

| Class | Overbuilds | Canal / Rail | Mean rounds left | Industries | Cubes lost | Old tile VP | Spent | New tile flipped by era end | Fresh build available | Same industry available fresh |
|---|---|---|---|---|---|---|---|---|---|---|
| canal-level1 | 112 | 112 / 0 | 4.9 | cottonMill 34, ironWorks 23, pottery 21, manufacturer 18, coalMine 16 | 77 | 0 (flipped) | £1148 | 17 of 112 (15%) | 88 of 112 (79%) | 38 of 112 (34%) |
| flipped | 312 | 194 / 118 | 4.8 | ironWorks 184, manufacturer 47, cottonMill 38, coalMine 33, pottery 7, brewery 3 | 0 | 1431 (flipped) | £3917 | 176 of 311 (57%) | 295 of 312 (95%) | 100 of 312 (32%) |
| cubes | 159 | 24 / 135 | 6.3 | coalMine 152, ironWorks 7 | 466 | 0 (flipped) | £2003 | 21 of 159 (13%) | 156 of 159 (98%) | 130 of 159 (82%) |
| unflipped | 115 | 5 / 110 | 4.4 | brewery 73, pottery 32, manufacturer 6, cottonMill 4 | 120 | 0 (flipped) | £1626 | 10 of 112 (9%) | 101 of 115 (88%) | 46 of 115 (40%) |
| all | 698 | 335 / 363 | 5.1 | ironWorks 214, coalMine 201, cottonMill 76, brewery 76, manufacturer 71, pottery 60 | 663 | 1431 (flipped) | £8694 | 224 of 694 (32%) | 640 of 698 (92%) | 314 of 698 (45%) |

For comparison, builds on empty spaces flipped by their era's end: 694 of 2900 (24%).
Where a build on an empty space was also possible, the overbuild outscored the best one by 1.0 on average (median 0.6).
Timing: 1–2 rounds left: 100, 3–4 rounds left: 198, 5–10 rounds left: 400.

**Examples**
- canal-level1: seed 203001, player 2, canal round 8 (2 left): cottonMill Lv1 → Lv2 for £17; score 2.5, best empty-space build 1.7, best other action develop 1.84; new tile: replaced or sold
- canal-level1: seed 203002, player 2, canal round 2 (8 left): ironWorks Lv1, 2 cubes → Lv2 for £9; score 4.7, best empty-space build 3.0, best other action develop 4.60; new tile: replaced or sold
- flipped: seed 203001, player 0, canal round 4 (6 left): manufacturer Lv1 (flipped) → Lv2 for £14; score 3.3, best empty-space build 3.2, best other action develop 3.52; new tile: unflipped
- flipped: seed 203001, player 2, canal round 7 (3 left): ironWorks Lv1 (flipped) → Lv2 for £10; score 3.9, best empty-space build 2.5, best other action develop 3.64; new tile: flipped
- cubes: seed 203001, player 0, canal round 9 (1 left): coalMine Lv2, 3 cubes → Lv3 for £13; score 1.9, best empty-space build –, best other action develop 1.18; new tile: unflipped
- cubes: seed 203001, player 2, rail round 5 (5 left): coalMine Lv3, 4 cubes → Lv4 for £11; score 3.8, best empty-space build 3.7, best other action develop 2.44; new tile: unflipped
- unflipped: seed 203001, player 2, rail round 7 (3 left): brewery Lv2, 1 cubes → Lv3 for £12; score 2.8, best empty-space build 1.9, best other action develop 2.08; new tile: unflipped
- unflipped: seed 203003, player 1, rail round 4 (6 left): brewery Lv2, 2 cubes → Lv3 for £9; score 3.9, best empty-space build 2.9, best other action network 2.89; new tile: unflipped

### easy: 4 players, 100 games: 604 own overbuilds in 3718 builds (16.2%; 1.51 per player per game), 19 opponent overbuilds

| Class | Overbuilds | Canal / Rail | Mean rounds left | Industries | Cubes lost | Old tile VP | Spent | New tile flipped by era end | Fresh build available | Same industry available fresh |
|---|---|---|---|---|---|---|---|---|---|---|
| canal-level1 | 46 | 46 / 0 | 3.5 | pottery 25, cottonMill 9, manufacturer 6, ironWorks 4, coalMine 2 | 12 | 0 (flipped) | £311 | 4 of 46 (9%) | 21 of 46 (46%) | 11 of 46 (24%) |
| flipped | 387 | 194 / 193 | 3.9 | ironWorks 246, coalMine 56, cottonMill 39, manufacturer 26, pottery 15, brewery 5 | 0 | 1773 (flipped) | £4784 | 249 of 384 (65%) | 356 of 387 (92%) | 142 of 387 (37%) |
| cubes | 109 | 4 / 105 | 5.0 | coalMine 100, ironWorks 9 | 294 | 0 (flipped) | £1340 | 18 of 109 (17%) | 105 of 109 (96%) | 78 of 109 (72%) |
| unflipped | 62 | 2 / 60 | 3.3 | brewery 31, pottery 25, cottonMill 4, manufacturer 2 | 58 | 0 (flipped) | £916 | 3 of 62 (5%) | 51 of 62 (82%) | 28 of 62 (45%) |
| all | 604 | 246 / 358 | 4.0 | ironWorks 259, coalMine 158, pottery 65, cottonMill 52, brewery 36, manufacturer 34 | 364 | 1773 (flipped) | £7351 | 274 of 601 (46%) | 533 of 604 (88%) | 259 of 604 (43%) |

For comparison, builds on empty spaces flipped by their era's end: 1174 of 3114 (38%).
Where a build on an empty space was also possible, the overbuild outscored the best one by 1.1 on average (median 0.6).
Timing: 1–2 rounds left: 152, 3–4 rounds left: 223, 5–10 rounds left: 229.

**Examples**
- canal-level1: seed 204007, player 2, canal round 5 (4 left): manufacturer Lv1 → Lv2 for £14; score 3.3, best empty-space build 3.1, best other action develop 3.52; new tile: replaced or sold
- canal-level1: seed 204011, player 1, canal round 7 (2 left): cottonMill Lv1 → Lv2 for £14; score 3.9, best empty-space build 3.7, best other action develop 3.16; new tile: unflipped
- flipped: seed 204001, player 0, canal round 2 (7 left): ironWorks Lv1 (flipped) → Lv2 for £9; score 4.7, best empty-space build 3.3, best other action develop 4.36; new tile: replaced or sold
- flipped: seed 204001, player 0, canal round 3 (6 left): ironWorks Lv2 (flipped) → Lv3 for £10; score 5.7, best empty-space build 2.4, best other action develop 3.76; new tile: replaced or sold
- cubes: seed 204001, player 0, rail round 4 (5 left): coalMine Lv2, 3 cubes → Lv3 for £9; score 3.6, best empty-space build 3.6, best other action network 2.58; new tile: replaced or sold
- cubes: seed 204001, player 0, rail round 8 (1 left): coalMine Lv3, 2 cubes → Lv4 for £14; score 2.8, best empty-space build 2.8, best other action develop 1.84; new tile: unflipped
- unflipped: seed 204002, player 3, rail round 6 (3 left): brewery Lv2, 2 cubes → Lv3 for £14; score 2.8, best empty-space build 2.8, best other action network 2.09; new tile: unflipped
- unflipped: seed 204003, player 3, rail round 7 (2 left): manufacturer Lv2 → Lv4 for £14; score 2.4, best empty-space build 1.7, best other action network 1.40; new tile: unflipped

### normal: 4 players, 100 games: 757 own overbuilds in 4454 builds (17.0%; 1.89 per player per game), 16 opponent overbuilds

| Class | Overbuilds | Canal / Rail | Mean rounds left | Industries | Cubes lost | Old tile VP | Spent | New tile flipped by era end | Fresh build available | Same industry available fresh |
|---|---|---|---|---|---|---|---|---|---|---|
| canal-level1 | 50 | 50 / 0 | 3.4 | pottery 19, cottonMill 18, manufacturer 7, coalMine 5, ironWorks 1 | 12 | 0 (flipped) | £478 | 6 of 50 (12%) | 29 of 50 (58%) | 18 of 50 (36%) |
| flipped | 437 | 209 / 228 | 4.3 | ironWorks 219, cottonMill 76, coalMine 74, manufacturer 39, brewery 15, pottery 14 | 0 | 1915 (flipped) | £5623 | 255 of 437 (58%) | 410 of 437 (94%) | 161 of 437 (37%) |
| cubes | 176 | 7 / 169 | 5.5 | coalMine 165, ironWorks 11 | 485 | 0 (flipped) | £2119 | 30 of 175 (17%) | 167 of 176 (95%) | 107 of 176 (61%) |
| unflipped | 94 | 7 / 87 | 3.8 | brewery 49, pottery 29, cottonMill 14, manufacturer 2 | 88 | 0 (flipped) | £1448 | 5 of 90 (6%) | 79 of 94 (84%) | 37 of 94 (39%) |
| all | 757 | 273 / 484 | 4.5 | coalMine 244, ironWorks 231, cottonMill 108, brewery 64, pottery 62, manufacturer 48 | 585 | 1915 (flipped) | £9668 | 296 of 752 (39%) | 685 of 757 (90%) | 323 of 757 (43%) |

For comparison, builds on empty spaces flipped by their era's end: 1261 of 3697 (34%).
Where a build on an empty space was also possible, the overbuild outscored the best one by 1.0 on average (median 0.7).
Timing: 1–2 rounds left: 144, 3–4 rounds left: 232, 5–10 rounds left: 381.

**Examples**
- canal-level1: seed 204006, player 2, canal round 7 (2 left): pottery Lv1 → Lv2 for £1; score 1.1, best empty-space build –, best other action loan 0.48; new tile: unflipped
- canal-level1: seed 204007, player 2, canal round 4 (5 left): manufacturer Lv1 → Lv2 for £14; score 3.5, best empty-space build 3.5, best other action develop 3.52; new tile: unflipped
- flipped: seed 204001, player 2, canal round 3 (6 left): manufacturer Lv1 (flipped) → Lv2 for £13; score 3.4, best empty-space build 3.2, best other action develop 3.88; new tile: replaced or sold
- flipped: seed 204001, player 3, canal round 3 (6 left): ironWorks Lv1 (flipped) → Lv2 for £9; score 4.9, best empty-space build 4.1, best other action develop 3.76; new tile: flipped
- cubes: seed 204001, player 0, canal round 7 (2 left): coalMine Lv2, 3 cubes → Lv3 for £9; score 2.7, best empty-space build 2.6, best other action develop 2.26; new tile: unflipped
- cubes: seed 204001, player 3, rail round 3 (6 left): coalMine Lv2, 3 cubes → Lv3 for £13; score 3.4, best empty-space build 3.1, best other action network 3.25; new tile: replaced or sold
- unflipped: seed 204002, player 3, rail round 6 (3 left): brewery Lv3, 1 cubes → Lv4 for £13; score 4.5, best empty-space build 1.7, best other action network 2.22; new tile: unflipped
- unflipped: seed 204003, player 3, rail round 8 (1 left): pottery Lv1 → Lv2 for £0; score 0.8, best empty-space build –, best other action pass -0.50; new tile: unflipped

### hard: 4 players, 100 games: 847 own overbuilds in 4772 builds (17.7%; 2.12 per player per game), 18 opponent overbuilds

| Class | Overbuilds | Canal / Rail | Mean rounds left | Industries | Cubes lost | Old tile VP | Spent | New tile flipped by era end | Fresh build available | Same industry available fresh |
|---|---|---|---|---|---|---|---|---|---|---|
| canal-level1 | 102 | 102 / 0 | 4.4 | coalMine 22, manufacturer 21, ironWorks 21, cottonMill 21, pottery 17 | 82 | 0 (flipped) | £994 | 20 of 102 (20%) | 80 of 102 (78%) | 37 of 102 (36%) |
| flipped | 406 | 214 / 192 | 4.2 | ironWorks 218, cottonMill 83, coalMine 50, manufacturer 31, pottery 15, brewery 9 | 0 | 1850 (flipped) | £5151 | 239 of 405 (59%) | 376 of 406 (93%) | 108 of 406 (27%) |
| cubes | 209 | 5 / 204 | 5.9 | coalMine 207, ironWorks 2 | 603 | 0 (flipped) | £2565 | 19 of 209 (9%) | 209 of 209 (100%) | 149 of 209 (71%) |
| unflipped | 130 | 4 / 126 | 3.9 | brewery 75, pottery 41, cottonMill 8, manufacturer 6 | 137 | 0 (flipped) | £1905 | 8 of 127 (6%) | 108 of 130 (83%) | 53 of 130 (41%) |
| all | 847 | 325 / 522 | 4.6 | coalMine 279, ironWorks 241, cottonMill 112, brewery 84, pottery 73, manufacturer 58 | 822 | 1850 (flipped) | £10615 | 286 of 843 (34%) | 773 of 847 (91%) | 347 of 847 (41%) |

For comparison, builds on empty spaces flipped by their era's end: 1110 of 3925 (28%).
Where a build on an empty space was also possible, the overbuild outscored the best one by 1.0 on average (median 0.6).
Timing: 1–2 rounds left: 151, 3–4 rounds left: 267, 5–10 rounds left: 429.

**Examples**
- canal-level1: seed 204001, player 3, canal round 5 (4 left): manufacturer Lv1 → Lv2 for £11; score 3.4, best empty-space build 3.3, best other action develop 4.24; new tile: unflipped
- canal-level1: seed 204002, player 2, canal round 4 (5 left): pottery Lv1 → Lv2 for £0; score 0.8, best empty-space build –, best other action loan -0.15; new tile: replaced or sold
- flipped: seed 204001, player 3, canal round 4 (5 left): coalMine Lv2 (flipped) → Lv3 for £12; score 3.4, best empty-space build 2.9, best other action develop 3.52; new tile: unflipped
- flipped: seed 204001, player 1, canal round 5 (4 left): ironWorks Lv1 (flipped) → Lv2 for £8; score 4.3, best empty-space build 4.2, best other action develop 3.76; new tile: replaced or sold
- cubes: seed 204001, player 2, rail round 4 (5 left): coalMine Lv2, 3 cubes → Lv4 for £13; score 3.6, best empty-space build 2.8, best other action develop 2.38; new tile: unflipped
- cubes: seed 204001, player 0, rail round 4 (5 left): coalMine Lv2, 1 cubes → Lv3 for £9; score 3.3, best empty-space build 2.8, best other action network 3.50; new tile: unflipped
- unflipped: seed 204001, player 1, rail round 3 (6 left): brewery Lv2, 2 cubes → Lv3 for £10; score 3.6, best empty-space build 2.7, best other action network 3.75; new tile: unflipped
- unflipped: seed 204001, player 1, rail round 7 (2 left): brewery Lv3, 2 cubes → Lv4 for £13; score 4.2, best empty-space build 2.5, best other action develop 2.02; new tile: unflipped

## 5.2 After: `opportunity` (Normal)

### normal (overbuild: opportunity): 2 players, 100 games: 40 own overbuilds in 2391 builds (1.7%; 0.20 per player per game), 10 opponent overbuilds

| Class | Overbuilds | Canal / Rail | Mean rounds left | Industries | Cubes lost | Old tile VP | Spent | New tile flipped by era end | Fresh build available | Same industry available fresh |
|---|---|---|---|---|---|---|---|---|---|---|
| flipped | 18 | 15 / 3 | 2.6 | ironWorks 15, pottery 3 | 0 | 48 (flipped) | £253 | 15 of 18 (83%) | 10 of 18 (56%) | 0 of 18 (0%) |
| unflipped | 22 | 1 / 21 | 5.1 | pottery 21, brewery 1 | 1 | 0 (flipped) | £487 | 1 of 22 (5%) | 20 of 22 (91%) | 0 of 22 (0%) |
| all | 40 | 16 / 24 | 4.0 | pottery 24, ironWorks 15, brewery 1 | 1 | 48 (flipped) | £740 | 16 of 40 (40%) | 30 of 40 (75%) | 0 of 40 (0%) |

For comparison, builds on empty spaces flipped by their era's end: 897 of 2351 (38%).
Where a build on an empty space was also possible, the overbuild outscored the best one by 0.9 on average (median 0.7).
Timing: 1–2 rounds left: 14, 3–4 rounds left: 13, 5–10 rounds left: 13.

**Examples**
- flipped: seed 202009, player 1, rail round 5 (6 left): pottery Lv2 (flipped) → Lv3 for £22; score 4.4, best empty-space build 4.1, best other action network 1.90; new tile: flipped
- unflipped: seed 202003, player 1, rail round 5 (6 left): pottery Lv2 → Lv3 for £26; score 4.0, best empty-space build 3.6, best other action network 3.16; new tile: unflipped

### normal (overbuild: opportunity): 3 players, 100 games: 38 own overbuilds in 3422 builds (1.1%; 0.13 per player per game), 30 opponent overbuilds

| Class | Overbuilds | Canal / Rail | Mean rounds left | Industries | Cubes lost | Old tile VP | Spent | New tile flipped by era end | Fresh build available | Same industry available fresh |
|---|---|---|---|---|---|---|---|---|---|---|
| canal-level1 | 1 | 1 / 0 | 1.0 | coalMine 1 | 2 | 0 (flipped) | £7 | 0 of 1 (0%) | 0 of 1 (0%) | 0 of 1 (0%) |
| flipped | 13 | 11 / 2 | 1.8 | ironWorks 11, pottery 2 | 0 | 37 (flipped) | £185 | 11 of 13 (85%) | 8 of 13 (62%) | 1 of 13 (8%) |
| unflipped | 24 | 0 / 24 | 4.1 | pottery 23, brewery 1 | 2 | 0 (flipped) | £498 | 3 of 24 (13%) | 21 of 24 (88%) | 0 of 24 (0%) |
| all | 38 | 12 / 26 | 3.2 | pottery 25, ironWorks 11, brewery 1, coalMine 1 | 4 | 37 (flipped) | £690 | 14 of 38 (37%) | 29 of 38 (76%) | 1 of 38 (3%) |

For comparison, builds on empty spaces flipped by their era's end: 1318 of 3384 (39%).
Where a build on an empty space was also possible, the overbuild outscored the best one by 1.3 on average (median 0.8).
Timing: 1–2 rounds left: 17, 3–4 rounds left: 11, 5–10 rounds left: 10.

**Examples**
- canal-level1: seed 203074, player 0, canal round 9 (1 left): coalMine Lv1, 2 cubes → Lv2 for £7; score 0.7, best empty-space build –, best other action develop 0.76; new tile: unflipped
- flipped: seed 203004, player 1, canal round 6 (4 left): ironWorks Lv1 (flipped) → Lv4 for £15; score 2.5, best empty-space build 1.8, best other action network 1.64; new tile: flipped
- unflipped: seed 203007, player 2, rail round 8 (2 left): pottery Lv2 → Lv3 for £22; score 3.8, best empty-space build 1.8, best other action network 1.06; new tile: unflipped

### normal (overbuild: opportunity): 4 players, 100 games: 38 own overbuilds in 4177 builds (0.9%; 0.10 per player per game), 56 opponent overbuilds

| Class | Overbuilds | Canal / Rail | Mean rounds left | Industries | Cubes lost | Old tile VP | Spent | New tile flipped by era end | Fresh build available | Same industry available fresh |
|---|---|---|---|---|---|---|---|---|---|---|
| flipped | 12 | 11 / 1 | 1.8 | ironWorks 12 | 0 | 40 (flipped) | £153 | 11 of 11 (100%) | 6 of 12 (50%) | 0 of 12 (0%) |
| unflipped | 26 | 4 / 22 | 3.7 | pottery 25, brewery 1 | 2 | 0 (flipped) | £597 | 1 of 24 (4%) | 24 of 26 (92%) | 0 of 26 (0%) |
| all | 38 | 15 / 23 | 3.1 | pottery 25, ironWorks 12, brewery 1 | 2 | 40 (flipped) | £750 | 12 of 35 (34%) | 30 of 38 (79%) | 0 of 38 (0%) |

For comparison, builds on empty spaces flipped by their era's end: 1827 of 4139 (44%).
Where a build on an empty space was also possible, the overbuild outscored the best one by 1.3 on average (median 1.0).
Timing: 1–2 rounds left: 16, 3–4 rounds left: 12, 5–10 rounds left: 10.

**Examples**
- flipped: seed 204001, player 3, canal round 7 (2 left): ironWorks Lv1 (flipped) → Lv4 for £12; score 2.9, best empty-space build 2.0, best other action develop 1.36; new tile: flipped
- unflipped: seed 204001, player 3, rail round 4 (5 left): pottery Lv2 → Lv3 for £22; score 4.4, best empty-space build 3.4, best other action network 3.01; new tile: unflipped

# 6. Loans after the change (`ai-loans.js`, Normal, production AI)

Compare with [Assignment 7 results §4.1](ai-loans-a7-results.md#41-the-production-ai-assignment-6-loan-heuristic-every-level-and-player-count).

### normal: 2 players, 100 games, 7800 turn decisions, 1218 loans (6.09 per player per game)

**Situation**
- Era: Canal 590, Rail 628; in the first third of an era (rounds left ≥ 2/3 of the era) 496 of 1218 (41%), last two rounds 240 of 1218 (20%)
- Mean cash before £1.6; mean income level before -0.1; 1st / 2nd / 3rd / 4th+ loan of the player: 200 / 200 / 200 / 618
- Income payments still to come: mean 9.4, so each loan's −3 income levels cost on average £28 for the £30 raised; loans costing more than they raise (more than 10 payments left): 529 of 1218 (43%)
- No Build or Network affordable: 1167 of 1218 (96%); the loan made one affordable: 1210 of 1218 (99%); nothing affordable AND the loan enabled nothing: 0 of 1218 (0%)

**Why it was chosen**
- Cash-crunch bonus (+4) applied: 1167 of 1218 (96%); mean loan score 3.26 (base -0.26)
- Other actions available at the loan: pass 1218 of 1218 (100%), scout 962 of 1218 (79%), develop 102 of 1218 (8%), network 43 of 1218 (4%), sell 10 of 1218 (1%), build 8 of 1218 (1%)
- Best alternative: pass 885, scout 209, develop 89, network 25, sell 10; the loan would have lost without the crunch bonus in 723 of 1167 (62%) of crunch loans; chosen only through Easy's random pick: 0

**What followed**
- Enabling (needed for the next Build / Network): 838 of 1218 (69%); investment (≥ £15 on Build / Network / Develop within two actions): 249 of 1218 (20%); idle: 131 of 1218 (11%)
- The player's next action: build 865, develop 193, network 103, sell 11, scout 7
- Followed by an income shortfall in the same era: 416 of 1218 (34%) (enabling 334 of 838 (40%), idle 22 of 131 (17%))

**Examples**

### normal: 3 players, 100 games, 10500 turn decisions, 1634 loans (5.45 per player per game)

**Situation**
- Era: Canal 810, Rail 824; in the first third of an era (rounds left ≥ 2/3 of the era) 746 of 1634 (46%), last two rounds 357 of 1634 (22%)
- Mean cash before £1.6; mean income level before 0.1; 1st / 2nd / 3rd / 4th+ loan of the player: 300 / 300 / 299 / 735
- Income payments still to come: mean 8.4, so each loan's −3 income levels cost on average £25 for the £30 raised; loans costing more than they raise (more than 10 payments left): 620 of 1634 (38%)
- No Build or Network affordable: 1544 of 1634 (94%); the loan made one affordable: 1626 of 1634 (100%); nothing affordable AND the loan enabled nothing: 0 of 1634 (0%)

**Why it was chosen**
- Cash-crunch bonus (+4) applied: 1544 of 1634 (94%); mean loan score 3.33 (base -0.13)
- Other actions available at the loan: pass 1634 of 1634 (100%), scout 1399 of 1634 (86%), develop 148 of 1634 (9%), network 72 of 1634 (4%), build 20 of 1634 (1%), sell 8 of 1634 (0%)
- Best alternative: pass 1253, scout 185, develop 140, network 45, sell 8, build 3; the loan would have lost without the crunch bonus in 816 of 1544 (53%) of crunch loans; chosen only through Easy's random pick: 0

**What followed**
- Enabling (needed for the next Build / Network): 1104 of 1634 (68%); investment (≥ £15 on Build / Network / Develop within two actions): 389 of 1634 (24%); idle: 141 of 1634 (9%)
- The player's next action: build 1183, develop 274, network 130, sell 7
- Followed by an income shortfall in the same era: 550 of 1634 (34%) (enabling 435 of 1104 (39%), idle 13 of 141 (9%))

**Examples**

### normal: 4 players, 100 games, 12400 turn decisions, 1942 loans (4.86 per player per game)

**Situation**
- Era: Canal 942, Rail 1000; in the first third of an era (rounds left ≥ 2/3 of the era) 715 of 1942 (37%), last two rounds 496 of 1942 (26%)
- Mean cash before £1.6; mean income level before 0.6; 1st / 2nd / 3rd / 4th+ loan of the player: 400 / 398 / 387 / 757
- Income payments still to come: mean 7.2, so each loan's −3 income levels cost on average £22 for the £30 raised; loans costing more than they raise (more than 10 payments left): 561 of 1942 (29%)
- No Build or Network affordable: 1829 of 1942 (94%); the loan made one affordable: 1921 of 1942 (99%); nothing affordable AND the loan enabled nothing: 0 of 1942 (0%)

**Why it was chosen**
- Cash-crunch bonus (+4) applied: 1829 of 1942 (94%); mean loan score 3.49 (base -0.01)
- Other actions available at the loan: pass 1942 of 1942 (100%), scout 1679 of 1942 (86%), develop 195 of 1942 (10%), network 91 of 1942 (5%), build 26 of 1942 (1%), sell 8 of 1942 (0%)
- Best alternative: pass 1566, develop 186, scout 114, network 65, sell 8, build 3; the loan would have lost without the crunch bonus in 636 of 1829 (35%) of crunch loans; chosen only through Easy's random pick: 0

**What followed**
- Enabling (needed for the next Build / Network): 1214 of 1942 (63%); investment (≥ £15 on Build / Network / Develop within two actions): 513 of 1942 (26%); idle: 215 of 1942 (11%)
- The player's next action: build 1328, develop 359, network 160, sell 18, scout 1
- Followed by an income shortfall in the same era: 503 of 1942 (26%) (enabling 362 of 1214 (30%), idle 7 of 215 (3%))

**Examples**

# 7. Legality and fairness probe of the new production AI (`ai-audit.js --games 10`)

| Players | Difficulty | Decisions | Illegal | State changed | Changes with resampled opponent hands | Changes with reshuffled deck | Moves leaving a choice to the engine | Rail networks with a double link legal | Changed by the information correction | Changed by the rounds correction |
|---|---|---|---|---|---|---|---|---|---|---|
| 2 | easy | 780 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 31 (4.0%) (iron 6, merchant 17, freeDevelop 4, beer 1, coal 3) | 16 of 56 | 0 (0.0%) | 57 (7.3%) |
| 2 | normal | 780 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 28 (3.6%) (freeDevelop 6, iron 6, merchant 12, coal 3, beer 1) | 17 of 50 | 0 (0.0%) | 68 (8.7%) |
| 2 | hard | 780 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 18 (2.3%) (freeDevelop 4, merchant 8, beer 2, coal 4) | 11 of 57 | 18 (2.3%) | 60 (7.7%) |
| 3 | easy | 1050 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 41 (3.9%) (merchant 10, freeDevelop 9, coal 22) | 21 of 98 | 0 (0.0%) | 107 (10.2%) |
| 3 | normal | 1050 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 40 (3.8%) (merchant 13, freeDevelop 11, iron 3, beer 2, coal 11) | 20 of 87 | 0 (0.0%) | 120 (11.4%) |
| 3 | hard | 1050 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 42 (4.0%) (merchant 14, freeDevelop 14, coal 14) | 11 of 81 | 31 (3.0%) | 116 (11.0%) |
| 4 | easy | 1240 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 43 (3.5%) (freeDevelop 11, coal 12, merchant 19, beer 1) | 22 of 92 | 0 (0.0%) | 129 (10.4%) |
| 4 | normal | 1240 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 59 (4.8%) (freeDevelop 7, merchant 29, coal 20, beer 3) | 32 of 107 | 0 (0.0%) | 179 (14.4%) |
| 4 | hard | 1240 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 36 (2.9%) (merchant 18, freeDevelop 6, coal 12) | 10 of 86 | 40 (3.2%) | 182 (14.7%) |
