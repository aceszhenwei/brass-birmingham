# AI Corrections: Results (Assignment 6)

Generated output of the research scripts, used by [the Assignment 6 report](ai-corrections-a6.md). The report's [Reproducing the experiments](ai-corrections-a6.md#reproducing-the-experiments) section regenerates every number; the raw per-game data is not committed.

Policy names: `easy`, `normal`, `hard` are the corrected AI. `-a5` is the Assignment 5 baseline (`AIPlayer.LEGACY_A5`, which reads hidden hands at Hard). `-fairinfo` is the baseline with only the information correction, and `-rounds` the baseline with only the rounds correction.

# 1. Seat-balanced matchups

`ai-baseline.js matchups` (2 players: 100 seeds; 3 and 4 players: 40 seeds) and `threeway` (50 seeds); the follow-up in 1.3 uses 80 seeds. Seeds 200000 + 1000 × players + i.

## 1.1 Pairwise matchups (seats balanced)

A win share: the share of games won by a seat playing A (ties split); 50% means equal strength.
VP difference: per game, the mean final VP of the A seats minus that of the B seats.

| Players | A vs B | Games | A win share [95% CI] | VP difference A − B | Mean VP A | Mean VP B |
|---|---|---|---|---|---|---|
| 2 | hard-fairinfo vs hard-a5 | 200 | 49.5% [43–56] | -1.0 ± 5.3 | 41.0 | 41.9 |
| 3 | hard-fairinfo vs hard-a5 | 240 | 47.9% [42–54] | -3.4 ± 3.9 | 36.4 | 39.9 |
| 4 | hard-fairinfo vs hard-a5 | 240 | 50.4% [44–57] | 0.9 ± 2.7 | 42.5 | 41.6 |
| 2 | easy-rounds vs easy-a5 | 200 | 49.0% [42–56] | 2.4 ± 4.9 | 33.9 | 31.5 |
| 3 | easy-rounds vs easy-a5 | 240 | 49.6% [43–56] | 0.1 ± 3.6 | 34.6 | 34.5 |
| 4 | easy-rounds vs easy-a5 | 240 | 51.7% [45–58] | 1.1 ± 2.6 | 39.6 | 38.5 |
| 2 | normal-rounds vs normal-a5 | 200 | 48.0% [41–55] | -0.5 ± 5.4 | 40.6 | 41.0 |
| 3 | normal-rounds vs normal-a5 | 240 | 48.3% [42–55] | 2.2 ± 3.8 | 41.3 | 39.1 |
| 4 | normal-rounds vs normal-a5 | 240 | 50.8% [45–57] | -0.0 ± 2.9 | 44.4 | 44.5 |
| 2 | hard-rounds vs hard-a5 | 200 | 48.8% [42–56] | -1.0 ± 5.6 | 36.9 | 37.9 |
| 3 | hard-rounds vs hard-a5 | 240 | 45.1% [39–51] | -1.5 ± 4.1 | 34.4 | 35.8 |
| 4 | hard-rounds vs hard-a5 | 240 | 50.8% [45–57] | 0.5 ± 2.5 | 39.8 | 39.3 |
| 2 | easy vs easy-a5 | 200 | 49.0% [42–56] | 2.4 ± 4.9 | 33.9 | 31.5 |
| 3 | easy vs easy-a5 | 240 | 49.6% [43–56] | 0.1 ± 3.6 | 34.6 | 34.5 |
| 4 | easy vs easy-a5 | 240 | 51.7% [45–58] | 1.1 ± 2.6 | 39.6 | 38.5 |
| 2 | normal vs normal-a5 | 200 | 48.0% [41–55] | -0.5 ± 5.4 | 40.6 | 41.0 |
| 3 | normal vs normal-a5 | 240 | 48.3% [42–55] | 2.2 ± 3.8 | 41.3 | 39.1 |
| 4 | normal vs normal-a5 | 240 | 50.8% [45–57] | -0.0 ± 2.9 | 44.4 | 44.5 |
| 2 | hard vs hard-a5 | 200 | 50.8% [44–58] | -2.0 ± 5.4 | 36.0 | 38.0 |
| 3 | hard vs hard-a5 | 240 | 48.3% [42–55] | -2.1 ± 3.9 | 34.6 | 36.7 |
| 4 | hard vs hard-a5 | 240 | 44.6% [38–51] | -2.0 ± 2.7 | 39.2 | 41.3 |
| 2 | easy vs normal | 200 | 41.3% [35–48] | -8.1 ± 4.8 | 32.1 | 40.2 |
| 3 | easy vs normal | 240 | 42.9% [37–49] | -5.1 ± 3.8 | 32.1 | 37.2 |
| 4 | easy vs normal | 240 | 45.4% [39–52] | -4.6 ± 2.7 | 37.0 | 41.6 |
| 2 | normal vs hard | 200 | 50.8% [44–58] | 0.1 ± 5.1 | 39.2 | 39.1 |
| 3 | normal vs hard | 240 | 47.9% [42–54] | 3.2 ± 4.1 | 39.4 | 36.2 |
| 4 | normal vs hard | 240 | 50.8% [45–57] | 0.6 ± 2.9 | 38.7 | 38.1 |
| 2 | easy vs hard | 200 | 41.8% [35–49] | -6.5 ± 5.3 | 31.5 | 38.0 |
| 3 | easy vs hard | 240 | 48.3% [42–55] | -3.5 ± 3.6 | 31.3 | 34.9 |
| 4 | easy vs hard | 240 | 52.1% [46–58] | -2.5 ± 2.8 | 35.3 | 37.9 |

## 1.2 Three-way games (3 players, one of each difficulty, all six seatings; 300 games)

| Difficulty | Win share [95% CI] | Mean VP | Mean rank |
|---|---|---|---|
| easy | 31.0% [26–36] | 33.1 ± 2.7 | 2.05 |
| normal | 30.7% [26–36] | 36.1 ± 2.7 | 2.01 |
| hard | 38.3% [33–44] | 37.5 ± 2.8 | 1.90 |

