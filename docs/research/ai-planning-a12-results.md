# Planning Research: Results (Assignment 12)

Generated output of the research scripts, used by [the Assignment 12 report](ai-planning-a12.md). The report's [reproduction section](ai-planning-a12.md#reproducing-the-experiments) regenerates every number; the raw per-game data is not committed.

Policy names: `normal@p<depth>-state[-b|-n]` are the planners (`js/aiPlanner.js` through `scripts/research/planner.js`; [plan](ai-planning-a12-plan.md)); `normal` is the heuristic AI of Assignment 10. `p4-state` is the production AI since Assignment 12 (without its wall-clock cut-off). Columns in §1–2: the candidate's win share and VP difference (candidate − baseline) ± 1.96 SE; pooled = 2, 3 and 4 players weighted equally (`ai-criteria.js`).

# 1. Exploration (seeds 200000 + 1000 × players + i)

2 players: 100 seeds, 3 and 4 players: 40 seeds.

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| normal@p4-state vs normal@p3-state | 2 | 200 | 55.0% ± 6.9 | +4.01 ± 4.49 | includes 0 |
| normal@p4-state vs normal@p3-state | 3 | 240 | 56.7% ± 6.3 | +2.99 ± 3.03 | includes 0 |
| normal@p4-state vs normal@p3-state | 4 | 240 | 58.8% ± 6.2 | +2.80 ± 2.15 | above 0 |
| normal@p4-state vs normal@p3-state | **pooled** | 680 | 56.8% ± 3.7 | +3.26 ± 1.94 | **improves** |
| normal@p4-state-b vs normal@p3-state | 2 | 200 | 43.5% ± 6.9 | -5.41 ± 4.38 | **below 0** |
| normal@p4-state-b vs normal@p3-state | 3 | 240 | 42.9% ± 6.3 | -4.42 ± 3.27 | **below 0** |
| normal@p4-state-b vs normal@p3-state | 4 | 240 | 43.3% ± 6.3 | -3.50 ± 2.05 | **below 0** |
| normal@p4-state-b vs normal@p3-state | **pooled** | 680 | 43.3% ± 3.7 | -4.44 ± 1.95 | no improvement; **regression** |
| normal@p4-state-n vs normal@p3-state | 2 | 200 | 44.0% ± 6.9 | -3.04 ± 4.49 | includes 0 |
| normal@p4-state-n vs normal@p3-state | 3 | 240 | 53.3% ± 6.3 | +0.23 ± 2.93 | includes 0 |
| normal@p4-state-n vs normal@p3-state | 4 | 240 | 44.6% ± 6.3 | +0.14 ± 2.11 | includes 0 |
| normal@p4-state-n vs normal@p3-state | **pooled** | 680 | 47.3% ± 3.8 | -0.89 ± 1.92 | no improvement |

## 1.1 Full against bounded four-action planning

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| normal@p4-state vs normal@p4-state-b | 2 | 200 | 62.0% ± 6.7 | +8.05 ± 4.11 | above 0 |
| normal@p4-state vs normal@p4-state-b | 3 | 240 | 66.7% ± 6.0 | +8.65 ± 2.93 | above 0 |
| normal@p4-state vs normal@p4-state-b | 4 | 240 | 61.3% ± 6.2 | +5.93 ± 2.08 | above 0 |
| normal@p4-state vs normal@p4-state-b | **pooled** | 680 | 63.3% ± 3.6 | +7.55 ± 1.82 | **improves** |
| normal@p4-state vs normal@p4-state-n | 2 | 200 | 58.0% ± 6.9 | +6.11 ± 4.31 | above 0 |
| normal@p4-state vs normal@p4-state-n | 3 | 240 | 55.4% ± 6.3 | +2.87 ± 3.29 | includes 0 |
| normal@p4-state vs normal@p4-state-n | 4 | 240 | 49.2% ± 6.3 | +0.50 ± 2.18 | includes 0 |
| normal@p4-state vs normal@p4-state-n | **pooled** | 680 | 54.2% ± 3.8 | +3.16 ± 1.95 | **improves** |

