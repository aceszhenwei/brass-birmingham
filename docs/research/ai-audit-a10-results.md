# Audit Closure: Results (Assignment 10)

Generated output of the research scripts, used by [the Assignment 10 report](ai-audit-a10.md). The report's [reproduction section](ai-audit-a10.md#7-reproducing-the-experiments) regenerates every number; the raw per-game data is not committed.

Policy names: the experiments ran while the Assignment 9 AI was production, so in §1–4 `normal`, `easy` and `hard` are **the Assignment 9 AI** (now `<level>%a9`, `AIPlayer.LEGACY_A9`). `%combined` (`double` + `develop-horizon`) was adopted and is now the production AI ([plan](ai-audit-a10-plan.md)). Columns in §1–3: the candidate's win share and VP difference (candidate − baseline) ± 1.96 SE; pooled = 2, 3 and 4 players weighted equally (`ai-criteria.js`).

# 1. Exploration matchups (seeds 200000 + 1000 × players + i)

Seat-balanced, against `normal`; 2 players: 100 seeds, 3 and 4 players: 40 seeds. `value-shortfall` is the re-run after the farm-brewery fix; `buildable-cards` was added after `useful-cards` failed; `combined` joins the two candidates that passed.

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| normal%double vs normal | 2 | 200 | 55.5% ± 6.9 | +3.40 ± 4.60 | includes 0 |
| normal%double vs normal | 3 | 240 | 52.9% ± 6.3 | +4.10 ± 3.90 | above 0 |
| normal%double vs normal | 4 | 240 | 59.2% ± 6.2 | +4.29 ± 2.55 | above 0 |
| normal%double vs normal | **pooled** | 680 | 55.9% ± 3.7 | +3.93 ± 2.18 | **improves** |
| normal%useful-cards vs normal | 2 | 200 | 45.3% ± 6.9 | -2.37 ± 4.76 | includes 0 |
| normal%useful-cards vs normal | 3 | 240 | 45.4% ± 6.3 | -3.32 ± 3.76 | includes 0 |
| normal%useful-cards vs normal | 4 | 240 | 56.3% ± 6.3 | +0.21 ± 2.54 | includes 0 |
| normal%useful-cards vs normal | **pooled** | 680 | 49.0% ± 3.8 | -1.82 ± 2.19 | no improvement |
| normal%own-sources vs normal | 2 | 200 | 51.5% ± 6.9 | +0.28 ± 4.61 | includes 0 |
| normal%own-sources vs normal | 3 | 240 | 50.0% ± 6.3 | -0.07 ± 4.07 | includes 0 |
| normal%own-sources vs normal | 4 | 240 | 50.0% ± 6.3 | +0.10 ± 2.55 | includes 0 |
| normal%own-sources vs normal | **pooled** | 680 | 50.5% ± 3.8 | +0.10 ± 2.22 | no improvement |
| normal%develop-horizon vs normal | 2 | 200 | 55.5% ± 6.9 | +3.15 ± 4.65 | includes 0 |
| normal%develop-horizon vs normal | 3 | 240 | 52.9% ± 6.3 | +3.37 ± 4.20 | includes 0 |
| normal%develop-horizon vs normal | 4 | 240 | 61.7% ± 6.2 | +4.52 ± 2.65 | above 0 |
| normal%develop-horizon vs normal | **pooled** | 680 | 56.7% ± 3.7 | +3.68 ± 2.27 | **improves** |
| normal%value-shortfall vs normal | 2 | 200 | 48.5% ± 6.9 | -1.14 ± 4.64 | includes 0 |
| normal%value-shortfall vs normal | 3 | 240 | 48.3% ± 6.3 | -2.05 ± 4.08 | includes 0 |
| normal%value-shortfall vs normal | 4 | 240 | 50.0% ± 6.3 | +0.32 ± 2.57 | includes 0 |
| normal%value-shortfall vs normal | **pooled** | 680 | 48.9% ± 3.8 | -0.95 ± 2.23 | no improvement |
| normal%buildable-cards vs normal | 2 | 200 | 48.5% ± 6.9 | +0.43 ± 4.64 | includes 0 |
| normal%buildable-cards vs normal | 3 | 240 | 52.9% ± 6.3 | +0.61 ± 3.83 | includes 0 |
| normal%buildable-cards vs normal | 4 | 240 | 49.2% ± 6.3 | +0.23 ± 2.66 | includes 0 |
| normal%buildable-cards vs normal | **pooled** | 680 | 50.2% ± 3.8 | +0.43 ± 2.19 | no improvement |
| normal%combined vs normal | 2 | 200 | 61.0% ± 6.8 | +7.04 ± 4.72 | above 0 |
| normal%combined vs normal | 3 | 240 | 58.3% ± 6.3 | +7.27 ± 3.99 | above 0 |
| normal%combined vs normal | 4 | 240 | 66.7% ± 6.0 | +8.33 ± 2.61 | above 0 |
| normal%combined vs normal | **pooled** | 680 | 62.0% ± 3.7 | +7.55 ± 2.24 | **improves** |

# 2. Validation matchups (held-out seeds 600000 + 1000 × players + i)

`combined` against the Assignment 9 AI at every difficulty; 2 players: 150 seeds, 3 and 4 players: 60 seeds.

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| easy%combined vs easy | 2 | 300 | 56.5% ± 5.6 | +4.85 ± 4.10 | above 0 |
| easy%combined vs easy | 3 | 360 | 58.3% ± 5.1 | +4.94 ± 3.27 | above 0 |
| easy%combined vs easy | 4 | 360 | 64.2% ± 5.0 | +5.73 ± 2.24 | above 0 |
| easy%combined vs easy | **pooled** | 1020 | 59.7% ± 3.0 | +5.17 ± 1.90 | **improves** |
| normal%combined vs normal | 2 | 300 | 63.3% ± 5.5 | +7.94 ± 4.82 | above 0 |
| normal%combined vs normal | 3 | 360 | 62.2% ± 5.0 | +7.37 ± 3.22 | above 0 |
| normal%combined vs normal | 4 | 360 | 66.9% ± 4.9 | +7.20 ± 2.20 | above 0 |
| normal%combined vs normal | **pooled** | 1020 | 64.2% ± 3.0 | +7.50 ± 2.07 | **improves** |
| hard%combined vs hard | 2 | 300 | 61.3% ± 5.5 | +5.87 ± 4.14 | above 0 |
| hard%combined vs hard | 3 | 360 | 67.2% ± 4.9 | +8.80 ± 3.13 | above 0 |
| hard%combined vs hard | 4 | 360 | 69.2% ± 4.8 | +9.58 ± 2.35 | above 0 |
| hard%combined vs hard | **pooled** | 1020 | 65.9% ± 2.9 | +8.08 ± 1.90 | **improves** |

# 3. Generalisation: different opponents (held-out seeds)

Normal with and without `combined` against Hard and Easy (the Assignment 9 AI); 2 players: 100 seeds, 3 and 4 players: 40 seeds.

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| normal%combined vs hard | 2 | 200 | 60.0% ± 6.8 | +7.18 ± 5.19 | above 0 |
| normal%combined vs hard | 3 | 240 | 70.0% ± 5.8 | +8.96 ± 3.72 | above 0 |
| normal%combined vs hard | 4 | 240 | 70.8% ± 5.8 | +7.34 ± 2.86 | above 0 |
| normal%combined vs hard | **pooled** | 680 | 66.9% ± 3.5 | +7.83 ± 2.33 | **improves** |
| normal vs hard | 2 | 200 | 49.0% ± 6.9 | +0.59 ± 5.20 | includes 0 |
| normal vs hard | 3 | 240 | 55.0% ± 6.3 | +1.79 ± 3.69 | includes 0 |
| normal vs hard | 4 | 240 | 56.3% ± 6.3 | -0.23 ± 2.68 | includes 0 |
| normal vs hard | **pooled** | 680 | 53.4% ± 3.8 | +0.72 ± 2.31 | no improvement |
| normal%combined vs easy | 2 | 200 | 63.5% ± 6.7 | +7.87 ± 5.65 | above 0 |
| normal%combined vs easy | 3 | 240 | 63.8% ± 6.1 | +8.67 ± 3.97 | above 0 |
| normal%combined vs easy | 4 | 240 | 72.1% ± 5.7 | +11.75 ± 2.75 | above 0 |
| normal%combined vs easy | **pooled** | 680 | 66.4% ± 3.6 | +9.43 ± 2.48 | **improves** |
| normal vs easy | 2 | 200 | 55.5% ± 6.9 | +2.10 ± 5.30 | includes 0 |
| normal vs easy | 3 | 240 | 52.9% ± 6.3 | +1.73 ± 3.68 | includes 0 |
| normal vs easy | 4 | 240 | 61.3% ± 6.2 | +4.66 ± 2.62 | above 0 |
| normal vs easy | **pooled** | 680 | 56.6% ± 3.7 | +2.83 ± 2.32 | **improves** |

# 4. Paired mirror comparisons (exploration seeds, 100 per player count)

