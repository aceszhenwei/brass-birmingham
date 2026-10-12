# Loan Research: Results (Assignment 7)

Generated output of the research scripts, used by [the Assignment 7 report](ai-loans-a7.md). The report's [Reproducing the experiments](ai-loans-a7.md#reproducing-the-experiments) section regenerates every number; the raw per-game data is not committed.

Policy names: `<level>+a6` is the production AI (the Assignment 6 loan heuristic). `+cashflow`, `+enabling` and `+cashflow+enabling` are the candidates, and `+never` is a no-loan ablation ([plan](ai-loans-a7-plan.md)).

# 1. Exploration matchups (seeds 200000 + 1000 × players + i)

Seat-balanced, against `normal+a6`; 2 players: 100 seeds, 3 and 4 players: 40 seeds. Columns: the candidate's win share and VP difference (candidate − baseline) ± 1.96 SE; pooled = the three player counts weighted equally (`ai-criteria.js`).

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| normal+cashflow vs normal+a6 | 2 | 200 | 50.0% ± 6.9 | -0.89 ± 5.22 | includes 0 |
| normal+cashflow vs normal+a6 | 3 | 240 | 49.6% ± 6.3 | -1.17 ± 3.84 | includes 0 |
| normal+cashflow vs normal+a6 | 4 | 240 | 47.9% ± 6.3 | -1.17 ± 3.03 | includes 0 |
| normal+cashflow vs normal+a6 | **pooled** | 680 | 49.2% ± 3.8 | -1.08 ± 2.39 | no improvement |
| normal+enabling vs normal+a6 | 2 | 200 | 53.5% ± 6.9 | +2.37 ± 5.03 | includes 0 |
| normal+enabling vs normal+a6 | 3 | 240 | 52.1% ± 6.3 | +0.51 ± 3.87 | includes 0 |
| normal+enabling vs normal+a6 | 4 | 240 | 49.2% ± 6.3 | -0.03 ± 2.79 | includes 0 |
| normal+enabling vs normal+a6 | **pooled** | 680 | 51.6% ± 3.8 | +0.95 ± 2.31 | no improvement |
| normal+cashflow+enabling vs normal+a6 | 2 | 200 | 44.3% ± 6.9 | -2.35 ± 4.97 | includes 0 |
| normal+cashflow+enabling vs normal+a6 | 3 | 240 | 44.2% ± 6.3 | -1.99 ± 3.65 | includes 0 |
| normal+cashflow+enabling vs normal+a6 | 4 | 240 | 43.8% ± 6.3 | -1.56 ± 2.70 | includes 0 |
| normal+cashflow+enabling vs normal+a6 | **pooled** | 680 | 44.1% ± 3.8 | -1.97 ± 2.24 | no improvement |
| normal+never vs normal+a6 | 2 | 200 | 38.5% ± 6.8 | -14.04 ± 4.26 | **below 0** |
| normal+never vs normal+a6 | 3 | 240 | 27.1% ± 5.6 | -18.24 ± 3.41 | **below 0** |
| normal+never vs normal+a6 | 4 | 240 | 17.1% ± 4.8 | -20.67 ± 2.60 | **below 0** |
| normal+never vs normal+a6 | **pooled** | 680 | 27.6% ± 3.3 | -17.65 ± 2.02 | no improvement; **regression** |

# 2. Validation matchups (held-out seeds 300000 + 1000 × players + i)

`enabling` against the production AI at every difficulty; 2 players: 150 seeds, 3 and 4 players: 60 seeds.

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| easy+enabling vs easy+a6 | 2 | 300 | 51.2% ± 5.6 | -1.11 ± 3.88 | includes 0 |
| easy+enabling vs easy+a6 | 3 | 360 | 54.2% ± 5.2 | +2.70 ± 3.02 | includes 0 |
| easy+enabling vs easy+a6 | 4 | 360 | 50.6% ± 5.2 | -0.71 ± 2.28 | includes 0 |
| easy+enabling vs easy+a6 | **pooled** | 1020 | 52.0% ± 3.1 | +0.29 ± 1.81 | no improvement |
| normal+enabling vs normal+a6 | 2 | 300 | 50.0% ± 5.6 | +1.25 ± 4.36 | includes 0 |
| normal+enabling vs normal+a6 | 3 | 360 | 52.0% ± 5.2 | +0.01 ± 3.16 | includes 0 |
| normal+enabling vs normal+a6 | 4 | 360 | 51.7% ± 5.2 | -0.27 ± 2.28 | includes 0 |
| normal+enabling vs normal+a6 | **pooled** | 1020 | 51.2% ± 3.1 | +0.33 ± 1.95 | no improvement |
| hard+enabling vs hard+a6 | 2 | 300 | 50.7% ± 5.6 | -1.41 ± 4.06 | includes 0 |
| hard+enabling vs hard+a6 | 3 | 360 | 50.6% ± 5.2 | +0.92 ± 3.09 | includes 0 |
| hard+enabling vs hard+a6 | 4 | 360 | 53.9% ± 5.2 | +1.45 ± 2.42 | includes 0 |
| hard+enabling vs hard+a6 | **pooled** | 1020 | 51.7% ± 3.1 | +0.32 ± 1.88 | no improvement |

# 3. Paired mirror comparisons (exploration seeds, 100 per player count)

Every seat plays the same policy; each candidate is compared with `normal+a6` seed by seed (`ai-compare.js`). Difference = candidate − baseline per player per game ± 1.96 SE; bold when the interval excludes 0.

### normal+cashflow vs normal+a6, 2 players (100 paired seeds)

| Measure (per player per game) | normal+a6 | normal+cashflow | Difference |
|---|---|---|---|
| Final VP | 41.54 | 38.41 | -3.13 ± 3.29 |
| Winner VP | 56.50 | 54.60 | -1.90 ± 3.38 |
| Link VP | 16.98 | 16.07 | **-0.91 ± 0.83** |
| Tile VP | 27.34 | 25.48 | -1.85 ± 1.94 |
| Income level | -3.44 | -4.96 | **-1.51 ± 0.65** |
| Money left | 10.89 | 15.26 | **+4.36 ± 2.61** |
| Loans | 6.08 | 6.21 | +0.14 ± 0.21 |
| Builds | 12.70 | 12.79 | +0.10 ± 0.34 |
| Develop actions | 6.35 | 5.95 | **-0.41 ± 0.20** |
| Tiles sold | 2.03 | 1.94 | -0.09 ± 0.17 |
| Networks | 6.79 | 6.42 | **-0.36 ± 0.18** |
| Links built | 6.79 | 6.42 | **-0.36 ± 0.18** |
| Passes | 4.32 | 5.07 | **+0.74 ± 0.64** |
| Shortfall sales | 2.77 | 3.06 | +0.30 ± 0.31 |
| VP lost to shortfalls | 3.07 | 3.46 | +0.39 ± 0.87 |
| Own unflipped overbuilds | 1.53 | 1.54 | +0.01 ± 0.17 |

### normal+cashflow vs normal+a6, 3 players (100 paired seeds)

