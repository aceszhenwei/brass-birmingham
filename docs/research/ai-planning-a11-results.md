# Planning Research: Results (Assignment 11)

Generated output of the research scripts, used by [the Assignment 11 report](ai-planning-a11.md). The report's [reproduction section](ai-planning-a11.md#reproducing-the-experiments) regenerates every number; the raw per-game data is not committed.

Policy names: `<level>` is the production AI of Assignment 10; `<level>@p<depth>-<evaluation>` are the experimental planners (`scripts/research/planner.js`; [plan](ai-planning-a11-plan.md)). Columns in §1–4: the candidate's win share and VP difference (candidate − baseline) ± 1.96 SE; pooled = 2, 3 and 4 players weighted equally (`ai-criteria.js`).

# 1. Exploration matchups against production Normal (seeds 200000 + 1000 × players + i)

2 players: 100 seeds, 3 and 4 players: 40 seeds.

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| normal@p1-sum vs normal | 2 | 200 | 54.5% ± 6.9 | -0.64 ± 5.20 | includes 0 |
| normal@p1-sum vs normal | 3 | 240 | 47.1% ± 6.3 | -1.44 ± 4.23 | includes 0 |
| normal@p1-sum vs normal | 4 | 240 | 47.9% ± 6.3 | +1.67 ± 2.78 | includes 0 |
| normal@p1-sum vs normal | **pooled** | 680 | 49.8% ± 3.8 | -0.14 ± 2.42 | no improvement |
| normal@p2-sum vs normal | 2 | 200 | 68.0% ± 6.5 | +18.52 ± 5.08 | above 0 |
| normal@p2-sum vs normal | 3 | 240 | 70.8% ± 5.8 | +17.09 ± 3.56 | above 0 |
| normal@p2-sum vs normal | 4 | 240 | 77.1% ± 5.3 | +16.68 ± 2.73 | above 0 |
| normal@p2-sum vs normal | **pooled** | 680 | 72.0% ± 3.4 | +17.43 ± 2.26 | **improves** |
| normal@p3-sum vs normal | 2 | 200 | 86.0% ± 4.8 | +27.54 ± 5.10 | above 0 |
| normal@p3-sum vs normal | 3 | 240 | 81.7% ± 4.9 | +23.14 ± 3.66 | above 0 |
| normal@p3-sum vs normal | 4 | 240 | 80.8% ± 5.0 | +18.90 ± 2.56 | above 0 |
| normal@p3-sum vs normal | **pooled** | 680 | 82.8% ± 2.8 | +23.19 ± 2.26 | **improves** |
| normal@p1-state vs normal | 2 | 200 | 60.3% ± 6.7 | +0.12 ± 6.27 | includes 0 |
| normal@p1-state vs normal | 3 | 240 | 74.6% ± 5.5 | +17.97 ± 4.07 | above 0 |
| normal@p1-state vs normal | 4 | 240 | 82.9% ± 4.8 | +19.13 ± 2.93 | above 0 |
| normal@p1-state vs normal | **pooled** | 680 | 72.6% ± 3.3 | +12.40 ± 2.68 | **improves** |
| normal@p2-state vs normal | 2 | 200 | 79.0% ± 5.7 | +24.11 ± 4.90 | above 0 |
| normal@p2-state vs normal | 3 | 240 | 92.1% ± 3.4 | +37.22 ± 3.40 | above 0 |
| normal@p2-state vs normal | 4 | 240 | 93.3% ± 3.2 | +30.15 ± 2.55 | above 0 |
| normal@p2-state vs normal | **pooled** | 680 | 88.1% ± 2.4 | +30.49 ± 2.16 | **improves** |
| normal@p3-state vs normal | 2 | 200 | 92.5% ± 3.7 | +40.73 ± 4.63 | above 0 |
| normal@p3-state vs normal | 3 | 240 | 95.4% ± 2.7 | +45.85 ± 3.18 | above 0 |
| normal@p3-state vs normal | 4 | 240 | 97.1% ± 2.1 | +39.80 ± 2.27 | above 0 |
| normal@p3-state vs normal | **pooled** | 680 | 95.0% ± 1.7 | +42.13 ± 2.02 | **improves** |
| normal@p2-sum-g0 vs normal | 2 | 200 | 67.5% ± 6.5 | +13.46 ± 4.94 | above 0 |
| normal@p2-sum-g0 vs normal | 3 | 240 | 71.3% ± 5.7 | +17.13 ± 3.70 | above 0 |
| normal@p2-sum-g0 vs normal | 4 | 240 | 73.8% ± 5.6 | +14.09 ± 2.68 | above 0 |
| normal@p2-sum-g0 vs normal | **pooled** | 680 | 70.8% ± 3.4 | +14.89 ± 2.24 | **improves** |
| normal@p2-sum-g1 vs normal | 2 | 200 | 71.0% ± 6.3 | +21.08 ± 5.07 | above 0 |
| normal@p2-sum-g1 vs normal | 3 | 240 | 72.1% ± 5.7 | +18.43 ± 3.49 | above 0 |
| normal@p2-sum-g1 vs normal | 4 | 240 | 78.8% ± 5.2 | +16.33 ± 2.35 | above 0 |
| normal@p2-sum-g1 vs normal | **pooled** | 680 | 73.9% ± 3.3 | +18.61 ± 2.20 | **improves** |
| normal@p2-sum-w3 vs normal | 2 | 200 | 66.5% ± 6.6 | +15.43 ± 5.02 | above 0 |
| normal@p2-sum-w3 vs normal | 3 | 240 | 64.2% ± 6.1 | +11.45 ± 3.51 | above 0 |
| normal@p2-sum-w3 vs normal | 4 | 240 | 69.6% ± 5.8 | +12.71 ± 2.74 | above 0 |
| normal@p2-sum-w3 vs normal | **pooled** | 680 | 66.8% ± 3.6 | +13.19 ± 2.24 | **improves** |

# 2. Depth comparisons (exploration seeds)

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| normal@p2-sum vs normal@p1-sum | 2 | 200 | 71.5% ± 6.3 | +20.12 ± 5.12 | above 0 |
| normal@p2-sum vs normal@p1-sum | 3 | 240 | 75.4% ± 5.5 | +18.20 ± 3.96 | above 0 |
| normal@p2-sum vs normal@p1-sum | 4 | 240 | 74.2% ± 5.5 | +13.84 ± 2.51 | above 0 |
| normal@p2-sum vs normal@p1-sum | **pooled** | 680 | 73.7% ± 3.3 | +17.39 ± 2.32 | **improves** |
| normal@p3-sum vs normal@p1-sum | 2 | 200 | 79.5% ± 5.6 | +25.45 ± 4.47 | above 0 |
| normal@p3-sum vs normal@p1-sum | 3 | 240 | 78.8% ± 5.2 | +22.31 ± 3.60 | above 0 |
| normal@p3-sum vs normal@p1-sum | 4 | 240 | 78.3% ± 5.2 | +18.82 ± 2.65 | above 0 |
| normal@p3-sum vs normal@p1-sum | **pooled** | 680 | 78.9% ± 3.1 | +22.19 ± 2.11 | **improves** |
| normal@p2-state vs normal@p1-state | 2 | 200 | 65.0% ± 6.6 | +14.13 ± 5.48 | above 0 |
| normal@p2-state vs normal@p1-state | 3 | 240 | 66.7% ± 6.0 | +12.01 ± 3.88 | above 0 |
| normal@p2-state vs normal@p1-state | 4 | 240 | 72.5% ± 5.7 | +12.95 ± 2.76 | above 0 |
| normal@p2-state vs normal@p1-state | **pooled** | 680 | 68.1% ± 3.5 | +13.03 ± 2.42 | **improves** |
| normal@p3-state vs normal@p1-state | 2 | 200 | 81.0% ± 5.5 | +29.00 ± 5.27 | above 0 |
| normal@p3-state vs normal@p1-state | 3 | 240 | 82.1% ± 4.9 | +25.90 ± 3.79 | above 0 |
| normal@p3-state vs normal@p1-state | 4 | 240 | 79.6% ± 5.1 | +17.86 ± 2.30 | above 0 |
| normal@p3-state vs normal@p1-state | **pooled** | 680 | 80.9% ± 3.0 | +24.26 ± 2.30 | **improves** |
| normal@p3-sum vs normal@p2-sum | 2 | 200 | 70.5% ± 6.3 | +14.02 ± 4.34 | above 0 |
| normal@p3-sum vs normal@p2-sum | 3 | 240 | 59.6% ± 6.2 | +6.16 ± 3.23 | above 0 |
| normal@p3-sum vs normal@p2-sum | 4 | 240 | 62.9% ± 6.1 | +5.30 ± 2.33 | above 0 |
| normal@p3-sum vs normal@p2-sum | **pooled** | 680 | 64.3% ± 3.6 | +8.49 ± 1.96 | **improves** |
| normal@p3-state vs normal@p2-state | 2 | 200 | 64.0% ± 6.7 | +11.46 ± 4.67 | above 0 |
| normal@p3-state vs normal@p2-state | 3 | 240 | 64.2% ± 6.1 | +10.25 ± 3.83 | above 0 |
| normal@p3-state vs normal@p2-state | 4 | 240 | 61.3% ± 6.2 | +7.39 ± 2.48 | above 0 |
| normal@p3-state vs normal@p2-state | **pooled** | 680 | 63.1% ± 3.6 | +9.70 ± 2.18 | **improves** |