## 1.2 Behaviour (four-action seats minus three-action seats in the same games, per game; `ai-seatstats.js`)

### normal@p4-state vs normal@p3-state: candidate seats minus baseline seats, per game

| Measure | 2 players (200 games) | 3 players (240 games) | 4 players (240 games) |
|---|---|---|---|
| Final VP | +4.01 ± 4.49 | +2.99 ± 3.03 | **+2.80 ± 2.15** |
| Final income level | +1.31 ± 1.46 | +0.33 ± 1.05 | **+1.11 ± 0.90** |
| Link VP (both eras) | +2.02 ± 2.43 | +0.98 ± 2.16 | +0.43 ± 1.60 |
| Industry VP (both eras) | +1.99 ± 3.81 | +1.60 ± 2.41 | **+2.40 ± 1.84** |
| Builds | +0.05 ± 0.47 | +0.04 ± 0.36 | +0.03 ± 0.30 |
| Develop actions | +0.07 ± 0.23 | -0.00 ± 0.13 | **+0.21 ± 0.09** |
| Network actions | +0.20 ± 0.54 | -0.02 ± 0.40 | -0.10 ± 0.30 |
| Links built | +0.36 ± 0.56 | +0.04 ± 0.42 | -0.08 ± 0.32 |
| Sell actions | +0.04 ± 0.22 | +0.12 ± 0.16 | +0.03 ± 0.14 |
| Tiles sold | +0.34 ± 0.39 | **+0.37 ± 0.31** | +0.23 ± 0.25 |
| Loans | **-0.44 ± 0.38** | -0.25 ± 0.29 | **-0.36 ± 0.24** |
| Scouts | +0.11 ± 0.15 | **+0.12 ± 0.10** | **+0.19 ± 0.09** |
| Passes | -0.03 ± 0.23 | -0.01 ± 0.12 | +0.01 ± 0.01 |
| Unflipped tiles at the end | -0.28 ± 0.45 | -0.04 ± 0.27 | -0.09 ± 0.19 |
| Shortfall sales | +0.06 ± 0.31 | +0.00 ± 0.17 | +0.03 ± 0.06 |
| VP lost to shortfalls | +0.06 ± 0.29 | -0.05 ± 0.18 | +0.00 ± 0.00 |

### normal@p4-state-b vs normal@p3-state: candidate seats minus baseline seats, per game

| Measure | 2 players (200 games) | 3 players (240 games) | 4 players (240 games) |
|---|---|---|---|
| Final VP | **-5.41 ± 4.38** | **-4.42 ± 3.27** | **-3.50 ± 2.05** |
| Final income level | +1.07 ± 1.49 | **+2.26 ± 1.02** | **+3.19 ± 0.80** |
| Link VP (both eras) | **-3.19 ± 2.70** | **-4.72 ± 2.01** | **-3.94 ± 1.54** |
| Industry VP (both eras) | -2.15 ± 3.74 | +0.21 ± 2.59 | +0.30 ± 1.84 |
| Builds | -0.16 ± 0.46 | +0.30 ± 0.35 | **+0.58 ± 0.29** |
| Develop actions | **+0.70 ± 0.24** | **+0.57 ± 0.15** | **+0.45 ± 0.11** |
| Network actions | +0.14 ± 0.57 | -0.20 ± 0.40 | -0.09 ± 0.30 |
| Links built | -0.07 ± 0.62 | -0.34 ± 0.43 | -0.15 ± 0.32 |
| Sell actions | +0.13 ± 0.23 | **+0.49 ± 0.19** | **+0.37 ± 0.15** |
| Tiles sold | -0.27 ± 0.37 | -0.08 ± 0.33 | **-0.26 ± 0.24** |
| Loans | **-1.15 ± 0.39** | **-1.11 ± 0.26** | **-1.35 ± 0.19** |
| Scouts | +0.09 ± 0.14 | -0.01 ± 0.11 | +0.02 ± 0.07 |
| Passes | +0.25 ± 0.29 | -0.05 ± 0.22 | +0.03 ± 0.04 |
| Unflipped tiles at the end | +0.20 ± 0.44 | **+0.35 ± 0.29** | **+0.37 ± 0.20** |
| Shortfall sales | +0.09 ± 0.37 | **-0.22 ± 0.15** | **-0.11 ± 0.06** |
| VP lost to shortfalls | +0.17 ± 0.23 | -0.13 ± 0.18 | -0.03 ± 0.05 |