| Measure (per player per game) | normal+a6 | normal+cashflow | Difference |
|---|---|---|---|
| Final VP | 39.22 | 37.81 | **-1.41 ± 1.34** |
| Winner VP | 59.65 | 57.30 | **-2.35 ± 1.94** |
| Link VP | 15.80 | 14.81 | **-1.00 ± 0.50** |
| Tile VP | 25.53 | 25.11 | -0.42 ± 0.83 |
| Income level | -3.17 | -4.27 | **-1.11 ± 0.34** |
| Money left | 12.04 | 16.85 | **+4.81 ± 2.13** |
| Loans | 5.46 | 5.71 | **+0.25 ± 0.11** |
| Builds | 11.74 | 11.96 | **+0.22 ± 0.15** |
| Develop actions | 5.64 | 5.43 | **-0.21 ± 0.12** |
| Tiles sold | 1.94 | 1.92 | -0.02 ± 0.08 |
| Networks | 6.12 | 5.85 | **-0.27 ± 0.11** |
| Links built | 6.12 | 5.85 | **-0.27 ± 0.11** |
| Passes | 3.88 | 3.96 | +0.08 ± 0.25 |
| Shortfall sales | 2.50 | 2.46 | -0.04 ± 0.15 |
| VP lost to shortfalls | 2.40 | 2.40 | +0.00 ± 0.35 |
| Own unflipped overbuilds | 1.06 | 1.11 | +0.04 ± 0.08 |

### normal+cashflow vs normal+a6, 4 players (100 paired seeds)

| Measure (per player per game) | normal+a6 | normal+cashflow | Difference |
|---|---|---|---|
| Final VP | 41.02 | 40.37 | -0.66 ± 0.93 |
| Winner VP | 63.10 | 61.98 | -1.12 ± 1.70 |
| Link VP | 15.92 | 15.35 | **-0.57 ± 0.41** |
| Tile VP | 25.36 | 25.34 | -0.01 ± 0.55 |
| Income level | -0.98 | -2.00 | **-1.03 ± 0.36** |
| Money left | 13.10 | 21.27 | **+8.17 ± 1.85** |
| Loans | 4.80 | 5.10 | **+0.30 ± 0.08** |
| Builds | 11.13 | 11.33 | **+0.20 ± 0.09** |
| Develop actions | 5.31 | 5.11 | **-0.20 ± 0.12** |
| Tiles sold | 2.03 | 2.03 | -0.00 ± 0.07 |
| Networks | 5.59 | 5.29 | **-0.30 ± 0.09** |
| Links built | 5.59 | 5.29 | **-0.30 ± 0.09** |
| Passes | 2.10 | 2.10 | -0.01 ± 0.11 |
| Shortfall sales | 1.64 | 1.63 | -0.01 ± 0.08 |
| VP lost to shortfalls | 1.57 | 1.58 | +0.01 ± 0.13 |
| Own unflipped overbuilds | 0.80 | 0.83 | +0.03 ± 0.05 |

### normal+enabling vs normal+a6, 2 players (100 paired seeds)

| Measure (per player per game) | normal+a6 | normal+enabling | Difference |
|---|---|---|---|
| Final VP | 41.54 | 39.45 | -2.10 ± 3.61 |
| Winner VP | 56.50 | 54.30 | -2.20 ± 3.89 |
| Link VP | 16.98 | 15.48 | **-1.49 ± 0.97** |
| Tile VP | 27.34 | 26.72 | -0.61 ± 2.24 |
| Income level | -3.44 | -4.47 | **-1.03 ± 0.77** |
| Money left | 10.89 | 11.48 | +0.59 ± 2.43 |
| Loans | 6.08 | 6.22 | +0.14 ± 0.25 |
| Builds | 12.70 | 13.16 | **+0.47 ± 0.46** |
| Develop actions | 6.35 | 5.72 | **-0.63 ± 0.24** |
| Tiles sold | 2.03 | 2.06 | +0.04 ± 0.18 |
| Networks | 6.79 | 6.07 | **-0.71 ± 0.26** |
| Links built | 6.79 | 6.07 | **-0.71 ± 0.26** |
| Passes | 4.32 | 5.17 | +0.84 ± 0.92 |
| Shortfall sales | 2.77 | 3.01 | +0.24 ± 0.33 |
| VP lost to shortfalls | 3.07 | 3.08 | +0.01 ± 0.72 |
| Own unflipped overbuilds | 1.53 | 1.61 | +0.08 ± 0.17 |

### normal+enabling vs normal+a6, 3 players (100 paired seeds)

| Measure (per player per game) | normal+a6 | normal+enabling | Difference |
|---|---|---|---|
| Final VP | 39.22 | 38.87 | -0.35 ± 3.10 |
| Winner VP | 59.65 | 60.01 | +0.36 ± 3.41 |
| Link VP | 15.80 | 14.72 | **-1.08 ± 0.90** |
| Tile VP | 25.53 | 26.39 | +0.86 ± 1.98 |
| Income level | -3.17 | -3.50 | -0.33 ± 0.73 |
| Money left | 12.04 | 11.67 | -0.37 ± 1.96 |
| Loans | 5.46 | 5.62 | +0.16 ± 0.18 |
| Builds | 11.74 | 12.07 | +0.32 ± 0.33 |
| Develop actions | 5.64 | 5.36 | **-0.28 ± 0.20** |
| Tiles sold | 1.94 | 2.09 | **+0.15 ± 0.15** |
| Networks | 6.12 | 5.57 | **-0.55 ± 0.21** |
| Links built | 6.12 | 5.57 | **-0.55 ± 0.21** |
| Passes | 3.88 | 4.10 | +0.22 ± 0.68 |
| Shortfall sales | 2.50 | 2.51 | +0.01 ± 0.33 |
| VP lost to shortfalls | 2.40 | 2.53 | +0.13 ± 0.56 |
| Own unflipped overbuilds | 1.06 | 0.99 | -0.08 ± 0.14 |

### normal+enabling vs normal+a6, 4 players (100 paired seeds)

| Measure (per player per game) | normal+a6 | normal+enabling | Difference |
|---|---|---|---|
| Final VP | 41.02 | 38.50 | **-2.52 ± 2.46** |
| Winner VP | 63.10 | 59.55 | **-3.55 ± 2.94** |
| Link VP | 15.92 | 14.32 | **-1.60 ± 0.79** |
| Tile VP | 25.36 | 24.67 | -0.69 ± 1.50 |
| Income level | -0.98 | -2.25 | **-1.27 ± 0.59** |
| Money left | 13.10 | 13.97 | +0.87 ± 1.67 |
| Loans | 4.80 | 5.09 | **+0.30 ± 0.15** |
| Builds | 11.13 | 11.09 | -0.04 ± 0.28 |
| Develop actions | 5.31 | 5.14 | -0.17 ± 0.21 |
| Tiles sold | 2.03 | 2.08 | +0.05 ± 0.12 |
| Networks | 5.59 | 5.00 | **-0.59 ± 0.15** |
| Links built | 5.59 | 5.00 | **-0.59 ± 0.15** |
| Passes | 2.10 | 2.53 | +0.43 ± 0.53 |
| Shortfall sales | 1.64 | 1.82 | +0.18 ± 0.26 |
| VP lost to shortfalls | 1.57 | 1.80 | +0.23 ± 0.48 |
| Own unflipped overbuilds | 0.80 | 0.86 | +0.06 ± 0.11 |

### normal+cashflow+enabling vs normal+a6, 2 players (100 paired seeds)