# 3. Validation (held-out seeds 700000 + 1000 × players + i)

2 players: 150 seeds, 3 and 4 players: 60 seeds.

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| normal@p3-state vs normal | 2 | 300 | 92.3% ± 3.0 | +41.25 ± 3.74 | above 0 |
| normal@p3-state vs normal | 3 | 360 | 97.2% ± 1.7 | +48.96 ± 2.64 | above 0 |
| normal@p3-state vs normal | 4 | 360 | 98.1% ± 1.4 | +39.11 ± 1.89 | above 0 |
| normal@p3-state vs normal | **pooled** | 1020 | 95.9% ± 1.2 | +43.11 ± 1.65 | **improves** |
| normal@p3-state vs normal@p1-state | 2 | 300 | 80.7% ± 4.5 | +30.58 ± 4.19 | above 0 |
| normal@p3-state vs normal@p1-state | 3 | 360 | 78.9% ± 4.2 | +22.58 ± 3.08 | above 0 |
| normal@p3-state vs normal@p1-state | 4 | 360 | 81.9% ± 4.0 | +19.48 ± 2.01 | above 0 |
| normal@p3-state vs normal@p1-state | **pooled** | 1020 | 80.5% ± 2.4 | +24.21 ± 1.86 | **improves** |
| normal@p3-state vs normal@p2-state | 2 | 300 | 62.7% ± 5.5 | +10.51 ± 4.10 | above 0 |
| normal@p3-state vs normal@p2-state | 3 | 360 | 67.8% ± 4.8 | +10.39 ± 2.85 | above 0 |
| normal@p3-state vs normal@p2-state | 4 | 360 | 66.9% ± 4.9 | +8.48 ± 1.83 | above 0 |
| normal@p3-state vs normal@p2-state | **pooled** | 1020 | 65.8% ± 2.9 | +9.79 ± 1.77 | **improves** |
| normal@p2-state vs normal | 2 | 300 | 81.7% ± 4.4 | +27.00 ± 4.51 | above 0 |
| normal@p2-state vs normal | 3 | 360 | 90.0% ± 3.1 | +36.75 ± 3.00 | above 0 |
| normal@p2-state vs normal | 4 | 360 | 92.5% ± 2.7 | +31.17 ± 1.99 | above 0 |
| normal@p2-state vs normal | **pooled** | 1020 | 88.1% ± 2.0 | +31.64 ± 1.92 | **improves** |
| normal@p2-state vs normal@p1-state | 2 | 300 | 70.2% ± 5.2 | +20.68 ± 4.88 | above 0 |
| normal@p2-state vs normal@p1-state | 3 | 360 | 71.7% ± 4.7 | +19.30 ± 3.25 | above 0 |
| normal@p2-state vs normal@p1-state | 4 | 360 | 75.0% ± 4.5 | +14.11 ± 2.08 | above 0 |
| normal@p2-state vs normal@p1-state | **pooled** | 1020 | 72.3% ± 2.8 | +18.03 ± 2.07 | **improves** |

# 4. Generalisation against production Hard, and the bounded depth-3 planner

Generalisation: held-out seeds, 2 players: 100 seeds, 3 and 4 players: 40. Bounded depth 3 (`p3-state-b`): exploration seeds.

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| normal@p3-state vs hard | 2 | 200 | 91.0% ± 4.0 | +38.02 ± 4.74 | above 0 |
| normal@p3-state vs hard | 3 | 240 | 96.7% ± 2.3 | +44.71 ± 3.13 | above 0 |
| normal@p3-state vs hard | 4 | 240 | 97.9% ± 1.8 | +40.04 ± 2.17 | above 0 |
| normal@p3-state vs hard | **pooled** | 680 | 95.2% ± 1.6 | +40.92 ± 2.03 | **improves** |
| normal@p2-state vs hard | 2 | 200 | 85.0% ± 5.0 | +29.07 ± 4.67 | above 0 |
| normal@p2-state vs hard | 3 | 240 | 88.3% ± 4.1 | +36.53 ± 3.50 | above 0 |
| normal@p2-state vs hard | 4 | 240 | 95.4% ± 2.7 | +33.45 ± 2.24 | above 0 |
| normal@p2-state vs hard | **pooled** | 680 | 89.6% ± 2.3 | +33.02 ± 2.08 | **improves** |

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| normal@p3-state-b vs normal | 2 | 200 | 90.0% ± 4.2 | +30.73 ± 4.94 | above 0 |
| normal@p3-state-b vs normal | 3 | 240 | 94.6% ± 2.9 | +41.37 ± 3.15 | above 0 |
| normal@p3-state-b vs normal | 4 | 240 | 95.4% ± 2.7 | +36.69 ± 2.40 | above 0 |
| normal@p3-state-b vs normal | **pooled** | 680 | 93.3% ± 1.9 | +36.26 ± 2.11 | **improves** |
| normal@p3-state-b vs normal@p2-state | 2 | 200 | 67.5% ± 6.5 | +11.59 ± 4.53 | above 0 |
| normal@p3-state-b vs normal@p2-state | 3 | 240 | 54.6% ± 6.3 | +6.68 ± 3.37 | above 0 |
| normal@p3-state-b vs normal@p2-state | 4 | 240 | 53.8% ± 6.3 | +2.00 ± 2.30 | includes 0 |
| normal@p3-state-b vs normal@p2-state | **pooled** | 680 | 58.6% ± 3.7 | +6.75 ± 2.03 | **improves** |

# 5. Behaviour in the matchups

Planner seats minus production seats in the same games, per game, ± 1.96 SE; **bold** = significant (`ai-seatstats.js`).

## 5.1 Exploration

### normal@p1-sum vs normal: candidate seats minus baseline seats, per game

