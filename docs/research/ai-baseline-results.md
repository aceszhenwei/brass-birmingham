# AI Baseline Results (Assignment 5)

Generated output of the research scripts, used by [the audit report](ai-baseline-audit.md). Every number can be regenerated with the commands in the report's [Reproducing the experiments](ai-baseline-audit.md#reproducing-the-experiments) section; the raw per-game data is not committed.

In these tables `easy`, `normal` and `hard` are the AI as it was in Assignment 5, preserved since Assignment 6 as the `-a5` baseline. Its Hard reads opponents' hands.

Contents: 1 experiments (pairwise matchups, three-way games, mirror-game statistics), 2 legality and fairness probe, 3 decision probes.

# 1. Experiments

`ai-baseline.js matchups|threeway|mirror`, summarised by `ai-report.js`. Game seeds 200000 + 1000 × players + i.

## 1.1 Pairwise matchups (seats balanced)

A win share: the share of games won by a seat playing A (ties split); 50% means equal strength.
VP difference: per game, the mean final VP of the A seats minus that of the B seats.

| Players | A vs B | Games | A win share [95% CI] | VP difference A − B | Mean VP A | Mean VP B |
|---|---|---|---|---|---|---|
| 2 | easy vs normal | 200 | 40.8% [34–48] | -9.9 ± 4.6 | 29.3 | 39.2 |
| 3 | easy vs normal | 240 | 42.9% [37–49] | -3.0 ± 3.5 | 37.5 | 40.5 |
| 4 | easy vs normal | 240 | 40.0% [34–46] | -4.0 ± 2.6 | 39.1 | 43.2 |
| 2 | normal vs hard | 200 | 50.3% [43–57] | -1.3 ± 5.4 | 38.8 | 40.1 |
| 3 | normal vs hard | 240 | 43.8% [38–50] | -4.8 ± 3.7 | 38.3 | 43.1 |
| 4 | normal vs hard | 240 | 42.5% [36–49] | -5.5 ± 3.0 | 42.4 | 47.8 |
| 2 | easy vs hard | 200 | 37.0% [31–44] | -8.0 ± 4.9 | 32.9 | 40.8 |
| 3 | easy vs hard | 240 | 46.3% [40–53] | -4.2 ± 3.8 | 36.5 | 40.7 |
| 4 | easy vs hard | 240 | 35.4% [30–42] | -6.7 ± 2.6 | 39.4 | 46.1 |
| 2 | hard-blind vs hard | 200 | 48.5% [42–55] | -1.0 ± 5.4 | 40.0 | 41.0 |
| 3 | hard-blind vs hard | 240 | 50.0% [44–56] | -3.0 ± 3.9 | 39.6 | 42.6 |
| 4 | hard-blind vs hard | 240 | 45.4% [39–52] | -3.5 ± 2.8 | 42.6 | 46.1 |
| 2 | hard-fair vs hard | 200 | 46.8% [40–54] | -2.1 ± 5.2 | 42.8 | 45.0 |
| 3 | hard-fair vs hard | 240 | 48.1% [42–54] | -3.8 ± 3.9 | 36.4 | 40.2 |
| 4 | hard-fair vs hard | 240 | 49.6% [43–56] | -1.5 ± 2.7 | 39.7 | 41.2 |
| 2 | hard-blind vs normal | 200 | 50.5% [44–57] | 1.8 ± 5.6 | 40.4 | 38.7 |
| 3 | hard-blind vs normal | 240 | 53.8% [47–60] | -0.0 ± 3.7 | 44.2 | 44.2 |
| 4 | hard-blind vs normal | 240 | 47.5% [41–54] | -0.6 ± 3.0 | 43.7 | 44.3 |
| 2 | random vs easy | 20 | 10.0% [3–30] | -28.5 ± 10.2 | 6.8 | 35.4 |
| 3 | random vs easy | 60 | 17.5% [10–29] | -23.7 ± 4.8 | 2.9 | 26.6 |
| 4 | random vs easy | 60 | 0.0% [0–6] | -36.4 ± 3.2 | 6.0 | 42.4 |

## 1.2 Three-way games (3 players, one of each difficulty, all six seatings; 300 games)

| Difficulty | Win share [95% CI] | Mean VP | Mean rank |
|---|---|---|---|
| easy | 27.7% [23–33] | 35.8 ± 2.7 | 2.08 |
| normal | 28.3% [24–34] | 37.8 ± 2.8 | 2.09 |
| hard | 44.0% [38–50] | 43.3 ± 2.8 | 1.80 |