| Measure (per player per game) | normal+a6 | normal+cashflow+enabling | Difference |
|---|---|---|---|
| Final VP | 41.54 | 36.99 | **-4.55 ± 3.35** |
| Winner VP | 56.50 | 50.52 | **-5.98 ± 3.27** |
| Link VP | 16.98 | 15.24 | **-1.73 ± 0.85** |
| Tile VP | 27.34 | 24.96 | **-2.38 ± 2.06** |
| Income level | -3.44 | -7.38 | **-3.94 ± 0.75** |
| Money left | 10.89 | 33.77 | **+22.87 ± 5.92** |
| Loans | 6.08 | 6.99 | **+0.91 ± 0.27** |
| Builds | 12.70 | 12.77 | +0.07 ± 0.36 |
| Develop actions | 6.35 | 5.76 | **-0.59 ± 0.25** |
| Tiles sold | 2.03 | 1.83 | **-0.20 ± 0.19** |
| Networks | 6.79 | 5.97 | **-0.81 ± 0.21** |
| Links built | 6.79 | 5.97 | **-0.81 ± 0.21** |
| Passes | 4.32 | 5.09 | **+0.77 ± 0.74** |
| Shortfall sales | 2.77 | 3.08 | +0.32 ± 0.35 |
| VP lost to shortfalls | 3.07 | 3.50 | +0.42 ± 0.80 |
| Own unflipped overbuilds | 1.53 | 1.66 | +0.13 ± 0.18 |

### normal+cashflow+enabling vs normal+a6, 3 players (100 paired seeds)

| Measure (per player per game) | normal+a6 | normal+cashflow+enabling | Difference |
|---|---|---|---|
| Final VP | 39.22 | 35.79 | **-3.42 ± 2.36** |
| Winner VP | 59.65 | 55.45 | **-4.20 ± 2.98** |
| Link VP | 15.80 | 13.63 | **-2.18 ± 0.70** |
| Tile VP | 25.53 | 24.68 | -0.85 ± 1.53 |
| Income level | -3.17 | -7.04 | **-3.88 ± 0.58** |
| Money left | 12.04 | 38.29 | **+26.25 ± 4.95** |
| Loans | 5.46 | 6.51 | **+1.05 ± 0.19** |
| Builds | 11.74 | 11.76 | +0.02 ± 0.28 |
| Develop actions | 5.64 | 5.06 | **-0.58 ± 0.18** |
| Tiles sold | 1.94 | 1.88 | -0.06 ± 0.12 |
| Networks | 6.12 | 5.25 | **-0.88 ± 0.16** |
| Links built | 6.12 | 5.25 | **-0.88 ± 0.16** |
| Passes | 3.88 | 4.33 | +0.45 ± 0.56 |
| Shortfall sales | 2.50 | 2.61 | +0.11 ± 0.29 |
| VP lost to shortfalls | 2.40 | 2.71 | +0.32 ± 0.49 |
| Own unflipped overbuilds | 1.06 | 0.97 | -0.09 ± 0.11 |

### normal+cashflow+enabling vs normal+a6, 4 players (100 paired seeds)

| Measure (per player per game) | normal+a6 | normal+cashflow+enabling | Difference |
|---|---|---|---|
| Final VP | 41.02 | 36.10 | **-4.92 ± 2.40** |
| Winner VP | 63.10 | 56.24 | **-6.86 ± 2.79** |
| Link VP | 15.92 | 12.95 | **-2.98 ± 0.77** |
| Tile VP | 25.36 | 23.92 | **-1.44 ± 1.42** |
| Income level | -0.98 | -6.62 | **-5.64 ± 0.57** |
| Money left | 13.10 | 55.21 | **+42.10 ± 4.56** |
| Loans | 4.80 | 6.36 | **+1.56 ± 0.18** |
| Builds | 11.13 | 10.88 | -0.25 ± 0.26 |
| Develop actions | 5.31 | 4.72 | **-0.59 ± 0.17** |
| Tiles sold | 2.03 | 1.88 | **-0.16 ± 0.12** |
| Networks | 5.59 | 4.63 | **-0.96 ± 0.14** |
| Links built | 5.59 | 4.63 | **-0.96 ± 0.14** |
| Passes | 2.10 | 2.44 | +0.34 ± 0.50 |
| Shortfall sales | 1.64 | 1.72 | +0.08 ± 0.23 |
| VP lost to shortfalls | 1.57 | 1.99 | +0.42 ± 0.51 |
| Own unflipped overbuilds | 0.80 | 0.90 | +0.10 ± 0.11 |

### normal+never vs normal+a6, 2 players (100 paired seeds)

| Measure (per player per game) | normal+a6 | normal+never | Difference |
|---|---|---|---|
| Final VP | 41.54 | 15.71 | **-25.82 ± 4.14** |
| Winner VP | 56.50 | 24.21 | **-32.29 ± 4.97** |
| Link VP | 16.98 | 8.74 | **-8.23 ± 1.42** |
| Tile VP | 27.34 | 6.91 | **-20.43 ± 2.45** |
| Income level | -3.44 | 3.93 | **+7.38 ± 0.95** |
| Money left | 10.89 | 1.68 | **-9.21 ± 1.87** |
| Loans | 6.08 | 0.00 | **-6.08 ± 0.22** |
| Builds | 12.70 | 3.10 | **-9.59 ± 0.59** |
| Develop actions | 6.35 | 4.41 | **-1.95 ± 0.57** |
| Tiles sold | 2.03 | 0.51 | **-1.52 ± 0.20** |
| Networks | 6.79 | 4.81 | **-1.98 ± 0.55** |
| Links built | 6.79 | 4.81 | **-1.98 ± 0.55** |
| Passes | 4.32 | 25.64 | **+21.32 ± 1.60** |
| Shortfall sales | 2.77 | 0.00 | **-2.77 ± 0.40** |
| VP lost to shortfalls | 3.07 | 0.00 | **-3.07 ± 0.76** |
| Own unflipped overbuilds | 1.53 | 0.10 | **-1.43 ± 0.19** |

### normal+never vs normal+a6, 3 players (100 paired seeds)

| Measure (per player per game) | normal+a6 | normal+never | Difference |
|---|---|---|---|
| Final VP | 39.22 | 14.78 | **-24.44 ± 3.49** |
| Winner VP | 59.65 | 27.94 | **-31.71 ± 4.32** |
| Link VP | 15.80 | 8.45 | **-7.36 ± 1.24** |
| Tile VP | 25.53 | 6.28 | **-19.25 ± 2.09** |
| Income level | -3.17 | 3.74 | **+6.91 ± 0.79** |
| Money left | 12.04 | 1.66 | **-10.38 ± 1.45** |
| Loans | 5.46 | 0.00 | **-5.46 ± 0.16** |
| Builds | 11.74 | 2.88 | **-8.87 ± 0.44** |
| Develop actions | 5.64 | 3.57 | **-2.07 ± 0.45** |
| Tiles sold | 1.94 | 0.58 | **-1.36 ± 0.16** |
| Networks | 6.12 | 4.58 | **-1.54 ± 0.45** |
| Links built | 6.12 | 4.58 | **-1.54 ± 0.45** |
| Passes | 3.88 | 22.87 | **+18.99 ± 1.30** |
| Shortfall sales | 2.50 | 0.00 | **-2.50 ± 0.28** |
| VP lost to shortfalls | 2.40 | 0.00 | **-2.40 ± 0.53** |
| Own unflipped overbuilds | 1.06 | 0.06 | **-1.00 ± 0.10** |

### normal+never vs normal+a6, 4 players (100 paired seeds)