| Measure | 2 players (200 games) | 3 players (240 games) | 4 players (240 games) |
|---|---|---|---|
| Final VP | -0.64 ± 5.20 | -1.44 ± 4.23 | +1.67 ± 2.78 |
| Final income level | -0.03 ± 1.32 | -0.45 ± 1.10 | +0.47 ± 0.87 |
| Link VP (both eras) | -0.68 ± 2.08 | -0.91 ± 1.62 | -0.19 ± 1.17 |
| Industry VP (both eras) | +0.03 ± 3.72 | -0.53 ± 2.87 | +1.56 ± 1.88 |
| Builds | +0.11 ± 0.56 | -0.03 ± 0.45 | +0.31 ± 0.31 |
| Develop actions | -0.20 ± 0.36 | +0.17 ± 0.25 | -0.02 ± 0.19 |
| Network actions | -0.20 ± 0.47 | -0.17 ± 0.35 | -0.06 ± 0.26 |
| Links built | -0.23 ± 0.50 | -0.20 ± 0.36 | -0.09 ± 0.27 |
| Sell actions | +0.03 ± 0.29 | +0.06 ± 0.22 | +0.04 ± 0.17 |
| Tiles sold | +0.04 ± 0.29 | +0.07 ± 0.22 | +0.02 ± 0.17 |
| Loans | +0.17 ± 0.32 | +0.03 ± 0.23 | +0.10 ± 0.18 |
| Scouts | +0.01 ± 0.12 | -0.04 ± 0.08 | +0.01 ± 0.04 |
| Passes | +0.10 ± 1.00 | -0.04 ± 0.74 | -0.38 ± 0.42 |
| Unflipped tiles at the end | -0.10 ± 0.42 | +0.05 ± 0.32 | +0.14 ± 0.20 |
| Shortfall sales | +0.21 ± 0.48 | +0.11 ± 0.35 | -0.07 ± 0.18 |
| VP lost to shortfalls | -0.10 ± 0.92 | -0.06 ± 0.57 | -0.17 ± 0.30 |

### normal@p2-sum vs normal: candidate seats minus baseline seats, per game

| Measure | 2 players (200 games) | 3 players (240 games) | 4 players (240 games) |
|---|---|---|---|
| Final VP | **+18.52 ± 5.08** | **+17.09 ± 3.56** | **+16.68 ± 2.73** |
| Final income level | **+2.98 ± 1.35** | **+5.03 ± 1.08** | **+4.77 ± 0.86** |
| Link VP (both eras) | +1.46 ± 1.95 | -0.25 ± 1.45 | -0.13 ± 1.24 |
| Industry VP (both eras) | **+15.46 ± 3.73** | **+15.89 ± 2.66** | **+15.15 ± 1.98** |
| Builds | **+2.33 ± 0.53** | **+2.69 ± 0.39** | **+2.14 ± 0.29** |
| Develop actions | **-1.51 ± 0.40** | **-1.48 ± 0.25** | **-1.39 ± 0.20** |
| Network actions | +0.42 ± 0.43 | **-0.30 ± 0.28** | **-0.49 ± 0.23** |
| Links built | +0.43 ± 0.48 | **-0.35 ± 0.30** | **-0.41 ± 0.24** |
| Sell actions | **+0.93 ± 0.28** | **+1.13 ± 0.19** | **+1.28 ± 0.15** |
| Tiles sold | **+1.25 ± 0.29** | **+1.56 ± 0.21** | **+1.73 ± 0.17** |
| Loans | +0.07 ± 0.29 | **-0.45 ± 0.22** | **-0.60 ± 0.18** |
| Scouts | **-0.11 ± 0.10** | -0.07 ± 0.09 | +0.03 ± 0.05 |
| Passes | **-2.13 ± 0.90** | **-1.52 ± 0.46** | **-0.97 ± 0.29** |
| Unflipped tiles at the end | **+1.07 ± 0.40** | **+0.88 ± 0.29** | +0.08 ± 0.20 |
| Shortfall sales | **-0.98 ± 0.46** | **-0.99 ± 0.27** | **-0.50 ± 0.16** |
| VP lost to shortfalls | **-1.32 ± 0.83** | **-1.04 ± 0.44** | **-0.56 ± 0.27** |

### normal@p3-sum vs normal: candidate seats minus baseline seats, per game

| Measure | 2 players (200 games) | 3 players (240 games) | 4 players (240 games) |
|---|---|---|---|
| Final VP | **+27.54 ± 5.10** | **+23.14 ± 3.66** | **+18.90 ± 2.56** |
| Final income level | **+5.38 ± 1.37** | **+4.96 ± 1.07** | **+5.02 ± 0.77** |
| Link VP (both eras) | **+3.89 ± 1.83** | **+2.62 ± 1.42** | -0.41 ± 1.23 |
| Industry VP (both eras) | **+21.61 ± 3.78** | **+18.94 ± 2.72** | **+17.18 ± 1.86** |
| Builds | **+3.07 ± 0.50** | **+2.80 ± 0.38** | **+2.41 ± 0.27** |
| Develop actions | **-1.96 ± 0.39** | **-1.92 ± 0.25** | **-1.81 ± 0.19** |
| Network actions | **+0.52 ± 0.39** | +0.03 ± 0.29 | **-0.54 ± 0.23** |
| Links built | **+0.54 ± 0.43** | -0.01 ± 0.30 | **-0.58 ± 0.23** |
| Sell actions | **+1.22 ± 0.28** | **+1.27 ± 0.20** | **+1.48 ± 0.16** |
| Tiles sold | **+1.88 ± 0.30** | **+1.88 ± 0.23** | **+2.14 ± 0.17** |
| Loans | **-0.47 ± 0.31** | **-0.56 ± 0.22** | **-0.58 ± 0.17** |
| Scouts | +0.04 ± 0.11 | -0.00 ± 0.09 | **+0.06 ± 0.06** |
| Passes | **-2.42 ± 0.87** | **-1.62 ± 0.49** | **-1.01 ± 0.25** |
| Unflipped tiles at the end | **+0.99 ± 0.39** | **+0.43 ± 0.28** | -0.01 ± 0.21 |
| Shortfall sales | **-1.14 ± 0.44** | **-0.77 ± 0.26** | **-0.51 ± 0.15** |
| VP lost to shortfalls | **-1.41 ± 0.85** | **-1.10 ± 0.51** | **-0.65 ± 0.27** |

### normal@p1-state vs normal: candidate seats minus baseline seats, per game

| Measure | 2 players (200 games) | 3 players (240 games) | 4 players (240 games) |
|---|---|---|---|
| Final VP | +0.12 ± 6.27 | **+17.97 ± 4.07** | **+19.13 ± 2.93** |
| Final income level | **-6.08 ± 1.17** | **-3.03 ± 1.01** | **-2.85 ± 0.88** |
| Link VP (both eras) | **+14.13 ± 2.74** | **+16.55 ± 2.12** | **+18.94 ± 1.57** |
| Industry VP (both eras) | **-12.61 ± 4.14** | +1.57 ± 2.72 | +1.00 ± 2.13 |
| Builds | **+3.52 ± 0.69** | **+4.61 ± 0.43** | **+2.81 ± 0.31** |
| Develop actions | **-8.00 ± 0.37** | **-7.44 ± 0.24** | **-6.30 ± 0.14** |
| Network actions | **+2.35 ± 0.67** | **+2.12 ± 0.44** | **+2.95 ± 0.33** |
| Links built | **+2.67 ± 0.74** | **+2.56 ± 0.47** | **+3.37 ± 0.36** |
| Sell actions | **-2.22 ± 0.26** | **-1.33 ± 0.22** | **-1.20 ± 0.18** |
| Tiles sold | **-2.13 ± 0.27** | **-1.07 ± 0.24** | **-0.97 ± 0.20** |
| Loans | **+2.02 ± 0.43** | **+2.17 ± 0.30** | **+1.78 ± 0.23** |
| Scouts | **-0.88 ± 0.09** | **-0.41 ± 0.06** | **-0.17 ± 0.04** |
| Passes | **+3.23 ± 1.31** | +0.28 ± 0.66 | +0.13 ± 0.33 |
| Unflipped tiles at the end | **+1.14 ± 0.47** | **+1.33 ± 0.32** | **+0.29 ± 0.22** |
| Shortfall sales | **+0.79 ± 0.51** | -0.01 ± 0.29 | -0.15 ± 0.17 |
| VP lost to shortfalls | **+1.06 ± 0.81** | -0.30 ± 0.47 | **-0.31 ± 0.25** |

### normal@p2-state vs normal: candidate seats minus baseline seats, per game