## 1.3 Mirror games (every seat the same difficulty): per-player statistics

Means per player per game (± 95% CI where shown). 900 games.

### Outcomes

| Players | Level | Games | Final VP | Winner VP | Income level | Money left | Loans |
|---|---|---|---|---|---|---|---|
| 2 | easy | 100 | 35.3 ± 3.6 | 49.5 ± 4.2 | -4.4 ± 0.8 | 9.4 ± 1.8 | 5.7 |
| 2 | normal | 100 | 41.0 ± 3.8 | 57.5 ± 4.1 | -4.1 ± 0.8 | 10.0 ± 1.7 | 6.0 |
| 2 | hard | 100 | 41.9 ± 3.9 | 56.9 ± 4.4 | -4.2 ± 0.9 | 10.3 ± 1.7 | 6.0 |
| 3 | easy | 100 | 33.7 ± 2.7 | 55.5 ± 2.7 | -3.2 ± 0.8 | 12.3 ± 1.7 | 4.9 |
| 3 | normal | 100 | 42.3 ± 2.9 | 63.6 ± 3.2 | -2.5 ± 0.8 | 12.3 ± 1.5 | 5.3 |
| 3 | hard | 100 | 37.0 ± 2.9 | 58.5 ± 3.1 | -3.6 ± 0.7 | 10.0 ± 1.4 | 5.4 |
| 4 | easy | 100 | 36.3 ± 2.1 | 57.9 ± 2.4 | -1.6 ± 0.6 | 15.8 ± 1.6 | 4.4 |
| 4 | normal | 100 | 43.7 ± 2.2 | 64.1 ± 2.4 | -0.7 ± 0.6 | 14.9 ± 1.3 | 4.8 |
| 4 | hard | 100 | 40.8 ± 2.2 | 62.3 ± 2.4 | -1.2 ± 0.7 | 12.7 ± 1.3 | 4.8 |

### Actions per player per game

| Players | Level | build | network | develop | sell | loan | scout | pass |
|---|---|---|---|---|---|---|---|---|
| 2 | easy | 9.8 | 6.8 | 7.4 | 1.3 | 5.7 | 1.5 | 6.5 |
| 2 | normal | 11.5 | 7.3 | 7.3 | 1.7 | 6.0 | 0.8 | 4.4 |
| 2 | hard | 12.1 | 7.1 | 6.7 | 1.8 | 6.0 | 0.8 | 4.5 |
| 3 | easy | 9.0 | 6.5 | 7.0 | 1.3 | 4.9 | 1.1 | 5.4 |
| 3 | normal | 10.6 | 7.0 | 6.7 | 1.7 | 5.3 | 0.4 | 3.3 |
| 3 | hard | 11.2 | 6.4 | 6.0 | 1.6 | 5.4 | 0.3 | 4.1 |
| 4 | easy | 8.2 | 5.8 | 7.0 | 1.3 | 4.4 | 1.0 | 3.4 |
| 4 | normal | 9.5 | 6.5 | 6.5 | 1.7 | 4.8 | 0.2 | 1.8 |
| 4 | hard | 10.7 | 5.8 | 5.6 | 1.8 | 4.8 | 0.1 | 2.2 |

### Tiles built per player (Canal + Rail)

