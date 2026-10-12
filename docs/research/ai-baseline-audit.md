# Assignment 5: Audit and Baseline of the Existing AI

**Scope.** This is an investigation of the computer opponents in
`js/aiPlayer.js` as they stand after Assignment 4.5. The AI was not changed.
The research scripts in `scripts/research/` call the AI exactly as the game
does. The full generated tables are in
[`ai-baseline-results.md`](ai-baseline-results.md).

**Summary.**

- **Legality.** The AI's moves are always legal: 0 illegal moves in about 6,600 games here, and none in the 1,350 strictly checked games of Assignment 4. The AI never changes the game state while deciding.
- **Fairness.** Easy and Normal use no hidden information. **Hard reads its opponents' hands** (confirmed). The leak changes 2–3% of Hard's decisions but buys no measurable strength: Hard shown a *random plausible* hand plays as well as Hard shown the real one.
- **Strength.**
  - Easy is measurably weaker than Normal: it wins 40–43% of balanced games against Normal, where 50% would mean equal strength.
  - Hard is equal to Normal at 2 players and modestly stronger at 3 and 4 players: it scores about 5 VP more per player.
  - The labels therefore overstate the differences.
  - All three levels score low in absolute terms: 34–44 VP per player and 50–64 VP for the winner.
- **Main weaknesses.** All are systematic across seeds, player counts and difficulties:
  - **A wrong estimate of the rounds remaining.** From the middle of each era the AI believes about one round is left when there are three to five. As a result it values income and sellable industries too little, and loans too much.
  - **A loan spiral.**
    - About 5 loans per player per game, nearly all taken when nothing else was affordable. That is about −15 income levels.
    - Final income is negative on average.
    - Players sell 1.3–3.1 of their own tiles per game to cover shortfalls, and lose 1.6–3.9 VP.
  - **Over-development.** Players develop 11–14 tiles per game, buying 80–94% of their iron at market prices. About half of the industries developed are never built afterwards.
  - **Little selling.** Selling is legal at only about 5% of turn actions, so players sell about 1.7 tiles per game.
  - **Destroying its own work.** The AI overbuilds its own *unflipped* tiles, losing the money and the resource cubes. The build score never accounts for the tile being replaced.
  - **Careless discards.** For non-build actions the AI discards the first non-wild card in its hand, whatever it is worth.

