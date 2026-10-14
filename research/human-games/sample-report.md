# Human Playtesting Report

## Games analysed

0 valid human-versus-AI games; 2 synthetic samples, 0 AI-only games and 0 human-only games excluded from human aggregates.
0 invalid/duplicate files. All discovered JSON files validated.

Small samples describe these games only; they do not establish reliable win rates or superior strategies.

## Overall findings

Human wins: 0; AI wins: 0 (shared wins count for both).
Mean final VP per seat: human —; AI —.

No genuine human playtests yet. Synthetic results below demonstrate the tooling, not AI strength.

| Game | Source | Players | Policy | Results (VP) | Human mean − AI mean |
|---|---|---:|---|---|---:|
| synthetic-2p-1701 | synthetic | 2 | sha256:bda2361cdcae2e292ee9c49d7db0aea85ac87b0d3108d80929a220ec07ec6065 | Scripted seat (human): 113; AI Bob (AI easy): 84 | 29.0 |
| synthetic-3p-1702 | synthetic | 3 | sha256:bda2361cdcae2e292ee9c49d7db0aea85ac87b0d3108d80929a220ec07ec6065 | Scripted seat (human): 74; AI Bob (AI easy): 93; AI Carol (AI easy): 70 | -7.5 |

### Human results by player count and AI policy/difficulty

| Players / policy / difficulty | Games | AI seats | Mean AI VP | Mean human VP in those games |
|---|---:|---:|---:|---:|

## Human versus AI differences

| Group (genuine games only) | Canal industry / links | Rail industry / links | Builds | Develop / Sell / Loan actions | Final income / cash |
|---|---|---|---:|---|---|
| Human | — / — | — / — | — | — / — / — | — / — |
| AI | — / — | — / — | — | — / — / — | — / — |

Other VP is the exact non-era-score change (merchant bonuses or shortfall penalties). Industry/link totals alone can therefore differ from final VP.

### Per-game behaviour (samples explicitly labelled)

### synthetic-2p-1701 (synthetic)

| Player | Canal industry / links / other / total | Rail industry / links / other / total | Final VP / income / cash |
|---|---|---|---|
| Scripted seat | 17 / 9 / 0 / 26 | 49 / 34 / 4 / 87 | 113 / 9 / £6 |
| AI Bob | 22 / 18 / 0 / 40 | 27 / 17 / 0 / 44 | 84 / 4 / £54 |

| Player | Industry builds (type: levels) | Era | Actions | Flipped / unflipped tiles | Links / VP |
|---|---|---|---|---|---|
| Scripted seat (human) | cottonMill: 1; ironWorks: 2,3; brewery: 2 | canal | network: 3; develop: 6; pass: 1; scout: 1; loan: 3; build: 4; sell: 1 | 3 / 1 | 3 / 9 |
| Scripted seat (human) | coalMine: 3,4; pottery: 1; brewery: 4; manufacturer: 2; cottonMill: 2,2 | rail | network: 6; build: 7; develop: 1; loan: 2; sell: 3; scout: 1 | 9 / 1 | 7 / 34 |
| AI Bob (easy) | coalMine: 2; ironWorks: 1,2,3; cottonMill: 1 | canal | network: 7; develop: 4; loan: 1; build: 5; scout: 1; sell: 1 | 5 / 0 | 7 / 18 |
| AI Bob (easy) | coalMine: 2,3,3,4; manufacturer: 2,2; cottonMill: 2; brewery: 3 | rail | loan: 4; build: 8; network: 4; develop: 1; pass: 1; scout: 1; sell: 1 | 6 / 5 | 4 / 17 |
### synthetic-3p-1702 (synthetic)

| Player | Canal industry / links / other / total | Rail industry / links / other / total | Final VP / income / cash |
|---|---|---|---|
| Scripted seat | 19 / 8 / 0 / 27 | 34 / 13 / 0 / 47 | 74 / 0 / £5 |
| AI Bob | 26 / 12 / 0 / 38 | 34 / 21 / 0 / 55 | 93 / -4 / £34 |
| AI Carol | 16 / 16 / 0 / 32 | 19 / 19 / 0 / 38 | 70 / 5 / £48 |

| Player | Industry builds (type: levels) | Era | Actions | Flipped / unflipped tiles | Links / VP |
|---|---|---|---|---|---|
| Scripted seat (human) | ironWorks: 2,3; coalMine: 2; manufacturer: 2; brewery: 2 | canal | network: 3; develop: 5; loan: 2; build: 5; scout: 1; sell: 1 | 4 / 1 | 3 / 8 |
| Scripted seat (human) | coalMine: 2,3,3,4; brewery: 3,3,4; pottery: 1 | rail | build: 8; network: 4; loan: 4; scout: 1; sell: 1 | 6 / 7 | 4 / 13 |
| AI Bob (easy) | cottonMill: 2; ironWorks: 2,3,4 | canal | develop: 5; network: 3; loan: 3; pass: 1; build: 4; sell: 1 | 4 / 0 | 3 / 12 |
| AI Bob (easy) | coalMine: 2,3,3,4; cottonMill: 2; pottery: 1 | rail | network: 5; build: 6; loan: 4; sell: 1; develop: 1; pass: 1 | 6 / 4 | 5 / 21 |
| AI Carol (easy) | cottonMill: 1; ironWorks: 1,2; manufacturer: 1; brewery: 2; coalMine: 2 | canal | network: 4; build: 6; sell: 2; develop: 5 | 4 / 2 | 4 / 16 |
| AI Carol (easy) | coalMine: 3,4; cottonMill: 2; manufacturer: 2 | rail | build: 4; network: 5; loan: 3; develop: 3; sell: 1; scout: 1; pass: 1 | 4 / 3 | 7 / 19 |