| Players | Level | cottonMill | coalMine | ironWorks | manufacturer | pottery | brewery | Mean level | Overbuilt own tile (unflipped) |
|---|---|---|---|---|---|---|---|---|---|
| 2 | easy | 0.7 + 0.5 | 1.3 + 1.8 | 2.0 + 0.3 | 0.1 + 0.3 | 0.8 + 0.5 | 0.5 + 0.9 | 2.34 | 2.10 (0.96) |
| 2 | normal | 0.7 + 0.7 | 1.5 + 2.3 | 2.1 + 0.4 | 0.2 + 0.4 | 0.7 + 0.7 | 0.6 + 1.2 | 2.45 | 2.65 (1.28) |
| 2 | hard | 0.7 + 0.8 | 1.8 + 2.2 | 2.1 + 0.4 | 0.2 + 0.5 | 0.7 + 0.7 | 0.7 + 1.4 | 2.47 | 2.73 (1.46) |
| 3 | easy | 0.5 + 0.3 | 0.9 + 1.9 | 1.6 + 0.5 | 0.3 + 0.4 | 0.6 + 0.6 | 0.3 + 0.9 | 2.28 | 1.72 (0.63) |
| 3 | normal | 0.6 + 0.5 | 1.3 + 2.3 | 1.6 + 0.6 | 0.4 + 0.4 | 0.6 + 0.7 | 0.5 + 1.2 | 2.36 | 1.79 (0.83) |
| 3 | hard | 0.9 + 0.4 | 1.4 + 2.5 | 1.5 + 0.7 | 0.3 + 0.5 | 0.7 + 0.6 | 0.5 + 1.2 | 2.32 | 2.12 (1.02) |
| 4 | easy | 0.5 + 0.3 | 0.8 + 1.6 | 1.4 + 0.7 | 0.2 + 0.2 | 0.4 + 0.7 | 0.3 + 1.0 | 2.26 | 1.44 (0.52) |
| 4 | normal | 0.5 + 0.5 | 0.9 + 2.2 | 1.3 + 0.7 | 0.3 + 0.3 | 0.5 + 0.8 | 0.4 + 1.2 | 2.31 | 1.57 (0.65) |
| 4 | hard | 0.9 + 0.5 | 1.1 + 2.4 | 1.3 + 0.7 | 0.2 + 0.4 | 0.5 + 0.7 | 0.4 + 1.4 | 2.25 | 1.95 (0.90) |

### Selling and development

| Players | Level | Tiles sold | Merchant bonuses | Tiles developed | Unflipped sellable at Canal end | Unflipped sellable at game end | Unflipped (all) at game end |
|---|---|---|---|---|---|---|---|
| 2 | easy | 1.3 | 1.1 | 13.8 | 0.59 | 0.36 | 1.69 |
| 2 | normal | 1.8 | 1.4 | 13.7 | 0.56 | 0.49 | 2.21 |
| 2 | hard | 1.8 | 1.4 | 12.8 | 0.55 | 0.52 | 2.31 |
| 3 | easy | 1.3 | 1.1 | 12.9 | 0.40 | 0.47 | 1.93 |
| 3 | normal | 1.7 | 1.4 | 12.6 | 0.42 | 0.48 | 2.43 |
| 3 | hard | 1.7 | 1.3 | 11.4 | 0.64 | 0.49 | 2.61 |
| 4 | easy | 1.3 | 1.2 | 13.0 | 0.24 | 0.42 | 1.94 |
| 4 | normal | 1.7 | 1.5 | 12.2 | 0.31 | 0.47 | 2.48 |
| 4 | hard | 1.8 | 1.5 | 10.5 | 0.50 | 0.52 | 2.89 |

### VP sources per player

| Players | Level | Canal links | Canal tiles | Rail links | Rail tiles | Merchant VP bonuses | VP lost to shortfalls | Level I tiles removed at Canal end | Money at Canal end |
|---|---|---|---|---|---|---|---|---|---|
| 2 | easy | 8.1 | 10.9 | 7.2 | 12.3 | 0.2 | 3.3 | 1.23 | 18.0 |
| 2 | normal | 9.2 | 12.4 | 8.0 | 15.1 | 0.2 | 3.9 | 1.22 | 18.3 |
| 2 | hard | 9.1 | 12.9 | 8.3 | 15.1 | 0.3 | 3.8 | 1.20 | 16.1 |
| 3 | easy | 7.8 | 9.4 | 7.1 | 11.7 | 0.2 | 2.4 | 1.00 | 19.5 |
| 3 | normal | 9.1 | 11.3 | 8.7 | 15.4 | 0.2 | 2.5 | 1.07 | 16.3 |
| 3 | hard | 8.2 | 10.3 | 7.5 | 13.9 | 0.1 | 3.0 | 1.16 | 16.5 |
| 4 | easy | 7.5 | 9.5 | 7.1 | 13.1 | 0.9 | 1.8 | 0.97 | 20.3 |
| 4 | normal | 8.3 | 10.4 | 9.3 | 16.1 | 1.1 | 1.6 | 0.97 | 17.7 |
| 4 | hard | 7.9 | 10.0 | 8.4 | 15.0 | 1.3 | 1.7 | 1.14 | 17.4 |

### Resources and card use