| Measure (per player per game) | normal+a6 | normal+never | Difference |
|---|---|---|---|
| Final VP | 41.02 | 19.34 | **-21.68 ± 2.72** |
| Winner VP | 63.10 | 38.14 | **-24.96 ± 4.05** |
| Link VP | 15.92 | 9.90 | **-6.02 ± 1.06** |
| Tile VP | 25.36 | 8.91 | **-16.45 ± 1.62** |
| Income level | -0.98 | 4.91 | **+5.88 ± 0.67** |
| Money left | 13.10 | 1.94 | **-11.17 ± 1.22** |
| Loans | 4.80 | 0.00 | **-4.80 ± 0.14** |
| Builds | 11.13 | 3.33 | **-7.81 ± 0.36** |
| Develop actions | 5.31 | 3.89 | **-1.42 ± 0.33** |
| Tiles sold | 2.03 | 0.71 | **-1.32 ± 0.12** |
| Networks | 5.59 | 4.84 | **-0.75 ± 0.26** |
| Links built | 5.59 | 4.84 | **-0.75 ± 0.26** |
| Passes | 2.10 | 17.84 | **+15.74 ± 0.81** |
| Shortfall sales | 1.64 | 0.00 | **-1.64 ± 0.19** |
| VP lost to shortfalls | 1.57 | 0.00 | **-1.57 ± 0.37** |
| Own unflipped overbuilds | 0.80 | 0.05 | **-0.75 ± 0.08** |

# 4. Loan probes (`ai-loans.js`, exploration mirror seeds, 100 games each)

## 4.1 The production AI (Assignment 6 loan heuristic), every level and player count

### easy: 2 players, 100 games, 7800 turn decisions, 1117 loans (5.58 per player per game)

**Situation**
- Era: Canal 577, Rail 540; in the first third of an era (rounds left ≥ 2/3 of the era) 484 of 1117 (43%), last two rounds 211 of 1117 (19%)
- Mean cash before £3.7; mean income level before -0.7; 1st / 2nd / 3rd / 4th+ loan of the player: 200 / 200 / 199 / 518
- Income payments still to come: mean 9.7, so each loan's −3 income levels cost on average £29 for the £30 raised; loans costing more than they raise (more than 10 payments left): 521 of 1117 (47%)
- No Build or Network affordable: 932 of 1117 (83%); the loan made one affordable: 1041 of 1117 (93%); nothing affordable AND the loan enabled nothing: 0 of 1117 (0%)

**Why it was chosen**
- Cash-crunch bonus (+4) applied: 932 of 1117 (83%); mean loan score 2.47 (base -0.27)
- Other actions available at the loan: pass 1117 of 1117 (100%), scout 716 of 1117 (64%), develop 292 of 1117 (26%), network 178 of 1117 (16%), build 106 of 1117 (9%), sell 11 of 1117 (1%)
- Best alternative: pass 689, develop 172, scout 117, network 64, build 64, sell 11; the loan would have lost without the crunch bonus in 629 of 932 (67%) of crunch loans; chosen only through Easy's random pick: 202

**What followed**
- Enabling (needed for the next Build / Network): 618 of 1117 (55%); investment (≥ £15 on Build / Network / Develop within two actions): 295 of 1117 (26%); idle: 204 of 1117 (18%)
- The player's next action: build 632, develop 200, network 170, pass 32, scout 25, loan 24, sell 8
- Followed by an income shortfall in the same era: 417 of 1117 (37%) (enabling 267 of 618 (43%), idle 47 of 204 (23%))

**Examples**
- enabling: seed 202001, player 1, canal round 3 (8 left), £2, income 4, loan #1; score 3.22 (crunch 4), runner-up develop 2.06; then build £19, build £12
- enabling: seed 202001, player 1, canal round 5 (6 left), £0, income 1, loan #2; score 3.64 (crunch 4), runner-up pass -0.50; then build £10, network £3
- investment: seed 202001, player 0, canal round 10 (1 left), £1, income 4, loan #2; score 4.69 (crunch 4), runner-up pass -0.50; then build £21, network £9
- investment: seed 202001, player 0, rail round 9 (2 left), £9, income 1, loan #6; score 0.48 (crunch 0), runner-up network 1.79; then network £8, build £14
- idle: seed 202001, player 0, canal round 3 (8 left), £2, income 4, loan #1; score 3.22 (crunch 4), runner-up develop 2.06; then develop £6, network £3
- idle: seed 202001, player 1, canal round 8 (3 left), £0, income -2, loan #3; score 4.27 (crunch 4), runner-up develop 4.60; then develop, develop

### normal: 2 players, 100 games, 7800 turn decisions, 1215 loans (6.08 per player per game)

**Situation**
- Era: Canal 568, Rail 647; in the first third of an era (rounds left ≥ 2/3 of the era) 505 of 1215 (42%), last two rounds 245 of 1215 (20%)
- Mean cash before £1.6; mean income level before 0.0; 1st / 2nd / 3rd / 4th+ loan of the player: 200 / 200 / 200 / 615
- Income payments still to come: mean 9.2, so each loan's −3 income levels cost on average £28 for the £30 raised; loans costing more than they raise (more than 10 payments left): 498 of 1215 (41%)
- No Build or Network affordable: 1177 of 1215 (97%); the loan made one affordable: 1208 of 1215 (99%); nothing affordable AND the loan enabled nothing: 0 of 1215 (0%)

**Why it was chosen**
- Cash-crunch bonus (+4) applied: 1177 of 1215 (97%); mean loan score 3.32 (base -0.25)
- Other actions available at the loan: pass 1215 of 1215 (100%), scout 940 of 1215 (77%), develop 155 of 1215 (13%), network 35 of 1215 (3%), sell 9 of 1215 (1%), build 3 of 1215 (0%)
- Best alternative: pass 793, scout 254, develop 138, network 18, sell 9, build 3; the loan would have lost without the crunch bonus in 752 of 1177 (64%) of crunch loans; chosen only through Easy's random pick: 0

**What followed**
- Enabling (needed for the next Build / Network): 874 of 1215 (72%); investment (≥ £15 on Build / Network / Develop within two actions): 225 of 1215 (19%); idle: 116 of 1215 (10%)
- The player's next action: build 937, develop 146, network 81, scout 13, sell 5
- Followed by an income shortfall in the same era: 412 of 1215 (34%) (enabling 331 of 874 (38%), idle 22 of 116 (19%))

**Examples**
- enabling: seed 202001, player 0, canal round 2 (9 left), £2, income 0, loan #1; score 3.01 (crunch 4), runner-up develop 2.06; then build £21, network £3
- enabling: seed 202001, player 1, canal round 2 (9 left), £1, income 0, loan #1; score 3.01 (crunch 4), runner-up pass -0.50; then build £7, develop £6
- investment: seed 202001, player 1, canal round 5 (6 left), £2, income 2, loan #2; score 3.64 (crunch 4), runner-up pass -0.50; then build £22, build £9
- investment: seed 202001, player 1, rail round 4 (7 left), £4, income -7, loan #6; score 0.93 (crunch 4), runner-up scout 0.00; then build £16, build £15; shortfall later in the era
- idle: seed 202001, player 0, canal round 7 (4 left), £0, income 1, loan #3; score 4.06 (crunch 4), runner-up pass -0.50; then develop £6, develop £8
- idle: seed 202002, player 0, canal round 7 (4 left), £0, income -3, loan #3; score 4.06 (crunch 4), runner-up pass -0.50; then develop £5, build £7; shortfall later in the era

### hard: 2 players, 100 games, 7800 turn decisions, 1235 loans (6.17 per player per game)