## 1.3 Follow-up: which correction removed Hard's edge (80 seeds)

A win share: the share of games won by a seat playing A (ties split); 50% means equal strength.
VP difference: per game, the mean final VP of the A seats minus that of the B seats.

| Players | A vs B | Games | A win share [95% CI] | VP difference A − B | Mean VP A | Mean VP B |
|---|---|---|---|---|---|---|
| 3 | normal-a5 vs hard-a5 | 480 | 44.4% [40–49] | -5.2 ± 2.7 | 38.4 | 43.6 |
| 4 | normal-a5 vs hard-a5 | 480 | 44.0% [40–48] | -4.4 ± 2.1 | 42.0 | 46.4 |
| 3 | normal-a5 vs hard-fairinfo | 480 | 44.0% [40–48] | -4.0 ± 2.8 | 38.5 | 42.6 |
| 4 | normal-a5 vs hard-fairinfo | 480 | 45.2% [41–50] | -5.0 ± 2.1 | 41.0 | 46.0 |
| 3 | normal-a5 vs hard-rounds | 480 | 48.3% [44–53] | 0.1 ± 2.8 | 39.3 | 39.2 |
| 4 | normal-a5 vs hard-rounds | 480 | 49.2% [45–54] | -0.8 ± 1.9 | 41.6 | 42.4 |
| 3 | normal vs hard | 480 | 50.6% [46–55] | 2.5 ± 2.8 | 38.0 | 35.5 |
| 4 | normal vs hard | 480 | 51.7% [47–56] | 1.2 ± 2.0 | 39.0 | 37.8 |

# 2. Paired mirror comparisons

`ai-baseline.js mirror` (100 seeds per policy and player count; every seat the same policy), compared seed by seed with `ai-compare.js`. Difference = variant − baseline, per player per game, ± 1.96 SE; bold when the interval excludes 0. Mirror VP measures how productive games are when *everyone* plays a policy, not relative strength.

### hard-fairinfo vs hard-a5, 2 players (100 paired seeds)

| Measure (per player per game) | hard-a5 | hard-fairinfo | Difference |
|---|---|---|---|
| Final VP | 41.91 | 41.29 | -0.62 ± 3.95 |
| Winner VP | 56.85 | 56.36 | -0.49 ± 4.81 |
| Link VP | 17.44 | 17.60 | +0.16 ± 1.04 |
| Tile VP | 28.01 | 27.34 | -0.68 ± 2.16 |
| Income level | -4.16 | -4.43 | -0.28 ± 0.89 |
| Money left | 10.29 | 9.60 | -0.69 ± 1.81 |
| Loans | 6.01 | 6.01 | -0.01 ± 0.23 |
| Builds | 12.10 | 11.89 | -0.21 ± 0.41 |
| Develop actions | 6.67 | 6.66 | -0.02 ± 0.31 |
| Tiles sold | 1.80 | 1.81 | +0.01 ± 0.18 |
| Networks | 7.11 | 7.24 | +0.13 ± 0.31 |
| Links built | 7.11 | 7.24 | +0.13 ± 0.31 |
| Passes | 4.54 | 4.61 | +0.07 ± 1.02 |
| Shortfall sales | 3.13 | 3.21 | +0.08 ± 0.47 |
| VP lost to shortfalls | 3.84 | 3.79 | -0.06 ± 1.24 |
| Own unflipped overbuilds | 1.46 | 1.47 | +0.01 ± 0.19 |

### hard-fairinfo vs hard-a5, 3 players (100 paired seeds)

| Measure (per player per game) | hard-a5 | hard-fairinfo | Difference |
|---|---|---|---|
| Final VP | 37.04 | 37.26 | +0.21 ± 3.70 |
| Winner VP | 58.50 | 59.04 | +0.54 ± 4.05 |
| Link VP | 15.70 | 15.73 | +0.03 ± 1.12 |
| Tile VP | 24.23 | 24.40 | +0.17 ± 2.23 |
| Income level | -3.65 | -3.31 | +0.33 ± 0.88 |
| Money left | 10.00 | 10.97 | +0.98 ± 1.67 |
| Loans | 5.37 | 5.30 | -0.06 ± 0.21 |
| Builds | 11.22 | 11.02 | -0.20 ± 0.42 |
| Develop actions | 6.00 | 6.04 | +0.03 ± 0.26 |
| Tiles sold | 1.65 | 1.57 | -0.08 ± 0.18 |
| Networks | 6.38 | 6.38 | -0.00 ± 0.25 |
| Links built | 6.38 | 6.38 | -0.00 ± 0.25 |
| Passes | 4.09 | 4.42 | +0.33 ± 0.92 |
| Shortfall sales | 2.69 | 2.49 | -0.20 ± 0.32 |
| VP lost to shortfalls | 3.01 | 3.12 | +0.10 ± 0.76 |
| Own unflipped overbuilds | 1.02 | 1.01 | -0.01 ± 0.11 |

### hard-fairinfo vs hard-a5, 4 players (100 paired seeds)

| Measure (per player per game) | hard-a5 | hard-fairinfo | Difference |
|---|---|---|---|
| Final VP | 40.85 | 41.55 | +0.70 ± 2.77 |
| Winner VP | 62.31 | 62.86 | +0.55 ± 3.09 |
| Link VP | 16.31 | 16.32 | +0.01 ± 0.96 |
| Tile VP | 25.00 | 25.55 | +0.55 ± 1.64 |
| Income level | -1.15 | -1.28 | -0.13 ± 0.75 |
| Money left | 12.71 | 12.91 | +0.21 ± 1.69 |
| Loans | 4.76 | 4.80 | +0.04 ± 0.15 |
| Builds | 10.73 | 10.71 | -0.03 ± 0.26 |
| Develop actions | 5.55 | 5.47 | -0.09 ± 0.20 |
| Tiles sold | 1.79 | 1.84 | +0.05 ± 0.15 |
| Networks | 5.84 | 5.78 | -0.07 ± 0.17 |
| Links built | 5.84 | 5.78 | -0.07 ± 0.17 |
| Passes | 2.23 | 2.37 | +0.14 ± 0.52 |
| Shortfall sales | 1.73 | 1.63 | -0.10 ± 0.30 |
| VP lost to shortfalls | 1.72 | 1.64 | -0.08 ± 0.47 |
| Own unflipped overbuilds | 0.90 | 0.88 | -0.03 ± 0.12 |