### normal@p4-state-n vs normal@p3-state: candidate seats minus baseline seats, per game

| Measure | 2 players (200 games) | 3 players (240 games) | 4 players (240 games) |
|---|---|---|---|
| Final VP | -3.04 ± 4.49 | +0.23 ± 2.93 | +0.14 ± 2.11 |
| Final income level | -0.48 ± 1.51 | +0.24 ± 1.06 | +0.35 ± 0.84 |
| Link VP (both eras) | -0.40 ± 2.60 | -0.84 ± 1.92 | -0.07 ± 1.54 |
| Industry VP (both eras) | -2.42 ± 3.61 | +1.02 ± 2.59 | +0.02 ± 1.85 |
| Builds | -0.15 ± 0.48 | +0.31 ± 0.35 | -0.23 ± 0.28 |
| Develop actions | +0.09 ± 0.23 | +0.03 ± 0.13 | **+0.21 ± 0.09** |
| Network actions | -0.05 ± 0.59 | -0.34 ± 0.40 | -0.11 ± 0.30 |
| Links built | -0.02 ± 0.61 | -0.34 ± 0.42 | -0.09 ± 0.31 |
| Sell actions | -0.17 ± 0.23 | +0.02 ± 0.18 | +0.11 ± 0.15 |
| Tiles sold | -0.39 ± 0.40 | -0.08 ± 0.29 | -0.04 ± 0.27 |
| Loans | +0.01 ± 0.39 | -0.24 ± 0.27 | -0.18 ± 0.21 |
| Scouts | **+0.19 ± 0.15** | **+0.23 ± 0.12** | **+0.24 ± 0.08** |
| Passes | +0.09 ± 0.29 | -0.01 ± 0.06 | -0.04 ± 0.08 |
| Unflipped tiles at the end | +0.09 ± 0.42 | +0.19 ± 0.29 | -0.08 ± 0.20 |
| Shortfall sales | +0.11 ± 0.35 | -0.04 ± 0.14 | **-0.10 ± 0.09** |
| VP lost to shortfalls | +0.03 ± 0.47 | -0.05 ± 0.10 | -0.04 ± 0.05 |


# 2. Validation (held-out seeds 800000 + 1000 × players + i)

2 players: 150 seeds, 3 and 4 players: 60 seeds.

| Candidate vs baseline | Players | Games | Win share | VP difference | Interval |
|---|---|---|---|---|---|
| normal@p4-state vs normal@p3-state | 2 | 300 | 52.7% ± 5.7 | +1.26 ± 3.93 | includes 0 |
| normal@p4-state vs normal@p3-state | 3 | 360 | 54.2% ± 5.2 | +2.04 ± 2.72 | includes 0 |
| normal@p4-state vs normal@p3-state | 4 | 360 | 55.0% ± 5.1 | +3.32 ± 1.84 | above 0 |
| normal@p4-state vs normal@p3-state | **pooled** | 1020 | 53.9% ± 3.1 | +2.21 ± 1.71 | **improves** |

## 2.1 Behaviour

### normal@p4-state vs normal@p3-state: candidate seats minus baseline seats, per game