Every seat plays the candidate, against every seat playing the Assignment 9 AI on the same seeds; per player per game, ± 1.96 SE of the paired difference; **bold** = significant. (`buildable-cards` was run after the adoption, against `normal%a9`, which replays the same games.)


### normal%combined vs normal, 2 players (100 paired seeds)

| Measure (per player per game) | normal | normal%combined | Difference |
|---|---|---|---|
| Final VP | 65.33 | 76.00 | **+10.66 ± 2.84** |
| Winner VP | 77.73 | 89.68 | **+11.95 ± 2.91** |
| Link VP | 24.46 | 29.11 | **+4.64 ± 0.98** |
| Tile VP | 41.79 | 47.32 | **+5.53 ± 1.84** |
| Income level | -0.39 | 2.33 | **+2.71 ± 0.79** |
| Money left | 15.00 | 17.41 | +2.40 ± 2.54 |
| Loans | 5.86 | 5.88 | +0.02 ± 0.15 |
| Builds | 11.47 | 11.96 | **+0.48 ± 0.16** |
| Develop actions | 8.11 | 6.95 | **-1.17 ± 0.19** |
| Tiles sold | 2.93 | 3.14 | **+0.21 ± 0.14** |
| Networks | 8.12 | 8.67 | **+0.56 ± 0.16** |
| Links built | 8.12 | 9.41 | **+1.30 ± 0.19** |
| Passes | 1.61 | 1.50 | -0.11 ± 0.38 |
| Shortfall sales | 1.85 | 1.56 | -0.29 ± 0.32 |
| VP lost to shortfalls | 1.41 | 0.95 | -0.45 ± 0.45 |
| Own unflipped overbuilds | 0.01 | 0.01 | +0.01 ± 0.02 |

### normal%combined vs normal, 3 players (100 paired seeds)

| Measure (per player per game) | normal | normal%combined | Difference |
|---|---|---|---|
| Final VP | 57.43 | 68.57 | **+11.14 ± 1.83** |
| Winner VP | 76.08 | 87.00 | **+10.92 ± 2.23** |
| Link VP | 23.18 | 28.48 | **+5.31 ± 0.78** |
| Tile VP | 35.02 | 40.30 | **+5.28 ± 1.08** |
| Income level | -0.08 | 2.34 | **+2.43 ± 0.58** |
| Money left | 14.05 | 19.88 | **+5.84 ± 2.12** |
| Loans | 5.16 | 5.16 | -0.00 ± 0.11 |
| Builds | 10.62 | 11.07 | **+0.46 ± 0.16** |
| Develop actions | 7.34 | 6.15 | **-1.19 ± 0.19** |
| Tiles sold | 2.48 | 2.74 | **+0.26 ± 0.09** |
| Networks | 7.45 | 8.11 | **+0.66 ± 0.15** |
| Links built | 7.45 | 8.70 | **+1.25 ± 0.15** |
| Passes | 1.60 | 1.43 | -0.18 ± 0.27 |
| Shortfall sales | 1.37 | 1.02 | **-0.35 ± 0.17** |
| VP lost to shortfalls | 1.23 | 0.79 | **-0.45 ± 0.32** |
| Own unflipped overbuilds | 0.01 | 0.04 | **+0.03 ± 0.02** |

### normal%combined vs normal, 4 players (100 paired seeds)

| Measure (per player per game) | normal | normal%combined | Difference |
|---|---|---|---|
| Final VP | 55.69 | 66.29 | **+10.60 ± 1.52** |
| Winner VP | 75.25 | 86.58 | **+11.33 ± 2.08** |
| Link VP | 21.87 | 27.43 | **+5.56 ± 0.72** |
| Tile VP | 32.83 | 37.61 | **+4.78 ± 0.86** |
| Income level | 1.30 | 3.81 | **+2.51 ± 0.49** |
| Money left | 15.62 | 20.46 | **+4.84 ± 1.65** |
| Loans | 4.46 | 4.42 | -0.04 ± 0.08 |
| Builds | 9.74 | 10.17 | **+0.42 ± 0.11** |
| Develop actions | 6.66 | 5.47 | **-1.19 ± 0.14** |
| Tiles sold | 2.44 | 2.79 | **+0.35 ± 0.08** |
| Networks | 6.55 | 7.04 | **+0.49 ± 0.12** |
| Links built | 6.55 | 7.59 | **+1.05 ± 0.12** |
| Passes | 1.01 | 0.95 | -0.06 ± 0.16 |
| Shortfall sales | 0.94 | 0.76 | **-0.18 ± 0.10** |
| VP lost to shortfalls | 0.75 | 0.62 | -0.13 ± 0.16 |
| Own unflipped overbuilds | 0.00 | 0.03 | **+0.03 ± 0.02** |

### normal%value-shortfall vs normal, 2 players (100 paired seeds)

| Measure (per player per game) | normal | normal%value-shortfall | Difference |
|---|---|---|---|
| Final VP | 65.33 | 64.80 | -0.53 ± 0.99 |
| Winner VP | 77.73 | 77.67 | -0.06 ± 0.94 |
| Link VP | 24.46 | 24.30 | -0.17 ± 0.33 |
| Tile VP | 41.79 | 41.59 | -0.20 ± 0.70 |
| Income level | -0.39 | -0.36 | +0.02 ± 0.26 |
| Money left | 15.00 | 14.94 | -0.06 ± 1.02 |
| Loans | 5.86 | 5.83 | -0.03 ± 0.06 |
| Builds | 11.47 | 11.48 | +0.01 ± 0.08 |
| Develop actions | 8.11 | 8.07 | -0.04 ± 0.14 |
| Tiles sold | 2.93 | 2.90 | -0.04 ± 0.06 |
| Networks | 8.12 | 8.16 | +0.05 ± 0.08 |
| Links built | 8.12 | 8.16 | +0.05 ± 0.08 |
| Passes | 1.61 | 1.69 | +0.07 ± 0.14 |
| Shortfall sales | 1.85 | 1.93 | +0.07 ± 0.15 |
| VP lost to shortfalls | 1.41 | 1.52 | +0.12 ± 0.20 |
| Own unflipped overbuilds | 0.01 | 0.01 | +0.00 ± 0.00 |

### normal%value-shortfall vs normal, 3 players (100 paired seeds)

| Measure (per player per game) | normal | normal%value-shortfall | Difference |
|---|---|---|---|
| Final VP | 57.43 | 56.72 | -0.71 ± 1.14 |
| Winner VP | 76.08 | 75.32 | -0.76 ± 1.80 |
| Link VP | 23.18 | 23.06 | -0.11 ± 0.43 |
| Tile VP | 35.02 | 34.42 | -0.60 ± 0.69 |
| Income level | -0.08 | -0.19 | -0.11 ± 0.35 |
| Money left | 14.05 | 14.53 | +0.49 ± 0.84 |
| Loans | 5.16 | 5.14 | -0.01 ± 0.08 |
| Builds | 10.62 | 10.63 | +0.01 ± 0.11 |
| Develop actions | 7.34 | 7.33 | -0.02 ± 0.10 |
| Tiles sold | 2.48 | 2.45 | -0.03 ± 0.06 |
| Networks | 7.45 | 7.45 | -0.00 ± 0.07 |
| Links built | 7.45 | 7.45 | -0.00 ± 0.07 |
| Passes | 1.60 | 1.67 | +0.07 ± 0.23 |
| Shortfall sales | 1.37 | 1.38 | +0.00 ± 0.08 |
| VP lost to shortfalls | 1.23 | 1.22 | -0.02 ± 0.17 |
| Own unflipped overbuilds | 0.01 | 0.00 | -0.01 ± 0.01 |

### normal%value-shortfall vs normal, 4 players (100 paired seeds)

| Measure (per player per game) | normal | normal%value-shortfall | Difference |
|---|---|---|---|
| Final VP | 55.69 | 56.01 | +0.32 ± 0.81 |
| Winner VP | 75.25 | 75.48 | +0.23 ± 1.11 |
| Link VP | 21.87 | 21.92 | +0.05 ± 0.31 |
| Tile VP | 32.83 | 32.98 | +0.15 ± 0.49 |
| Income level | 1.30 | 1.50 | +0.20 ± 0.27 |
| Money left | 15.62 | 16.32 | +0.70 ± 1.04 |
| Loans | 4.46 | 4.45 | -0.02 ± 0.06 |
| Builds | 9.74 | 9.72 | -0.02 ± 0.08 |
| Develop actions | 6.66 | 6.65 | -0.01 ± 0.09 |
| Tiles sold | 2.44 | 2.49 | +0.05 ± 0.05 |
| Networks | 6.55 | 6.57 | +0.02 ± 0.05 |
| Links built | 6.55 | 6.57 | +0.02 ± 0.05 |
| Passes | 1.01 | 1.00 | -0.02 ± 0.16 |
| Shortfall sales | 0.94 | 0.91 | -0.03 ± 0.13 |
| VP lost to shortfalls | 0.75 | 0.62 | -0.13 ± 0.17 |
| Own unflipped overbuilds | 0.00 | 0.00 | -0.00 ± 0.00 |