### easy-rounds vs easy-a5, 2 players (100 paired seeds)

| Measure (per player per game) | easy-a5 | easy-rounds | Difference |
|---|---|---|---|
| Final VP | 35.30 | 31.67 | -3.63 ± 4.38 |
| Winner VP | 49.48 | 46.66 | -2.82 ± 5.26 |
| Link VP | 15.27 | 13.77 | **-1.50 ± 1.31** |
| Tile VP | 23.11 | 21.16 | -1.95 ± 2.60 |
| Income level | -4.37 | -4.80 | -0.43 ± 1.09 |
| Money left | 9.45 | 10.15 | +0.70 ± 2.16 |
| Loans | 5.66 | 5.58 | -0.07 ± 0.26 |
| Builds | 9.85 | 10.55 | **+0.70 ± 0.48** |
| Develop actions | 7.38 | 6.61 | **-0.78 ± 0.34** |
| Tiles sold | 1.33 | 1.49 | +0.15 ± 0.19 |
| Networks | 6.78 | 6.13 | **-0.65 ± 0.36** |
| Links built | 6.78 | 6.13 | **-0.65 ± 0.36** |
| Passes | 6.55 | 7.17 | +0.63 ± 1.08 |
| Shortfall sales | 2.62 | 2.83 | +0.22 ± 0.42 |
| VP lost to shortfalls | 3.27 | 3.52 | +0.24 ± 1.02 |
| Own unflipped overbuilds | 0.96 | 1.09 | +0.13 ± 0.19 |

### easy-rounds vs easy-a5, 3 players (100 paired seeds)

| Measure (per player per game) | easy-a5 | easy-rounds | Difference |
|---|---|---|---|
| Final VP | 33.67 | 32.46 | -1.21 ± 3.21 |
| Winner VP | 55.51 | 51.79 | **-3.72 ± 3.69** |
| Link VP | 14.83 | 13.55 | **-1.28 ± 1.12** |
| Tile VP | 21.03 | 21.18 | +0.15 ± 1.83 |
| Income level | -3.16 | -3.47 | -0.31 ± 0.82 |
| Money left | 12.28 | 12.62 | +0.34 ± 2.30 |
| Loans | 4.87 | 5.11 | **+0.24 ± 0.22** |
| Builds | 8.95 | 10.08 | **+1.13 ± 0.34** |
| Develop actions | 6.95 | 6.01 | **-0.94 ± 0.28** |
| Tiles sold | 1.29 | 1.57 | **+0.28 ± 0.15** |
| Networks | 6.46 | 5.77 | **-0.69 ± 0.29** |
| Links built | 6.46 | 5.77 | **-0.69 ± 0.29** |
| Passes | 5.38 | 5.43 | +0.06 ± 0.80 |
| Shortfall sales | 2.03 | 2.09 | +0.06 ± 0.30 |
| VP lost to shortfalls | 2.40 | 2.48 | +0.08 ± 0.70 |
| Own unflipped overbuilds | 0.63 | 0.78 | **+0.15 ± 0.14** |

### easy-rounds vs easy-a5, 4 players (100 paired seeds)

| Measure (per player per game) | easy-a5 | easy-rounds | Difference |
|---|---|---|---|
| Final VP | 36.26 | 37.56 | +1.30 ± 2.80 |
| Winner VP | 57.93 | 59.04 | +1.11 ± 3.23 |
| Link VP | 14.57 | 14.93 | +0.35 ± 0.95 |
| Tile VP | 22.62 | 22.89 | +0.26 ± 1.61 |
| Income level | -1.61 | -1.02 | +0.59 ± 0.86 |
| Money left | 15.79 | 15.31 | -0.48 ± 2.28 |
| Loans | 4.41 | 4.53 | +0.12 ± 0.16 |
| Builds | 8.23 | 9.29 | **+1.06 ± 0.27** |
| Develop actions | 6.95 | 5.83 | **-1.13 ± 0.21** |
| Tiles sold | 1.31 | 1.80 | **+0.49 ± 0.14** |
| Networks | 5.78 | 5.42 | **-0.36 ± 0.23** |
| Links built | 5.78 | 5.42 | **-0.36 ± 0.23** |
| Passes | 3.36 | 3.34 | -0.03 ± 0.54 |
| Shortfall sales | 1.28 | 1.51 | +0.23 ± 0.24 |
| VP lost to shortfalls | 1.82 | 1.56 | -0.27 ± 0.47 |
| Own unflipped overbuilds | 0.52 | 0.54 | +0.03 ± 0.10 |

### normal-rounds vs normal-a5, 2 players (100 paired seeds)

| Measure (per player per game) | normal-a5 | normal-rounds | Difference |
|---|---|---|---|
| Final VP | 41.05 | 41.54 | +0.49 ± 4.77 |
| Winner VP | 57.50 | 56.50 | -1.00 ± 5.19 |
| Link VP | 17.23 | 16.98 | -0.26 ± 1.28 |
| Tile VP | 27.50 | 27.34 | -0.16 ± 2.91 |
| Income level | -4.12 | -3.44 | +0.68 ± 1.00 |
| Money left | 9.96 | 10.89 | +0.93 ± 2.36 |
| Loans | 5.97 | 6.08 | +0.10 ± 0.29 |
| Builds | 11.54 | 12.70 | **+1.16 ± 0.55** |
| Develop actions | 7.25 | 6.35 | **-0.91 ± 0.34** |
| Tiles sold | 1.76 | 2.03 | **+0.27 ± 0.23** |
| Networks | 7.27 | 6.79 | **-0.48 ± 0.29** |
| Links built | 7.27 | 6.79 | **-0.48 ± 0.29** |
| Passes | 4.41 | 4.32 | -0.09 ± 1.15 |
| Shortfall sales | 2.81 | 2.77 | -0.04 ± 0.46 |
| VP lost to shortfalls | 3.88 | 3.07 | -0.81 ± 1.08 |
| Own unflipped overbuilds | 1.28 | 1.53 | **+0.24 ± 0.20** |