| Measure | 2 players (300 games) | 3 players (360 games) | 4 players (360 games) |
|---|---|---|---|
| Final VP | +1.26 ± 3.93 | +2.04 ± 2.72 | **+3.32 ± 1.84** |
| Final income level | +0.74 ± 1.23 | **+1.12 ± 0.95** | **+0.78 ± 0.70** |
| Link VP (both eras) | +0.99 ± 2.08 | +0.56 ± 1.74 | **+1.30 ± 1.29** |
| Industry VP (both eras) | +0.30 ± 3.18 | +1.46 ± 2.24 | **+1.82 ± 1.52** |
| Builds | +0.05 ± 0.42 | -0.01 ± 0.32 | -0.11 ± 0.24 |
| Develop actions | -0.04 ± 0.20 | +0.07 ± 0.11 | **+0.11 ± 0.08** |
| Network actions | +0.04 ± 0.47 | -0.01 ± 0.33 | -0.01 ± 0.24 |
| Links built | +0.13 ± 0.49 | +0.06 ± 0.35 | +0.04 ± 0.25 |
| Sell actions | +0.15 ± 0.19 | +0.13 ± 0.14 | **+0.13 ± 0.12** |
| Tiles sold | +0.20 ± 0.31 | **+0.27 ± 0.27** | **+0.41 ± 0.22** |
| Loans | -0.27 ± 0.33 | **-0.35 ± 0.24** | **-0.26 ± 0.18** |
| Scouts | +0.11 ± 0.12 | **+0.11 ± 0.08** | **+0.15 ± 0.07** |
| Passes | -0.03 ± 0.34 | +0.05 ± 0.15 | +0.00 ± 0.05 |
| Unflipped tiles at the end | -0.01 ± 0.37 | -0.09 ± 0.25 | **-0.17 ± 0.16** |
| Shortfall sales | +0.11 ± 0.32 | +0.02 ± 0.14 | +0.03 ± 0.06 |
| VP lost to shortfalls | +0.00 ± 0.32 | +0.07 ± 0.16 | +0.04 ± 0.09 |


# 3. Mixed tables (held-out seeds, 40 seeds × every rotation; `ai-mixed.js`)

### Mixed tables: 3 players, 120 games (40 seeds × 3 rotations)

| Policy | Win share | Mean rank | VP relative to the table mean |
|---|---|---|---|
| normal@p4-state | 48.3% | 1.73 | +5.20 ± 2.70 |
| normal@p3-state | 33.3% | 1.98 | +0.61 ± 2.88 |
| normal@p2-state | 18.3% | 2.28 | -5.80 ± 2.67 |

### Mixed tables: 4 players, 160 games (40 seeds × 4 rotations)

| Policy | Win share | Mean rank | VP relative to the table mean |
|---|---|---|---|
| normal@p4-state | 41.3% | 1.86 | +12.68 ± 2.28 |
| normal@p3-state | 35.0% | 2.02 | +10.64 ± 2.53 |
| normal@p2-state | 23.1% | 2.40 | +2.27 ± 2.75 |
| normal | 0.6% | 3.71 | -25.59 ± 2.27 |


# 4. Self-play: the three-action planner in every seat (`ai-report.js`, 50 games per player count)

### Mirror games (every seat the same difficulty): per-player statistics

Means per player per game (± 95% CI where shown). 150 games.

#### Outcomes

| Players | Level | Games | Final VP | Winner VP | Income level | Money left | Loans |
|---|---|---|---|---|---|---|---|
| 2 | normal@p3-state | 50 | 98.5 ± 5.2 | 112.5 ± 5.2 | 7.9 ± 1.5 | 49.9 ± 8.0 | 6.5 |
| 3 | normal@p3-state | 50 | 100.4 ± 3.3 | 115.4 ± 4.2 | 8.7 ± 1.2 | 67.3 ± 7.7 | 5.9 |
| 4 | normal@p3-state | 50 | 96.5 ± 2.4 | 113.2 ± 3.2 | 9.3 ± 1.0 | 63.3 ± 6.3 | 4.9 |

#### Actions per player per game