| Players | Level | Coal from | Iron from | Brewery beer from | Passes while another action was legal | Non-build discards of a buildable card while holding a dead card | Shortfall tile sales (flipped) |
|---|---|---|---|---|---|---|---|
| 2 | easy | own 28%, opponent 14%, market 58% | own 6%, opponent 9%, market 85% | own 87%, opponent 13% | 233 of 1310 | 1051 of 5537 (19%) | 2.62 (0.45) |
| 2 | normal | own 31%, opponent 15%, market 54% | own 7%, opponent 10%, market 83% | own 98%, opponent 3% | 2 of 881 | 876 of 5328 (16%) | 2.81 (0.43) |
| 2 | hard | own 31%, opponent 16%, market 53% | own 9%, opponent 11%, market 80% | own 94%, opponent 6% | 0 of 909 | 722 of 5223 (14%) | 3.13 (0.51) |
| 3 | easy | own 24%, opponent 22%, market 54% | own 2%, opponent 8%, market 90% | own 85%, opponent 15% | 342 of 1613 | 1564 of 7474 (21%) | 2.03 (0.26) |
| 3 | normal | own 28%, opponent 22%, market 50% | own 2%, opponent 6%, market 92% | own 91%, opponent 9% | 5 of 1001 | 1308 of 7210 (18%) | 2.25 (0.27) |
| 3 | hard | own 27%, opponent 25%, market 48% | own 3%, opponent 8%, market 89% | own 93%, opponent 7% | 1 of 1226 | 1140 of 7036 (16%) | 2.69 (0.35) |
| 4 | easy | own 22%, opponent 25%, market 53% | own 2%, opponent 7%, market 91% | own 85%, opponent 15% | 420 of 1345 | 2104 of 8716 (24%) | 1.28 (0.13) |
| 4 | normal | own 23%, opponent 27%, market 50% | own 1%, opponent 5%, market 94% | own 63%, opponent 38% | 3 of 704 | 1720 of 8513 (20%) | 1.28 (0.18) |
| 4 | hard | own 24%, opponent 30%, market 46% | own 2%, opponent 7%, market 91% | own 86%, opponent 14% | 4 of 893 | 1471 of 8063 (18%) | 1.73 (0.15) |

### Turn-order position (mirror games)

Win share by position in the initial turn order (1 = first to act). With identical policies at every seat, an even split means no positional advantage.

| Players | Level | Position 1 | Position 2 | Position 3 | Position 4 |
|---|---|---|---|---|---|
| 2 | easy | 57.0% [47–66] | 43.0% [34–53] |  |  |
| 2 | normal | 50.5% [41–60] | 49.5% [40–59] |  |  |
| 2 | hard | 53.0% [43–62] | 47.0% [38–57] |  |  |
| 3 | easy | 36.0% [27–46] | 30.0% [22–40] | 34.0% [25–44] |  |
| 3 | normal | 31.0% [23–41] | 37.0% [28–47] | 32.0% [24–42] |  |
| 3 | hard | 34.3% [26–44] | 37.3% [28–47] | 28.3% [20–38] |  |
| 4 | easy | 25.0% [18–34] | 31.0% [23–41] | 25.0% [18–34] | 19.0% [13–28] |
| 4 | normal | 22.0% [15–31] | 29.0% [21–39] | 25.0% [18–34] | 24.0% [17–33] |
| 4 | hard | 28.0% [20–37] | 32.0% [24–42] | 16.0% [10–24] | 24.0% [17–33] |

# 2. Legality and fairness probe

`ai-audit.js --games 10`: 10 all-AI games per difficulty and player count (seeds 1000 × players + 1…10). Every column counts AI turn decisions.

| Players | Difficulty | Decisions | Illegal | State changed | Changes with resampled opponent hands | Changes with reshuffled deck | Moves leaving a choice to the engine | Rail networks with a double link legal |
|---|---|---|---|---|---|---|---|---|
| 2 | easy | 780 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 29 (3.7%) (iron 10, freeDevelop 5, merchant 8, coal 5, beer 1) | 17 of 56 |
| 2 | normal | 780 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 26 (3.3%) (iron 4, merchant 13, coal 5, freeDevelop 3, beer 1) | 10 of 71 |
| 2 | hard | 780 | 0 | 0 | 16 (2.1%) | 0 (0.0%) | 26 (3.3%) (iron 7, merchant 13, freeDevelop 3, beer 1, coal 2) | 10 of 51 |
| 3 | easy | 1050 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 55 (5.2%) (merchant 15, iron 11, coal 21, freeDevelop 6, beer 2) | 42 of 98 |
| 3 | normal | 1050 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 42 (4.0%) (merchant 9, freeDevelop 12, coal 7, beer 3, iron 11) | 31 of 98 |
| 3 | hard | 1050 | 0 | 0 | 28 (2.7%) | 0 (0.0%) | 44 (4.2%) (merchant 21, freeDevelop 9, coal 11, iron 2, beer 1) | 18 of 83 |
| 4 | easy | 1240 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 47 (3.8%) (merchant 15, freeDevelop 7, coal 15, iron 10) | 42 of 121 |
| 4 | normal | 1240 | 0 | 0 | 0 (0.0%) | 0 (0.0%) | 44 (3.5%) (freeDevelop 6, merchant 22, coal 11, iron 3, beer 2) | 43 of 129 |
| 4 | hard | 1240 | 0 | 0 | 41 (3.3%) | 0 (0.0%) | 63 (5.1%) (freeDevelop 6, merchant 24, coal 20, beer 8, iron 5) | 32 of 112 |