**Situation**
- Era: Canal 563, Rail 672; in the first third of an era (rounds left ≥ 2/3 of the era) 523 of 1235 (42%), last two rounds 240 of 1235 (19%)
- Mean cash before £1.6; mean income level before -0.0; 1st / 2nd / 3rd / 4th+ loan of the player: 200 / 200 / 200 / 635
- Income payments still to come: mean 9.1, so each loan's −3 income levels cost on average £27 for the £30 raised; loans costing more than they raise (more than 10 payments left): 499 of 1235 (40%)
- No Build or Network affordable: 1207 of 1235 (98%); the loan made one affordable: 1228 of 1235 (99%); nothing affordable AND the loan enabled nothing: 0 of 1235 (0%)

**Why it was chosen**
- Cash-crunch bonus (+4) applied: 1207 of 1235 (98%); mean loan score 3.35 (base -0.26)
- Other actions available at the loan: pass 1235 of 1235 (100%), scout 959 of 1235 (78%), develop 232 of 1235 (19%), network 27 of 1235 (2%), sell 7 of 1235 (1%), build 3 of 1235 (0%)
- Best alternative: pass 747, scout 249, develop 214, network 16, sell 7, build 2; the loan would have lost without the crunch bonus in 814 of 1207 (67%) of crunch loans; chosen only through Easy's random pick: 0

**What followed**
- Enabling (needed for the next Build / Network): 922 of 1235 (75%); investment (≥ £15 on Build / Network / Develop within two actions): 201 of 1235 (16%); idle: 112 of 1235 (9%)
- The player's next action: build 1003, develop 116, network 67, scout 6, sell 6
- Followed by an income shortfall in the same era: 431 of 1235 (35%) (enabling 362 of 922 (39%), idle 14 of 112 (13%))

**Examples**
- enabling: seed 202001, player 0, canal round 3 (8 left), £2, income 4, loan #1; score 3.22 (crunch 4), runner-up pass -0.50; then build £21, build £7
- enabling: seed 202001, player 1, canal round 4 (7 left), £1, income 4, loan #1; score 3.43 (crunch 4), runner-up pass -0.50; then build £7, build £7
- investment: seed 202001, player 0, canal round 6 (5 left), £1, income 1, loan #2; score 3.85 (crunch 4), runner-up pass -0.50; then build £22, network £3
- investment: seed 202001, player 1, rail round 9 (2 left), £0, income 5, loan #5; score 4.48 (crunch 4), runner-up scout 0.00; then develop £12, develop £12
- idle: seed 202002, player 1, rail round 10 (1 left), £8, income 5, loan #6; score 0.69 (crunch 0), runner-up develop 0.68; then develop £12
- idle: seed 202003, player 1, rail round 10 (1 left), £3, income -4, loan #9; score 4.69 (crunch 4), runner-up pass -0.50; then –

### easy: 3 players, 100 games, 10500 turn decisions, 1534 loans (5.11 per player per game)

**Situation**
- Era: Canal 795, Rail 739; in the first third of an era (rounds left ≥ 2/3 of the era) 675 of 1534 (44%), last two rounds 325 of 1534 (21%)
- Mean cash before £4.0; mean income level before -0.3; 1st / 2nd / 3rd / 4th+ loan of the player: 300 / 299 / 296 / 639
- Income payments still to come: mean 8.5, so each loan's −3 income levels cost on average £26 for the £30 raised; loans costing more than they raise (more than 10 payments left): 630 of 1534 (41%)
- No Build or Network affordable: 1234 of 1534 (80%); the loan made one affordable: 1416 of 1534 (92%); nothing affordable AND the loan enabled nothing: 0 of 1534 (0%)

**Why it was chosen**
- Cash-crunch bonus (+4) applied: 1234 of 1534 (80%); mean loan score 2.51 (base -0.12)
- Other actions available at the loan: pass 1534 of 1534 (100%), scout 1107 of 1534 (72%), develop 379 of 1534 (25%), network 290 of 1534 (19%), build 186 of 1534 (12%), sell 38 of 1534 (2%)
- Best alternative: pass 965, develop 207, scout 109, build 108, network 108, sell 37; the loan would have lost without the crunch bonus in 651 of 1234 (53%) of crunch loans; chosen only through Easy's random pick: 303

**What followed**
- Enabling (needed for the next Build / Network): 772 of 1534 (50%); investment (≥ £15 on Build / Network / Develop within two actions): 434 of 1534 (28%); idle: 328 of 1534 (21%)
- The player's next action: build 821, develop 304, network 233, pass 49, loan 33, scout 31, sell 20
- Followed by an income shortfall in the same era: 492 of 1534 (32%) (enabling 295 of 772 (38%), idle 60 of 328 (18%))

**Examples**
- enabling: seed 203001, player 2, canal round 3 (7 left), £2, income 0, loan #1; score 3.43 (crunch 4), runner-up pass -0.50; then build £21, sell
- enabling: seed 203001, player 1, canal round 3 (7 left), £1, income 0, loan #1; score 3.43 (crunch 4), runner-up pass -0.50; then network £3, build £10
- investment: seed 203001, player 0, canal round 3 (7 left), £0, income 0, loan #1; score 3.43 (crunch 4), runner-up pass -0.50; then develop £9, build £9
- investment: seed 203001, player 1, canal round 4 (6 left), £15, income -3, loan #2; score -2.86 (crunch 0), runner-up sell 5.94; then sell, build £16
- idle: seed 203001, player 0, rail round 5 (5 left), £2, income 0, loan #5; score 3.85 (crunch 4), runner-up scout 0.00; then pass, network £5; shortfall later in the era
- idle: seed 203001, player 2, rail round 9 (1 left), £1, income 1, loan #6; score 4.69 (crunch 4), runner-up pass -0.50; then –

### normal: 3 players, 100 games, 10500 turn decisions, 1638 loans (5.46 per player per game)

**Situation**
- Era: Canal 778, Rail 860; in the first third of an era (rounds left ≥ 2/3 of the era) 729 of 1638 (45%), last two rounds 375 of 1638 (23%)
- Mean cash before £1.6; mean income level before 0.2; 1st / 2nd / 3rd / 4th+ loan of the player: 300 / 300 / 299 / 739
- Income payments still to come: mean 8.2, so each loan's −3 income levels cost on average £24 for the £30 raised; loans costing more than they raise (more than 10 payments left): 587 of 1638 (36%)
- No Build or Network affordable: 1573 of 1638 (96%); the loan made one affordable: 1629 of 1638 (99%); nothing affordable AND the loan enabled nothing: 0 of 1638 (0%)

**Why it was chosen**
- Cash-crunch bonus (+4) applied: 1573 of 1638 (96%); mean loan score 3.41 (base -0.13)
- Other actions available at the loan: pass 1638 of 1638 (100%), scout 1387 of 1638 (85%), develop 166 of 1638 (10%), network 63 of 1638 (4%), sell 14 of 1638 (1%), build 4 of 1638 (0%)
- Best alternative: pass 1220, scout 210, develop 151, network 39, sell 14, build 4; the loan would have lost without the crunch bonus in 842 of 1573 (54%) of crunch loans; chosen only through Easy's random pick: 0

**What followed**
- Enabling (needed for the next Build / Network): 1109 of 1638 (68%); investment (≥ £15 on Build / Network / Develop within two actions): 378 of 1638 (23%); idle: 151 of 1638 (9%)
- The player's next action: build 1222, develop 236, network 110, sell 12, scout 3
- Followed by an income shortfall in the same era: 552 of 1638 (34%) (enabling 456 of 1109 (41%), idle 17 of 151 (11%))