| Measure | 2 players (200 games) | 3 players (240 games) | 4 players (240 games) |
|---|---|---|---|
| Final VP | **+24.11 ± 4.90** | **+37.22 ± 3.40** | **+30.15 ± 2.55** |
| Final income level | -0.54 ± 1.53 | **+3.51 ± 1.08** | **+1.84 ± 0.93** |
| Link VP (both eras) | **+22.39 ± 2.28** | **+24.05 ± 2.00** | **+22.63 ± 1.36** |
| Industry VP (both eras) | +1.61 ± 3.60 | **+12.25 ± 2.55** | **+7.06 ± 2.11** |
| Builds | **+4.58 ± 0.52** | **+4.65 ± 0.39** | **+2.80 ± 0.29** |
| Develop actions | **-8.61 ± 0.40** | **-7.45 ± 0.29** | **-5.90 ± 0.17** |
| Network actions | **+4.58 ± 0.57** | **+4.05 ± 0.41** | **+3.80 ± 0.27** |
| Links built | **+4.79 ± 0.61** | **+4.25 ± 0.41** | **+4.01 ± 0.27** |
| Sell actions | **-1.59 ± 0.28** | **-0.87 ± 0.18** | **-0.81 ± 0.16** |
| Tiles sold | **-1.16 ± 0.32** | -0.02 ± 0.23 | +0.10 ± 0.19 |
| Loans | **+1.39 ± 0.42** | **+0.38 ± 0.29** | **+0.35 ± 0.23** |
| Scouts | **-0.56 ± 0.11** | **-0.24 ± 0.08** | **+0.09 ± 0.05** |
| Passes | +0.22 ± 0.72 | **-0.52 ± 0.34** | **-0.33 ± 0.21** |
| Unflipped tiles at the end | **+1.40 ± 0.38** | **+0.70 ± 0.29** | +0.00 ± 0.21 |
| Shortfall sales | -0.15 ± 0.38 | **-0.43 ± 0.21** | **-0.35 ± 0.13** |
| VP lost to shortfalls | -0.28 ± 0.50 | **-0.47 ± 0.28** | **-0.30 ± 0.20** |

### normal@p3-state vs normal: candidate seats minus baseline seats, per game

| Measure | 2 players (200 games) | 3 players (240 games) | 4 players (240 games) |
|---|---|---|---|
| Final VP | **+40.73 ± 4.63** | **+45.85 ± 3.18** | **+39.80 ± 2.27** |
| Final income level | **+2.93 ± 1.52** | **+4.29 ± 1.08** | **+3.32 ± 0.84** |
| Link VP (both eras) | **+28.70 ± 2.15** | **+28.91 ± 1.91** | **+25.62 ± 1.39** |
| Industry VP (both eras) | **+11.62 ± 3.76** | **+15.97 ± 2.64** | **+13.50 ± 1.93** |
| Builds | **+5.87 ± 0.47** | **+4.78 ± 0.38** | **+3.16 ± 0.29** |
| Develop actions | **-9.38 ± 0.37** | **-8.12 ± 0.32** | **-6.22 ± 0.16** |
| Network actions | **+5.84 ± 0.51** | **+4.94 ± 0.38** | **+4.29 ± 0.26** |
| Links built | **+6.13 ± 0.52** | **+5.31 ± 0.40** | **+4.51 ± 0.27** |
| Sell actions | **-1.61 ± 0.27** | **-1.04 ± 0.20** | **-0.63 ± 0.15** |
| Tiles sold | **-0.87 ± 0.34** | -0.01 ± 0.25 | **+0.51 ± 0.19** |
| Loans | **+0.82 ± 0.42** | +0.21 ± 0.30 | -0.12 ± 0.21 |
| Scouts | **-0.46 ± 0.13** | +0.04 ± 0.10 | **+0.31 ± 0.07** |
| Passes | **-1.09 ± 0.63** | **-0.81 ± 0.25** | **-0.79 ± 0.23** |
| Unflipped tiles at the end | **+1.84 ± 0.37** | **+0.56 ± 0.27** | -0.09 ± 0.20 |
| Shortfall sales | **-0.82 ± 0.37** | **-0.47 ± 0.16** | **-0.47 ± 0.13** |
| VP lost to shortfalls | **-0.52 ± 0.48** | **-0.52 ± 0.27** | **-0.41 ± 0.19** |


## 5.2 Validation (held-out seeds)

### normal@p3-state vs normal: candidate seats minus baseline seats, per game

| Measure | 2 players (300 games) | 3 players (360 games) | 4 players (360 games) |
|---|---|---|---|
| Final VP | **+41.25 ± 3.74** | **+48.96 ± 2.64** | **+39.11 ± 1.89** |
| Final income level | **+2.70 ± 1.19** | **+4.77 ± 0.91** | **+3.83 ± 0.68** |
| Link VP (both eras) | **+28.38 ± 1.77** | **+29.53 ± 1.47** | **+25.93 ± 1.14** |
| Industry VP (both eras) | **+12.17 ± 3.13** | **+18.32 ± 2.08** | **+12.22 ± 1.64** |
| Builds | **+5.94 ± 0.43** | **+4.91 ± 0.33** | **+3.24 ± 0.23** |
| Develop actions | **-9.00 ± 0.29** | **-8.00 ± 0.27** | **-6.34 ± 0.14** |
| Network actions | **+5.58 ± 0.41** | **+5.11 ± 0.31** | **+4.31 ± 0.24** |
| Links built | **+5.99 ± 0.42** | **+5.35 ± 0.31** | **+4.61 ± 0.25** |
| Sell actions | **-1.43 ± 0.23** | **-0.93 ± 0.16** | **-0.67 ± 0.13** |
| Tiles sold | **-0.79 ± 0.28** | +0.08 ± 0.21 | **+0.40 ± 0.17** |
| Loans | **+0.88 ± 0.33** | +0.13 ± 0.25 | **-0.25 ± 0.16** |
| Scouts | **-0.43 ± 0.11** | -0.00 ± 0.08 | **+0.28 ± 0.06** |
| Passes | **-1.54 ± 0.55** | **-1.22 ± 0.31** | **-0.56 ± 0.17** |
| Unflipped tiles at the end | **+1.81 ± 0.33** | **+0.72 ± 0.22** | **-0.28 ± 0.15** |
| Shortfall sales | **-0.78 ± 0.28** | **-0.66 ± 0.17** | **-0.30 ± 0.09** |
| VP lost to shortfalls | **-0.68 ± 0.37** | **-0.83 ± 0.30** | **-0.28 ± 0.15** |

### normal@p2-state vs normal: candidate seats minus baseline seats, per game

| Measure | 2 players (300 games) | 3 players (360 games) | 4 players (360 games) |
|---|---|---|---|
| Final VP | **+27.00 ± 4.51** | **+36.75 ± 3.00** | **+31.17 ± 1.99** |
| Final income level | +1.16 ± 1.18 | **+2.79 ± 0.95** | **+2.00 ± 0.76** |
| Link VP (both eras) | **+20.39 ± 1.87** | **+24.78 ± 1.53** | **+21.78 ± 1.14** |
| Industry VP (both eras) | **+6.00 ± 3.22** | **+11.35 ± 2.28** | **+8.74 ± 1.60** |
| Builds | **+5.26 ± 0.45** | **+4.48 ± 0.35** | **+3.07 ± 0.25** |
| Develop actions | **-8.46 ± 0.30** | **-7.18 ± 0.24** | **-6.10 ± 0.14** |
| Network actions | **+4.39 ± 0.46** | **+4.27 ± 0.33** | **+3.63 ± 0.23** |
| Links built | **+4.60 ± 0.48** | **+4.55 ± 0.34** | **+3.89 ± 0.23** |
| Sell actions | **-1.35 ± 0.23** | **-1.12 ± 0.17** | **-0.68 ± 0.12** |
| Tiles sold | **-0.87 ± 0.26** | **-0.31 ± 0.20** | **+0.23 ± 0.16** |
| Loans | **+1.05 ± 0.31** | **+0.55 ± 0.24** | **+0.37 ± 0.19** |
| Scouts | **-0.59 ± 0.10** | **-0.23 ± 0.07** | **+0.09 ± 0.05** |
| Passes | -0.30 ± 0.72 | **-0.76 ± 0.37** | **-0.38 ± 0.19** |
| Unflipped tiles at the end | **+1.66 ± 0.35** | **+0.96 ± 0.24** | -0.07 ± 0.16 |
| Shortfall sales | **-0.52 ± 0.37** | **-0.60 ± 0.20** | **-0.34 ± 0.10** |
| VP lost to shortfalls | -0.55 ± 0.57 | **-0.64 ± 0.28** | **-0.28 ± 0.14** |