### normal-rounds vs normal-a5, 3 players (100 paired seeds)

| Measure (per player per game) | normal-a5 | normal-rounds | Difference |
|---|---|---|---|
| Final VP | 42.32 | 39.22 | -3.11 ± 3.50 |
| Winner VP | 63.61 | 59.65 | -3.96 ± 4.17 |
| Link VP | 17.84 | 15.80 | **-2.04 ± 1.02** |
| Tile VP | 26.72 | 25.53 | -1.19 ± 2.17 |
| Income level | -2.50 | -3.17 | -0.67 ± 0.84 |
| Money left | 12.27 | 12.04 | -0.23 ± 2.14 |
| Loans | 5.28 | 5.46 | +0.18 ± 0.21 |
| Builds | 10.56 | 11.74 | **+1.18 ± 0.36** |
| Develop actions | 6.70 | 5.64 | **-1.06 ± 0.24** |
| Tiles sold | 1.70 | 1.94 | **+0.24 ± 0.17** |
| Networks | 7.04 | 6.12 | **-0.92 ± 0.23** |
| Links built | 7.04 | 6.12 | **-0.92 ± 0.23** |
| Passes | 3.34 | 3.88 | +0.54 ± 0.71 |
| Shortfall sales | 2.25 | 2.50 | +0.25 ± 0.38 |
| VP lost to shortfalls | 2.46 | 2.40 | -0.07 ± 0.72 |
| Own unflipped overbuilds | 0.83 | 1.06 | **+0.23 ± 0.14** |

### normal-rounds vs normal-a5, 4 players (100 paired seeds)

| Measure (per player per game) | normal-a5 | normal-rounds | Difference |
|---|---|---|---|
| Final VP | 43.67 | 41.02 | -2.65 ± 2.83 |
| Winner VP | 64.11 | 63.10 | -1.01 ± 3.47 |
| Link VP | 17.68 | 15.92 | **-1.76 ± 0.97** |
| Tile VP | 26.48 | 25.36 | -1.11 ± 1.66 |
| Income level | -0.65 | -0.98 | -0.33 ± 0.76 |
| Money left | 14.87 | 13.10 | -1.76 ± 1.82 |
| Loans | 4.83 | 4.80 | -0.03 ± 0.19 |
| Builds | 9.54 | 11.13 | **+1.60 ± 0.25** |
| Develop actions | 6.48 | 5.31 | **-1.17 ± 0.22** |
| Tiles sold | 1.74 | 2.03 | **+0.29 ± 0.14** |
| Networks | 6.50 | 5.59 | **-0.91 ± 0.19** |
| Links built | 6.50 | 5.59 | **-0.91 ± 0.19** |
| Passes | 1.76 | 2.10 | +0.34 ± 0.55 |
| Shortfall sales | 1.28 | 1.64 | **+0.36 ± 0.24** |
| VP lost to shortfalls | 1.62 | 1.57 | -0.06 ± 0.55 |
| Own unflipped overbuilds | 0.65 | 0.80 | **+0.15 ± 0.10** |

### hard-rounds vs hard-a5, 2 players (100 paired seeds)

| Measure (per player per game) | hard-a5 | hard-rounds | Difference |
|---|---|---|---|
| Final VP | 41.91 | 39.41 | -2.50 ± 4.85 |
| Winner VP | 56.85 | 56.38 | -0.47 ± 5.20 |
| Link VP | 17.44 | 15.90 | **-1.54 ± 1.25** |
| Tile VP | 28.01 | 27.11 | -0.91 ± 2.76 |
| Income level | -4.16 | -4.74 | -0.58 ± 0.91 |
| Money left | 10.29 | 10.47 | +0.18 ± 2.16 |
| Loans | 6.01 | 6.14 | +0.13 ± 0.28 |
| Builds | 12.10 | 13.11 | **+1.01 ± 0.47** |
| Develop actions | 6.67 | 6.03 | **-0.65 ± 0.31** |
| Tiles sold | 1.80 | 1.76 | -0.04 ± 0.21 |
| Networks | 7.11 | 6.39 | **-0.71 ± 0.31** |
| Links built | 7.11 | 6.39 | **-0.71 ± 0.31** |
| Passes | 4.54 | 4.92 | +0.38 ± 1.13 |
| Shortfall sales | 3.13 | 3.19 | +0.06 ± 0.48 |
| VP lost to shortfalls | 3.84 | 3.87 | +0.03 ± 1.34 |
| Own unflipped overbuilds | 1.46 | 1.90 | **+0.43 ± 0.20** |

### hard-rounds vs hard-a5, 3 players (100 paired seeds)

| Measure (per player per game) | hard-a5 | hard-rounds | Difference |
|---|---|---|---|
| Final VP | 37.04 | 32.14 | **-4.90 ± 3.32** |
| Winner VP | 58.50 | 53.67 | **-4.83 ± 4.05** |
| Link VP | 15.70 | 12.81 | **-2.90 ± 1.01** |
| Tile VP | 24.23 | 22.18 | **-2.05 ± 2.04** |
| Income level | -3.65 | -4.64 | **-0.99 ± 0.80** |
| Money left | 10.00 | 9.66 | -0.34 ± 1.87 |
| Loans | 5.37 | 5.51 | +0.14 ± 0.19 |
| Builds | 11.22 | 12.32 | **+1.10 ± 0.44** |
| Develop actions | 6.00 | 5.02 | **-0.98 ± 0.26** |
| Tiles sold | 1.65 | 1.75 | +0.09 ± 0.17 |
| Networks | 6.38 | 5.27 | **-1.11 ± 0.23** |
| Links built | 6.38 | 5.27 | **-1.11 ± 0.23** |
| Passes | 4.09 | 5.03 | **+0.95 ± 0.83** |
| Shortfall sales | 2.69 | 3.14 | **+0.45 ± 0.38** |
| VP lost to shortfalls | 3.01 | 2.97 | -0.05 ± 0.74 |
| Own unflipped overbuilds | 1.02 | 1.27 | **+0.25 ± 0.15** |