| Players | Level | build | network | develop | sell | loan | scout | pass |
|---|---|---|---|---|---|---|---|---|
| 2 | normal@p3-state | 17.4 | 9.6 | 1.4 | 2.8 | 6.5 | 0.7 | 0.5 |
| 3 | normal@p3-state | 15.8 | 9.2 | 0.9 | 2.7 | 5.9 | 0.5 | 0.0 |
| 4 | normal@p3-state | 13.6 | 8.5 | 0.6 | 3.0 | 4.9 | 0.4 | 0.0 |

#### Tiles built per player (Canal + Rail)

| Players | Level | cottonMill | coalMine | ironWorks | manufacturer | pottery | brewery | Mean level | Overbuilt own tile (unflipped) |
|---|---|---|---|---|---|---|---|---|---|
| 2 | normal@p3-state | 1.1 + 0.9 | 3.5 + 2.5 | 1.7 + 1.5 | 0.6 + 1.1 | 0.2 + 0.5 | 1.6 + 2.0 | 2.21 | 0.48 (0.29) |
| 3 | normal@p3-state | 1.1 + 0.5 | 2.3 + 2.4 | 1.3 + 1.3 | 1.0 + 1.6 | 0.3 + 0.5 | 1.8 + 1.7 | 2.11 | 0.39 (0.21) |
| 4 | normal@p3-state | 1.3 + 0.6 | 1.4 + 2.2 | 0.9 + 1.2 | 1.0 + 1.2 | 0.4 + 0.6 | 1.4 + 1.5 | 1.98 | 0.24 (0.13) |

#### Selling and development

| Players | Level | Tiles sold | Merchant bonuses | Tiles developed | Unflipped sellable at Canal end | Unflipped sellable at game end | Unflipped (all) at game end |
|---|---|---|---|---|---|---|---|
| 2 | normal@p3-state | 4.1 | 2.2 | 2.9 | 0.09 | 0.28 | 4.52 |
| 3 | normal@p3-state | 4.5 | 2.4 | 1.8 | 0.21 | 0.21 | 3.11 |
| 4 | normal@p3-state | 4.7 | 2.6 | 1.3 | 0.26 | 0.17 | 2.13 |

#### VP sources per player

| Players | Level | Canal links | Canal tiles | Rail links | Rail tiles | Merchant VP bonuses | VP lost to shortfalls | Level I tiles removed at Canal end | Money at Canal end |
|---|---|---|---|---|---|---|---|---|---|
| 2 | normal@p3-state | 14.7 | 16.9 | 27.4 | 39.4 | 0.7 | 0.5 | 4.00 | 49.9 |
| 3 | normal@p3-state | 16.6 | 18.7 | 26.7 | 37.7 | 0.7 | 0.0 | 4.35 | 48.7 |
| 4 | normal@p3-state | 17.8 | 20.2 | 23.4 | 32.3 | 2.8 | 0.1 | 4.46 | 43.5 |

#### Resources and card use

| Players | Level | Coal from | Iron from | Brewery beer from | Passes while another action was legal | Non-build discards of a buildable card while holding a dead card | Shortfall tile sales (flipped) |
|---|---|---|---|---|---|---|---|
| 2 | normal@p3-state | own 40%, opponent 32%, market 28% | own 38%, opponent 34%, market 28% | own 88%, opponent 12% | 15 of 50 | 521 of 2091 (25%) | 0.75 (0.01) |
| 3 | normal@p3-state | own 27%, opponent 40%, market 33% | own 28%, opponent 43%, market 29% | own 89%, opponent 11% | 7 of 7 | 717 of 2807 (26%) | 0.41 (0.00) |
| 4 | normal@p3-state | own 21%, opponent 43%, market 36% | own 16%, opponent 38%, market 47% | own 76%, opponent 24% | 5 of 5 | 870 of 3400 (26%) | 0.17 (0.00) |

#### Turn-order position (mirror games)

Win share by position in the initial turn order (1 = first to act). With identical policies at every seat, an even split means no positional advantage.