# 6. Search space and engine cost (`ai-plan.js search`, 10 production games per player count)

### Search space and cost: 2 players, 10 production games (Normal)

| Phase | Decisions | Legal moves: median / p95 / max | With choices expanded: median / max | Last action of a turn | getLegalMoves ms (median / max) | Expanded ms (median / max) | getObservation ms | clone ms | applyMove ms | Heuristic decision ms (median / max) |
|---|---|---|---|---|---|---|---|---|---|---|
| early | 140 | 197 / 438 / 511 | 203 / 511 | 80 of 140 (57%) | 2.1 / 12.6 | 2.7 / 8.8 | 0.09 | 0.05 | 0.10 | 2.03 / 6.6 |
| middle | 360 | 162 / 741 / 2639 | 167 / 7174 | 180 of 360 (50%) | 2.4 / 248.9 | 3.0 / 419.9 | 0.08 | 0.05 | 0.10 | 1.77 / 6.7 |
| late | 280 | 216 / 2383 / 2947 | 270 / 20343 | 140 of 280 (50%) | 118.5 / 360.1 | 137.6 / 1438.4 | 0.14 | 0.06 | 0.15 | 3.78 / 22.4 |

### Search space and cost: 3 players, 10 production games (Normal)

| Phase | Decisions | Legal moves: median / p95 / max | With choices expanded: median / max | Last action of a turn | getLegalMoves ms (median / max) | Expanded ms (median / max) | getObservation ms | clone ms | applyMove ms | Heuristic decision ms (median / max) |
|---|---|---|---|---|---|---|---|---|---|---|
| early | 210 | 206 / 444 / 517 | 206 / 540 | 120 of 210 (57%) | 2.2 / 14.5 | 2.9 / 10.6 | 0.09 | 0.05 | 0.10 | 1.87 / 6.6 |
| middle | 480 | 146 / 754 / 3536 | 151 / 11651 | 240 of 480 (50%) | 2.6 / 267.4 | 3.2 / 636.6 | 0.10 | 0.05 | 0.11 | 1.70 / 11.6 |
| late | 360 | 154 / 2114 / 3660 | 195 / 22702 | 180 of 360 (50%) | 105.3 / 449.7 | 120.0 / 2664.3 | 0.16 | 0.08 | 0.17 | 3.63 / 29.0 |

### Search space and cost: 4 players, 10 production games (Normal)

| Phase | Decisions | Legal moves: median / p95 / max | With choices expanded: median / max | Last action of a turn | getLegalMoves ms (median / max) | Expanded ms (median / max) | getObservation ms | clone ms | applyMove ms | Heuristic decision ms (median / max) |
|---|---|---|---|---|---|---|---|---|---|---|
| early | 280 | 206 / 444 / 512 | 207 / 512 | 160 of 280 (57%) | 2.2 / 15.2 | 2.9 / 10.9 | 0.11 | 0.06 | 0.10 | 1.85 / 7.2 |
| middle | 560 | 124 / 473 / 2023 | 132 / 5420 | 280 of 560 (50%) | 2.7 / 424.5 | 3.4 / 434.8 | 0.12 | 0.07 | 0.11 | 1.97 / 12.4 |
| late | 400 | 188 / 1415 / 3508 | 241 / 10352 | 200 of 400 (50%) | 83.3 / 445.0 | 91.3 / 809.1 | 0.17 | 0.09 | 0.17 | 4.46 / 13.5 |

# 7. Decision time and plan realisation (`ai-plan.js realise`, 8 games, one planner at a time)

### Plan realisation and cost: p2-state, 2 players, 8 games (seat 0 the planner, others production Normal)

- Planned follow-up in the same turn: played next 79 of 152 (52%)
- Planned follow-up in the next turn (after the opponents): still legal 138 of 144 (96%), played 22 of 144 (15%)
- Decision time: mean 22.5 ms, median 19.2, p95 51.3, max 79.4; per game 0.9 s for the planner's seat
- States evaluated per decision: mean 6.4, max 7
- By phase (mean / max ms): early 17.4 / 44.4; middle 18.4 / 54.9; late 30.3 / 79.4

### Plan realisation and cost: p2-sum, 2 players, 8 games (seat 0 the planner, others production Normal)

- Planned follow-up in the same turn: played next 135 of 152 (89%)
- Planned follow-up in the next turn (after the opponents): still legal 133 of 144 (92%), played 58 of 144 (40%)
- Decision time: mean 20.1 ms, median 18.1, p95 42.9, max 76.2; per game 0.8 s for the planner's seat
- States evaluated per decision: mean 6.2, max 7
- By phase (mean / max ms): early 15.7 / 61.8; middle 17.9 / 48.6; late 25.1 / 76.2

### Plan realisation and cost: p3-state, 2 players, 8 games (seat 0 the planner, others production Normal)

- Planned follow-up in the same turn: played next 91 of 152 (60%)
- Planned follow-up in the next turn (after the opponents): still legal 131 of 144 (91%), played 49 of 144 (34%)
- Decision time: mean 71.8 ms, median 62.4, p95 167.7, max 227.4; per game 2.8 s for the planner's seat
- States evaluated per decision: mean 21.5, max 25
- By phase (mean / max ms): early 61.9 / 148.9; middle 62.7 / 196.6; late 88.5 / 227.4

### Plan realisation and cost: p3-state-b, 2 players, 8 games (seat 0 the planner, others production Normal)

- Planned follow-up in the same turn: played next 109 of 152 (72%)
- Planned follow-up in the next turn (after the opponents): still legal 134 of 144 (93%), played 50 of 144 (35%)
- Decision time: mean 31.2 ms, median 27.6, p95 63.6, max 99.0; per game 1.2 s for the planner's seat
- States evaluated per decision: mean 11.8, max 13
- By phase (mean / max ms): early 26.6 / 59.6; middle 25.2 / 60.8; late 41.4 / 99.0

### Plan realisation and cost: p3-sum, 2 players, 8 games (seat 0 the planner, others production Normal)

- Planned follow-up in the same turn: played next 134 of 152 (88%)
- Planned follow-up in the next turn (after the opponents): still legal 130 of 144 (90%), played 55 of 144 (38%)
- Decision time: mean 70.1 ms, median 63.1, p95 150.3, max 213.2; per game 2.7 s for the planner's seat
- States evaluated per decision: mean 20.7, max 25
- By phase (mean / max ms): early 54.0 / 132.3; middle 63.6 / 183.1; late 86.5 / 213.2

### Plan realisation and cost: p2-state, 4 players, 8 games (seat 0 the planner, others production Normal)

- Planned follow-up in the same turn: played next 66 of 120 (55%)
- Planned follow-up in the next turn (after the opponents): still legal 97 of 112 (87%), played 13 of 112 (12%)
- Decision time: mean 24.8 ms, median 21.8, p95 60.9, max 76.8; per game 0.8 s for the planner's seat
- States evaluated per decision: mean 6.4, max 7
- By phase (mean / max ms): early 17.8 / 39.4; middle 20.6 / 50.8; late 35.5 / 76.8

### Plan realisation and cost: p2-sum, 4 players, 8 games (seat 0 the planner, others production Normal)

- Planned follow-up in the same turn: played next 106 of 120 (88%)
- Planned follow-up in the next turn (after the opponents): still legal 91 of 112 (81%), played 42 of 112 (38%)
- Decision time: mean 21.3 ms, median 17.6, p95 49.2, max 75.3; per game 0.7 s for the planner's seat
- States evaluated per decision: mean 6.2, max 7
- By phase (mean / max ms): early 14.9 / 51.7; middle 17.2 / 43.1; late 31.5 / 75.3

### Plan realisation and cost: p3-state, 4 players, 8 games (seat 0 the planner, others production Normal)