**Recommendation.** Fix the Hard hand-reading first. Then use the research harness as a benchmark, and fix the confirmed implementation defects one at a time with a controlled experiment for each. Do not introduce search-based AI until those fixes have been measured. See [section 6](#6-recommendations-for-assignment-6-and-beyond).

---

## 1. How the existing AI works

### 1.1 Architecture

`AIPlayer.chooseAction(state, logic, playerId, difficulty, rng)` is a
stateless, one-ply heuristic.

**Inputs.**
- It reads the live `GameState` and `GameLogic`, not a player view, and never mutates them (verified at every decision, [§2.1](#21-legality-and-purity)).
- `rng` is a dedicated `SeededRandom`. The UI and the harness seed it from the game seed, so the AI's noise never moves the game's own random stream.

**Output.** A legacy decision `{ action, pendingData, cardIndex }`. `logic.moveFromDecision` converts it into an engine move, and the engine completes and validates it.

**Decision procedure.**
1. **Score one candidate per action type.** For each action type the AI evaluates every target, keeps the best, and scores it on one "VP-equivalent" scale:

   `score = VP × 1.0 + income × incomeWeight + money × 0.12 + flex × 0.8`

   Here `incomeWeight = 0.35 × roundsRemaining / 5`.
2. **Perturb the scores by difficulty** ([§1.3](#13-difficulty-levels)).
3. **Play the highest score.**

**Per-action scoring.** Scores are in "VP-equivalent" units.

| Action | Candidates | Score (main terms) |
|---|---|---|
| Build | `getValidBuildTargets` (all legal, affordable builds) | Tile VP × flip probability, plus income × flip probability; − cost × 0.12; + half the tile's link VP if the player owns an adjacent link; + 0.15 per resource cube (coal / iron); + 0.1 per unbuilt adjacent connection. **Nothing for the tile being replaced** |
| Network | `getValidNetworkTargets` (single links only) | Hand cards whose location the link brings into the network, + 1.5 for a merchant location, + an exploration bonus that shrinks with links already built, − cost |
| Develop | The first one or two developable industries, ranked by "urgency": 2.0 if the lowest tile cannot be built in the Rail Era, else 0.5, + 0.3 × level | The urgency terms count as VP; − iron cost (first source only checked for affordability) |
| Sell | All sellable tiles, greedily, ranked by merchant bonus then tile value, keeping each only while `planSell` accepts the whole sale | VP + income of every tile sold, + the merchant bonus value |
| Loan | Always, if legal | +£30 × 0.25 as money, − 3 income levels; **+4 "cash crunch" if no Build or Network is affordable**; −2.5 if income ≤ −5; −2.5 if money > 2.5 × the cheapest affordable target |
| Scout | If legal | Based on how many of the three least useful cards are "dead" |
| Pass | Always | −0.5 |

**Which card it plays.**
- **For a Build:** a non-wild card that matches the target (a wild only if nothing else fits).
- **For every other action:** the first non-wild card in the hand. The card's usefulness is not considered.
- **For a Scout:** the three least useful cards.

**Choices the AI does not make.** The legacy decision cannot express the
following, so the engine's defaults fill them in ([`moves.md`](../moves.md)):

| Choice | Engine default |
|---|---|
| Coal | The closest mine first |
| Iron | The first Iron Works with iron in the engine's list, then the market |
| Beer | The player's own breweries first |
| Merchant | The best bonus |
| Gloucester free develop | Always develops (Canal-only, lowest level first), never skips |
| Income shortfall | `defaultShortfallMove`: unflipped tiles first, then the lowest VP |

The AI never plans a **double rail link** and never develops **two tiles of
the same industry** in one action.

### 1.2 Can the AI make every decision a human can?

**It can always act.** Every AI decision completes into a legal move, and
progression, shortfalls and era ends are handled by the engine.

**But it can't express part of the decision space:**
- **Double rail links.** These were legal in 14–43% of the AI's Rail-Era Network decisions ([results §2](ai-baseline-results.md#2-legality-and-fairness-probe)) and never chosen.
- **Explicit resource, merchant and Gloucester choices.** 3–5% of the AI's moves had a real choice that it left to the engine's default.
- **Choosing which tiles to sell** for a shortfall; this uses a fixed policy.
- **Developing the same industry twice** in one action.
- **Selling only some of its sellable tiles.** The AI always sells every tile it can.

These are missing *options*, not rule violations.

### 1.3 Difficulty levels

| Level | Perturbation (`applyDifficulty`) | Effect |
|---|---|---|
| Easy | Every action's score gets uniform noise of ±2. With probability 0.15, it plays a **random one of the action types' best candidates** instead | Random actions include Pass and Loan, which explains Easy's extra passes (233 of 1,310 passes at 2 players were made while another action was legal; Normal 2 of 881) |
| Normal | Uniform noise of ±0.6 on every action's score | Small tie-breaking noise |
| Hard | **No noise.** The best Build candidate gets a "denial" bonus: +0.6 for every opponent **location card** naming the build's town, +0.3 for every opponent **industry card** showing its industry | The bonus is added *after* the best build target has been picked, so it never changes *where* Hard builds. It only makes Build more likely to win over the other actions |

Normal and Easy draw the noise from the AI's seeded stream. Hard is
deterministic given the state.

---

## 2. Legality, fairness and hidden information

### 2.1 Legality and purity

The probe was `scripts/research/ai-audit.js --games 10`: 270 games and 9,210
AI decisions ([results §2](ai-baseline-results.md#2-legality-and-fairness-probe)).

| Check | Result |
|---|---|
| The AI's move resolves to a legal move | **9,210 of 9,210**. Also 0 rejected moves in every experiment of this report (about 6,600 games, checked with `resolveMove` before every move) and in Assignment 4's 1,350 strict games |
| Choosing changes the game state (`serialize()` before vs after) | **0** |
| The decision depends on the order of the draw deck | **0** at every difficulty |
| The decision depends on opponents' hands (hands replaced by a random sample of the unseen cards, same AI random stream) | **Easy 0, Normal 0, Hard 2.1–3.3%** |

### 2.2 Confirmed: Hard reads opponents' hands (F1)

`denialBonus` (`js/aiPlayer.js`) iterates over `p.hand` for every opponent.
Hand contents are hidden information in Brass. Hard therefore decides with
information a human in its seat could not have. The leak is easy to see in a
single game: 3 players, seed 3001, Canal round 5, player 1.

| Hard is shown | It chooses |
|---|---|
| The real opponent hands | Develop (Brewery + Cotton Mill) |
| A random plausible sample of opponent hands | Build Iron Works at Redditch |

On its next decision the outcome flips the other way.

**What the leak is worth.** Two research variants of Hard were played against
Hard with seats balanced. Neither changes any AI code; they only change what
the AI is shown while it decides.

| Variant (A) vs Hard (B) | 2 players | 3 players | 4 players |
|---|---|---|---|
| **Hard-fair** (shown resampled opponent hands) | 46.8% [40–54], −2.1 ± 5.2 VP | 48.1% [42–54], −3.8 ± 3.9 VP | 49.6% [43–56], −1.5 ± 2.7 VP |
| **Hard-blind** (shown empty opponent hands, so no denial bonus) | 48.5% [42–55], −1.0 ± 5.4 VP | 50.0% [44–56], −3.0 ± 3.9 VP | 45.4% [39–52], −3.5 ± 2.8 VP |
| Hard-blind vs **Normal** | 50.5% [44–57], +1.8 ± 5.6 VP | 53.8% [47–60], 0.0 ± 3.7 VP | 47.5% [41–54], −0.6 ± 3.0 VP |

Each cell gives A's win share with its 95% interval, then the VP difference A − B.

**Interpretation.**
- **The actual hidden information buys no detectable strength.** Hard-fair is statistically indistinguishable from Hard at every player count.
- **What Hard gains over Normal comes from the shape of the bonus, a bias towards building.** Removing the bonus entirely (Hard-blind) costs about 3 VP at 3 and 4 players (significant only at 4), and Hard-blind plays like Normal. Removing Normal's noise therefore adds nothing measurable.
- **The fix should cost nothing.** Making Hard fair (for example by computing the bonus from public information or a sampled hand) should not cost strength.

### 2.3 Other fairness and exploit checks

- **Deck order.** No difficulty reads the order of the deck. `estimateRoundsRemaining` uses only `drawDeck.length`, which is public.
- **No other hidden information.**
  - All the other inputs are the board, the markets, merchant tiles, the player's own hand and mat, and public counts.
  - The rules queries the AI calls (`getValidBuildTargets`, `getValidCardsForAction`, …) consider only the acting player's own hand.
- **Unintended behaviour that comes from implementation details.** None of it is a rules exploit; each item is a heuristic defect in [§4](#4-identified-weaknesses):
  - the rounds-remaining estimate (D2);
  - the loan "cash crunch" test (D3);
  - overbuilding its own tiles (D4).
- **Turn order.** Seat position gives no detectable advantage in mirror games. Of 27 position cells, only one interval excludes the even split (4 players, Hard, position 3: 16% [10–24]), which is about what chance predicts ([results §1.3](ai-baseline-results.md#13-mirror-games-every-seat-the-same-difficulty-per-player-statistics)).

---

## 3. Baseline experiments

### 3.1 Method

- **Harness.** `scripts/research/harness.js` plays complete games through the engine (`getCurrentDecision` / `play`), with any policy at any seat:
  - the AI is called exactly as the UI calls it, with the same seeded AI stream;
  - income shortfalls use the engine's automatic policy, as the UI does for AI seats.
  - It was checked against the production driver (`test/helpers/headless.js`): for the same seed and difficulty, final VP and money are identical at 2, 3 and 4 players for all three levels.
- **Policies.**
  - Easy, Normal and Hard, unchanged;
  - Hard-fair and Hard-blind ([§2.2](#22-confirmed-hard-reads-opponents-hands-f1));
  - Random, a floor: a uniformly random move type, then a uniformly random legal move of that type.
- **Seeds.**
  - Experiments use seeds `200000 + 1000 × players + i`. These are disjoint from the seeds used by the tests and `simulate.js`.
  - Each seed fixes the deck, the merchants and the initial turn order (the "starting position").
- **Controlled matchups.** For each pair of policies, every arrangement of the two over the seats is played on every seed:
  - 2 players: AB and BA;
  - 3 players: AAB, ABA, BAA, BBA, BAB, ABB;
  - 4 players: the six arrangements of AABB.

  Each policy therefore occupies every seat and turn position equally often.
- **Measures.**
  - A's **win share** (ties split; 50% means equal strength), with a Wilson 95% interval.
  - The per-game **VP difference** between A's seats and B's seats, as a mean ± 1.96 standard errors.
  - **Gameplay statistics** from mirror games (every seat the same level), recorded before each move: actions, builds by industry and era, overbuilds, sales, development, loans, resource sources, discards, shortfalls, a per-era snapshot (unflipped tiles, money, Level I tiles) and the VP breakdown.

| Experiment | Games |
|---|---|
| Pairwise matchups, 6 pairs (2p: 100 seeds; 3p / 4p: 40 seeds) | 4,080 |
| Random vs Easy (10 seeds) | 140 |
| Three-way, 3 players, one of each level, all six seatings (50 seeds) | 300 |
| Mirror games, 3 levels × 3 player counts × 100 seeds | 900 |
| Decision probes (replays of the mirror seeds) | 900 |
| Legality and fairness probe | 270 |

### 3.2 Strength of the difficulty levels

| A vs B | 2 players | 3 players | 4 players |
|---|---|---|---|
| Easy vs Normal | 40.8% [34–48], **−9.9 ± 4.6** | 42.9% [37–49], −3.0 ± 3.5 | 40.0% [34–46], **−4.0 ± 2.6** |
| Normal vs Hard | 50.3% [43–57], −1.3 ± 5.4 | 43.8% [38–50], **−4.8 ± 3.7** | 42.5% [36–49], **−5.5 ± 3.0** |
| Easy vs Hard | 37.0% [31–44], **−8.0 ± 4.9** | 46.3% [40–53], **−4.2 ± 3.8** | 35.4% [30–42], **−6.7 ± 2.6** |
| Random vs Easy | 10.0% [3–30], −28.5 ± 10.2 (20 games) | 17.5% [10–29], −23.7 ± 4.8 | 0.0% [0–6], −36.4 ± 3.2 |

Each cell gives A's win share with its 95% interval, then the VP difference A − B. Bold marks a VP difference whose interval excludes 0.

In three-way 3-player games (300 games):

| Level | Win share | Mean VP |
|---|---|---|
| Easy | 27.7% [23–33] | 35.8 |
| Normal | 28.3% [24–34] | 37.8 |
| Hard | 44.0% [38–50] | 43.3 |

**Findings.**
- **Ordering.** The order Easy < Normal ≤ Hard holds, but the gaps are small.
  - Easy loses about 3–10 VP per game to Normal. The 3-player difference is not significant on VP, though Easy's win share is below 50% there too.
  - Normal and Hard are indistinguishable at 2 players. At 3–4 players Hard gains about 5 VP, which [§2.2](#22-confirmed-hard-reads-opponents-hands-f1) attributes to its build bias.
- **Easy is still far above random play.** Easy beats Random decisively, so it is a real, if weak, player.
- **Strength is close to symmetric across seats and starting positions.** That is confirmed by the balanced matchups and by the turn-order table.

### 3.3 What a game looks like

These are per-player means in mirror games ([results §1.3](ai-baseline-results.md#13-mirror-games-every-seat-the-same-difficulty-per-player-statistics)).
The 3-player Normal game is typical:

| Measure | 3-player Normal (range over all levels and player counts) |
|---|---|
| Final VP (winner) | 42.3 (63.6); range 34–44 (50–64) |
| Actions | Build 10.6, Network 7.0, **Develop 6.7**, **Sell 1.7**, **Loan 5.3**, Pass 3.3, Scout 0.4 |
| Loans | 5.3 (range 4.4–6.0), worth £158 per player against £203 spent on Build, Network and Develop |
| Final income level | −2.5 (range −0.7 to −4.4) |
| Tiles developed | 12.6 (range 10.5–13.8) |
| Iron bought from the market | 92% (range 80–94%) |
| Tiles sold | 1.7 (range 1.3–1.8) |
| Shortfall tile sales, of which flipped | 2.25, 0.27 (ranges 1.3–3.1 and 0.13–0.51) |
| VP lost to shortfalls | 2.5 (range 1.6–3.9) |
| Own tiles overbuilt, of which unflipped | 1.8, 0.8 (ranges 1.4–2.7 and 0.5–1.5) |
| VP sources | Canal links 9.1, Canal tiles 11.3, Rail links 8.7, Rail tiles 15.4, merchant VP bonuses 0.2 |

---

## 4. Identified weaknesses

The labels are:
- **Confirmed:** read in the code and reproduced or measured.
- **Evidence:** a measured pattern, with its frequency across seeds.
- **Hypothesis:** a likely cause that has not yet been tested by changing the AI.

### D2. The rounds-remaining estimate is wrong for half of every era (confirmed)

`estimateRoundsRemaining = drawDeck.length / numPlayers`, clamped to 1–10.
That ignores the cards in hand, and each round uses two cards per player, not
one.

Measured over 20 Normal games per player count (estimate / actual rounds remaining):

| Players | Round 1 | Round 3 | Round 5 | Round 6 | Round 7 |
|---|---|---|---|---|---|
| 2 | 10.0 / 10 | 7.5 / 8 | 3.5 / 6 | **1.5 / 5** | **1.0 / 4** |
| 3 | 8.7 / 9 | 5.3 / 7 | **1.4 / 5** | **1.0 / 4** | 1.0 / 3 |
| 4 | 6.6 / 8 | 3.3 / 6 | **1.0 / 4** | 1.0 / 3 | 1.0 / 2 |

The pattern is the same in the Rail Era. Once the deck is empty, the AI thinks
one round remains while players still hold up to 8 cards, which is four
rounds. Every term that uses the estimate is distorted for the second half of
each era:
- **income is valued at its minimum** (`incomeWeight`), so the income lost to loans looks almost free;
- **sellable industries lose 0.3 of their flip probability** (when the estimate is below 2).

### D3. The loan "cash crunch" test cannot work as written (confirmed)

The comment intends a bonus when the player "can't afford the next move". But
`cheapestAffordableBuildOrNetworkCost` takes the minimum over targets that
`getValidBuildTargets` / `getValidNetworkTargets` have **already filtered for
affordability**. The two outcomes are:
- **Nothing is affordable or legal:** the minimum is ∞, so the +4 bonus always applies, and the "already flush" penalty never does.
- **Something is affordable:** money ≥ the minimum by construction, so the bonus never applies.

Even without the bonus, a loan's base score is £30 × 0.25 × 0.12 = +0.9, minus
3 income levels × `incomeWeight`. While the rounds estimate is low, which D2
makes the case for half of each era, that comes to about +0.7, above Pass
(−0.5). A loan is therefore the default fallback action until the income
floor penalty applies at income ≤ −5.

**Evidence** ([results §3](ai-baseline-results.md#3-decision-probes)):
- Normal and Hard took 92–96% of their loans when no Build or Network was affordable; Easy 74–80%.
- 30–51% of loans were followed by an income shortfall in the same era.
- Loans raised £130–180 per player per game, close to everything the AI spent.
- 9–14% of loans were taken in the last two Rail rounds, where the money can barely be used.

### D4. Overbuilding its own tiles is scored as a free new tile (confirmed)

`scoreBuildCandidate` scores the new tile and never subtracts the tile it
replaces. That tile's cost is lost and its unsold resource cubes are
discarded. An overbuilt unflipped tile never scores.

**Evidence:**
- 1.4–2.7 own overbuilds per player per game, of which 0.5–1.5 were of unflipped tiles.
- At 3 players, Normal: 249 unflipped own tiles were overbuilt in 300 player-games, after £3,353 had been spent on them, destroying 478 resource cubes.

**Trace.** Seed 203001, 3 players, all Normal, player 0
(`node scripts/research/ai-trace.js --players 3 --seed 203001 --seats normal,normal,normal --player 0`):

```
canal r 6  P0 normal £  8 inc   0 vp   0  build    {"card":7,"location":"birmingham","slot":2,"industry":"ironWorks","coal":["market"]}
canal r 6  P0 normal £ 19 inc   2 vp   0  build    {"card":1,"location":"birmingham","slot":2,"industry":"ironWorks","coal":["market"]}
canal r 7  P0 normal £ 23 inc   3 vp   0  build    {"card":3,"location":"birmingham","slot":2,"industry":"ironWorks","coal":["market"]}
```

The same space is built three times in two rounds. Each build replaces the
player's own unflipped Iron Works.

### W1. The loan spiral (evidence, with D2 and D3 as the likely cause)

The same trace continues in the Rail Era (excerpt):

```
rail  r 3  P0 normal £  1 inc   1 vp  19  loan     {"card":0}
rail  r 5  P0 normal £  1 inc  -2 vp  19  loan     {"card":0}
rail  r 6  P0 normal £ 21 inc  -5 vp  19  build    {"card":5,"location":"burtonOnTrent","slot":0,"industry":"coalMine","iron":["market"]}
rail  r 6  P0 normal £ 12 inc  -5 vp  19  build    {"card":5,"location":"burtonOnTrent","slot":0,"industry":"coalMine","iron":["market"]}
rail  r 7  P0 normal £ -5 inc  -5 vp  19  shortfall {"tile":"burtonOnTrent_0"}
rail  r 7  P0 normal £  0 inc  -5 vp  19  loan     {"card":0}
rail  r 9  P0 normal £ -6 inc  -8 vp  19  shortfall {"tile":"tamworth_0"}
rail  r 9  P0 normal £ -1 inc  -8 vp  19  shortfall {"tile":"nuneaton_0"}
```

Taken together, the game shows the whole cycle:
- loans drive the income negative;
- the negative income forces the sale of tiles, including the Coal Mine the player had just overbuilt twice;
- the cycle repeats.

The game ended 26 / 0 / 3 VP. It is an extreme seed, but every step in it
occurs in the averages above.

### W2. Over-development (evidence)

- **Volume.** Players develop 10.5–13.8 tiles per game, about 6–7 Develop actions, close to their Network count.
- **Payoff.** 44–53% of the developed tiles belong to industries the player **never builds afterwards**. Development has no other payoff, so that money and those actions are wasted.
- **Cost.**
  - 80–94% of all iron is bought from the market, because the AI rarely owns iron with cubes left.
  - Develop takes 15–28% of all money spent.

**Cause (confirmed in code).** The urgency term counts 2.0 (Canal-only tile)
or 0.5, plus 0.3 × level, as VP, for up to two tiles. It doesn't depend on
whether the player intends to build that industry. Developing two Canal-only
Level I tiles therefore scores about 3–4 after the iron cost. That is as much
as a good build.

### W3. Little selling (evidence; cause is a hypothesis)

- **Rarely possible.** Sell is legal at only 4–6% of turn actions. When it is legal, Normal and Hard take it 88–95% of the time, so the decision itself is not the problem.
- **Little to sell.** Players build about 3 sellable tiles (cotton, manufacturer, pottery) per game against 5–6 coal and iron tiles. Some of those are overbuilt or sold for shortfalls, and about 0.5 per player are still unsold at each era's end.
- **Hypothesis.** Selling needs a connected merchant and beer. The build score uses a fixed flip probability (0.6–0.8) that ignores beer availability, and halves its value late (D2). It never plans the build → link → brewery → sell sequence. The 1.4–2.1 breweries built per player per game are few for that sequence.

### W4. Careless discards (confirmed behaviour, measured)

For Network, Develop, Sell, Loan and Pass, `pickCardIndex` plays the first
non-wild card in hand. In 14–24% of those actions, the AI discarded a card it
could have used to build right now while holding a card it could not use for
any build. The useful card is thrown away. (This is a proxy: "dead" only
means not buildable right now.)

### W5. Unused options (confirmed, impact unknown)

- **Double rail links.** Never chosen. They were legal in 14–43% of the AI's Rail-Era Network decisions.
- **Resource choices left to the engine.** The default iron source (first in board order) used opponents' works for 5–11% of iron, which helps them flip their tiles.
- **Gloucester's free develop.** Always taken, never skipped.

Whether any of these matters is untested (hypothesis H4).

### W6. The difficulty levels are not well separated (evidence)

- Normal and Hard are equal at 2 players.
- Hard's 3–4-player edge comes from a build bias, not from skill or the hidden information ([§2.2](#22-confirmed-hard-reads-opponents-hands-f1)).
- Easy's handicap is noise plus a 15% random action type. It loses only 4–10 VP to Normal.

### Things the AI does well, to preserve

- **Legal, complete moves:**
  - one engine validates everything;
  - the sell plan is checked with `planSell` before it is proposed;
  - a failure is impossible in practice (0 in about 8,000 strict games), and the UI's recovery path remains.
- **Purity and reproducibility.**
  - The AI never mutates the state.
  - Its noise comes from its own seeded stream, separate from the game's.
  - Same seed means same game.
- **Easy and Normal use only legitimate information.**
- **Sells immediately when it can,** and drinks merchant beer for the bonus.
- **Keeps wild cards** for builds that need them.
- **It is fast:** under 1 ms per decision, so 0.15–0.3 s for a whole game. That makes large controlled experiments cheap.

---

## 5. Limitations of these findings

- **No human baseline.**
  - Strength is only measured between the existing policies and against a random floor.
  - "Low scores" (34–44 VP per player) is a comparison between AI levels and against the rules' scoring potential, not against measured human play.
  - No human games are recorded in this repository.
- **Correlated games.**
  - All arrangements of a matchup share each seed, so deck and merchants repeat. The intervals treat games as independent and are somewhat optimistic.
  - All AI seats share one AI random stream (as in the UI), so one seat's noise draws shift the others'.
- **Policy-specific results.** Matchup results apply to these pairings and need not be transitive. Three- and four-player results mix interactions between more than two policies.
- **Ablations, not fixes.**
  - Hard-fair and Hard-blind change what Hard *sees*, not its code.
  - Hard-fair resamples only non-wild cards from the deck and the opponents' hands. It ignores what a player could infer from discards.
- **Causes are mostly inferred.** The causes proposed for W1–W3 come from reading the code and from correlations. They have not been tested by changing the AI, which this assignment excludes. Interacting causes (D2 feeds W1 and W3) mean the size of each effect is unknown.
- **Proxy metrics.**
  - "Dead card" and "developed but never built" are proxies.
  - Shortfall decisions use the engine's automatic policy for every AI seat.
- **The quantity of games is not evidence of skill.** About 6,600 games show the behaviour is consistent. They don't show it is good.

---

## 6. Recommendations for Assignment 6 and beyond

### 6.1 Confirmed defects to fix

| Priority | Defect | Why this order | Expected cost |
|---|---|---|---|
| 1 | **F1: Hard reads opponents' hands** | A fairness defect, visible to players. The experiments show a fair version keeps Hard's strength (Hard-fair ≈ Hard) | Very small. Compute the bonus from public information, or move the AI onto `state.getPlayerView(id)` so hidden information is excluded by construction. Turn the `todo` test in `test/ai-audit.test.js` into a passing test |
| 2 | **D2: Rounds-remaining estimate** | An implementation error. It feeds the loan, income and selling valuations, so fix it before measuring the others | One function. Count the cards in hand and the two cards per round |
| 3 | **D3: Loan cash-crunch test and default loan** | Logic that can't do what its comment says, and the main driver of the income spiral | Small and local |
| 4 | **D4: Overbuild scoring ignores the replaced tile** | Destroys the AI's own money and resources every game | Small: subtract the replaced tile's cost, cubes and VP |
| 5 | **W4: Discard choice** | A simple, measurable inefficiency | Reuse the existing `cardUsefulness` |

Change **one thing at a time**, and measure each change with the harness
against the current AI before taking the next. D2 interacts with D3 and W3,
so fixing them together would hide which change helped.

### 6.2 Strategic weaknesses to address after the defects (evidence-backed)

1. **Over-development (W2).** Tie the Develop value to industries the player can actually build or plan to build, and to the price of iron.
2. **The selling pipeline (W3).** Value sellable builds by reachable merchants and available beer, and the breweries and links that enable a sale.
3. **Separating the difficulty levels (W6).** Define the levels by a measured strength gap, after the fixes.

### 6.3 Hypotheses to test, not yet act on

| Hypothesis | Test |
|---|---|
| H1: D2 is the main cause of the low sell rate | Measure the sell rate after the D2 fix alone |
| H2: Fixing D2 and D3 removes most shortfalls and VP lost | Measure shortfall statistics after each fix |
| H3: Over-development causes the cash shortage that leads to loans | Measure spending and loans after the W2 change |
| H4: Double rail links, explicit resource choices (own iron and coal first) and skipping Gloucester's develop matter | Only after the above, with a matched A/B experiment |
| H5: A search-based AI (rollouts with `clone` and `runGame`) would add strength | **Defer.** First establish how far the fixed heuristic gets. Rollouts are only as good as their rollout policy, which today is this heuristic |

### 6.4 Process for Assignment 6

- **A benchmark.** Use `scripts/research/` as a regression benchmark. A candidate AI plays the current one with the seats balanced (`ai-baseline.js matchups`), and the mirror statistics are compared with [the baseline tables](ai-baseline-results.md). Before an experiment, fix the seeds and a rule for what counts as an improvement (for example, a win-share interval above 50%).
- **Keep the behaviour listed above:** legality, purity, the separate seeded AI stream, and Easy and Normal's fairness.
- **Keep the existing levels available** (for example as `legacy`) until a replacement is shown to be better. That way the baseline stays reproducible.

---

## Reproducing the experiments

Everything is deterministic, with no dependencies (Node.js 22+). Raw results
go to `research-results/`, which git ignores. Times are for one core.

```
# Legality, purity and hidden-information probe (§2; about 2 min)
node scripts/research/ai-audit.js --games 10

# Strength experiments (§3; about 3 + 6 + 7 min; run them in parallel)
P=easy:normal,normal:hard,easy:hard,hard-blind:hard,hard-fair:hard,hard-blind:normal
node scripts/research/ai-baseline.js matchups --players 2 --seeds 100 --pairs $P
node scripts/research/ai-baseline.js matchups --players 3 --seeds 40 --pairs $P
node scripts/research/ai-baseline.js matchups --players 4 --seeds 40 --pairs $P
node scripts/research/ai-baseline.js matchups --players 2,3,4 --seeds 10 --pairs random:easy --out research-results/random-floor.json
node scripts/research/ai-baseline.js threeway --players 3 --seeds 50
node scripts/research/ai-baseline.js mirror --players 2 --seeds 100     # and --players 3, 4

# Tables (results §1)
node scripts/research/ai-report.js research-results/*.json

# Decision probes (§4; about 1 min each)
node scripts/research/ai-probes.js --players 3 --seeds 100           # and 2, 4

# A readable trace of any game
node scripts/research/ai-trace.js --players 3 --seed 203001 --seats normal,normal,normal --player 0
```

| File | Purpose |
|---|---|
| `scripts/research/harness.js` | Plays a game with a policy per seat; Hard-fair / Hard-blind views; per-player statistics |
| `scripts/research/ai-baseline.js` | Matchups, three-way and mirror experiments → raw JSON |
| `scripts/research/ai-report.js` | Raw JSON → the Markdown tables |
| `scripts/research/ai-audit.js` | Legality, purity, hidden-information and decision-coverage probe |
| `scripts/research/ai-probes.js` | Loans, selling, development, spending and overbuild probes |
| `scripts/research/ai-trace.js` | A one-line-per-move trace of a seeded game |
| `test/ai-audit.test.js` | Pins the fairness properties: no state changes, no dependence on deck order, Easy and Normal independent of hidden hands. Hard's dependence is recorded as a `todo` test (F1) |