Examples of decisions that depend on opponents' hands:
  2p hard: {"seed":2001,"players":2,"era":"canal","round":2,"player":0,"real":{"type":"develop","card":0,"industries":["brewery","cottonMill"]},"withSampledHands":{"type":"build","card":4,"location":"burtonOnTrent","slot":0,"industry":"coalMine"}}
  2p hard: {"seed":2001,"players":2,"era":"canal","round":2,"player":0,"real":{"type":"develop","card":0,"industries":["cottonMill","ironWorks"]},"withSampledHands":{"type":"build","card":3,"location":"burtonOnTrent","slot":0,"industry":"coalMine"}}
  3p hard: {"seed":3001,"players":3,"era":"canal","round":5,"player":1,"real":{"type":"develop","card":0,"industries":["brewery","cottonMill"]},"withSampledHands":{"type":"build","card":6,"location":"redditch","slot":1,"industry":"ironWorks"}}
  3p hard: {"seed":3001,"players":3,"era":"canal","round":5,"player":1,"real":{"type":"build","card":5,"location":"redditch","slot":1,"industry":"ironWorks"},"withSampledHands":{"type":"develop","card":0,"industries":["brewery","cottonMill"]}}
  4p hard: {"seed":4001,"players":4,"era":"canal","round":1,"player":0,"real":{"type":"network","card":0,"links":["birmingham-oxford"]},"withSampledHands":{"type":"build","card":6,"location":"derby","slot":0,"industry":"cottonMill"}}
  4p hard: {"seed":4001,"players":4,"era":"canal","round":3,"player":0,"real":{"type":"build","card":4,"location":"coventry","slot":2,"industry":"ironWorks"},"withSampledHands":{"type":"network","card":0,"links":["redditch-oxford"]}}

# 3. Decision probes

`ai-probes.js --players N --seeds 100`: the mirror-game seeds of section 1.3.

## 3.1 2 players, 100 mirror games per difficulty (seeds 202001…)


### easy
- Loans: 1132; with no Build or Network affordable: 907 of 1132 (80%); in the last two Rail rounds: 99 of 1132 (9%); followed by an income shortfall in the same era: 540 of 1132 (48%)
- Sell legal at 318 of 7800 (4%) of turn actions; not chosen: 56 of 318 (18%); chose Pass or Loan instead: 28 of 318 (9%)
- Tiles developed: 2765; industry never built afterwards: 1283 of 2765 (46%)
- Money spent per player per game: £191: Build 61%, Network 16%, Develop 23%; loans raised £170
- Overbuilt own unflipped tiles: 193 (£2293 spent on them), destroying 356 resource cubes

### normal
- Loans: 1194; with no Build or Network affordable: 1133 of 1194 (95%); in the last two Rail rounds: 111 of 1194 (9%); followed by an income shortfall in the same era: 575 of 1194 (48%)
- Sell legal at 366 of 7800 (5%) of turn actions; not chosen: 18 of 366 (5%); chose Pass or Loan instead: 6 of 366 (2%)
- Tiles developed: 2737; industry never built afterwards: 1195 of 2737 (44%)
- Money spent per player per game: £211: Build 67%, Network 15%, Develop 18%; loans raised £179
- Overbuilt own unflipped tiles: 257 (£3315 spent on them), destroying 503 resource cubes

### hard
- Loans: 1203; with no Build or Network affordable: 1153 of 1203 (96%); in the last two Rail rounds: 122 of 1203 (10%); followed by an income shortfall in the same era: 617 of 1203 (51%)
- Sell legal at 375 of 7800 (5%) of turn actions; not chosen: 21 of 375 (6%); chose Pass or Loan instead: 6 of 375 (2%)
- Tiles developed: 2551; industry never built afterwards: 1132 of 2551 (44%)
- Money spent per player per game: £210: Build 70%, Network 15%, Develop 15%; loans raised £180
- Overbuilt own unflipped tiles: 292 (£3728 spent on them), destroying 563 resource cubes