### normal%double vs normal, 2 players (100 paired seeds)

| Measure (per player per game) | normal | normal%double | Difference |
|---|---|---|---|
| Final VP | 65.33 | 71.31 | **+5.97 ± 2.71** |
| Winner VP | 77.73 | 84.18 | **+6.45 ± 2.74** |
| Link VP | 24.46 | 26.04 | **+1.57 ± 0.80** |
| Tile VP | 41.79 | 45.74 | **+3.95 ± 1.80** |
| Income level | -0.39 | 1.36 | **+1.75 ± 0.76** |
| Money left | 15.00 | 13.20 | -1.80 ± 2.43 |
| Loans | 5.86 | 5.91 | +0.05 ± 0.15 |
| Builds | 11.47 | 11.63 | **+0.16 ± 0.16** |
| Develop actions | 8.11 | 8.42 | **+0.31 ± 0.19** |
| Tiles sold | 2.93 | 3.02 | +0.09 ± 0.13 |
| Networks | 8.12 | 7.86 | **-0.26 ± 0.14** |
| Links built | 8.12 | 8.61 | **+0.49 ± 0.16** |
| Passes | 1.61 | 1.31 | -0.30 ± 0.38 |
| Shortfall sales | 1.85 | 1.56 | -0.28 ± 0.32 |
| VP lost to shortfalls | 1.41 | 0.95 | -0.45 ± 0.45 |
| Own unflipped overbuilds | 0.01 | 0.00 | -0.01 ± 0.01 |

### normal%double vs normal, 3 players (100 paired seeds)

| Measure (per player per game) | normal | normal%double | Difference |
|---|---|---|---|
| Final VP | 57.43 | 63.87 | **+6.43 ± 1.74** |
| Winner VP | 76.08 | 81.65 | **+5.57 ± 2.20** |
| Link VP | 23.18 | 25.25 | **+2.07 ± 0.69** |
| Tile VP | 35.02 | 38.89 | **+3.86 ± 1.03** |
| Income level | -0.08 | 1.36 | **+1.44 ± 0.53** |
| Money left | 14.05 | 15.45 | +1.40 ± 1.74 |
| Loans | 5.16 | 5.21 | +0.06 ± 0.10 |
| Builds | 10.62 | 10.72 | +0.10 ± 0.13 |
| Develop actions | 7.34 | 7.66 | **+0.32 ± 0.19** |
| Tiles sold | 2.48 | 2.64 | **+0.15 ± 0.09** |
| Networks | 7.45 | 7.22 | **-0.23 ± 0.13** |
| Links built | 7.45 | 7.80 | **+0.35 ± 0.12** |
| Passes | 1.60 | 1.22 | **-0.38 ± 0.26** |
| Shortfall sales | 1.37 | 1.05 | **-0.32 ± 0.17** |
| VP lost to shortfalls | 1.23 | 0.79 | **-0.45 ± 0.32** |
| Own unflipped overbuilds | 0.01 | 0.00 | -0.01 ± 0.01 |

### normal%double vs normal, 4 players (100 paired seeds)

| Measure (per player per game) | normal | normal%double | Difference |
|---|---|---|---|
| Final VP | 55.69 | 61.05 | **+5.36 ± 1.37** |
| Winner VP | 75.25 | 81.26 | **+6.01 ± 1.90** |
| Link VP | 21.87 | 23.93 | **+2.05 ± 0.63** |
| Tile VP | 32.83 | 35.95 | **+3.13 ± 0.78** |
| Income level | 1.30 | 2.83 | **+1.53 ± 0.46** |
| Money left | 15.62 | 16.26 | +0.64 ± 1.75 |
| Loans | 4.46 | 4.47 | +0.01 ± 0.07 |
| Builds | 9.74 | 9.82 | +0.08 ± 0.10 |
| Develop actions | 6.66 | 6.95 | **+0.28 ± 0.13** |
| Tiles sold | 2.44 | 2.63 | **+0.18 ± 0.07** |
| Networks | 6.55 | 6.22 | **-0.33 ± 0.11** |
| Links built | 6.55 | 6.78 | **+0.23 ± 0.10** |
| Passes | 1.01 | 0.79 | **-0.23 ± 0.15** |
| Shortfall sales | 0.94 | 0.77 | **-0.17 ± 0.10** |
| VP lost to shortfalls | 0.75 | 0.62 | -0.13 ± 0.16 |
| Own unflipped overbuilds | 0.00 | 0.00 | -0.00 ± 0.00 |

### normal%develop-horizon vs normal, 2 players (100 paired seeds)

| Measure (per player per game) | normal | normal%develop-horizon | Difference |
|---|---|---|---|
| Final VP | 65.33 | 69.68 | **+4.35 ± 0.94** |
| Winner VP | 77.73 | 82.56 | **+4.83 ± 1.26** |
| Link VP | 24.46 | 27.30 | **+2.84 ± 0.58** |
| Tile VP | 41.79 | 43.24 | **+1.45 ± 0.53** |
| Income level | -0.39 | 0.61 | **+0.99 ± 0.30** |
| Money left | 15.00 | 18.16 | **+3.15 ± 1.83** |
| Loans | 5.86 | 5.82 | -0.04 ± 0.05 |
| Builds | 11.47 | 11.79 | **+0.32 ± 0.07** |
| Develop actions | 8.11 | 6.79 | **-1.31 ± 0.16** |
| Tiles sold | 2.93 | 3.04 | **+0.10 ± 0.05** |
| Networks | 8.12 | 8.87 | **+0.75 ± 0.13** |
| Links built | 8.12 | 8.87 | **+0.75 ± 0.13** |
| Passes | 1.61 | 1.75 | **+0.13 ± 0.06** |
| Shortfall sales | 1.85 | 1.83 | -0.01 ± 0.02 |
| VP lost to shortfalls | 1.41 | 1.41 | +0.00 ± 0.00 |
| Own unflipped overbuilds | 0.01 | 0.04 | **+0.04 ± 0.03** |

### normal%develop-horizon vs normal, 3 players (100 paired seeds)

| Measure (per player per game) | normal | normal%develop-horizon | Difference |
|---|---|---|---|
| Final VP | 57.43 | 61.58 | **+4.14 ± 0.71** |
| Winner VP | 76.08 | 80.63 | **+4.55 ± 1.03** |
| Link VP | 23.18 | 26.18 | **+3.00 ± 0.47** |
| Tile VP | 35.02 | 36.16 | **+1.14 ± 0.37** |
| Income level | -0.08 | 0.75 | **+0.83 ± 0.24** |
| Money left | 14.05 | 18.81 | **+4.76 ± 1.56** |
| Loans | 5.16 | 5.13 | -0.03 ± 0.04 |
| Builds | 10.62 | 10.92 | **+0.30 ± 0.06** |
| Develop actions | 7.34 | 5.97 | **-1.38 ± 0.13** |
| Tiles sold | 2.48 | 2.55 | **+0.07 ± 0.03** |
| Networks | 7.45 | 8.28 | **+0.83 ± 0.10** |
| Links built | 7.45 | 8.28 | **+0.83 ± 0.10** |
| Passes | 1.60 | 1.80 | **+0.20 ± 0.06** |
| Shortfall sales | 1.37 | 1.36 | -0.01 ± 0.02 |
| VP lost to shortfalls | 1.23 | 1.25 | +0.01 ± 0.03 |
| Own unflipped overbuilds | 0.01 | 0.05 | **+0.04 ± 0.02** |

### normal%develop-horizon vs normal, 4 players (100 paired seeds)

| Measure (per player per game) | normal | normal%develop-horizon | Difference |
|---|---|---|---|
| Final VP | 55.69 | 60.61 | **+4.92 ± 0.65** |
| Winner VP | 75.25 | 81.36 | **+6.11 ± 1.21** |
| Link VP | 21.87 | 24.83 | **+2.96 ± 0.41** |
| Tile VP | 32.83 | 34.72 | **+1.89 ± 0.38** |
| Income level | 1.30 | 2.42 | **+1.12 ± 0.20** |
| Money left | 15.62 | 18.82 | **+3.19 ± 1.13** |
| Loans | 4.46 | 4.38 | **-0.08 ± 0.03** |
| Builds | 9.74 | 10.06 | **+0.32 ± 0.06** |
| Develop actions | 6.66 | 5.33 | **-1.33 ± 0.11** |
| Tiles sold | 2.44 | 2.62 | **+0.18 ± 0.04** |
| Networks | 6.55 | 7.28 | **+0.73 ± 0.09** |
| Links built | 6.55 | 7.28 | **+0.73 ± 0.09** |
| Passes | 1.01 | 1.18 | **+0.16 ± 0.05** |
| Shortfall sales | 0.94 | 0.93 | -0.01 ± 0.02 |
| VP lost to shortfalls | 0.75 | 0.76 | +0.01 ± 0.01 |
| Own unflipped overbuilds | 0.00 | 0.03 | **+0.03 ± 0.02** |