## Suspicious AI decisions

Review hypotheses, not move grades. Thresholds: Rail loans in the last two rounds while holding ≥£30; era-end links ≤1 VP; unflipped industries with printed VP ≥5; developed types never built later; final cash ≥£30. Low-scoring links can provide access, and unused money may be unavoidable.

### synthetic-2p-1701 (synthetic)

- Player 1, rail round 10, action 75 (loan): Late Rail loan with £40 already held and 1 rounds remaining. Check the planned spending; this is not proof the loan was unnecessary. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-2p-1701 --action 75 --dir 'research/human-games/samples'`.
- Player 1, rail round 10, action 78 (network): rail ended with unflipped brewery Lv3 at nuneaton_0 (printed 7 VP; actual industry score 0). Check selling/resource access. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-2p-1701 --action 78 --dir 'research/human-games/samples'`.
- Player 1, rail round 10, action 78 (network): rail ended with unflipped manufacturer Lv2 at wolverhampton_0 (printed 5 VP; actual industry score 0). Check selling/resource access. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-2p-1701 --action 78 --dir 'research/human-games/samples'`.
- Player 1, rail round 10, action 76 (build): Finished with £54 unused cash. Check whether worthwhile spending was possible. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-2p-1701 --action 76 --dir 'research/human-games/samples'`.
- Player 1, canal round 10, action 38 (develop): Developed ironWorks but built no later industry of those types. Check whether the development enabled another benefit. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-2p-1701 --action 38 --dir 'research/human-games/samples'`.
- Player 1, rail round 4, action 53 (develop): Developed coalMine but built no later industry of those types. Check whether the development enabled another benefit. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-2p-1701 --action 53 --dir 'research/human-games/samples'`.

### synthetic-3p-1702 (synthetic)

- Player 2, canal round 9, action 51 (develop): canal ended with unflipped brewery Lv2 at stone_0 (printed 5 VP; actual industry score 0). Check selling/resource access. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-3p-1702 --action 51 --dir 'research/human-games/samples'`.
- Player 1, rail round 9, action 105 (network): rail ended with unflipped pottery Lv1 at stokeOnTrent_1 (printed 10 VP; actual industry score 0). Check selling/resource access. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-3p-1702 --action 105 --dir 'research/human-games/samples'`.
- Player 2, rail round 9, action 105 (network): rail link cannock-stafford scored 0 VP. It may still have provided useful access. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-3p-1702 --action 105 --dir 'research/human-games/samples'`.
- Player 2, rail round 9, action 105 (network): rail ended with unflipped cottonMill Lv2 at birmingham_0 (printed 5 VP; actual industry score 0). Check selling/resource access. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-3p-1702 --action 105 --dir 'research/human-games/samples'`.
- Player 1, rail round 9, action 105 (network): Finished with £34 unused cash. Check whether worthwhile spending was possible. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-3p-1702 --action 105 --dir 'research/human-games/samples'`.
- Player 1, canal round 1, action 3 (develop): Developed brewery but built no later industry of those types. Check whether the development enabled another benefit. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-3p-1702 --action 3 --dir 'research/human-games/samples'`.
- Player 1, canal round 2, action 8 (develop): Developed brewery but built no later industry of those types. Check whether the development enabled another benefit. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-3p-1702 --action 8 --dir 'research/human-games/samples'`.
- Player 1, canal round 5, action 22 (develop): Developed manufacturer but built no later industry of those types. Check whether the development enabled another benefit. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-3p-1702 --action 22 --dir 'research/human-games/samples'`.
- Player 1, canal round 9, action 49 (develop): Developed brewery but built no later industry of those types. Check whether the development enabled another benefit. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-3p-1702 --action 49 --dir 'research/human-games/samples'`.
- Player 1, rail round 6, action 82 (develop): Developed cottonMill but built no later industry of those types. Check whether the development enabled another benefit. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-3p-1702 --action 82 --dir 'research/human-games/samples'`.
- Player 2, rail round 9, action 103 (pass): Finished with £48 unused cash. Check whether worthwhile spending was possible. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-3p-1702 --action 103 --dir 'research/human-games/samples'`.
- Player 2, canal round 7, action 38 (develop): Developed ironWorks but built no later industry of those types. Check whether the development enabled another benefit. Inspect: `node scripts/research/inspect-human-game.js --game synthetic-3p-1702 --action 38 --dir 'research/human-games/samples'`.
- 6 more flags available in the analysis module; showing the first 12 for readability.

## Potential weaknesses

No human-game evidence yet; no strategic conclusions drawn.

## Recommended next experiments

Inspect recurring flags, check the legal alternatives and network context, and collect another batch against the same policy. Test any proposed AI correction separately; this tool makes no strategy changes.

## Files needing attention

None.