| Players | Level | Position 1 | Position 2 | Position 3 | Position 4 |
|---|---|---|---|---|---|
| 2 | normal@p3-state | 50.0% [37–63] | 50.0% [37–63] |  |  |
| 3 | normal@p3-state | 36.0% [24–50] | 32.0% [21–46] | 32.0% [21–46] |  |
| 4 | normal@p3-state | 22.0% [13–35] | 24.0% [14–37] | 28.0% [17–42] | 26.0% [16–40] |


# 5. Node decision times (`ai-plan.js realise`, 8 games, seat 0 the planner, one run at a time)

### Plan realisation and cost: p3-state, 2 players, 8 games (seat 0 the planner, others production Normal)

- Planned follow-up in the same turn: played next 91 of 152 (60%)
- Planned follow-up in the next turn (after the opponents): still legal 131 of 144 (91%), played 49 of 144 (34%)
- Decision time: mean 65.7 ms, median 56.5, p95 151.9, max 203.5; per game 2.6 s for the planner's seat
- States evaluated per decision: mean 21.5, max 25
- By phase (mean / max ms): early 54.3 / 120.4; middle 54.6 / 167.0; late 85.8 / 203.5

### Plan realisation and cost: p3-state, 3 players, 8 games (seat 0 the planner, others production Normal)

- Planned follow-up in the same turn: played next 87 of 136 (64%)
- Planned follow-up in the next turn (after the opponents): still legal 118 of 128 (92%), played 36 of 128 (28%)
- Decision time: mean 78.6 ms, median 69.0, p95 173.0, max 260.2; per game 2.7 s for the planner's seat
- States evaluated per decision: mean 22.2, max 25
- By phase (mean / max ms): early 50.1 / 95.9; middle 62.5 / 157.0; late 116.5 / 260.2

### Plan realisation and cost: p3-state, 4 players, 8 games (seat 0 the planner, others production Normal)

- Planned follow-up in the same turn: played next 69 of 120 (58%)
- Planned follow-up in the next turn (after the opponents): still legal 104 of 112 (93%), played 37 of 112 (33%)
- Decision time: mean 82.6 ms, median 68.3, p95 197.4, max 275.4; per game 2.6 s for the planner's seat
- States evaluated per decision: mean 21.8, max 25
- By phase (mean / max ms): early 58.5 / 96.4; middle 65.6 / 202.0; late 123.5 / 275.4

### Plan realisation and cost: p4-state, 2 players, 8 games (seat 0 the planner, others production Normal)

- Planned follow-up in the same turn: played next 106 of 152 (70%)
- Planned follow-up in the next turn (after the opponents): still legal 131 of 144 (91%), played 51 of 144 (35%)
- Decision time: mean 190.7 ms, median 154.6, p95 438.7, max 682.8; per game 7.4 s for the planner's seat
- States evaluated per decision: mean 65.0, max 79
- By phase (mean / max ms): early 152.4 / 256.9; middle 143.9 / 433.0; late 270.1 / 682.8

### Plan realisation and cost: p4-state, 3 players, 8 games (seat 0 the planner, others production Normal)

- Planned follow-up in the same turn: played next 83 of 136 (61%)
- Planned follow-up in the next turn (after the opponents): still legal 116 of 128 (91%), played 45 of 128 (35%)
- Decision time: mean 193.6 ms, median 168.2, p95 453.7, max 632.4; per game 6.8 s for the planner's seat
- States evaluated per decision: mean 64.3, max 79
- By phase (mean / max ms): early 149.9 / 237.4; middle 157.6 / 397.1; late 267.1 / 632.4

### Plan realisation and cost: p4-state, 4 players, 8 games (seat 0 the planner, others production Normal)

- Planned follow-up in the same turn: played next 79 of 120 (66%)
- Planned follow-up in the next turn (after the opponents): still legal 103 of 112 (92%), played 39 of 112 (35%)
- Decision time: mean 226.9 ms, median 189.7, p95 548.6, max 752.7; per game 7.0 s for the planner's seat
- States evaluated per decision: mean 64.3, max 79
- By phase (mean / max ms): early 158.9 / 242.7; middle 193.8 / 659.3; late 320.9 / 752.7