### normal%useful-cards vs normal, 2 players (100 paired seeds)

| Measure (per player per game) | normal | normal%useful-cards | Difference |
|---|---|---|---|
| Final VP | 65.33 | 62.15 | -3.19 ± 4.55 |
| Winner VP | 77.73 | 76.68 | -1.05 ± 4.19 |
| Link VP | 24.46 | 23.40 | -1.06 ± 1.44 |
| Tile VP | 41.79 | 39.99 | -1.80 ± 2.83 |
| Income level | -0.39 | -1.15 | -0.77 ± 0.97 |
| Money left | 15.00 | 14.69 | -0.31 ± 2.45 |
| Loans | 5.86 | 5.92 | +0.07 ± 0.28 |
| Builds | 11.47 | 11.62 | +0.14 ± 0.32 |
| Develop actions | 8.11 | 8.09 | -0.03 ± 0.38 |
| Tiles sold | 2.93 | 2.68 | **-0.25 ± 0.21** |
| Networks | 8.12 | 7.86 | -0.26 ± 0.28 |
| Links built | 8.12 | 7.86 | -0.26 ± 0.28 |
| Passes | 1.61 | 2.54 | **+0.92 ± 0.92** |
| Shortfall sales | 1.85 | 1.89 | +0.04 ± 0.53 |
| VP lost to shortfalls | 1.41 | 1.71 | +0.30 ± 0.73 |
| Own unflipped overbuilds | 0.01 | 0.01 | +0.00 ± 0.01 |

### normal%useful-cards vs normal, 3 players (100 paired seeds)

| Measure (per player per game) | normal | normal%useful-cards | Difference |
|---|---|---|---|
| Final VP | 57.43 | 56.48 | -0.96 ± 3.76 |
| Winner VP | 76.08 | 73.38 | -2.70 ± 3.72 |
| Link VP | 23.18 | 21.73 | **-1.45 ± 1.11** |
| Tile VP | 35.02 | 35.89 | +0.87 ± 2.32 |
| Income level | -0.08 | -0.67 | -0.58 ± 0.85 |
| Money left | 14.05 | 14.45 | +0.41 ± 2.09 |
| Loans | 5.16 | 5.27 | +0.11 ± 0.18 |
| Builds | 10.62 | 10.90 | +0.28 ± 0.29 |
| Develop actions | 7.34 | 7.22 | -0.13 ± 0.27 |
| Tiles sold | 2.48 | 2.46 | -0.02 ± 0.18 |
| Networks | 7.45 | 7.10 | **-0.35 ± 0.20** |
| Links built | 7.45 | 7.10 | **-0.35 ± 0.20** |
| Passes | 1.60 | 1.96 | +0.36 ± 0.60 |
| Shortfall sales | 1.37 | 1.62 | +0.25 ± 0.30 |
| VP lost to shortfalls | 1.23 | 1.58 | +0.35 ± 0.62 |
| Own unflipped overbuilds | 0.01 | 0.03 | +0.02 ± 0.02 |

### normal%useful-cards vs normal, 4 players (100 paired seeds)

| Measure (per player per game) | normal | normal%useful-cards | Difference |
|---|---|---|---|
| Final VP | 55.69 | 54.13 | -1.56 ± 2.54 |
| Winner VP | 75.25 | 74.70 | -0.55 ± 2.89 |
| Link VP | 21.87 | 20.49 | **-1.38 ± 0.93** |
| Tile VP | 32.83 | 32.73 | -0.10 ± 1.55 |
| Income level | 1.30 | 0.78 | -0.52 ± 0.80 |
| Money left | 15.62 | 15.17 | -0.45 ± 1.57 |
| Loans | 4.46 | 4.56 | +0.10 ± 0.15 |
| Builds | 9.74 | 9.93 | +0.18 ± 0.19 |
| Develop actions | 6.66 | 6.75 | +0.09 ± 0.20 |
| Tiles sold | 2.44 | 2.35 | -0.09 ± 0.13 |
| Networks | 6.55 | 6.21 | **-0.33 ± 0.17** |
| Links built | 6.55 | 6.21 | **-0.33 ± 0.17** |
| Passes | 1.01 | 1.15 | +0.14 ± 0.43 |
| Shortfall sales | 0.94 | 0.98 | +0.04 ± 0.22 |
| VP lost to shortfalls | 0.75 | 0.76 | +0.01 ± 0.36 |
| Own unflipped overbuilds | 0.00 | 0.01 | +0.01 ± 0.01 |

### normal%own-sources vs normal, 2 players (100 paired seeds)

| Measure (per player per game) | normal | normal%own-sources | Difference |
|---|---|---|---|
| Final VP | 65.33 | 64.55 | **-0.78 ± 0.66** |
| Winner VP | 77.73 | 77.29 | -0.44 ± 0.64 |
| Link VP | 24.46 | 24.23 | **-0.24 ± 0.20** |
| Tile VP | 41.79 | 41.23 | **-0.56 ± 0.51** |
| Income level | -0.39 | -0.64 | **-0.26 ± 0.22** |
| Money left | 15.00 | 14.68 | -0.32 ± 1.09 |
| Loans | 5.86 | 5.88 | +0.02 ± 0.07 |
| Builds | 11.47 | 11.45 | -0.03 ± 0.05 |
| Develop actions | 8.11 | 8.05 | -0.06 ± 0.08 |
| Tiles sold | 2.93 | 2.90 | -0.04 ± 0.04 |
| Networks | 8.12 | 8.14 | +0.03 ± 0.07 |
| Links built | 8.12 | 8.14 | +0.03 ± 0.07 |
| Passes | 1.61 | 1.69 | +0.07 ± 0.09 |
| Shortfall sales | 1.85 | 1.92 | +0.07 ± 0.07 |
| VP lost to shortfalls | 1.41 | 1.41 | +0.00 ± 0.00 |
| Own unflipped overbuilds | 0.01 | 0.01 | +0.00 ± 0.00 |

### normal%own-sources vs normal, 3 players (100 paired seeds)

| Measure (per player per game) | normal | normal%own-sources | Difference |
|---|---|---|---|
| Final VP | 57.43 | 57.36 | -0.08 ± 0.49 |
| Winner VP | 76.08 | 76.01 | -0.07 ± 0.52 |
| Link VP | 23.18 | 23.11 | -0.06 ± 0.15 |
| Tile VP | 35.02 | 35.01 | -0.01 ± 0.31 |
| Income level | -0.08 | -0.14 | -0.06 ± 0.18 |
| Money left | 14.05 | 13.88 | -0.17 ± 0.82 |
| Loans | 5.16 | 5.15 | -0.01 ± 0.03 |
| Builds | 10.62 | 10.60 | -0.01 ± 0.05 |
| Develop actions | 7.34 | 7.35 | +0.00 ± 0.04 |
| Tiles sold | 2.48 | 2.49 | +0.01 ± 0.03 |
| Networks | 7.45 | 7.44 | -0.01 ± 0.04 |
| Links built | 7.45 | 7.44 | -0.01 ± 0.04 |
| Passes | 1.60 | 1.62 | +0.02 ± 0.06 |
| Shortfall sales | 1.37 | 1.39 | +0.02 ± 0.05 |
| VP lost to shortfalls | 1.23 | 1.25 | +0.02 ± 0.08 |
| Own unflipped overbuilds | 0.01 | 0.01 | +0.00 ± 0.00 |

### normal%own-sources vs normal, 4 players (100 paired seeds)

| Measure (per player per game) | normal | normal%own-sources | Difference |
|---|---|---|---|
| Final VP | 55.69 | 55.51 | -0.18 ± 0.45 |
| Winner VP | 75.25 | 74.66 | **-0.59 ± 0.46** |
| Link VP | 21.87 | 21.80 | -0.07 ± 0.18 |
| Tile VP | 32.83 | 32.70 | -0.13 ± 0.29 |
| Income level | 1.30 | 1.21 | -0.09 ± 0.13 |
| Money left | 15.62 | 15.73 | +0.10 ± 0.55 |
| Loans | 4.46 | 4.46 | -0.00 ± 0.03 |
| Builds | 9.74 | 9.75 | +0.01 ± 0.03 |
| Develop actions | 6.66 | 6.64 | -0.02 ± 0.06 |
| Tiles sold | 2.44 | 2.43 | -0.01 ± 0.02 |
| Networks | 6.55 | 6.54 | -0.00 ± 0.04 |
| Links built | 6.55 | 6.54 | -0.00 ± 0.04 |
| Passes | 1.01 | 1.04 | +0.03 ± 0.07 |
| Shortfall sales | 0.94 | 0.96 | +0.02 ± 0.05 |
| VP lost to shortfalls | 0.75 | 0.75 | +0.00 ± 0.05 |
| Own unflipped overbuilds | 0.00 | 0.01 | +0.00 ± 0.00 |


### normal%buildable-cards vs normal%a9, 2 players (100 paired seeds)