**Examples**
- enabling: seed 203001, player 2, canal round 2 (8 left), £1, income 0, loan #1; score 3.22 (crunch 4), runner-up pass -0.50; then build £21, build £7; shortfall later in the era
- enabling: seed 203001, player 0, canal round 4 (6 left), £1, income 3, loan #1; score 3.64 (crunch 4), runner-up pass -0.50; then build £12, develop £11; shortfall later in the era
- investment: seed 203001, player 2, rail round 3 (7 left), £3, income 1, loan #4; score 3.43 (crunch 4), runner-up pass -0.50; then build £10, build £12
- investment: seed 203002, player 0, canal round 5 (5 left), £2, income 3, loan #1; score 3.85 (crunch 4), runner-up pass -0.50; then build £17, sell
- idle: seed 203001, player 1, canal round 2 (8 left), £2, income 0, loan #1; score 3.22 (crunch 4), runner-up pass -0.50; then develop £6, build £7; shortfall later in the era
- idle: seed 203002, player 1, canal round 3 (7 left), £0, income 0, loan #1; score 3.43 (crunch 4), runner-up pass -0.50; then develop £5, develop £7

### hard: 3 players, 100 games, 10500 turn decisions, 1636 loans (5.45 per player per game)

**Situation**
- Era: Canal 844, Rail 792; in the first third of an era (rounds left ≥ 2/3 of the era) 761 of 1636 (47%), last two rounds 339 of 1636 (21%)
- Mean cash before £1.4; mean income level before -0.4; 1st / 2nd / 3rd / 4th+ loan of the player: 300 / 300 / 298 / 738
- Income payments still to come: mean 8.7, so each loan's −3 income levels cost on average £26 for the £30 raised; loans costing more than they raise (more than 10 payments left): 659 of 1636 (40%)
- No Build or Network affordable: 1596 of 1636 (98%); the loan made one affordable: 1628 of 1636 (100%); nothing affordable AND the loan enabled nothing: 0 of 1636 (0%)

**Why it was chosen**
- Cash-crunch bonus (+4) applied: 1596 of 1636 (98%); mean loan score 3.38 (base -0.15)
- Other actions available at the loan: pass 1636 of 1636 (100%), scout 1421 of 1636 (87%), develop 202 of 1636 (12%), network 39 of 1636 (2%), sell 13 of 1636 (1%), build 1 of 1636 (0%)
- Best alternative: pass 1194, scout 211, develop 192, network 25, sell 13, build 1; the loan would have lost without the crunch bonus in 909 of 1596 (57%) of crunch loans; chosen only through Easy's random pick: 0

**What followed**
- Enabling (needed for the next Build / Network): 1161 of 1636 (71%); investment (≥ £15 on Build / Network / Develop within two actions): 309 of 1636 (19%); idle: 166 of 1636 (10%)
- The player's next action: build 1282, develop 204, network 92, sell 8
- Followed by an income shortfall in the same era: 638 of 1636 (39%) (enabling 511 of 1161 (44%), idle 36 of 166 (22%))

**Examples**
- enabling: seed 203001, player 2, canal round 2 (8 left), £1, income 0, loan #1; score 3.22 (crunch 4), runner-up pass -0.50; then build £21, build £7; shortfall later in the era
- enabling: seed 203001, player 0, canal round 3 (7 left), £1, income 3, loan #1; score 3.43 (crunch 4), runner-up pass -0.50; then build £14, build £12
- investment: seed 203001, player 1, canal round 2 (8 left), £2, income 0, loan #1; score 3.22 (crunch 4), runner-up pass -0.50; then build £12, develop £6; shortfall later in the era
- investment: seed 203002, player 0, rail round 5 (5 left), £0, income 0, loan #4; score 3.85 (crunch 4), runner-up scout 0.00; then build £22, network £5; shortfall later in the era
- idle: seed 203001, player 0, canal round 7 (3 left), £2, income -3, loan #3; score 4.27 (crunch 4), runner-up pass -0.50; then develop £6, build £7
- idle: seed 203001, player 1, canal round 8 (2 left), £0, income -4, loan #4; score 4.48 (crunch 4), runner-up pass -0.50; then develop £9, network £3

### easy: 4 players, 100 games, 12400 turn decisions, 1813 loans (4.53 per player per game)

**Situation**
- Era: Canal 919, Rail 894; in the first third of an era (rounds left ≥ 2/3 of the era) 640 of 1813 (35%), last two rounds 469 of 1813 (26%)
- Mean cash before £4.0; mean income level before 0.4; 1st / 2nd / 3rd / 4th+ loan of the player: 400 / 392 / 375 / 646
- Income payments still to come: mean 7.4, so each loan's −3 income levels cost on average £22 for the £30 raised; loans costing more than they raise (more than 10 payments left): 540 of 1813 (30%)
- No Build or Network affordable: 1440 of 1813 (79%); the loan made one affordable: 1680 of 1813 (93%); nothing affordable AND the loan enabled nothing: 1 of 1813 (0%)

**Why it was chosen**
- Cash-crunch bonus (+4) applied: 1440 of 1813 (79%); mean loan score 2.63 (base -0.01)
- Other actions available at the loan: pass 1813 of 1813 (100%), scout 1320 of 1813 (73%), develop 490 of 1813 (27%), network 365 of 1813 (20%), build 219 of 1813 (12%), sell 32 of 1813 (2%)
- Best alternative: pass 1152, develop 279, network 141, build 134, scout 76, sell 31; the loan would have lost without the crunch bonus in 575 of 1440 (40%) of crunch loans; chosen only through Easy's random pick: 347

**What followed**
- Enabling (needed for the next Build / Network): 855 of 1813 (47%); investment (≥ £15 on Build / Network / Develop within two actions): 553 of 1813 (31%); idle: 405 of 1813 (22%)
- The player's next action: build 940, develop 398, network 255, pass 50, loan 43, sell 38, scout 32
- Followed by an income shortfall in the same era: 451 of 1813 (25%) (enabling 245 of 855 (29%), idle 62 of 405 (15%))

**Examples**
- enabling: seed 204001, player 3, canal round 4 (5 left), £2, income 4, loan #1; score 3.85 (crunch 4), runner-up pass -0.50; then network £3, build £9
- enabling: seed 204001, player 1, canal round 4 (5 left), £0, income 2, loan #2; score 3.85 (crunch 4), runner-up pass -0.50; then network £3, develop £11
- investment: seed 204001, player 1, canal round 2 (7 left), £5, income 0, loan #1; score -0.57 (crunch 0), runner-up sell 8.43; then sell, build £18
- investment: seed 204001, player 2, rail round 1 (8 left), £1, income -2, loan #3; score 3.22 (crunch 4), runner-up pass -0.50; then scout, build £23; shortfall later in the era
- idle: seed 204001, player 2, canal round 3 (6 left), £1, income 0, loan #1; score 3.64 (crunch 4), runner-up pass -0.50; then develop £4, network £3; shortfall later in the era
- idle: seed 204001, player 2, canal round 6 (3 left), £1, income 1, loan #2; score 4.27 (crunch 4), runner-up develop 2.20; then develop, develop £2; shortfall later in the era

### normal: 4 players, 100 games, 12400 turn decisions, 1919 loans (4.80 per player per game)

**Situation**
- Era: Canal 933, Rail 986; in the first third of an era (rounds left ≥ 2/3 of the era) 675 of 1919 (35%), last two rounds 511 of 1919 (27%)
- Mean cash before £1.6; mean income level before 0.7; 1st / 2nd / 3rd / 4th+ loan of the player: 400 / 396 / 377 / 746
- Income payments still to come: mean 7.2, so each loan's −3 income levels cost on average £21 for the £30 raised; loans costing more than they raise (more than 10 payments left): 538 of 1919 (28%)
- No Build or Network affordable: 1832 of 1919 (95%); the loan made one affordable: 1906 of 1919 (99%); nothing affordable AND the loan enabled nothing: 2 of 1919 (0%)