### hard-rounds vs hard-a5, 4 players (100 paired seeds)

| Measure (per player per game) | hard-a5 | hard-rounds | Difference |
|---|---|---|---|
| Final VP | 40.85 | 33.93 | **-6.92 ± 2.78** |
| Winner VP | 62.31 | 55.02 | **-7.29 ± 3.17** |
| Link VP | 16.31 | 12.64 | **-3.67 ± 0.90** |
| Tile VP | 25.00 | 22.03 | **-2.98 ± 1.62** |
| Income level | -1.15 | -3.22 | **-2.07 ± 0.69** |
| Money left | 12.71 | 10.89 | -1.81 ± 1.90 |
| Loans | 4.76 | 5.13 | **+0.37 ± 0.17** |
| Builds | 10.73 | 11.88 | **+1.15 ± 0.33** |
| Develop actions | 5.55 | 4.48 | **-1.07 ± 0.19** |
| Tiles sold | 1.79 | 1.76 | -0.03 ± 0.12 |
| Networks | 5.84 | 4.69 | **-1.15 ± 0.17** |
| Links built | 5.84 | 4.69 | **-1.15 ± 0.17** |
| Passes | 2.23 | 3.05 | **+0.82 ± 0.61** |
| Shortfall sales | 1.73 | 2.60 | **+0.88 ± 0.31** |
| VP lost to shortfalls | 1.72 | 2.11 | +0.39 ± 0.53 |
| Own unflipped overbuilds | 0.90 | 1.07 | **+0.17 ± 0.14** |

### easy vs easy-a5, 2 players (100 paired seeds)

| Measure (per player per game) | easy-a5 | easy | Difference |
|---|---|---|---|
| Final VP | 35.30 | 31.67 | -3.63 ± 4.38 |
| Winner VP | 49.48 | 46.66 | -2.82 ± 5.26 |
| Link VP | 15.27 | 13.77 | **-1.50 ± 1.31** |
| Tile VP | 23.11 | 21.16 | -1.95 ± 2.60 |
| Income level | -4.37 | -4.80 | -0.43 ± 1.09 |
| Money left | 9.45 | 10.15 | +0.70 ± 2.16 |
| Loans | 5.66 | 5.58 | -0.07 ± 0.26 |
| Builds | 9.85 | 10.55 | **+0.70 ± 0.48** |
| Develop actions | 7.38 | 6.61 | **-0.78 ± 0.34** |
| Tiles sold | 1.33 | 1.49 | +0.15 ± 0.19 |
| Networks | 6.78 | 6.13 | **-0.65 ± 0.36** |
| Links built | 6.78 | 6.13 | **-0.65 ± 0.36** |
| Passes | 6.55 | 7.17 | +0.63 ± 1.08 |
| Shortfall sales | 2.62 | 2.83 | +0.22 ± 0.42 |
| VP lost to shortfalls | 3.27 | 3.52 | +0.24 ± 1.02 |
| Own unflipped overbuilds | 0.96 | 1.09 | +0.13 ± 0.19 |

### easy vs easy-a5, 3 players (100 paired seeds)

| Measure (per player per game) | easy-a5 | easy | Difference |
|---|---|---|---|
| Final VP | 33.67 | 32.46 | -1.21 ± 3.21 |
| Winner VP | 55.51 | 51.79 | **-3.72 ± 3.69** |
| Link VP | 14.83 | 13.55 | **-1.28 ± 1.12** |
| Tile VP | 21.03 | 21.18 | +0.15 ± 1.83 |
| Income level | -3.16 | -3.47 | -0.31 ± 0.82 |
| Money left | 12.28 | 12.62 | +0.34 ± 2.30 |
| Loans | 4.87 | 5.11 | **+0.24 ± 0.22** |
| Builds | 8.95 | 10.08 | **+1.13 ± 0.34** |
| Develop actions | 6.95 | 6.01 | **-0.94 ± 0.28** |
| Tiles sold | 1.29 | 1.57 | **+0.28 ± 0.15** |
| Networks | 6.46 | 5.77 | **-0.69 ± 0.29** |
| Links built | 6.46 | 5.77 | **-0.69 ± 0.29** |
| Passes | 5.38 | 5.43 | +0.06 ± 0.80 |
| Shortfall sales | 2.03 | 2.09 | +0.06 ± 0.30 |
| VP lost to shortfalls | 2.40 | 2.48 | +0.08 ± 0.70 |
| Own unflipped overbuilds | 0.63 | 0.78 | **+0.15 ± 0.14** |

### easy vs easy-a5, 4 players (100 paired seeds)

| Measure (per player per game) | easy-a5 | easy | Difference |
|---|---|---|---|
| Final VP | 36.26 | 37.56 | +1.30 ± 2.80 |
| Winner VP | 57.93 | 59.04 | +1.11 ± 3.23 |
| Link VP | 14.57 | 14.93 | +0.35 ± 0.95 |
| Tile VP | 22.62 | 22.89 | +0.26 ± 1.61 |
| Income level | -1.61 | -1.02 | +0.59 ± 0.86 |
| Money left | 15.79 | 15.31 | -0.48 ± 2.28 |
| Loans | 4.41 | 4.53 | +0.12 ± 0.16 |
| Builds | 8.23 | 9.29 | **+1.06 ± 0.27** |
| Develop actions | 6.95 | 5.83 | **-1.13 ± 0.21** |
| Tiles sold | 1.31 | 1.80 | **+0.49 ± 0.14** |
| Networks | 5.78 | 5.42 | **-0.36 ± 0.23** |
| Links built | 5.78 | 5.42 | **-0.36 ± 0.23** |
| Passes | 3.36 | 3.34 | -0.03 ± 0.54 |
| Shortfall sales | 1.28 | 1.51 | +0.23 ± 0.24 |
| VP lost to shortfalls | 1.82 | 1.56 | -0.27 ± 0.47 |
| Own unflipped overbuilds | 0.52 | 0.54 | +0.03 ± 0.10 |