| Measure (per player per game) | normal%a9 | normal%buildable-cards | Difference |
|---|---|---|---|
| Final VP | 65.33 | 65.08 | -0.25 ± 4.05 |
| Winner VP | 77.73 | 77.65 | -0.08 ± 3.86 |
| Link VP | 24.46 | 24.36 | -0.10 ± 1.20 |
| Tile VP | 41.79 | 41.83 | +0.04 ± 2.65 |
| Income level | -0.39 | 0.12 | +0.50 ± 0.78 |
| Money left | 15.00 | 13.07 | -1.93 ± 2.61 |
| Loans | 5.86 | 5.75 | -0.11 ± 0.23 |
| Builds | 11.47 | 11.67 | +0.20 ± 0.27 |
| Develop actions | 8.11 | 7.99 | -0.13 ± 0.34 |
| Tiles sold | 2.93 | 2.85 | -0.07 ± 0.17 |
| Networks | 8.12 | 8.10 | -0.01 ± 0.22 |
| Links built | 8.12 | 8.10 | -0.01 ± 0.22 |
| Passes | 1.61 | 1.89 | +0.28 ± 0.73 |
| Shortfall sales | 1.85 | 1.72 | -0.14 ± 0.40 |
| VP lost to shortfalls | 1.41 | 1.53 | +0.13 ± 0.65 |
| Own unflipped overbuilds | 0.01 | 0.01 | +0.01 ± 0.02 |

### normal%buildable-cards vs normal%a9, 3 players (100 paired seeds)

| Measure (per player per game) | normal%a9 | normal%buildable-cards | Difference |
|---|---|---|---|
| Final VP | 57.43 | 60.03 | +2.60 ± 3.15 |
| Winner VP | 76.08 | 76.78 | +0.70 ± 3.18 |
| Link VP | 23.18 | 23.24 | +0.06 ± 1.04 |
| Tile VP | 35.02 | 37.14 | **+2.12 ± 1.91** |
| Income level | -0.08 | 0.02 | +0.10 ± 0.73 |
| Money left | 14.05 | 14.96 | +0.91 ± 2.04 |
| Loans | 5.16 | 5.25 | +0.09 ± 0.16 |
| Builds | 10.62 | 10.84 | +0.23 ± 0.23 |
| Develop actions | 7.34 | 7.31 | -0.04 ± 0.25 |
| Tiles sold | 2.48 | 2.56 | +0.08 ± 0.13 |
| Networks | 7.45 | 7.46 | +0.01 ± 0.18 |
| Links built | 7.45 | 7.46 | +0.01 ± 0.18 |
| Passes | 1.60 | 1.26 | -0.34 ± 0.47 |
| Shortfall sales | 1.37 | 1.21 | -0.16 ± 0.28 |
| VP lost to shortfalls | 1.23 | 0.79 | -0.44 ± 0.50 |
| Own unflipped overbuilds | 0.01 | 0.01 | +0.00 ± 0.02 |

### normal%buildable-cards vs normal%a9, 4 players (100 paired seeds)

| Measure (per player per game) | normal%a9 | normal%buildable-cards | Difference |
|---|---|---|---|
| Final VP | 55.69 | 56.16 | +0.46 ± 2.34 |
| Winner VP | 75.25 | 76.44 | +1.19 ± 2.53 |
| Link VP | 21.87 | 21.74 | -0.13 ± 0.90 |
| Tile VP | 32.83 | 33.28 | +0.45 ± 1.39 |
| Income level | 1.30 | 1.35 | +0.05 ± 0.71 |
| Money left | 15.62 | 16.24 | +0.62 ± 1.82 |
| Loans | 4.46 | 4.49 | +0.02 ± 0.13 |
| Builds | 9.74 | 9.88 | +0.14 ± 0.18 |
| Develop actions | 6.66 | 6.53 | -0.13 ± 0.20 |
| Tiles sold | 2.44 | 2.50 | +0.06 ± 0.13 |
| Networks | 6.55 | 6.49 | -0.06 ± 0.15 |
| Links built | 6.55 | 6.49 | -0.06 ± 0.15 |
| Passes | 1.01 | 1.00 | -0.01 ± 0.36 |
| Shortfall sales | 0.94 | 0.85 | -0.09 ± 0.19 |
| VP lost to shortfalls | 0.75 | 0.61 | -0.14 ± 0.31 |
| Own unflipped overbuilds | 0.00 | 0.01 | +0.01 ± 0.01 |

# 5. The open audit findings (`ai-close.js`, exploration mirror seeds, 50 games each)

## 5.1 The Assignment 9 AI, every level and player count

### easy ({"network":"single","develop":"a8"}): 2 players, 50 games, 3900 turn decisions

**Decision time:** 4.14 ms per turn decision (chooseAction)

**Cards (W4):** 2756 discarding actions (Network, Develop, Sell, Loan, Pass)
- Discarded a card usable for a build now while holding an unusable card: 558 of 2756 (20%) (5.58 per player per game)

**Double rail (W5):** Rail-Era decisions with Network legal: 1279; a two-link Network legal and affordable: 667 of 1279 (52%)
- Rail Networks taken: single 359, double 0

**Develop:** 725 actions: one tile 98 of 725 (14%), two tiles 627 of 725 (86%) (same industry twice 0)
- One tile developed while two of the same industry were legal: 0 of 98 (0%)

**Choices left to the engine (W5)** (choice points with 2+ legal options in the moves played):

| Choice | Points | Per player per game | Specified by the AI | Taken: own | opponent | market | other | Own source available but not taken |
|---|---|---|---|---|---|---|---|---|
| merchant | 140 | 1.40 | 0 | 0 | 0 | 0 | 140 | – |
| beer | 24 | 0.24 | 0 | 24 | 0 | 0 | 0 | 0 of 24 (0%) |
| coal | 52 | 0.52 | 0 | 31 | 21 | 0 | 0 | 17 of 52 (33%) |
| freeDevelop | 46 | 0.46 | 0 | 0 | 0 | 0 | 46 | – |
| iron | 8 | 0.08 | 0 | 5 | 3 | 0 | 0 | 3 of 8 (38%) |