**Why it was chosen**
- Cash-crunch bonus (+4) applied: 1832 of 1919 (95%); mean loan score 3.58 (base 0.00)
- Other actions available at the loan: pass 1919 of 1919 (100%), scout 1642 of 1919 (86%), develop 245 of 1919 (13%), network 84 of 1919 (4%), sell 15 of 1919 (1%), build 5 of 1919 (0%)
- Best alternative: pass 1499, develop 226, scout 113, network 62, sell 15, build 4; the loan would have lost without the crunch bonus in 661 of 1832 (36%) of crunch loans; chosen only through Easy's random pick: 0

**What followed**
- Enabling (needed for the next Build / Network): 1282 of 1919 (67%); investment (≥ £15 on Build / Network / Develop within two actions): 419 of 1919 (22%); idle: 218 of 1919 (11%)
- The player's next action: build 1400, develop 300, network 125, sell 18, loan 1, scout 1
- Followed by an income shortfall in the same era: 491 of 1919 (26%) (enabling 383 of 1282 (30%), idle 12 of 218 (6%))

**Examples**
- enabling: seed 204001, player 1, canal round 3 (6 left), £2, income 4, loan #1; score 3.64 (crunch 4), runner-up pass -0.50; then build £17, develop
- enabling: seed 204001, player 2, canal round 3 (6 left), £0, income 3, loan #1; score 3.64 (crunch 4), runner-up pass -0.50; then build £19, develop £6; shortfall later in the era
- investment: seed 204001, player 2, canal round 5 (4 left), £2, income 0, loan #2; score 4.06 (crunch 4), runner-up pass -0.50; then develop £8, develop £10; shortfall later in the era
- investment: seed 204001, player 3, canal round 7 (2 left), £1, income 1, loan #2; score 4.48 (crunch 4), runner-up pass -0.50; then develop £10, build £13
- idle: seed 204001, player 0, canal round 3 (6 left), £0, income 0, loan #1; score 3.64 (crunch 4), runner-up pass -0.50; then develop £1, develop £3
- idle: seed 204001, player 1, rail round 8 (1 left), £3, income 1, loan #5; score 4.69 (crunch 4), runner-up pass -0.50; then –

### hard: 4 players, 100 games, 12400 turn decisions, 2059 loans (5.15 per player per game)

**Situation**
- Era: Canal 1013, Rail 1046; in the first third of an era (rounds left ≥ 2/3 of the era) 753 of 2059 (37%), last two rounds 504 of 2059 (24%)
- Mean cash before £1.4; mean income level before -0.1; 1st / 2nd / 3rd / 4th+ loan of the player: 400 / 397 / 394 / 868
- Income payments still to come: mean 7.4, so each loan's −3 income levels cost on average £22 for the £30 raised; loans costing more than they raise (more than 10 payments left): 625 of 2059 (30%)
- No Build or Network affordable: 1994 of 2059 (97%); the loan made one affordable: 2052 of 2059 (100%); nothing affordable AND the loan enabled nothing: 0 of 2059 (0%)

**Why it was chosen**
- Cash-crunch bonus (+4) applied: 1994 of 2059 (97%); mean loan score 3.56 (base -0.03)
- Other actions available at the loan: pass 2059 of 2059 (100%), scout 1785 of 2059 (87%), develop 221 of 2059 (11%), network 62 of 2059 (3%), sell 14 of 2059 (1%), build 4 of 2059 (0%)
- Best alternative: pass 1632, develop 215, scout 145, network 51, sell 13, build 3; the loan would have lost without the crunch bonus in 861 of 1994 (43%) of crunch loans; chosen only through Easy's random pick: 0

**What followed**
- Enabling (needed for the next Build / Network): 1397 of 2059 (68%); investment (≥ £15 on Build / Network / Develop within two actions): 448 of 2059 (22%); idle: 214 of 2059 (10%)
- The player's next action: build 1566, develop 296, network 115, sell 14
- Followed by an income shortfall in the same era: 649 of 2059 (32%) (enabling 498 of 1397 (36%), idle 26 of 214 (12%))

**Examples**
- enabling: seed 204001, player 0, canal round 2 (7 left), £2, income 0, loan #1; score 3.43 (crunch 4), runner-up develop 2.06; then build £20, develop £7; shortfall later in the era
- enabling: seed 204001, player 3, canal round 3 (6 left), £1, income 0, loan #1; score 3.64 (crunch 4), runner-up pass -0.50; then build £7, build £7
- investment: seed 204001, player 3, canal round 5 (4 left), £2, income 2, loan #2; score 4.06 (crunch 4), runner-up develop 2.06; then develop £9, develop £11
- investment: seed 204001, player 2, canal round 5 (4 left), £1, income 0, loan #2; score 4.06 (crunch 4), runner-up pass -0.50; then develop £6, build £14
- idle: seed 204001, player 0, canal round 4 (5 left), £2, income -3, loan #2; score 3.85 (crunch 4), runner-up pass -0.50; then build £12, sell; shortfall later in the era
- idle: seed 204001, player 0, canal round 8 (1 left), £2, income -4, loan #4; score 4.69 (crunch 4), runner-up pass -0.50; then build £7, build £7

## 4.2 The candidates (Normal, 3 players)

For `enabling`, "cash-crunch bonus applied" counts loans whose enabling bonus was above 0.

### normal (loan: cashflow): 3 players, 100 games, 10500 turn decisions, 1712 loans (5.71 per player per game)

**Situation**
- Era: Canal 773, Rail 939; in the first third of an era (rounds left ≥ 2/3 of the era) 737 of 1712 (43%), last two rounds 395 of 1712 (23%)
- Mean cash before £2.9; mean income level before 0.2; 1st / 2nd / 3rd / 4th+ loan of the player: 300 / 300 / 300 / 812
- Income payments still to come: mean 7.9, so each loan's −3 income levels cost on average £24 for the £30 raised; loans costing more than they raise (more than 10 payments left): 590 of 1712 (34%)
- No Build or Network affordable: 1441 of 1712 (84%); the loan made one affordable: 1664 of 1712 (97%); nothing affordable AND the loan enabled nothing: 0 of 1712 (0%)

**Why it was chosen**
- Cash-crunch bonus (+4) applied: 1441 of 1712 (84%); mean loan score 3.75 (base 0.76)
- Other actions available at the loan: pass 1712 of 1712 (100%), scout 1478 of 1712 (86%), develop 358 of 1712 (21%), network 257 of 1712 (15%), build 55 of 1712 (3%), sell 23 of 1712 (1%)
- Best alternative: pass 1100, develop 218, scout 204, network 148, sell 23, build 19; the loan would have lost without the crunch bonus in 711 of 1441 (49%) of crunch loans; chosen only through Easy's random pick: 0

**What followed**
- Enabling (needed for the next Build / Network): 1021 of 1712 (60%); investment (≥ £15 on Build / Network / Develop within two actions): 472 of 1712 (28%); idle: 219 of 1712 (13%)
- The player's next action: build 1245, develop 240, network 124, sell 23, loan 15, scout 7
- Followed by an income shortfall in the same era: 557 of 1712 (33%) (enabling 448 of 1021 (44%), idle 16 of 219 (7%))