# 6. Browser benchmarks (`ai-browser.js`, Chromium; every seat at Normal)

**browser-p3-desktop-2**

```
game 1: completed in 12 s; VP 70, 66; 78 AI decisions: mean 64 ms, p95 137, max 161; longest turn 285 ms; budget hit 0; first / last third of decisions: mean 48 / 95 ms; longest frame gap 217 ms; heap 2.8 → 5.0 MB; AI failures 0
SUMMARY 2 players, 1 games, production planner, CPU 1x: 78 decisions, mean 64 ms, median 54, p95 137, max 161; turns: median 97, p95 251, max 285 ms; budget hit 0; longest frame gap 217 ms; errors 0
```

**browser-p3-desktop-3**

```
game 1: completed in 15 s; VP 113, 97, 97; 105 AI decisions: mean 66 ms, p95 152, max 221; longest turn 404 ms; budget hit 0; first / last third of decisions: mean 39 / 109 ms; longest frame gap 250 ms; heap 2.8 → 5.0 MB; AI failures 0
SUMMARY 3 players, 1 games, production planner, CPU 1x: 105 decisions, mean 66 ms, median 47, p95 152, max 221; turns: median 90, p95 304, max 404 ms; budget hit 0; longest frame gap 250 ms; errors 0
```

**browser-p3-desktop-4**

```
game 1: completed in 17 s; VP 124, 116, 108, 53; 124 AI decisions: mean 60 ms, p95 116, max 132; longest turn 240 ms; budget hit 0; first / last third of decisions: mean 53 / 72 ms; longest frame gap 200 ms; heap 2.8 → 5.0 MB; AI failures 0
SUMMARY 4 players, 1 games, production planner, CPU 1x: 124 decisions, mean 60 ms, median 57, p95 116, max 132; turns: median 114, p95 206, max 240 ms; budget hit 0; longest frame gap 200 ms; errors 0
```

**browser-p3-mobile4x-2**

```
game 1: completed in 29 s; VP 75, 44; 78 AI decisions: mean 206 ms, p95 430, max 505; longest turn 910 ms; budget hit 0; first / last third of decisions: mean 253 / 187 ms; longest frame gap 850 ms; heap 2.8 → 5.0 MB; AI failures 0
SUMMARY 2 players, 1 games, production planner, CPU 4x, mobile viewport: 78 decisions, mean 206 ms, median 217, p95 430, max 505; turns: median 433, p95 862, max 910 ms; budget hit 0; longest frame gap 850 ms; errors 0
```

**browser-p3-mobile4x-4**

```
game 1: completed in 64 s; VP 113, 90, 71, 46; 124 AI decisions: mean 342 ms, p95 718, max 898; longest turn 1750 ms; budget hit 0; first / last third of decisions: mean 241 / 472 ms; longest frame gap 1083 ms; heap 2.9 → 5.1 MB; AI failures 0
SUMMARY 4 players, 1 games, production planner, CPU 4x, mobile viewport: 124 decisions, mean 342 ms, median 328, p95 718, max 898; turns: median 623, p95 1372, max 1750 ms; budget hit 0; longest frame gap 1083 ms; errors 0
```

**browser-p4-desktop-2**

```
game 1: completed in 22 s; VP 126, 102; 78 AI decisions: mean 194 ms, p95 443, max 465; longest turn 888 ms; budget hit 0; first / last third of decisions: mean 146 / 289 ms; longest frame gap 467 ms; heap 2.8 → 5.1 MB; AI failures 0
SUMMARY 2 players, 1 games, depth 4 widths 6,3,3, CPU 1x: 78 decisions, mean 194 ms, median 169, p95 443, max 465; turns: median 327, p95 869, max 888 ms; budget hit 0; longest frame gap 467 ms; errors 0
```