- Planned follow-up in the same turn: played next 69 of 120 (58%)
- Planned follow-up in the next turn (after the opponents): still legal 104 of 112 (93%), played 37 of 112 (33%)
- Decision time: mean 76.6 ms, median 62.2, p95 175.5, max 290.5; per game 2.4 s for the planner's seat
- States evaluated per decision: mean 21.8, max 25
- By phase (mean / max ms): early 55.7 / 121.6; middle 61.6 / 159.6; late 112.2 / 290.5

### Plan realisation and cost: p3-state-b, 4 players, 8 games (seat 0 the planner, others production Normal)

- Planned follow-up in the same turn: played next 77 of 120 (64%)
- Planned follow-up in the next turn (after the opponents): still legal 97 of 112 (87%), played 37 of 112 (33%)
- Decision time: mean 33.4 ms, median 29.1, p95 68.3, max 96.2; per game 1.0 s for the planner's seat
- States evaluated per decision: mean 11.6, max 13
- By phase (mean / max ms): early 25.1 / 48.1; middle 27.3 / 72.5; late 47.9 / 96.2

### Plan realisation and cost: p3-sum, 4 players, 8 games (seat 0 the planner, others production Normal)

- Planned follow-up in the same turn: played next 109 of 120 (91%)
- Planned follow-up in the next turn (after the opponents): still legal 94 of 112 (84%), played 44 of 112 (39%)
- Decision time: mean 66.4 ms, median 53.8, p95 158.3, max 229.8; per game 2.1 s for the planner's seat
- States evaluated per decision: mean 21.0, max 25
- By phase (mean / max ms): early 47.4 / 152.7; middle 55.3 / 218.3; late 95.3 / 229.8

# 8. Where the planner disagrees with the heuristic (`ai-plan.js missed`, 20 production games per player count)

### Where the planner disagrees with the heuristic: 2 players, 20 production games (Normal)

| Planner | Decisions | Different first action | With another action left this turn (follow-up exact) | At the last action of a turn (follow-up next turn) | Most common planned pairs |
|---|---|---|---|---|---|
| p2-sum | 1560 | 337 of 1560 (22%) | 204 | 133 | network → build 86; build → sell 53; develop → loan 32; build → loan 25 |
| p3-sum | 1560 | 510 of 1560 (33%) | 303 | 207 | network → build 142; loan → build 59; build → sell 37; network → loan 37 |
| p2-state | 1560 | 900 of 1560 (58%) | 466 | 434 | network → build 201; loan → build 140; build → build 89; network → loan 49 |
| p3-state | 1560 | 925 of 1560 (59%) | 470 | 455 | network → build 207; loan → build 151; build → build 102; network → network 80 |

**Examples (p2-sum)**
- seed 202001, player 1, canal round 2 (first action of the turn): heuristic build coalMine at burtonOnTrent; planner network birmingham-oxford, then build manufacturer at birmingham
- seed 202001, player 0, canal round 5 (first action of the turn): heuristic develop cottonMill + manufacturer; planner network birmingham-worcester, then develop cottonMill + manufacturer
- seed 202001, player 1, canal round 6 (first action of the turn): heuristic network coalbrookdale-shrewsbury; planner develop cottonMill + coalMine, then loan
- seed 202001, player 0, canal round 7 (first action of the turn): heuristic network redditch-oxford; planner develop coalMine + ironWorks, then build ironWorks at birmingham
- seed 202001, player 1, canal round 8 (first action of the turn): heuristic build ironWorks at walsall; planner build cottonMill at birmingham, then sell
- seed 202001, player 0, canal round 8 (first action of the turn): heuristic develop ironWorks + coalMine; planner network birmingham-worcester, then build cottonMill at worcester
- seed 202001, player 0, canal round 9 (first action of the turn): heuristic network gloucester-redditch; planner develop coalMine + brewery, then build brewery at stafford
- seed 202001, player 0, canal round 9 (last action of the turn): heuristic network gloucester-redditch; planner develop brewery + coalMine, then develop coalMine + brewery

**Examples (p3-sum)**
- seed 202001, player 0, canal round 2 (first action of the turn): heuristic develop brewery + coalMine; planner network birmingham-oxford, then build manufacturer at coventry, then sell
- seed 202001, player 0, canal round 2 (last action of the turn): heuristic build coalMine at coventry; planner build coalMine at wolverhampton, then loan, then build coalMine at coventry
- seed 202001, player 1, canal round 2 (first action of the turn): heuristic build coalMine at burtonOnTrent; planner network birmingham-oxford, then build manufacturer at birmingham, then sell
- seed 202001, player 1, canal round 3 (first action of the turn): heuristic develop brewery + cottonMill; planner network birmingham-dudley, then build ironWorks at dudley, then develop brewery + cottonMill
- seed 202001, player 0, canal round 5 (first action of the turn): heuristic develop cottonMill + manufacturer; planner network birmingham-oxford, then network redditch-oxford, then build ironWorks at redditch
- seed 202001, player 0, canal round 5 (last action of the turn): heuristic build coalMine at dudley; planner build brewery at burtonOnTrent, then loan, then build ironWorks at birmingham
- seed 202001, player 0, canal round 6 (first action of the turn): heuristic network birmingham-oxford; planner develop coalMine, then loan, then build ironWorks at birmingham
- seed 202001, player 1, canal round 6 (first action of the turn): heuristic network coalbrookdale-shrewsbury; planner develop cottonMill + coalMine, then loan, then build coalMine at cannock

**Examples (p2-state)**
- seed 202001, player 0, canal round 1 (last action of the turn): heuristic network birmingham-coventry; planner build brewery at burtonOnTrent, then develop brewery + coalMine
- seed 202001, player 0, canal round 2 (first action of the turn): heuristic develop brewery + coalMine; planner build coalMine at coventry, then build coalMine at wolverhampton
- seed 202001, player 1, canal round 3 (first action of the turn): heuristic develop brewery + cottonMill; planner network birmingham-dudley, then build ironWorks at dudley
- seed 202001, player 1, canal round 3 (last action of the turn): heuristic develop brewery + cottonMill; planner loan, then build coalMine at dudley
- seed 202001, player 0, canal round 3 (first action of the turn): heuristic loan; planner pass, then loan
- seed 202001, player 0, canal round 3 (last action of the turn): heuristic develop brewery + cottonMill; planner build coalMine at dudley, then build coalMine at redditch
- seed 202001, player 0, canal round 4 (last action of the turn): heuristic build ironWorks at coalbrookdale; planner build coalMine at dudley, then build ironWorks at coalbrookdale
- seed 202001, player 1, canal round 4 (first action of the turn): heuristic develop brewery + cottonMill; planner network birmingham-oxford, then loan

**Examples (p3-state)**
- seed 202001, player 0, canal round 1 (last action of the turn): heuristic network birmingham-coventry; planner network birmingham-oxford, then build coalMine at wolverhampton, then build coalMine at coventry
- seed 202001, player 0, canal round 2 (first action of the turn): heuristic develop brewery + coalMine; planner network birmingham-oxford, then build manufacturer at coventry, then sell
- seed 202001, player 1, canal round 3 (first action of the turn): heuristic develop brewery + cottonMill; planner build coalMine at kidderminster, then network birmingham-oxford, then network redditch-oxford
- seed 202001, player 1, canal round 3 (last action of the turn): heuristic develop brewery + cottonMill; planner loan, then build coalMine at dudley, then build coalMine at kidderminster
- seed 202001, player 0, canal round 3 (last action of the turn): heuristic develop brewery + cottonMill; planner network birmingham-oxford, then build coalMine at dudley, then build coalMine at redditch
- seed 202001, player 0, canal round 4 (first action of the turn): heuristic develop cottonMill + ironWorks; planner build coalMine at dudley, then build coalMine at redditch, then build ironWorks at coalbrookdale
- seed 202001, player 0, canal round 4 (last action of the turn): heuristic build ironWorks at coalbrookdale; planner network birmingham-oxford, then build coalMine at dudley, then build ironWorks at coalbrookdale
- seed 202001, player 1, canal round 4 (first action of the turn): heuristic develop brewery + cottonMill; planner loan, then build coalMine at dudley, then build coalMine at kidderminster