## 3.2 3 players, 100 mirror games per difficulty (seeds 203001…)


### easy
- Loans: 1462; with no Build or Network affordable: 1098 of 1462 (75%); in the last two Rail rounds: 144 of 1462 (10%); followed by an income shortfall in the same era: 643 of 1462 (44%)
- Sell legal at 532 of 10500 (5%) of turn actions; not chosen: 156 of 532 (29%); chose Pass or Loan instead: 57 of 532 (11%)
- Tiles developed: 3882; industry never built afterwards: 1992 of 3882 (51%)
- Money spent per player per game: £179: Build 59%, Network 16%, Develop 25%; loans raised £146
- Overbuilt own unflipped tiles: 188 (£2409 spent on them), destroying 347 resource cubes

### normal
- Loans: 1583; with no Build or Network affordable: 1456 of 1583 (92%); in the last two Rail rounds: 175 of 1583 (11%); followed by an income shortfall in the same era: 683 of 1583 (43%)
- Sell legal at 557 of 10500 (5%) of turn actions; not chosen: 53 of 557 (10%); chose Pass or Loan instead: 22 of 557 (4%)
- Tiles developed: 3793; industry never built afterwards: 1765 of 3793 (47%)
- Money spent per player per game: £203: Build 63%, Network 15%, Develop 22%; loans raised £158
- Overbuilt own unflipped tiles: 249 (£3353 spent on them), destroying 478 resource cubes

### hard
- Loans: 1610; with no Build or Network affordable: 1530 of 1610 (95%); in the last two Rail rounds: 163 of 1610 (10%); followed by an income shortfall in the same era: 808 of 1610 (50%)
- Sell legal at 551 of 10500 (5%) of turn actions; not chosen: 66 of 551 (12%); chose Pass or Loan instead: 17 of 551 (3%)
- Tiles developed: 3426; industry never built afterwards: 1652 of 3426 (48%)
- Money spent per player per game: £196: Build 67%, Network 14%, Develop 19%; loans raised £161
- Overbuilt own unflipped tiles: 306 (£3696 spent on them), destroying 568 resource cubes

## 3.3 4 players, 100 mirror games per difficulty (seeds 204001…)


### easy
- Loans: 1764; with no Build or Network affordable: 1303 of 1764 (74%); in the last two Rail rounds: 217 of 1764 (12%); followed by an income shortfall in the same era: 584 of 1764 (33%)
- Sell legal at 687 of 12400 (6%) of turn actions; not chosen: 171 of 687 (25%); chose Pass or Loan instead: 59 of 687 (9%)
- Tiles developed: 5207; industry never built afterwards: 2764 of 5207 (53%)
- Money spent per player per game: £169: Build 56%, Network 16%, Develop 28%; loans raised £132
- Overbuilt own unflipped tiles: 207 (£2485 spent on them), destroying 382 resource cubes

### normal
- Loans: 1932; with no Build or Network affordable: 1768 of 1932 (92%); in the last two Rail rounds: 262 of 1932 (14%); followed by an income shortfall in the same era: 578 of 1932 (30%)
- Sell legal at 778 of 12400 (6%) of turn actions; not chosen: 94 of 778 (12%); chose Pass or Loan instead: 31 of 778 (4%)
- Tiles developed: 4868; industry never built afterwards: 2331 of 4868 (48%)
- Money spent per player per game: £189: Build 60%, Network 15%, Develop 25%; loans raised £145
- Overbuilt own unflipped tiles: 261 (£3279 spent on them), destroying 470 resource cubes

### hard
- Loans: 1905; with no Build or Network affordable: 1781 of 1905 (93%); in the last two Rail rounds: 242 of 1905 (13%); followed by an income shortfall in the same era: 673 of 1905 (35%)
- Sell legal at 775 of 12400 (6%) of turn actions; not chosen: 70 of 775 (9%); chose Pass or Loan instead: 22 of 775 (3%)
- Tiles developed: 4217; industry never built afterwards: 1979 of 4217 (47%)
- Money spent per player per game: £185: Build 66%, Network 14%, Develop 20%; loans raised £143
- Overbuilt own unflipped tiles: 360 (£4078 spent on them), destroying 676 resource cubes