**browser-p4-desktop-3**

```
game 1: completed in 27 s; VP 100, 86, 70; 105 AI decisions: mean 175 ms, p95 421, max 480; longest turn 857 ms; budget hit 0; first / last third of decisions: mean 119 / 248 ms; longest frame gap 500 ms; heap 2.8 → 5.2 MB; AI failures 0
SUMMARY 3 players, 1 games, depth 4 widths 6,3,3, CPU 1x: 105 decisions, mean 175 ms, median 141, p95 421, max 480; turns: median 242, p95 804, max 857 ms; budget hit 0; longest frame gap 500 ms; errors 0
```

**browser-p4-desktop-4**

```
game 1: completed in 27 s; VP 92, 88, 76, 9; 124 AI decisions: mean 140 ms, p95 297, max 436; longest turn 785 ms; budget hit 0; first / last third of decisions: mean 133 / 165 ms; longest frame gap 450 ms; heap 2.8 → 5.2 MB; AI failures 0
SUMMARY 4 players, 1 games, depth 4 widths 6,3,3, CPU 1x: 124 decisions, mean 140 ms, median 137, p95 297, max 436; turns: median 264, p95 584, max 785 ms; budget hit 0; longest frame gap 450 ms; errors 0
```

**browser-p4-mobile4x-2**

```
game 1: completed in 77 s; VP 109, 91; 78 AI decisions: mean 832 ms, p95 1659, max 1781; longest turn 3440 ms; budget hit 0; first / last third of decisions: mean 601 / 1118 ms; longest frame gap 1917 ms; heap 2.8 → 5.1 MB; AI failures 0
SUMMARY 2 players, 1 games, depth 4 widths 6,3,3, CPU 4x, mobile viewport: 78 decisions, mean 832 ms, median 849, p95 1659, max 1781; turns: median 1703, p95 3338, max 3440 ms; budget hit 0; longest frame gap 1917 ms; errors 0
```

**browser-p4-mobile4x-3**

```
game 1: completed in 107 s; VP 143, 98, 83; 105 AI decisions: mean 846 ms, p95 1725, max 2266; longest turn 3950 ms; budget hit 0; first / last third of decisions: mean 562 / 1222 ms; longest frame gap 2433 ms; heap 2.8 → 5.3 MB; AI failures 0
SUMMARY 3 players, 1 games, depth 4 widths 6,3,3, CPU 4x, mobile viewport: 105 decisions, mean 846 ms, median 791, p95 1725, max 2266; turns: median 1260, p95 3306, max 3950 ms; budget hit 0; longest frame gap 2433 ms; errors 0
```

**browser-p4-mobile4x-4**

```
game 1: completed in 136 s; VP 112, 89, 87, 65; 124 AI decisions: mean 926 ms, p95 1976, max 2519; longest turn 4809 ms; budget hit 2; first / last third of decisions: mean 701 / 1211 ms; longest frame gap 2700 ms; heap 2.9 → 5.3 MB; AI failures 0
SUMMARY 4 players, 1 games, depth 4 widths 6,3,3, CPU 4x, mobile viewport: 124 decisions, mean 926 ms, median 832, p95 1976, max 2519; turns: median 1585, p95 3298, max 4809 ms; budget hit 2; longest frame gap 2700 ms; errors 0
```

**browser-prod-desktop-3**

```
game 1: completed in 30 s; VP 142, 108, 108; 105 AI decisions: mean 201 ms, p95 461, max 633; longest turn 1121 ms; budget hit 0; first / last third of decisions: mean 150 / 294 ms; longest frame gap 650 ms; heap 2.8 → 5.2 MB; AI failures 0
SUMMARY 3 players, 1 games, production planner, CPU 1x: 105 decisions, mean 201 ms, median 172, p95 461, max 633; turns: median 323, p95 884, max 1121 ms; budget hit 0; longest frame gap 650 ms; errors 0
```