### Where the planner disagrees with the heuristic: 3 players, 20 production games (Normal)

| Planner | Decisions | Different first action | With another action left this turn (follow-up exact) | At the last action of a turn (follow-up next turn) | Most common planned pairs |
|---|---|---|---|---|---|
| p2-sum | 2100 | 479 of 2100 (23%) | 295 | 184 | network → build 133; build → sell 86; build → loan 44; develop → loan 43 |
| p3-sum | 2100 | 648 of 2100 (31%) | 380 | 268 | network → build 202; network → loan 58; build → sell 51; build → network 47 |
| p2-state | 2100 | 1145 of 2100 (55%) | 583 | 562 | network → build 277; loan → build 154; build → build 95; network → loan 77 |
| p3-state | 2100 | 1154 of 2100 (55%) | 576 | 578 | network → build 279; loan → build 152; build → build 126; network → network 104 |

**Examples (p2-sum)**
- seed 203001, player 1, canal round 1 (last action of the turn): heuristic network birmingham-oxford; planner build manufacturer at stokeOnTrent, then sell
- seed 203001, player 0, canal round 2 (last action of the turn): heuristic build coalMine at stone; planner build coalMine at tamworth, then network stokeOnTrent-stone
- seed 203001, player 1, canal round 3 (first action of the turn): heuristic build coalMine at burtonOnTrent; planner build ironWorks at coalbrookdale, then build coalMine at burtonOnTrent
- seed 203001, player 0, canal round 4 (first action of the turn): heuristic build coalMine at wolverhampton; planner build ironWorks at stokeOnTrent, then develop brewery + cottonMill
- seed 203001, player 0, canal round 4 (last action of the turn): heuristic build coalMine at wolverhampton; planner build ironWorks at stokeOnTrent, then develop cottonMill + manufacturer
- seed 203001, player 2, canal round 4 (first action of the turn): heuristic network coalbrookdale-shrewsbury; planner network coalbrookdale-kidderminster, then network coalbrookdale-shrewsbury
- seed 203001, player 1, canal round 5 (first action of the turn): heuristic develop brewery + cottonMill; planner build ironWorks at coalbrookdale, then develop brewery + cottonMill
- seed 203001, player 1, canal round 5 (last action of the turn): heuristic develop cottonMill + ironWorks; planner network burtonOnTrent-walsall, then build ironWorks at walsall

**Examples (p3-sum)**
- seed 203001, player 0, canal round 2 (first action of the turn): heuristic develop brewery + coalMine; planner build ironWorks at stokeOnTrent, then develop brewery + coalMine, then develop brewery + cottonMill
- seed 203001, player 0, canal round 2 (last action of the turn): heuristic build coalMine at stone; planner build coalMine at tamworth, then network stokeOnTrent-stone, then loan
- seed 203001, player 1, canal round 3 (first action of the turn): heuristic build coalMine at burtonOnTrent; planner build ironWorks at coalbrookdale, then build coalMine at burtonOnTrent, then build coalMine at cannock
- seed 203001, player 0, canal round 4 (first action of the turn): heuristic build coalMine at wolverhampton; planner build ironWorks at stokeOnTrent, then develop brewery + cottonMill, then build coalMine at wolverhampton
- seed 203001, player 2, canal round 4 (first action of the turn): heuristic network coalbrookdale-shrewsbury; planner network coalbrookdale-kidderminster, then network coalbrookdale-shrewsbury, then loan
- seed 203001, player 1, canal round 5 (first action of the turn): heuristic develop brewery + cottonMill; planner network burtonOnTrent-walsall, then build ironWorks at walsall, then develop brewery + cottonMill
- seed 203001, player 1, canal round 5 (last action of the turn): heuristic develop cottonMill + ironWorks; planner build coalMine at coventry, then network burtonOnTrent-walsall, then build ironWorks at walsall
- seed 203001, player 2, canal round 5 (first action of the turn): heuristic network coalbrookdale-wolverhampton; planner loan, then build cottonMill at kidderminster, then sell

**Examples (p2-state)**
- seed 203001, player 1, canal round 1 (last action of the turn): heuristic network birmingham-oxford; planner build manufacturer at stokeOnTrent, then sell
- seed 203001, player 0, canal round 2 (first action of the turn): heuristic develop brewery + coalMine; planner build ironWorks at stokeOnTrent, then develop brewery + coalMine
- seed 203001, player 1, canal round 2 (first action of the turn): heuristic sell; planner build brewery at coalbrookdale, then sell
- seed 203001, player 1, canal round 2 (last action of the turn): heuristic develop brewery + coalMine; planner build coalMine at cannock, then build coalMine at wolverhampton
- seed 203001, player 1, canal round 3 (first action of the turn): heuristic build coalMine at burtonOnTrent; planner build ironWorks at coalbrookdale, then build coalMine at burtonOnTrent
- seed 203001, player 1, canal round 3 (last action of the turn): heuristic network burtonOnTrent-derby; planner loan, then build coalMine at cannock
- seed 203001, player 0, canal round 3 (first action of the turn): heuristic network burtonOnTrent-stone; planner loan, then build coalMine at tamworth
- seed 203001, player 2, canal round 4 (first action of the turn): heuristic network coalbrookdale-shrewsbury; planner scout, then build ironWorks at derby

**Examples (p3-state)**
- seed 203001, player 1, canal round 1 (last action of the turn): heuristic network birmingham-oxford; planner build manufacturer at stokeOnTrent, then build brewery at coalbrookdale, then sell
- seed 203001, player 0, canal round 2 (first action of the turn): heuristic develop brewery + coalMine; planner build ironWorks at stokeOnTrent, then build brewery at stone, then develop brewery + coalMine
- seed 203001, player 1, canal round 2 (first action of the turn): heuristic sell; planner build brewery at coalbrookdale, then loan, then sell
- seed 203001, player 1, canal round 2 (last action of the turn): heuristic develop brewery + coalMine; planner build coalMine at cannock, then build coalMine at wolverhampton, then loan
- seed 203001, player 2, canal round 3 (first action of the turn): heuristic build coalMine at burtonOnTrent; planner build coalMine at kidderminster, then build coalMine at redditch, then build coalMine at burtonOnTrent
- seed 203001, player 1, canal round 3 (first action of the turn): heuristic build coalMine at burtonOnTrent; planner build ironWorks at coalbrookdale, then build coalMine at burtonOnTrent, then build coalMine at cannock
- seed 203001, player 1, canal round 3 (last action of the turn): heuristic network burtonOnTrent-derby; planner loan, then build coalMine at cannock, then build ironWorks at coalbrookdale
- seed 203001, player 0, canal round 3 (first action of the turn): heuristic network burtonOnTrent-stone; planner loan, then build coalMine at tamworth, then build coalMine at wolverhampton

### Where the planner disagrees with the heuristic: 4 players, 20 production games (Normal)

| Planner | Decisions | Different first action | With another action left this turn (follow-up exact) | At the last action of a turn (follow-up next turn) | Most common planned pairs |
|---|---|---|---|---|---|
| p2-sum | 2480 | 640 of 2480 (26%) | 407 | 233 | build → sell 162; network → build 155; build → loan 57; develop → loan 44 |
| p3-sum | 2480 | 795 of 2480 (32%) | 480 | 315 | network → build 251; build → sell 106; build → build 75; build → loan 54 |
| p2-state | 2480 | 1472 of 2480 (59%) | 764 | 708 | network → build 372; loan → build 162; build → sell 138; network → loan 102 |
| p3-state | 2480 | 1534 of 2480 (62%) | 773 | 761 | network → build 389; loan → build 180; build → build 168; network → network 157 |