### normal vs normal-a5, 2 players (100 paired seeds)

| Measure (per player per game) | normal-a5 | normal | Difference |
|---|---|---|---|
| Final VP | 41.05 | 41.54 | +0.49 ± 4.77 |
| Winner VP | 57.50 | 56.50 | -1.00 ± 5.19 |
| Link VP | 17.23 | 16.98 | -0.26 ± 1.28 |
| Tile VP | 27.50 | 27.34 | -0.16 ± 2.91 |
| Income level | -4.12 | -3.44 | +0.68 ± 1.00 |
| Money left | 9.96 | 10.89 | +0.93 ± 2.36 |
| Loans | 5.97 | 6.08 | +0.10 ± 0.29 |
| Builds | 11.54 | 12.70 | **+1.16 ± 0.55** |
| Develop actions | 7.25 | 6.35 | **-0.91 ± 0.34** |
| Tiles sold | 1.76 | 2.03 | **+0.27 ± 0.23** |
| Networks | 7.27 | 6.79 | **-0.48 ± 0.29** |
| Links built | 7.27 | 6.79 | **-0.48 ± 0.29** |
| Passes | 4.41 | 4.32 | -0.09 ± 1.15 |
| Shortfall sales | 2.81 | 2.77 | -0.04 ± 0.46 |
| VP lost to shortfalls | 3.88 | 3.07 | -0.81 ± 1.08 |
| Own unflipped overbuilds | 1.28 | 1.53 | **+0.24 ± 0.20** |

### normal vs normal-a5, 3 players (100 paired seeds)

| Measure (per player per game) | normal-a5 | normal | Difference |
|---|---|---|---|
| Final VP | 42.32 | 39.22 | -3.11 ± 3.50 |
| Winner VP | 63.61 | 59.65 | -3.96 ± 4.17 |
| Link VP | 17.84 | 15.80 | **-2.04 ± 1.02** |
| Tile VP | 26.72 | 25.53 | -1.19 ± 2.17 |
| Income level | -2.50 | -3.17 | -0.67 ± 0.84 |
| Money left | 12.27 | 12.04 | -0.23 ± 2.14 |
| Loans | 5.28 | 5.46 | +0.18 ± 0.21 |
| Builds | 10.56 | 11.74 | **+1.18 ± 0.36** |
| Develop actions | 6.70 | 5.64 | **-1.06 ± 0.24** |
| Tiles sold | 1.70 | 1.94 | **+0.24 ± 0.17** |
| Networks | 7.04 | 6.12 | **-0.92 ± 0.23** |
| Links built | 7.04 | 6.12 | **-0.92 ± 0.23** |
| Passes | 3.34 | 3.88 | +0.54 ± 0.71 |
| Shortfall sales | 2.25 | 2.50 | +0.25 ± 0.38 |
| VP lost to shortfalls | 2.46 | 2.40 | -0.07 ± 0.72 |
| Own unflipped overbuilds | 0.83 | 1.06 | **+0.23 ± 0.14** |

### normal vs normal-a5, 4 players (100 paired seeds)

| Measure (per player per game) | normal-a5 | normal | Difference |
|---|---|---|---|
| Final VP | 43.67 | 41.02 | -2.65 ± 2.83 |
| Winner VP | 64.11 | 63.10 | -1.01 ± 3.47 |
| Link VP | 17.68 | 15.92 | **-1.76 ± 0.97** |
| Tile VP | 26.48 | 25.36 | -1.11 ± 1.66 |
| Income level | -0.65 | -0.98 | -0.33 ± 0.76 |
| Money left | 14.87 | 13.10 | -1.76 ± 1.82 |
| Loans | 4.83 | 4.80 | -0.03 ± 0.19 |
| Builds | 9.54 | 11.13 | **+1.60 ± 0.25** |
| Develop actions | 6.48 | 5.31 | **-1.17 ± 0.22** |
| Tiles sold | 1.74 | 2.03 | **+0.29 ± 0.14** |
| Networks | 6.50 | 5.59 | **-0.91 ± 0.19** |
| Links built | 6.50 | 5.59 | **-0.91 ± 0.19** |
| Passes | 1.76 | 2.10 | +0.34 ± 0.55 |
| Shortfall sales | 1.28 | 1.64 | **+0.36 ± 0.24** |
| VP lost to shortfalls | 1.62 | 1.57 | -0.06 ± 0.55 |
| Own unflipped overbuilds | 0.65 | 0.80 | **+0.15 ± 0.10** |

### hard vs hard-a5, 2 players (100 paired seeds)

| Measure (per player per game) | hard-a5 | hard | Difference |
|---|---|---|---|
| Final VP | 41.91 | 39.29 | -2.62 ± 5.31 |
| Winner VP | 56.85 | 53.51 | -3.34 ± 5.80 |
| Link VP | 17.44 | 16.43 | -1.01 ± 1.27 |
| Tile VP | 28.01 | 26.81 | -1.20 ± 3.08 |
| Income level | -4.16 | -4.64 | -0.48 ± 0.90 |
| Money left | 10.29 | 10.38 | +0.09 ± 2.50 |
| Loans | 6.01 | 6.17 | +0.16 ± 0.30 |
| Builds | 12.10 | 13.06 | **+0.96 ± 0.60** |
| Develop actions | 6.67 | 6.14 | **-0.54 ± 0.35** |
| Tiles sold | 1.80 | 1.84 | +0.04 ± 0.21 |
| Networks | 7.11 | 6.56 | **-0.55 ± 0.32** |
| Links built | 7.11 | 6.56 | **-0.55 ± 0.32** |
| Passes | 4.54 | 4.50 | -0.04 ± 1.30 |
| Shortfall sales | 3.13 | 3.09 | -0.04 ± 0.55 |
| VP lost to shortfalls | 3.84 | 4.27 | +0.43 ± 1.47 |
| Own unflipped overbuilds | 1.46 | 1.84 | **+0.38 ± 0.21** |

