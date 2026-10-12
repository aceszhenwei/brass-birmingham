# Assignment 5 Audit: Checklist

The status of every finding of the [Assignment 5 audit](ai-baseline-audit.md)
after Assignments 6–10.

**Statuses:**
- **Resolved:** fixed, with the change validated and adopted.
- **Improved:** partly addressed by an adopted change; some of the weakness remains.
- **Investigated, no change:** measured or tested; the evidence did not justify a change.
- **Deferred:** outside the scope so far, or needing a decision first.

## Defects and weaknesses (audit §4, §6.1)

| Finding | Status | Where | Outcome |
|---|---|---|---|
| **F1** Hard reads opponents' hands | **Resolved** | [A6](ai-corrections-a6.md) | Every difficulty decides on the player's observation; a test checks every decision of complete games |
| **D2** Rounds-remaining estimate wrong for half of each era | **Resolved** | [A6](ai-corrections-a6.md) | The AI uses the engine's exact count |
| **D3** Loan "cash crunch" test cannot work as written | **Investigated, no change** | [A7](ai-loans-a7.md) | The test is wrong in form but selects the right situations. No loan rule beat it on held-out seeds |
| **D4** Overbuilding own tiles scored as free | **Resolved** | [A8](ai-overbuild-a8.md) | The replaced tile's value is charged. +3.6 to +4.0 VP |
| **W1** The loan spiral | **Investigated, no change** | [A7](ai-loans-a7.md), [A10](ai-audit-a10.md) | Loans are a rational response to low cash. Later changes raised income, but loans stayed at about 4.5–6 per player per game |
| **W2** Over-development | **Improved** | [A9](ai-invest-a9.md), [A10](ai-audit-a10.md) | No Develop in the game's last 2 rounds: −1.2 Develop actions per game, and developed industries built later rise from 53–55% to 67–68% (part of +5 to +8 VP). Develop is still valued without regard to later building |
| **W3** Little selling | **Resolved** | [A9](ai-invest-a9.md) | The real cause was building where no sale was possible. A calibrated sale probability gave +9 to +10 VP, and 92–98% of sellable tiles are now sold |
| **W4** Careless discards | **Investigated, no change** | [A10](ai-audit-a10.md) | Two discard rules removed the measured "waste" but were neutral (−1.8 ± 2.2 and +0.4 ± 2.2 VP). The audit's proxy does not measure real harm |
| **W5** Double rail links never built | **Resolved** | [A10](ai-audit-a10.md) | Two-link Networks are scored. +3.9 VP alone, and part of the validated combination |
| **W5** Resource choices left to the engine | **Investigated, no change** | [A10](ai-audit-a10.md) | Taking own coal, iron and beer first: +0.1 ± 2.2 VP. Rare (under 1 choice per player per game), and neither choice is clearly better |
| **W5** Gloucester's free develop always taken | **Investigated, no change** | [A10](ai-audit-a10.md) | 0.4–0.8 times per player per game. The default follows nearly the AI's own develop ranking. Not tested further: too rare to matter |
| **W6** Difficulty levels poorly separated | **Deferred** | [A6](ai-corrections-a6.md), [A10](ai-audit-a10.md) | Normal and Hard are still level (+0.7 ± 2.3 VP). This needs a decision on what each level should be, not a fix |

## Options the AI could not express (audit §1.2)

| Finding | Status | Outcome |
|---|---|---|
| Double rail links | **Resolved** | See W5 |
| Explicit resource, merchant and Gloucester choices | **Investigated, no change** | Resource choices: see W5. The merchant default already takes the best bonus. Gloucester: see W5 |
| Choosing which tiles to sell for a shortfall | **Investigated, no change** | A value-based choice was −1.0 ± 2.2 VP. The default already sells unflipped tiles first |
| Developing the same industry twice | **Investigated, no change** | 86–91% of Develops already remove two tiles. A same-industry pair was legal in 3 of 1,096 single-tile Develops |
| Selling only some sellable tiles | **Investigated, no change** (analysis only) | Each sale flips a tile, scoring its VP and income; holding a sellable tile back gains nothing but beer. Since Assignment 9, the AI builds sellable tiles where they can be sold, and 92–98% are sold. Not tested experimentally |

## Hypotheses (audit §6.3)

| Hypothesis | Status | Outcome |
|---|---|---|
| H1: D2 is the main cause of the low sell rate | **Refuted** ([A6](ai-corrections-a6.md), [A9](ai-invest-a9.md)) | Fixing D2 added only 0.25 sales. The cause was the build valuation |
| H2: Fixing D2 and D3 removes most shortfalls | **Refuted** ([A6](ai-corrections-a6.md), [A7](ai-loans-a7.md)) | Loans and shortfalls were unchanged |
| H3: Over-development causes the cash shortage | **Refuted** ([A10](ai-audit-a10.md)) | 1.2 fewer Develop actions per game left loans unchanged (±0.1) |
| H4: Double links, own resources and skipping Gloucester's develop matter | **Partly supported** ([A10](ai-audit-a10.md)) | Double links matter (+3.9 VP); own resources do not; Gloucester is too rare to test |
| H5: A search-based AI would add strength | **Deferred** | Excluded so far. In seat-balanced games the current AI beats the Assignment 5 AI by about +19 VP per game (Normal +19.2 ± 3.8, Hard +19.6 ± 3.4, win shares 72–78%; `research-a10/vs-a5`). Search should be compared against this stronger baseline |

## Behaviour to preserve (audit §4)

| Property | Status |
|---|---|
| Legal, complete moves | Kept. No illegal move in any experiment since Assignment 5, and the engine validates every move |
| Purity and reproducibility | Kept. Tests check that choosing never changes the state, and every AI has a recorded-game fixture |
| Fair information | Extended to every difficulty in Assignment 6 |
| Sells immediately when it can | Kept |
| Keeps wild cards for builds | Kept |
| Fast | 2.8–3.2 ms per decision (Assignment 5: under 1 ms; still well under a second per game) |