**Examples (p2-sum)**
- seed 204001, player 0, canal round 1 (last action of the turn): heuristic network kidderminster-worcester; planner network gloucester-worcester, then build cottonMill at worcester
- seed 204001, player 3, canal round 2 (last action of the turn): heuristic develop brewery + coalMine; planner build ironWorks at stokeOnTrent, then develop brewery + coalMine
- seed 204001, player 2, canal round 3 (last action of the turn): heuristic develop brewery + cottonMill; planner build coalMine at belper, then loan
- seed 204001, player 0, canal round 5 (first action of the turn): heuristic build ironWorks at coalbrookdale; planner network coalbrookdale-shrewsbury, then sell
- seed 204001, player 3, canal round 6 (first action of the turn): heuristic develop cottonMill + ironWorks; planner build coalMine at redditch, then develop cottonMill + ironWorks
- seed 204001, player 1, canal round 6 (first action of the turn): heuristic build ironWorks at coalbrookdale; planner network birmingham-coventry, then build pottery at coventry
- seed 204001, player 1, canal round 6 (last action of the turn): heuristic develop manufacturer + ironWorks; planner network birmingham-coventry, then build pottery at coventry
- seed 204001, player 1, canal round 7 (first action of the turn): heuristic build coalMine at burtonOnTrent; planner network birmingham-coventry, then build pottery at coventry

**Examples (p3-sum)**
- seed 204001, player 0, canal round 1 (last action of the turn): heuristic network kidderminster-worcester; planner network gloucester-worcester, then build cottonMill at worcester, then sell
- seed 204001, player 3, canal round 2 (first action of the turn): heuristic develop brewery + coalMine; planner build ironWorks at redditch, then build ironWorks at stokeOnTrent, then develop brewery + coalMine
- seed 204001, player 3, canal round 2 (last action of the turn): heuristic develop brewery + coalMine; planner build ironWorks at stokeOnTrent, then develop brewery + coalMine, then develop brewery + cottonMill
- seed 204001, player 2, canal round 3 (last action of the turn): heuristic develop brewery + cottonMill; planner build coalMine at belper, then loan, then develop brewery + cottonMill
- seed 204001, player 0, canal round 3 (first action of the turn): heuristic network coalbrookdale-kidderminster; planner loan, then build cottonMill at worcester, then sell
- seed 204001, player 0, canal round 4 (last action of the turn): heuristic build cottonMill at worcester; planner network coalbrookdale-shrewsbury, then build cottonMill at worcester, then sell
- seed 204001, player 1, canal round 4 (first action of the turn): heuristic network birmingham-coventry; planner develop brewery + cottonMill, then develop cottonMill + ironWorks, then build ironWorks at coalbrookdale
- seed 204001, player 1, canal round 4 (last action of the turn): heuristic develop cottonMill + ironWorks; planner network redditch-oxford, then develop cottonMill + ironWorks, then build ironWorks at redditch

**Examples (p2-state)**
- seed 204001, player 0, canal round 1 (last action of the turn): heuristic network kidderminster-worcester; planner network gloucester-worcester, then build cottonMill at worcester
- seed 204001, player 1, canal round 2 (last action of the turn): heuristic sell; planner loan, then sell
- seed 204001, player 2, canal round 2 (last action of the turn): heuristic sell; planner build coalMine at belper, then sell
- seed 204001, player 3, canal round 2 (first action of the turn): heuristic develop brewery + coalMine; planner build ironWorks at stokeOnTrent, then build ironWorks at redditch
- seed 204001, player 3, canal round 2 (last action of the turn): heuristic develop brewery + coalMine; planner build ironWorks at stokeOnTrent, then develop brewery + coalMine
- seed 204001, player 2, canal round 3 (first action of the turn): heuristic develop brewery + coalMine; planner build brewery at walsall, then develop brewery + coalMine
- seed 204001, player 2, canal round 3 (last action of the turn): heuristic develop brewery + cottonMill; planner build coalMine at belper, then loan
- seed 204001, player 3, canal round 3 (first action of the turn): heuristic build ironWorks at stokeOnTrent; planner network redditch-oxford, then build ironWorks at stokeOnTrent

**Examples (p3-state)**
- seed 204001, player 0, canal round 1 (last action of the turn): heuristic network kidderminster-worcester; planner network gloucester-worcester, then build cottonMill at worcester, then sell
- seed 204001, player 1, canal round 2 (last action of the turn): heuristic sell; planner loan, then network redditch-oxford, then sell
- seed 204001, player 0, canal round 2 (first action of the turn): heuristic develop brewery + coalMine; planner build coalMine at kidderminster, then build coalMine at burtonOnTrent, then loan
- seed 204001, player 3, canal round 2 (first action of the turn): heuristic develop brewery + coalMine; planner build ironWorks at redditch, then build ironWorks at stokeOnTrent, then develop brewery + coalMine
- seed 204001, player 3, canal round 2 (last action of the turn): heuristic develop brewery + coalMine; planner build ironWorks at stokeOnTrent, then network redditch-oxford, then develop brewery + coalMine
- seed 204001, player 2, canal round 3 (first action of the turn): heuristic develop brewery + coalMine; planner network stokeOnTrent-stone, then build coalMine at stone, then develop brewery + cottonMill
- seed 204001, player 2, canal round 3 (last action of the turn): heuristic develop brewery + cottonMill; planner build coalMine at belper, then pass, then loan
- seed 204001, player 3, canal round 3 (first action of the turn): heuristic build ironWorks at stokeOnTrent; planner network redditch-oxford, then build ironWorks at stokeOnTrent, then develop brewery + cottonMill

# 9. How well the evaluations predict the final result (`ai-plan.js evaluate`, 40 production games per player count)

### How well the evaluations predict the final result: 2 players, 40 production games (Normal)

| Snapshot | Measure | Correlation with final VP | Pairs of players ranked correctly |
|---|---|---|---|
| early (start of its last round) | position value V (state) | 0.29 | 60% |
| early (start of its last round) | VP + VP scorable now | 0.33 | 53% |
| early (start of its last round) | sum of action scores so far (sum) | 0.28 | 58% |
| middle (start of its last round) | position value V (state) | 0.57 | 63% |
| middle (start of its last round) | VP + VP scorable now | 0.48 | 58% |
| middle (start of its last round) | sum of action scores so far (sum) | 0.45 | 55% |
| late (start of its last round) | position value V (state) | 0.97 | 88% |
| late (start of its last round) | VP + VP scorable now | 0.98 | 88% |
| late (start of its last round) | sum of action scores so far (sum) | 0.79 | 60% |
| whole game | sum of action scores (sum) | 0.79 | 73% |

### How well the evaluations predict the final result: 3 players, 40 production games (Normal)

| Snapshot | Measure | Correlation with final VP | Pairs of players ranked correctly |
|---|---|---|---|
| early (start of its last round) | position value V (state) | 0.19 | 57% |
| early (start of its last round) | VP + VP scorable now | 0.26 | 58% |
| early (start of its last round) | sum of action scores so far (sum) | 0.24 | 56% |
| middle (start of its last round) | position value V (state) | 0.80 | 75% |
| middle (start of its last round) | VP + VP scorable now | 0.72 | 77% |
| middle (start of its last round) | sum of action scores so far (sum) | 0.58 | 63% |
| late (start of its last round) | position value V (state) | 0.97 | 91% |
| late (start of its last round) | VP + VP scorable now | 0.98 | 93% |
| late (start of its last round) | sum of action scores so far (sum) | 0.75 | 72% |
| whole game | sum of action scores (sum) | 0.76 | 72% |

### How well the evaluations predict the final result: 4 players, 40 production games (Normal)

| Snapshot | Measure | Correlation with final VP | Pairs of players ranked correctly |
|---|---|---|---|
| early (start of its last round) | position value V (state) | 0.17 | 50% |
| early (start of its last round) | VP + VP scorable now | 0.26 | 50% |
| early (start of its last round) | sum of action scores so far (sum) | 0.17 | 56% |
| middle (start of its last round) | position value V (state) | 0.78 | 75% |
| middle (start of its last round) | VP + VP scorable now | 0.72 | 75% |
| middle (start of its last round) | sum of action scores so far (sum) | 0.34 | 58% |
| late (start of its last round) | position value V (state) | 0.96 | 89% |
| late (start of its last round) | VP + VP scorable now | 0.97 | 93% |
| late (start of its last round) | sum of action scores so far (sum) | 0.68 | 70% |
| whole game | sum of action scores (sum) | 0.66 | 69% |