### hard vs hard-a5, 3 players (100 paired seeds)

| Measure (per player per game) | hard-a5 | hard | Difference |
|---|---|---|---|
| Final VP | 37.04 | 31.91 | **-5.13 ± 3.78** |
| Winner VP | 58.50 | 53.75 | **-4.75 ± 4.31** |
| Link VP | 15.70 | 12.86 | **-2.84 ± 1.15** |
| Tile VP | 24.23 | 21.87 | **-2.37 ± 2.35** |
| Income level | -3.65 | -4.75 | **-1.10 ± 0.86** |
| Money left | 10.00 | 10.15 | +0.15 ± 1.92 |
| Loans | 5.37 | 5.45 | +0.09 ± 0.21 |
| Builds | 11.22 | 11.99 | **+0.77 ± 0.48** |
| Develop actions | 6.00 | 4.91 | **-1.09 ± 0.30** |
| Tiles sold | 1.65 | 1.64 | -0.01 ± 0.19 |
| Networks | 6.38 | 5.35 | **-1.03 ± 0.25** |
| Links built | 6.38 | 5.35 | **-1.03 ± 0.25** |
| Passes | 4.09 | 5.51 | **+1.43 ± 1.00** |
| Shortfall sales | 2.69 | 3.11 | **+0.42 ± 0.40** |
| VP lost to shortfalls | 3.01 | 2.95 | -0.06 ± 0.78 |
| Own unflipped overbuilds | 1.02 | 1.29 | **+0.27 ± 0.16** |

### hard vs hard-a5, 4 players (100 paired seeds)

| Measure (per player per game) | hard-a5 | hard | Difference |
|---|---|---|---|
| Final VP | 40.85 | 35.78 | **-5.06 ± 3.03** |
| Winner VP | 62.31 | 56.48 | **-5.83 ± 3.56** |
| Link VP | 16.31 | 13.19 | **-3.12 ± 0.96** |
| Tile VP | 25.00 | 22.88 | **-2.13 ± 1.84** |
| Income level | -1.15 | -2.63 | **-1.48 ± 0.85** |
| Money left | 12.71 | 12.37 | -0.34 ± 1.80 |
| Loans | 4.76 | 5.15 | **+0.39 ± 0.16** |
| Builds | 10.73 | 11.93 | **+1.20 ± 0.29** |
| Develop actions | 5.55 | 4.49 | **-1.07 ± 0.20** |
| Tiles sold | 1.79 | 1.83 | +0.03 ± 0.15 |
| Networks | 5.84 | 4.82 | **-1.02 ± 0.20** |
| Links built | 5.84 | 4.82 | **-1.02 ± 0.20** |
| Passes | 2.23 | 2.81 | **+0.57 ± 0.57** |
| Shortfall sales | 1.73 | 2.26 | **+0.54 ± 0.30** |
| VP lost to shortfalls | 1.72 | 1.72 | +0.00 ± 0.50 |
| Own unflipped overbuilds | 0.90 | 1.10 | **+0.20 ± 0.12** |

# 3. Legality, fairness and decision-sensitivity probe

`ai-audit.js --games 10`, the corrected AI. 10 all-AI games per difficulty and player count (seeds 1000 × players + 1…10). The last two columns count decisions that the information correction and the rounds correction each change in the same position.

| Players | Difficulty | Decisions | Illegal | State changed | Changes with resampled opponent hands | Changes with reshuffled deck | Moves leaving a choice to the engine | Rail networks with a double link legal | Changed by the information correction | Changed by the rounds correction |
|---|---|---|---|---|---|---|---|---|---|---|
| 2 | easy | 780 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 27 (3.5%) (iron 7, merchant 10, freeDevelop 4, coal 6) | 15 of 60 | 0 (0.0%) | 54 (6.9%) |
| 2 | normal | 780 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 32 (4.1%) (freeDevelop 2, iron 7, beer 5, merchant 12, coal 6) | 8 of 53 | 0 (0.0%) | 66 (8.5%) |
| 2 | hard | 780 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 24 (3.1%) (iron 6, beer 7, freeDevelop 2, merchant 7, coal 2) | 4 of 38 | 16 (2.1%) | 47 (6.0%) |
| 3 | easy | 1050 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 44 (4.2%) (merchant 10, iron 10, coal 13, beer 2, freeDevelop 9) | 16 of 79 | 0 (0.0%) | 102 (9.7%) |
| 3 | normal | 1050 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 36 (3.4%) (merchant 12, freeDevelop 12, coal 4, iron 7, beer 1) | 15 of 75 | 0 (0.0%) | 120 (11.4%) |
| 3 | hard | 1050 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 48 (4.6%) (merchant 14, freeDevelop 9, iron 5, coal 17, beer 3) | 15 of 79 | 27 (2.6%) | 139 (13.2%) |
| 4 | easy | 1240 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 65 (5.2%) (freeDevelop 10, coal 32, merchant 19, iron 4) | 27 of 102 | 0 (0.0%) | 126 (10.2%) |
| 4 | normal | 1240 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 41 (3.3%) (freeDevelop 8, iron 13, merchant 13, coal 5, beer 2) | 14 of 88 | 0 (0.0%) | 160 (12.9%) |
| 4 | hard | 1240 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 28 (2.3%) (merchant 17, freeDevelop 7, iron 1, coal 3) | 13 of 86 | 39 (3.1%) | 172 (13.9%) |

# 4. Decision probes (corrected AI)