**Shortfalls:** 237 tiles sold (2.37 per player per game); flipped 37 of 237 (16%), losing 210 VP (2.10 per player per game)
- In the Canal Era with a Level I tile (removed at the era's end anyway) available: 20; a Level I tile taken: 3

**Examples**
- wasteful: seed 202001, player 0, canal round 2: sell discarding "wolverhampton" (usable for a build) while holding an unusable card
- wasteful: seed 202001, player 1, canal round 4: develop discarding "burtonOnTrent" (usable for a build) while holding an unusable card
- ownSkipped: seed 202007, player 1, rail round 2: network took coal from mine:coalbrookdale_2 (opponent); own option available
- ownSkipped: seed 202008, player 1, rail round 1: network took coal from mine:burtonOnTrent_0 (opponent); own option available

### normal ({"network":"single","develop":"a8"}): 2 players, 50 games, 3900 turn decisions

**Decision time:** 3.33 ms per turn decision (chooseAction)

**Cards (W4):** 2646 discarding actions (Network, Develop, Sell, Loan, Pass)
- Discarded a card usable for a build now while holding an unusable card: 479 of 2646 (18%) (4.79 per player per game)

**Double rail (W5):** Rail-Era decisions with Network legal: 1466; a two-link Network legal and affordable: 832 of 1466 (57%)
- Rail Networks taken: single 395, double 0

**Develop:** 804 actions: one tile 83 of 804 (10%), two tiles 721 of 804 (90%) (same industry twice 0)
- One tile developed while two of the same industry were legal: 1 of 83 (1%)

**Choices left to the engine (W5)** (choice points with 2+ legal options in the moves played):

| Choice | Points | Per player per game | Specified by the AI | Taken: own | opponent | market | other | Own source available but not taken |
|---|---|---|---|---|---|---|---|---|
| merchant | 198 | 1.98 | 0 | 0 | 0 | 0 | 198 | – |
| beer | 60 | 0.60 | 0 | 60 | 0 | 0 | 0 | 0 of 60 (0%) |
| freeDevelop | 77 | 0.77 | 0 | 0 | 0 | 0 | 77 | – |
| coal | 57 | 0.57 | 0 | 27 | 30 | 0 | 0 | 21 of 57 (37%) |
| iron | 6 | 0.06 | 0 | 3 | 3 | 0 | 0 | 3 of 6 (50%) |

**Shortfalls:** 156 tiles sold (1.56 per player per game); flipped 17 of 156 (11%), losing 107 VP (1.07 per player per game)
- In the Canal Era with a Level I tile (removed at the era's end anyway) available: 10; a Level I tile taken: 0

**Examples**
- wasteful: seed 202001, player 0, canal round 2: develop discarding "wolverhampton" (usable for a build) while holding an unusable card
- wasteful: seed 202001, player 1, canal round 5: develop discarding "dudley" (usable for a build) while holding an unusable card
- ownSkipped: seed 202002, player 1, rail round 6: network took coal from mine:cannock_0 (opponent); own option available
- ownSkipped: seed 202004, player 0, canal round 9: build took iron from works:redditch_1 (opponent); own option available

### hard ({"network":"single","develop":"a8"}): 2 players, 50 games, 3900 turn decisions

**Decision time:** 1.92 ms per turn decision (chooseAction)

**Cards (W4):** 2669 discarding actions (Network, Develop, Sell, Loan, Pass)
- Discarded a card usable for a build now while holding an unusable card: 415 of 2669 (16%) (4.15 per player per game)

**Double rail (W5):** Rail-Era decisions with Network legal: 1337; a two-link Network legal and affordable: 729 of 1337 (55%)
- Rail Networks taken: single 375, double 0

**Develop:** 793 actions: one tile 103 of 793 (13%), two tiles 690 of 793 (87%) (same industry twice 0)
- One tile developed while two of the same industry were legal: 2 of 103 (2%)

**Choices left to the engine (W5)** (choice points with 2+ legal options in the moves played):

| Choice | Points | Per player per game | Specified by the AI | Taken: own | opponent | market | other | Own source available but not taken |
|---|---|---|---|---|---|---|---|---|
| merchant | 161 | 1.61 | 0 | 0 | 0 | 0 | 161 | – |
| coal | 51 | 0.51 | 0 | 26 | 25 | 0 | 0 | 17 of 51 (33%) |
| freeDevelop | 62 | 0.62 | 0 | 0 | 0 | 0 | 62 | – |
| iron | 10 | 0.10 | 0 | 2 | 8 | 0 | 0 | 3 of 10 (30%) |
| beer | 48 | 0.48 | 0 | 48 | 0 | 0 | 0 | 0 of 48 (0%) |

**Shortfalls:** 195 tiles sold (1.95 per player per game); flipped 26 of 195 (13%), losing 154 VP (1.54 per player per game)
- In the Canal Era with a Level I tile (removed at the era's end anyway) available: 10; a Level I tile taken: 0

**Examples**
- wasteful: seed 202001, player 0, canal round 2: sell discarding "wolverhampton" (usable for a build) while holding an unusable card
- wasteful: seed 202001, player 0, canal round 3: develop discarding "wolverhampton" (usable for a build) while holding an unusable card
- ownSkipped: seed 202001, player 1, rail round 4: network took coal from mine:cannock_0 (opponent); own option available
- ownSkipped: seed 202001, player 1, rail round 4: network took coal from mine:cannock_0 (opponent); own option available


### easy ({"network":"single","develop":"a8"}): 3 players, 50 games, 5250 turn decisions

**Decision time:** 4.34 ms per turn decision (chooseAction)

**Cards (W4):** 3650 discarding actions (Network, Develop, Sell, Loan, Pass)
- Discarded a card usable for a build now while holding an unusable card: 838 of 3650 (23%) (5.59 per player per game)

**Double rail (W5):** Rail-Era decisions with Network legal: 2004; a two-link Network legal and affordable: 1121 of 2004 (56%)
- Rail Networks taken: single 521, double 0

**Develop:** 1053 actions: one tile 138 of 1053 (13%), two tiles 915 of 1053 (87%) (same industry twice 0)
- One tile developed while two of the same industry were legal: 0 of 138 (0%)

**Choices left to the engine (W5)** (choice points with 2+ legal options in the moves played):

| Choice | Points | Per player per game | Specified by the AI | Taken: own | opponent | market | other | Own source available but not taken |
|---|---|---|---|---|---|---|---|---|
| merchant | 229 | 1.53 | 0 | 0 | 0 | 0 | 229 | – |
| freeDevelop | 76 | 0.51 | 0 | 0 | 0 | 0 | 76 | – |
| coal | 104 | 0.69 | 0 | 42 | 62 | 0 | 0 | 43 of 104 (41%) |
| beer | 18 | 0.12 | 0 | 17 | 1 | 0 | 0 | 0 of 18 (0%) |
| iron | 9 | 0.06 | 0 | 2 | 7 | 0 | 0 | 1 of 9 (11%) |

**Shortfalls:** 191 tiles sold (1.27 per player per game); flipped 26 of 191 (14%), losing 156 VP (1.04 per player per game)
- In the Canal Era with a Level I tile (removed at the era's end anyway) available: 14; a Level I tile taken: 6

**Examples**
- wasteful: seed 203001, player 1, canal round 1: develop discarding "kidderminster" (usable for a build) while holding an unusable card
- wasteful: seed 203001, player 2, canal round 2: network discarding "birmingham" (usable for a build) while holding an unusable card
- ownSkipped: seed 203001, player 0, rail round 5: network took coal from mine:leek_1 (opponent); own option available
- ownSkipped: seed 203001, player 0, rail round 5: build took coal from mine:leek_1 (opponent); own option available

### normal ({"network":"single","develop":"a8"}): 3 players, 50 games, 5250 turn decisions

**Decision time:** 2.50 ms per turn decision (chooseAction)

**Cards (W4):** 3614 discarding actions (Network, Develop, Sell, Loan, Pass)
- Discarded a card usable for a build now while holding an unusable card: 662 of 3614 (18%) (4.41 per player per game)

**Double rail (W5):** Rail-Era decisions with Network legal: 1912; a two-link Network legal and affordable: 1083 of 1912 (57%)
- Rail Networks taken: single 549, double 0

**Develop:** 1073 actions: one tile 127 of 1073 (12%), two tiles 946 of 1073 (88%) (same industry twice 0)
- One tile developed while two of the same industry were legal: 0 of 127 (0%)

**Choices left to the engine (W5)** (choice points with 2+ legal options in the moves played):

| Choice | Points | Per player per game | Specified by the AI | Taken: own | opponent | market | other | Own source available but not taken |
|---|---|---|---|---|---|---|---|---|
| merchant | 251 | 1.67 | 0 | 0 | 0 | 0 | 251 | – |
| coal | 107 | 0.71 | 0 | 45 | 62 | 0 | 0 | 33 of 107 (31%) |
| freeDevelop | 83 | 0.55 | 0 | 0 | 0 | 0 | 83 | – |
| iron | 28 | 0.19 | 0 | 11 | 17 | 0 | 0 | 14 of 28 (50%) |
| beer | 58 | 0.39 | 0 | 55 | 3 | 0 | 0 | 0 of 58 (0%) |

**Shortfalls:** 223 tiles sold (1.49 per player per game); flipped 34 of 223 (15%), losing 180 VP (1.20 per player per game)
- In the Canal Era with a Level I tile (removed at the era's end anyway) available: 20; a Level I tile taken: 3

**Examples**
- wasteful: seed 203001, player 1, canal round 2: sell discarding "kidderminster" (usable for a build) while holding an unusable card
- wasteful: seed 203001, player 1, canal round 2: develop discarding "wolverhampton" (usable for a build) while holding an unusable card
- ownSkipped: seed 203001, player 0, rail round 5: network took coal from mine:cannock_0 (opponent); own option available
- ownSkipped: seed 203001, player 0, rail round 6: network took coal from mine:burtonOnTrent_0 (opponent); own option available

### hard ({"network":"single","develop":"a8"}): 3 players, 50 games, 5250 turn decisions

**Decision time:** 1.86 ms per turn decision (chooseAction)

**Cards (W4):** 3551 discarding actions (Network, Develop, Sell, Loan, Pass)
- Discarded a card usable for a build now while holding an unusable card: 600 of 3551 (17%) (4.00 per player per game)

**Double rail (W5):** Rail-Era decisions with Network legal: 1870; a two-link Network legal and affordable: 1111 of 1870 (59%)
- Rail Networks taken: single 522, double 0

**Develop:** 1054 actions: one tile 96 of 1054 (9%), two tiles 958 of 1054 (91%) (same industry twice 0)
- One tile developed while two of the same industry were legal: 0 of 96 (0%)

**Choices left to the engine (W5)** (choice points with 2+ legal options in the moves played):

| Choice | Points | Per player per game | Specified by the AI | Taken: own | opponent | market | other | Own source available but not taken |
|---|---|---|---|---|---|---|---|---|
| merchant | 232 | 1.55 | 0 | 0 | 0 | 0 | 232 | – |
| coal | 106 | 0.71 | 0 | 47 | 59 | 0 | 0 | 35 of 106 (33%) |
| freeDevelop | 78 | 0.52 | 0 | 0 | 0 | 0 | 78 | – |
| beer | 52 | 0.35 | 0 | 52 | 0 | 0 | 0 | 0 of 52 (0%) |
| iron | 13 | 0.09 | 0 | 2 | 11 | 0 | 0 | 0 of 13 (0%) |

**Shortfalls:** 263 tiles sold (1.75 per player per game); flipped 21 of 263 (8%), losing 116 VP (0.77 per player per game)
- In the Canal Era with a Level I tile (removed at the era's end anyway) available: 34; a Level I tile taken: 6

**Examples**
- wasteful: seed 203001, player 1, canal round 2: sell discarding "kidderminster" (usable for a build) while holding an unusable card
- wasteful: seed 203001, player 1, canal round 2: develop discarding "wolverhampton" (usable for a build) while holding an unusable card
- ownSkipped: seed 203001, player 1, rail round 9: build took coal from mine:cannock_0 (opponent); own option available
- ownSkipped: seed 203002, player 0, rail round 5: network took coal from mine:cannock_0 (opponent); own option available


### easy ({"network":"single","develop":"a8"}): 4 players, 50 games, 6200 turn decisions

**Decision time:** 4.40 ms per turn decision (chooseAction)

**Cards (W4):** 4248 discarding actions (Network, Develop, Sell, Loan, Pass)
- Discarded a card usable for a build now while holding an unusable card: 1073 of 4248 (25%) (5.37 per player per game)

**Double rail (W5):** Rail-Era decisions with Network legal: 2569; a two-link Network legal and affordable: 1431 of 2569 (56%)
- Rail Networks taken: single 638, double 0

**Develop:** 1317 actions: one tile 181 of 1317 (14%), two tiles 1136 of 1317 (86%) (same industry twice 0)
- One tile developed while two of the same industry were legal: 0 of 181 (0%)

**Choices left to the engine (W5)** (choice points with 2+ legal options in the moves played):

| Choice | Points | Per player per game | Specified by the AI | Taken: own | opponent | market | other | Own source available but not taken |
|---|---|---|---|---|---|---|---|---|
| merchant | 337 | 1.69 | 0 | 0 | 0 | 0 | 337 | – |
| freeDevelop | 89 | 0.45 | 0 | 0 | 0 | 0 | 89 | – |
| coal | 110 | 0.55 | 0 | 43 | 67 | 0 | 0 | 38 of 110 (35%) |
| beer | 18 | 0.09 | 0 | 18 | 0 | 0 | 0 | 0 of 18 (0%) |
| iron | 28 | 0.14 | 0 | 1 | 27 | 0 | 0 | 13 of 28 (46%) |

**Shortfalls:** 144 tiles sold (0.72 per player per game); flipped 15 of 144 (10%), losing 80 VP (0.40 per player per game)
- In the Canal Era with a Level I tile (removed at the era's end anyway) available: 13; a Level I tile taken: 3

**Examples**
- wasteful: seed 204001, player 3, canal round 1: network discarding "birmingham" (usable for a build) while holding an unusable card
- wasteful: seed 204001, player 0, canal round 2: sell discarding "kidderminster" (usable for a build) while holding an unusable card
- ownSkipped: seed 204001, player 2, rail round 4: network took coal from mine:burtonOnTrent_0 (opponent); own option available
- ownSkipped: seed 204002, player 0, rail round 7: network took coal from mine:dudley_0 (opponent); own option available

### normal ({"network":"single","develop":"a8"}): 4 players, 50 games, 6200 turn decisions

**Decision time:** 2.51 ms per turn decision (chooseAction)

**Cards (W4):** 4183 discarding actions (Network, Develop, Sell, Loan, Pass)
- Discarded a card usable for a build now while holding an unusable card: 847 of 4183 (20%) (4.24 per player per game)

**Double rail (W5):** Rail-Era decisions with Network legal: 2457; a two-link Network legal and affordable: 1418 of 2457 (58%)
- Rail Networks taken: single 644, double 0

**Develop:** 1318 actions: one tile 149 of 1318 (11%), two tiles 1169 of 1318 (89%) (same industry twice 0)
- One tile developed while two of the same industry were legal: 0 of 149 (0%)

**Choices left to the engine (W5)** (choice points with 2+ legal options in the moves played):

| Choice | Points | Per player per game | Specified by the AI | Taken: own | opponent | market | other | Own source available but not taken |
|---|---|---|---|---|---|---|---|---|
| merchant | 391 | 1.96 | 0 | 0 | 0 | 0 | 391 | – |
| freeDevelop | 108 | 0.54 | 0 | 0 | 0 | 0 | 108 | – |
| beer | 41 | 0.20 | 0 | 39 | 2 | 0 | 0 | 0 of 41 (0%) |
| coal | 114 | 0.57 | 0 | 39 | 75 | 0 | 0 | 32 of 114 (28%) |
| iron | 9 | 0.04 | 0 | 1 | 8 | 0 | 0 | 2 of 9 (22%) |

**Shortfalls:** 189 tiles sold (0.94 per player per game); flipped 15 of 189 (8%), losing 85 VP (0.42 per player per game)
- In the Canal Era with a Level I tile (removed at the era's end anyway) available: 30; a Level I tile taken: 8

**Examples**
- wasteful: seed 204001, player 3, canal round 1: network discarding "birmingham" (usable for a build) while holding an unusable card
- wasteful: seed 204001, player 2, canal round 2: sell discarding "belper" (usable for a build) while holding an unusable card
- ownSkipped: seed 204006, player 2, canal round 6: build took coal from mine:belper_1 (opponent); own option available
- ownSkipped: seed 204009, player 2, rail round 7: network took coal from mine:burtonOnTrent_0 (opponent); own option available

### hard ({"network":"single","develop":"a8"}): 4 players, 50 games, 6200 turn decisions

**Decision time:** 1.89 ms per turn decision (chooseAction)

**Cards (W4):** 4098 discarding actions (Network, Develop, Sell, Loan, Pass)
- Discarded a card usable for a build now while holding an unusable card: 774 of 4098 (19%) (3.87 per player per game)

**Double rail (W5):** Rail-Era decisions with Network legal: 2449; a two-link Network legal and affordable: 1469 of 2449 (60%)
- Rail Networks taken: single 623, double 0

**Develop:** 1306 actions: one tile 121 of 1306 (9%), two tiles 1185 of 1306 (91%) (same industry twice 0)
- One tile developed while two of the same industry were legal: 0 of 121 (0%)

**Choices left to the engine (W5)** (choice points with 2+ legal options in the moves played):

| Choice | Points | Per player per game | Specified by the AI | Taken: own | opponent | market | other | Own source available but not taken |
|---|---|---|---|---|---|---|---|---|
| merchant | 352 | 1.76 | 0 | 0 | 0 | 0 | 352 | – |
| freeDevelop | 87 | 0.43 | 0 | 0 | 0 | 0 | 87 | – |
| coal | 130 | 0.65 | 0 | 56 | 74 | 0 | 0 | 34 of 130 (26%) |
| beer | 53 | 0.27 | 0 | 52 | 1 | 0 | 0 | 0 of 53 (0%) |
| iron | 30 | 0.15 | 0 | 4 | 26 | 0 | 0 | 10 of 30 (33%) |

**Shortfalls:** 206 tiles sold (1.03 per player per game); flipped 14 of 206 (7%), losing 76 VP (0.38 per player per game)
- In the Canal Era with a Level I tile (removed at the era's end anyway) available: 36; a Level I tile taken: 6

**Examples**
- wasteful: seed 204001, player 3, canal round 1: network discarding "birmingham" (usable for a build) while holding an unusable card
- wasteful: seed 204001, player 1, canal round 2: develop discarding "derby" (usable for a build) while holding an unusable card
- ownSkipped: seed 204001, player 0, rail round 1: network took coal from mine:burtonOnTrent_0 (opponent); own option available
- ownSkipped: seed 204003, player 2, rail round 4: network took coal from mine:cannock_0 (opponent); own option available


## 5.2 The new production AI (Normal)

### normal: 2 players, 50 games, 3900 turn decisions

**Decision time:** 5.71 ms per turn decision (chooseAction)

**Cards (W4):** 2605 discarding actions (Network, Develop, Sell, Loan, Pass)
- Discarded a card usable for a build now while holding an unusable card: 459 of 2605 (18%) (4.59 per player per game)

**Double rail (W5):** Rail-Era decisions with Network legal: 1488; a two-link Network legal and affordable: 796 of 1488 (53%)
- Rail Networks taken: single 377, double 74

**Develop:** 685 actions: one tile 73 of 685 (11%), two tiles 612 of 685 (89%) (same industry twice 0)
- One tile developed while two of the same industry were legal: 0 of 73 (0%)

**Choices left to the engine (W5)** (choice points with 2+ legal options in the moves played):

| Choice | Points | Per player per game | Specified by the AI | Taken: own | opponent | market | other | Own source available but not taken |
|---|---|---|---|---|---|---|---|---|
| merchant | 200 | 2.00 | 0 | 0 | 0 | 0 | 200 | – |
| beer | 70 | 0.70 | 0 | 70 | 0 | 0 | 0 | 0 of 70 (0%) |
| coal | 98 | 0.98 | 0 | 57 | 41 | 0 | 0 | 25 of 98 (26%) |
| freeDevelop | 81 | 0.81 | 0 | 0 | 0 | 0 | 81 | – |
| iron | 6 | 0.06 | 0 | 3 | 3 | 0 | 0 | 3 of 6 (50%) |

**Shortfalls:** 160 tiles sold (1.60 per player per game); flipped 28 of 160 (18%), losing 173 VP (1.73 per player per game)
- In the Canal Era with a Level I tile (removed at the era's end anyway) available: 10; a Level I tile taken: 0

**Examples**
- wasteful: seed 202001, player 0, canal round 2: develop discarding "wolverhampton" (usable for a build) while holding an unusable card
- wasteful: seed 202001, player 1, canal round 5: develop discarding "dudley" (usable for a build) while holding an unusable card
- double: seed 202001, player 0, rail round 6: redditch-oxford + gloucester-redditch
- double: seed 202002, player 0, rail round 5: gloucester-redditch + gloucester-worcester
- ownSkipped: seed 202002, player 1, rail round 6: network took coal from mine:cannock_0 (opponent); own option available
- ownSkipped: seed 202003, player 1, rail round 9: network took coal from mine:cannock_0 (opponent); own option available


### normal: 3 players, 50 games, 5250 turn decisions

**Decision time:** 5.64 ms per turn decision (chooseAction)

**Cards (W4):** 3553 discarding actions (Network, Develop, Sell, Loan, Pass)
- Discarded a card usable for a build now while holding an unusable card: 651 of 3553 (18%) (4.34 per player per game)

**Double rail (W5):** Rail-Era decisions with Network legal: 1994; a two-link Network legal and affordable: 1041 of 1994 (52%)
- Rail Networks taken: single 559, double 89

**Develop:** 904 actions: one tile 102 of 904 (11%), two tiles 802 of 904 (89%) (same industry twice 0)
- One tile developed while two of the same industry were legal: 0 of 102 (0%)

**Choices left to the engine (W5)** (choice points with 2+ legal options in the moves played):

| Choice | Points | Per player per game | Specified by the AI | Taken: own | opponent | market | other | Own source available but not taken |
|---|---|---|---|---|---|---|---|---|
| merchant | 282 | 1.88 | 0 | 0 | 0 | 0 | 282 | – |
| coal | 141 | 0.94 | 0 | 65 | 76 | 0 | 0 | 36 of 141 (26%) |
| freeDevelop | 89 | 0.59 | 0 | 0 | 0 | 0 | 89 | – |
| beer | 70 | 0.47 | 0 | 63 | 7 | 0 | 0 | 0 of 70 (0%) |
| iron | 21 | 0.14 | 0 | 1 | 20 | 0 | 0 | 8 of 21 (38%) |

**Shortfalls:** 166 tiles sold (1.11 per player per game); flipped 25 of 166 (15%), losing 137 VP (0.91 per player per game)
- In the Canal Era with a Level I tile (removed at the era's end anyway) available: 20; a Level I tile taken: 3

**Examples**
- wasteful: seed 203001, player 1, canal round 2: sell discarding "kidderminster" (usable for a build) while holding an unusable card
- wasteful: seed 203001, player 1, canal round 2: develop discarding "wolverhampton" (usable for a build) while holding an unusable card
- double: seed 203001, player 1, rail round 2: birmingham-coventry + burtonOnTrent-stone
- double: seed 203001, player 0, rail round 5: coalbrookdale-kidderminster + dudley-kidderminster
- ownSkipped: seed 203006, player 0, rail round 5: network took coal from mine:burtonOnTrent_0 (opponent); own option available
- ownSkipped: seed 203007, player 2, rail round 7: network took coal from mine:burtonOnTrent_0 (opponent); own option available


### normal: 4 players, 50 games, 6200 turn decisions

**Decision time:** 5.85 ms per turn decision (chooseAction)

**Cards (W4):** 4078 discarding actions (Network, Develop, Sell, Loan, Pass)
- Discarded a card usable for a build now while holding an unusable card: 850 of 4078 (21%) (4.25 per player per game)

**Double rail (W5):** Rail-Era decisions with Network legal: 2532; a two-link Network legal and affordable: 1358 of 2532 (54%)
- Rail Networks taken: single 643, double 111

**Develop:** 1072 actions: one tile 111 of 1072 (10%), two tiles 961 of 1072 (90%) (same industry twice 0)
- One tile developed while two of the same industry were legal: 0 of 111 (0%)

**Choices left to the engine (W5)** (choice points with 2+ legal options in the moves played):

| Choice | Points | Per player per game | Specified by the AI | Taken: own | opponent | market | other | Own source available but not taken |
|---|---|---|---|---|---|---|---|---|
| merchant | 430 | 2.15 | 0 | 0 | 0 | 0 | 430 | – |
| freeDevelop | 111 | 0.56 | 0 | 0 | 0 | 0 | 111 | – |
| beer | 73 | 0.36 | 0 | 67 | 6 | 0 | 0 | 0 of 73 (0%) |
| coal | 168 | 0.84 | 0 | 55 | 113 | 0 | 0 | 46 of 168 (27%) |
| iron | 10 | 0.05 | 0 | 1 | 9 | 0 | 0 | 4 of 10 (40%) |

**Shortfalls:** 154 tiles sold (0.77 per player per game); flipped 13 of 154 (8%), losing 77 VP (0.39 per player per game)
- In the Canal Era with a Level I tile (removed at the era's end anyway) available: 30; a Level I tile taken: 8

**Examples**
- wasteful: seed 204001, player 3, canal round 1: network discarding "birmingham" (usable for a build) while holding an unusable card
- wasteful: seed 204001, player 2, canal round 2: sell discarding "belper" (usable for a build) while holding an unusable card
- double: seed 204001, player 0, rail round 2: burtonOnTrent-derby + derby-nottingham
- double: seed 204001, player 3, rail round 3: gloucester-worcester + redditch-oxford
- ownSkipped: seed 204002, player 0, rail round 3: network took coal from mine:cannock_0 (opponent); own option available
- ownSkipped: seed 204005, player 3, rail round 8: network took coal from mine:dudley_0 (opponent); own option available


Decision times in §5 were measured with other experiments running in parallel; the report's figures come from a separate sequential run (4 players, 20 games per level).

# 6. The current AI against the Assignment 5 AI

Seat-balanced; 2 players: 50 seeds, 3 and 4 players: 20 seeds (exploration seeds). Here `normal` and `hard` are the new production AI.

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| normal vs normal-a5 | 2 | 100 | 65.0% ± 9.4 | +16.64 ± 8.71 | above 0 |
| normal vs normal-a5 | 3 | 120 | 75.0% ± 7.8 | +20.80 ± 5.86 | above 0 |
| normal vs normal-a5 | 4 | 120 | 76.7% ± 7.6 | +20.15 ± 4.62 | above 0 |
| normal vs normal-a5 | **pooled** | 340 | 72.2% ± 4.8 | +19.20 ± 3.82 | **improves** |
| hard vs hard-a5 | 2 | 100 | 75.0% ± 8.5 | +20.62 ± 7.31 | above 0 |
| hard vs hard-a5 | 3 | 120 | 73.3% ± 7.9 | +18.94 ± 5.96 | above 0 |
| hard vs hard-a5 | 4 | 120 | 85.8% ± 6.3 | +19.12 ± 3.77 | above 0 |
| hard vs hard-a5 | **pooled** | 340 | 78.1% ± 4.4 | +19.56 ± 3.38 | **improves** |

# 7. Legality and fairness probe of the new production AI (`ai-audit.js --games 10`)

| Players | Difficulty | Decisions | Illegal | State changed | Changes with resampled opponent hands | Changes with reshuffled deck | Moves leaving a choice to the engine | Rail networks with a double link legal | Changed by the information correction | Changed by the rounds correction |
|---|---|---|---|---|---|---|---|---|---|---|
| 2 | easy | 780 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 28 (3.6%) (coal 10, freeDevelop 6, beer 4, merchant 8) | 22 of 67 | 0 (0.0%) | 43 (5.5%) |
| 2 | normal | 780 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 41 (5.3%) (freeDevelop 7, merchant 14, coal 12, beer 8) | 31 of 88 | 0 (0.0%) | 61 (7.8%) |
| 2 | hard | 780 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 50 (6.4%) (merchant 23, coal 9, beer 14, freeDevelop 1, iron 3) | 39 of 75 | 17 (2.2%) | 57 (7.3%) |
| 3 | easy | 1050 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 50 (4.8%) (merchant 15, freeDevelop 10, coal 22, beer 1, iron 2) | 39 of 113 | 0 (0.0%) | 75 (7.1%) |
| 3 | normal | 1050 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 74 (7.0%) (merchant 25, coal 26, freeDevelop 10, beer 13) | 59 of 135 | 0 (0.0%) | 107 (10.2%) |
| 3 | hard | 1050 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 75 (7.1%) (merchant 25, beer 13, coal 29, freeDevelop 8) | 64 of 129 | 30 (2.9%) | 110 (10.5%) |
| 4 | easy | 1240 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 83 (6.7%) (freeDevelop 10, beer 6, merchant 35, coal 32) | 78 of 140 | 0 (0.0%) | 124 (10.0%) |
| 4 | normal | 1240 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 85 (6.9%) (freeDevelop 10, merchant 24, coal 39, beer 10, iron 2) | 67 of 159 | 0 (0.0%) | 151 (12.2%) |
| 4 | hard | 1240 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 124 (10.0%) (merchant 35, coal 49, iron 13, beer 18, freeDevelop 9) | 75 of 160 | 44 (3.5%) | 141 (11.4%) |