**Examples**
- enabling: seed 203001, player 2, canal round 2 (8 left), £1, income 0, loan #1; score 1.84 (crunch 4), runner-up pass -0.50; then build £21, build £7; shortfall later in the era
- enabling: seed 203001, player 0, canal round 4 (6 left), £1, income 3, loan #1; score 2.56 (crunch 4), runner-up pass -0.50; then build £12, develop £11; shortfall later in the era
- investment: seed 203001, player 2, rail round 3 (7 left), £3, income 1, loan #4; score 5.44 (crunch 4), runner-up pass -0.50; then build £10, build £12
- investment: seed 203001, player 2, rail round 7 (3 left), £5, income 2, loan #5; score 2.88 (crunch 0), runner-up network 1.60; then build £9, network £6
- idle: seed 203001, player 1, canal round 2 (8 left), £2, income 0, loan #1; score 1.84 (crunch 4), runner-up pass -0.50; then develop £6, build £7; shortfall later in the era
- idle: seed 203001, player 2, rail round 9 (1 left), £18, income -1, loan #6; score 1.10 (crunch 0), runner-up develop 1.48; then develop £6

### normal (loan: enabling): 3 players, 100 games, 10500 turn decisions, 1686 loans (5.62 per player per game)

**Situation**
- Era: Canal 828, Rail 858; in the first third of an era (rounds left ≥ 2/3 of the era) 744 of 1686 (44%), last two rounds 379 of 1686 (22%)
- Mean cash before £2.8; mean income level before 0.1; 1st / 2nd / 3rd / 4th+ loan of the player: 300 / 300 / 298 / 788
- Income payments still to come: mean 8.3, so each loan's −3 income levels cost on average £25 for the £30 raised; loans costing more than they raise (more than 10 payments left): 629 of 1686 (37%)
- No Build or Network affordable: 1219 of 1686 (72%); the loan made one affordable: 1662 of 1686 (99%); nothing affordable AND the loan enabled nothing: 0 of 1686 (0%)

**Why it was chosen**
- Cash-crunch bonus (+4) applied: 1659 of 1686 (98%); mean loan score 3.34 (base -0.12)
- Other actions available at the loan: pass 1686 of 1686 (100%), scout 1457 of 1686 (86%), develop 423 of 1686 (25%), network 359 of 1686 (21%), build 193 of 1686 (11%), sell 12 of 1686 (1%)
- Best alternative: pass 903, develop 287, network 189, scout 184, build 113, sell 10; the loan would have lost without the crunch bonus in 1142 of 1659 (69%) of crunch loans; chosen only through Easy's random pick: 0

**What followed**
- Enabling (needed for the next Build / Network): 873 of 1686 (52%); investment (≥ £15 on Build / Network / Develop within two actions): 608 of 1686 (36%); idle: 205 of 1686 (12%)
- The player's next action: build 1239, develop 265, network 124, sell 11, loan 4, scout 2
- Followed by an income shortfall in the same era: 535 of 1686 (32%) (enabling 358 of 873 (41%), idle 21 of 205 (10%))

**Examples**
- enabling: seed 203001, player 2, canal round 2 (8 left), £1, income 0, loan #1; score 5.20 (crunch 5.9799999999999995), runner-up pass -0.50; then build £21, build £7; shortfall later in the era
- enabling: seed 203001, player 1, canal round 4 (6 left), £2, income -3, loan #2; score 4.84 (crunch 5.2), runner-up pass -0.50; then build £23, network £3; shortfall later in the era
- investment: seed 203001, player 0, canal round 4 (6 left), £4, income 3, loan #1; score 3.44 (crunch 3.8000000000000003), runner-up network 1.14; then build £12, develop £12
- investment: seed 203001, player 2, canal round 4 (6 left), £0, income -3, loan #2; score 3.51 (crunch 3.8679999999999994), runner-up pass -0.50; then develop £12, build £7; shortfall later in the era
- idle: seed 203001, player 1, canal round 2 (8 left), £2, income 0, loan #1; score 2.91 (crunch 3.6900000000000004), runner-up pass -0.50; then develop £6, build £7; shortfall later in the era
- idle: seed 203002, player 1, canal round 3 (7 left), £0, income 0, loan #1; score 5.42 (crunch 5.989999999999999), runner-up pass -0.50; then develop £5, develop £7; shortfall later in the era

### normal (loan: cashflow+enabling): 3 players, 100 games, 10500 turn decisions, 1954 loans (6.51 per player per game)

**Situation**
- Era: Canal 808, Rail 1146; in the first third of an era (rounds left ≥ 2/3 of the era) 782 of 1954 (40%), last two rounds 505 of 1954 (26%)
- Mean cash before £11.8; mean income level before -0.2; 1st / 2nd / 3rd / 4th+ loan of the player: 300 / 300 / 300 / 1054
- Income payments still to come: mean 7.4, so each loan's −3 income levels cost on average £22 for the £30 raised; loans costing more than they raise (more than 10 payments left): 608 of 1954 (31%)
- No Build or Network affordable: 1129 of 1954 (58%); the loan made one affordable: 1616 of 1954 (83%); nothing affordable AND the loan enabled nothing: 0 of 1954 (0%)

**Why it was chosen**
- Cash-crunch bonus (+4) applied: 1597 of 1954 (82%); mean loan score 3.63 (base 0.95)
- Other actions available at the loan: pass 1954 of 1954 (100%), scout 1686 of 1954 (86%), develop 831 of 1954 (43%), network 749 of 1954 (38%), build 461 of 1954 (24%), sell 11 of 1954 (1%)
- Best alternative: pass 841, develop 339, network 338, build 266, scout 161, sell 9; the loan would have lost without the crunch bonus in 1031 of 1597 (65%) of crunch loans; chosen only through Easy's random pick: 0

**What followed**
- Enabling (needed for the next Build / Network): 796 of 1954 (41%); investment (≥ £15 on Build / Network / Develop within two actions): 699 of 1954 (36%); idle: 459 of 1954 (23%)
- The player's next action: build 1256, develop 245, loan 198, network 166, sell 13, scout 3
- Followed by an income shortfall in the same era: 562 of 1954 (29%) (enabling 372 of 796 (47%), idle 23 of 459 (5%))

**Examples**
- enabling: seed 203001, player 2, canal round 2 (8 left), £1, income 0, loan #1; score 3.82 (crunch 5.9799999999999995), runner-up pass -0.50; then build £21, build £7; shortfall later in the era
- enabling: seed 203001, player 1, canal round 4 (6 left), £2, income -3, loan #2; score 3.76 (crunch 5.2), runner-up pass -0.50; then build £23, network £3; shortfall later in the era
- investment: seed 203001, player 0, canal round 4 (6 left), £4, income 3, loan #1; score 2.36 (crunch 3.8000000000000003), runner-up network 1.14; then build £12, develop £12
- investment: seed 203001, player 2, canal round 4 (6 left), £0, income -3, loan #2; score 2.43 (crunch 3.8679999999999994), runner-up pass -0.50; then develop £12, build £7; shortfall later in the era
- idle: seed 203001, player 1, canal round 2 (8 left), £2, income 0, loan #1; score 1.53 (crunch 3.6900000000000004), runner-up pass -0.50; then develop £6, build £7; shortfall later in the era
- idle: seed 203002, player 1, canal round 3 (7 left), £0, income 0, loan #1; score 4.19 (crunch 5.989999999999999), runner-up pass -0.50; then develop £5, develop £7; shortfall later in the era