`ai-probes.js --players N --seeds 100 --levels easy,normal,hard`, the mirror seeds of section 2. Compare with the baseline in [Assignment 5 results §3](ai-baseline-results.md#3-decision-probes).

## 4.1 2 players, 100 mirror games per difficulty (seeds 202001…)


### easy
- Loans: 1117; with no Build or Network affordable: 932 of 1117 (83%); in the last two Rail rounds: 103 of 1117 (9%); followed by an income shortfall in the same era: 580 of 1117 (52%)
- Sell legal at 356 of 7800 (5%) of turn actions; not chosen: 64 of 356 (18%); chose Pass or Loan instead: 23 of 356 (6%)
- Tiles developed: 2449; industry never built afterwards: 1119 of 2449 (46%)
- Money spent per player per game: £188: Build 66%, Network 14%, Develop 19%; loans raised £168
- Overbuilt own unflipped tiles: 219 (£2668 spent on them), destroying 442 resource cubes

### normal
- Loans: 1215; with no Build or Network affordable: 1177 of 1215 (97%); in the last two Rail rounds: 123 of 1215 (10%); followed by an income shortfall in the same era: 601 of 1215 (49%)
- Sell legal at 416 of 7800 (5%) of turn actions; not chosen: 19 of 416 (5%); chose Pass or Loan instead: 9 of 416 (2%)
- Tiles developed: 2383; industry never built afterwards: 969 of 2383 (41%)
- Money spent per player per game: £213: Build 71%, Network 14%, Develop 15%; loans raised £182
- Overbuilt own unflipped tiles: 306 (£3894 spent on them), destroying 590 resource cubes

### hard
- Loans: 1235; with no Build or Network affordable: 1207 of 1235 (98%); in the last two Rail rounds: 123 of 1235 (10%); followed by an income shortfall in the same era: 580 of 1235 (47%)
- Sell legal at 389 of 7800 (5%) of turn actions; not chosen: 25 of 389 (6%); chose Pass or Loan instead: 7 of 389 (2%)
- Tiles developed: 2310; industry never built afterwards: 943 of 2310 (41%)
- Money spent per player per game: £209: Build 74%, Network 14%, Develop 13%; loans raised £185
- Overbuilt own unflipped tiles: 367 (£4524 spent on them), destroying 715 resource cubes

## 4.2 3 players, 100 mirror games per difficulty (seeds 203001…)


### easy
- Loans: 1534; with no Build or Network affordable: 1234 of 1534 (80%); in the last two Rail rounds: 160 of 1534 (10%); followed by an income shortfall in the same era: 657 of 1534 (43%)
- Sell legal at 581 of 10500 (6%) of turn actions; not chosen: 128 of 581 (22%); chose Pass or Loan instead: 58 of 581 (10%)
- Tiles developed: 3299; industry never built afterwards: 1698 of 3299 (51%)
- Money spent per player per game: £180: Build 65%, Network 14%, Develop 21%; loans raised £153
- Overbuilt own unflipped tiles: 233 (£2922 spent on them), destroying 428 resource cubes

### normal
- Loans: 1638; with no Build or Network affordable: 1573 of 1638 (96%); in the last two Rail rounds: 184 of 1638 (11%); followed by an income shortfall in the same era: 756 of 1638 (46%)
- Sell legal at 607 of 10500 (6%) of turn actions; not chosen: 41 of 607 (7%); chose Pass or Loan instead: 14 of 607 (2%)
- Tiles developed: 3182; industry never built afterwards: 1471 of 3182 (46%)
- Money spent per player per game: £200: Build 70%, Network 13%, Develop 17%; loans raised £164
- Overbuilt own unflipped tiles: 319 (£4247 spent on them), destroying 560 resource cubes

### hard
- Loans: 1636; with no Build or Network affordable: 1596 of 1636 (98%); in the last two Rail rounds: 154 of 1636 (9%); followed by an income shortfall in the same era: 890 of 1636 (54%)
- Sell legal at 512 of 10500 (5%) of turn actions; not chosen: 35 of 512 (7%); chose Pass or Loan instead: 13 of 512 (3%)
- Tiles developed: 2785; industry never built afterwards: 1350 of 2785 (48%)
- Money spent per player per game: £188: Build 74%, Network 12%, Develop 14%; loans raised £164
- Overbuilt own unflipped tiles: 386 (£4777 spent on them), destroying 663 resource cubes

## 4.3 4 players, 100 mirror games per difficulty (seeds 204001…)


### easy
- Loans: 1813; with no Build or Network affordable: 1440 of 1813 (79%); in the last two Rail rounds: 224 of 1813 (12%); followed by an income shortfall in the same era: 652 of 1813 (36%)
- Sell legal at 840 of 12400 (7%) of turn actions; not chosen: 140 of 840 (17%); chose Pass or Loan instead: 47 of 840 (6%)
- Tiles developed: 4320; industry never built afterwards: 2323 of 4320 (54%)
- Money spent per player per game: £172: Build 63%, Network 14%, Develop 23%; loans raised £136
- Overbuilt own unflipped tiles: 217 (£2567 spent on them), destroying 364 resource cubes

### normal
- Loans: 1919; with no Build or Network affordable: 1832 of 1919 (95%); in the last two Rail rounds: 238 of 1919 (12%); followed by an income shortfall in the same era: 718 of 1919 (37%)
- Sell legal at 835 of 12400 (7%) of turn actions; not chosen: 46 of 835 (6%); chose Pass or Loan instead: 15 of 835 (2%)
- Tiles developed: 3966; industry never built afterwards: 1939 of 3966 (49%)
- Money spent per player per game: £188: Build 69%, Network 13%, Develop 19%; loans raised £144
- Overbuilt own unflipped tiles: 320 (£4045 spent on them), destroying 585 resource cubes

### hard
- Loans: 2059; with no Build or Network affordable: 1994 of 2059 (97%); in the last two Rail rounds: 251 of 2059 (12%); followed by an income shortfall in the same era: 992 of 2059 (48%)
- Sell legal at 741 of 12400 (6%) of turn actions; not chosen: 41 of 741 (6%); chose Pass or Loan instead: 14 of 741 (2%)
- Tiles developed: 3384; industry never built afterwards: 1643 of 3384 (49%)
- Money spent per player per game: £182: Build 74%, Network 11%, Develop 15%; loans raised £154
- Overbuilt own unflipped tiles: 441 (£5464 spent on them), destroying 822 resource cubes
