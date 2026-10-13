# Assignment 13: Human Strategy Research and AI Capability Gap Analysis

**Scope.** A research-only assignment, with no change to the game or the AI. It:
- checks the supplied *Human Strategy Literature Review* (13 October 2026; "the review");
- expands the review with further Brass: Birmingham sources;
- compares what experienced players say with what the production AI (the four-action planner of Assignment 12) actually does;
- turns the result into a prioritised backlog of testable hypotheses for Assignments 14 and 16.

**The most important findings:**

1. **Most of the review's sources could not be verified from this environment.**
   - The network policy blocks boardgamegeek.com, reddit.com and roxley.com, and several strategy blogs.
   - All nine forum sources in the review (S1–S9) are therefore **unverified**: their existence and content could not be checked.
   - The official rulebook (S0) was verified from a local copy of the same PDF.
   - Eight further sources are graded from search-engine excerpts only (section 3).
2. **Where the human advice can be checked against the rules and our own data, it holds up in three places:**
   - **Money at the end is worthless.** It only breaks ties (rulebook).
   - **Links gain value after they are built**, as neighbouring industries flip.
   - **Level II+ tiles built in the Canal Era score twice.**
3. **The production AI violates the first of these in a measurable, reproducible way.**
   - In its last round it often takes a £30 loan it can never use (about 0.6 per player per game) while a link worth 3–8 VP is affordable.
   - It ends the game holding £47–54 on average.
   - The cause is twofold, shown by trace (section 9.1): the position value counts money at full value even in the final round, and the heuristic that proposes candidates rates links by network access, not by the VP they score.
4. **The review's top priority, opponents taking shared beer, is not what disrupts this AI's plans.**
   - 15–19% of its plans for the next turn are no longer legal by the time it moves.
   - The cause is overwhelmingly opponents occupying build spaces and links: 80–90% of failures.
   - Beer runs out in 4–6% of failures.
   - Opponent modelling should target contested spaces and links first.
5. **The other suspected weaknesses are real gaps in what the AI can represent, but their competitive cost is unknown.** They need experiments, not assumptions:
   - It develops rarely: 0.8–1.4 Develop actions per game, against 5.4–6.3 for the old heuristic (Assignment 9).
   - It values links only by what they would score now. Links in fact gain a further 1.3–2.2 VP each by the end of the era.
   - It has no notion of turn order.

## Contents

1. [Scope and method](#1-scope-and-method)
2. [Review and verification of the supplied document](#2-review-and-verification-of-the-supplied-document)
3. [Bibliography](#3-bibliography)
4. [Economic and industry strategy](#4-economic-and-industry-strategy)
5. [Network, beer and shared resources](#5-network-beer-and-shared-resources)
6. [Opponent awareness](#6-opponent-awareness)
7. [Era-level and long-term planning](#7-era-level-and-long-term-planning)
8. [Conflicting viewpoints and limits of the evidence](#8-conflicting-viewpoints-and-limits-of-the-evidence)
9. [Capability-gap analysis of the production AI](#9-capability-gap-analysis-of-the-production-ai)
10. [Prioritised hypothesis catalogue](#10-prioritised-hypothesis-catalogue)
11. [Recommendations for Assignment 14 (opponent modelling)](#11-recommendations-for-assignment-14-opponent-modelling)
12. [Recommendations for Assignment 16 (long-term strategic modelling)](#12-recommendations-for-assignment-16-long-term-strategic-modelling)
13. [Reproducing the diagnostics](#13-reproducing-the-diagnostics)

## 1. Scope and method

**Sources.**
- **The official rulebook.** Checked directly against the 2018-11-20 "highlights" PDF, the same file the review cites, from a copy already in the project.
- **The review's forum and BGG sources (S1–S9).** Each was attempted through the fetch tool.
- **Additional Brass: Birmingham strategy sources.** Found by web search. Brass: Lancashire advice is excluded unless a source compares the two games.

**Access.**
- From this environment, boardgamegeek.com, reddit.com, roxley.com, steamcommunity.com, eriktwice.com, gamepretty.com and eurostrategygames.com could not be fetched: a DNS failure or a blocked host. Search engines still returned excerpts from some of these sites.
- No forum post or article was read in full. Every non-rulebook claim below is graded accordingly.

**Evidence grades,** used throughout:

| Grade | Meaning |
|---|---|
| **R** | Official rule, verified in the rulebook |
| **V** | Independently verified: measured in this project's own engine experiments or traces |
| **E** | Repeated experienced-player advice: at least two independent sources make the claim |
| **O** | A single source's opinion or anecdote |
| **D** | Disputed: sources disagree |
| **U** | Unverified: cited by the review, but the source could not be read here |

**Access levels** in the bibliography:

| Level | Meaning |
|---|---|
| **F** | Read in full |
| **S** | A search-engine excerpt I saw directly |
| **S\*** | An excerpt reported by a search sub-agent, not seen directly |
| **X** | Inaccessible |

Repetition is never treated as proof. Only R and V findings are treated as
established. E is a reason to test, not to implement.

**AI evidence.**
- **New diagnostics.** `scripts/research/ai-gap.js` played 24 self-play games of the production AI (2 players: 10 games, 3 players: 8, 4 players: 6; seeds 900000+, never used before), and `scripts/research/ai-gap-trace.js` traces single decisions.
- **Earlier results.** Assignments 5–12 supplied the rest.
- No competitive experiments were run. That is for later assignments.

## 2. Review and verification of the supplied document

**The review's framing is sound.** It states that it is not a validated
strategy guide, separates mechanics from opinion, excludes Lancashire, and
asks for pre-registered experiments. Those cautions are kept here.

**What could and could not be verified:**

| Review finding | Sources cited | Verification here | Grade |
|---|---|---|---|
| 01 Rail links as scoring investment | S1, S2, S3 | The rulebook confirms how links score (flipped tiles' link icons, 2 per merchant) and that canal links are removed. **Our data:** links gain 1.3–2.2 VP after being built (section 9.3). S1–S3 unverified. "Links worth at least 5 points" could not be checked | R, V (mechanism); U (5-point advice) |
| 02 Double rail needs a beer-and-coal plan | S2, S4 | Rulebook: at most 2 rail links for £15, consuming 1 beer from a **brewery** (not a merchant), plus coal per link. Strategy content unverified; one excerpt calls the double rail "very efficient" [N4] | R, O |
| 03 Beer as bottleneck and enabler | S1, S2 | Unverified directly. Two independent blog excerpts call beer the most important or a scarce resource [N1, N2] | E |
| 04 Develop toward achievable high-level industries | S1, S5 | Rulebook: 1 iron per developed tile; lightbulb potteries cannot be developed; Level I tiles leave the board at the end of the Canal Era. The excerpts recommend developing so that Level II+ tiles built in the Canal Era score twice [N4, N7\*]. **Our data:** develop-then-build conversion matters (Assignments 9–10) | R, E, V (conversion) |
| 05 Early high-level cotton | S1, S5, S6 | Unverified. Excerpts both endorse Canal-Era Level II/III cotton [N4] and warn that cotton is contested [N13\*, N15\*] | D |
| 06 Manufactured goods: flexible timing and locations | S7 | Unverified. One excerpt: goods are weaker than cotton but situational, and the high levels score well [N2] | O |
| 07 Pottery high-risk, opportunistic | S1 | Unverified. One excerpt agrees: highest ceiling, easy to block, pursue only with suitable cards and merchants [N2] | E (2 sources incl. U) |
| 08 Borrowing versus income disputed | S1, S3 | Unverified. Excerpts: "each loan is a burned action" [N5]; "maximise VPs, not money" [N10\*]; coal overbuilding is a common mistake [N1, N4]. **Our data:** loans are mostly rational for this AI (Assignment 7), and income above a working level is not rewarded (Assignments 11–12) | E, V (partly) |
| 09 Use shared infrastructure opportunistically | S1, S2 | Unverified. One excerpt advises connecting to an opponent's obvious canal network [N15\*]. **Our data:** in 3- and 4-player games, opponents' flips supply about half of a link's later gain (section 9.3) | O, V (mechanism) |
| 10 Anticipate opponents from public evidence | S2, S4 | Unverified. No excerpt measured prediction accuracy | U |
| 11 Openings must respect actual hands | S8, S9 | S8 unverified. The point is methodological and obviously correct: an ideal-hand analysis cannot be a policy | Method |
| 12 Era timing drives commitments | S0, S2, S4 | Rulebook confirmed: two eras of 8/9/10 rounds (4/3/2 players), era-end scoring, Level I removal. **Our data (Assignment 10):** developing in the last two rounds is wasted | R, V |

**Corrections and cautions about the review:**
- **The rulebook URL is the same file** as the local copy (`Brass-Birmingham-Rulebook-2018.11.20-highlights.pdf`), and its mechanics claims check out.
- **Leftover money only breaks ties.** The rulebook says ties are broken first by income and then by money. The review does not say this, but it is the single most useful fact for the cash hypothesis.
- **Turn order is set by money spent.** The player who spent least goes first next round (rulebook, confirmed in a review excerpt [N16]). The review does not cover it, yet it couples spending and timing.
- **S5 is dated 2026,** and its ID format (`1sbulm5`) suggests a very recent post. That is plausible but could not be checked.
- **The review's P1 "opponent beer consumption" is not where this AI's plans break.** See section 9.4.

## 3. Bibliography

**Sources cited by the review:**

| ID | Source | Access | Used for |
|---|---|---|---|
| S0 | Roxley, *Brass: Birmingham* rulebook (2018-11-20 highlights PDF) — <https://files.roxley.com/Brass-Birmingham-Rulebook-2018.11.20-highlights.pdf> | **F** (the identical file, read locally) | All R findings |
| S1 | Reddit r/boardgames, "I need some fresh Brass Birmingham strategy tips!" (2020) — <https://www.reddit.com/r/boardgames/comments/fxbqsj/i_need_some_fresh_brass_birmingham_strategy_tips/> | X | U only |
| S2 | BGG, "Relative strength of strategies in Birmingham vs Lancashire" (2022) — <https://boardgamegeek.com/thread/2885798/relative-strength-of-strategies-in-birmingham-vs-l> | X | U only |
| S3 | BGG, "A Compilation of Brass: Lancashire vs Birmingham Comparisons" (2019) — <https://boardgamegeek.com/thread/2278384/compilation-brass-lancashire-vs-birmingham-compari> | X | U only |
| S4 | BGG, "Advance Strategy and Tactics - Hints" (2021) — <https://boardgamegeek.com/thread/2622371/advance-strategy-and-tactics-hints> | X | U only |
| S5 | Reddit r/boardgames, "Brass Love" (2026) — <https://www.reddit.com/r/boardgames/comments/1sbulm5/brass_love/> | X | U only |
| S6 | Reddit r/boardgames, "Brass Birmingham solved (?)" (2022) — <https://www.reddit.com/r/boardgames/comments/v93y8m> | X | U only |
| S7 | Reddit r/boardgames, "Specific Strategy question about Brass Birmingham" (2021) — <https://www.reddit.com/r/boardgames/comments/la1e52/specific_strategy_question_about_brass_birmingham/> | X | U only |
| S8 | BGG, "Optimal Openings" (2018) — <https://boardgamegeek.com/thread/2088185/optimal-openings> | X | U only |
| S9 | BGG, "Official Brass: Birmingham FAQ" (2020–) — <https://boardgamegeek.com/thread/2545744/official-brass-birmingham-faq> | X | Not used; the engine's rules audit settled rules questions separately |

**Additional sources:**

| ID | Source | Access | Claims used |
|---|---|---|---|
| N1 | Erik Twice, "Brass Birmingham: The most common beginner mistakes" (2020-11-06) — <https://eriktwice.com/en/2020/11/06/brass-birmingham-beginner-mistakes/> | S | Too many coal mines (coal feeds opponents; "losing while rich" signals over-built coal); time, not money, is the constraint; breweries are the most important industry; development denies you scarce barrels |
| N2 | Erik Twice, "Brass Birmingham: Understanding the industries" (2021-01-15) — <https://eriktwice.com/en/2021/01/15/brass-birmingham-understanding-the-industries/> | S | Pottery: highest ceiling, easy to block, pursue only with suitable hand and merchants; breweries or cotton over weaker industries; goods levels V–VIII score well |
| N3 | Erik Twice, "Should you develop your level I breweries?" (2021-08-06) — <https://eriktwice.com/en/2021/08/06/brass-birmingham-develop-level-breweries/> | S | Developing away Level I breweries reduces your beer supply; each player has only seven brewery tiles |
| N4 | ChrisLuv, "Avoiding Beginner Mistakes in Brass Birmingham" (Steam guide), mirrored as "Beginners' Guide (Avoiding Simple Mistakes)" — <https://gamepretty.com/brass-birmingham-beginners-guide-avoiding-simple-mistakes/> | S | The game is action optimisation (31/35/39 actions per player at 4/3/2 players); don't overproduce coal; Level II+ tiles built in the Canal Era score twice; coal is key to rail; double rail is very efficient |
| N5 | Steam discussion, *Brass: Birmingham* — <https://steamcommunity.com/app/1287920/discussions/0/3047231300186949614> | S | "Each loan is a 'burned' action": use loans deliberately, neither avoided nor overused |
| N6 | IM Spoon, "Brass strategy - guide to score 5VP/action and win the game", BGG thread 3100883 — <https://boardgamegeek.com/thread/3100883/brass-strategy-guide-to-score-5vpaction-and-win-th> | S\* (not confirmed by my own searches) | About 5 VP per action is needed to win; a single rail is often worth 6+ VP |
| N7 | Strategy Eurogames, "Strategy Notes" (notes on an interview with Mafiul Robin) — <https://www.eurostrategygames.com/strategy-notes> | S\* (not confirmed) | Take loans and developments (non-scoring actions) in the Canal Era and score in the Rail Era; build few canals; managing turn order is a skill |
| N8 | Legendary Tactics with Mafiul Robin, strategy videos (YouTube) — <https://www.youtube.com/watch?v=GZG5zzrM-wY>, <https://www.youtube.com/watch?v=SVYKyjFLhpM> | S\* (chapter titles only) | Annotated gameplay exists; content not reviewed |
| N9 | BGG 2571272, "Brass: Birmingham strategy primer and openings (4p)" — <https://boardgamegeek.com/thread/2571272/brass-birmingham-strategy-primer-and-openings-4p> | S\* | Actions, not money, are scarce; resource industries offset loans; overbuilding checks a runaway leader |
| N10 | BGG 3061778, "Loans" — <https://boardgamegeek.com/thread/3061778/loans> | S\* | "Maximise VPs, not money" |
| N11 | BGG 2669119, "New Player - Tips for first three turns" — <https://boardgamegeek.com/thread/2669119/new-player-tips-for-first-three-turns> | S\* | High income is not needed to win; avoid a coal focus at first |
| N12 | BGG 2037786, "Strategic tidbits new to Birmingham" — <https://boardgamegeek.com/thread/2037786/strategic-tidbits-new-to-birmingham> | S\* | Early development forces loans sooner |
| N13 | BGG 3398674, "How to fight against cotton strategy in 2p?" — <https://boardgamegeek.com/thread/3398674/how-to-fight-against-cotton-strategy-in-2p> | S\* | A strong 2-player cotton opening is hard to counter |
| N14 | TheTablePriest, "Mastering Brass: Birmingham: Tempo Plays & High-Impact Openings" — <https://thetablepriest.com/mastering-brass-birmingham-tempo-plays-high-impact-openings/> | S\* | A Canal-Era "iron and develop" opening |
| N15 | Meeple Power, "Teaching Brass Birmingham Strategy" (Medium) — <https://medium.com/@meeplepower/teaching-brass-birmingham-strategy-lessons-from-watching-players-struggle-5120b5b77f4b> | S\* | Cotton is where everyone fights; connect to an opponent's obvious network; the two eras are one arc |
| N16 | RPG.net, "Review of Brass: Birmingham" — <https://www.rpg.net/reviews/archive/18/18636.phtml> | S | Turn order follows money spent |

**Sources sought but not found:** no Board Game Arena forum strategy thread,
and no written annotated game analysis, turned up in searches.

## 4. Economic and industry strategy

### 4.1 Income, borrowing and cash

| Finding | Grade | Evidence |
|---|---|---|
| Leftover money only breaks ties (after income) | **R** | Rulebook, end of game |
| A loan is £30 and 3 income levels down; no loan may take income below −10 | **R** | Rulebook, Loan action |
| Actions, not money, are the binding constraint; there are 31/35/39 actions per player per game (at 4/3/2 players) | E | N1, N4; N9\* |
| Each loan costs an action ("burned"), so it must buy something that scores | E | N5; N10\* |
| High income is not needed to win; over-building coal for income is a common mistake | E | N1, N4; N11\* |
| Take non-scoring actions (loans, development) in the Canal Era and score in the Rail Era | O | N7\* only |
| For this AI, loans are mostly a rational response to low cash; a better loan rule was not found | **V** | Assignment 7 |

**What it means for the AI.**
- **Strategy and rules agree:** cash has no value at the end except through what it can still buy.
- **The AI shows two cash problems.** Both are clear, measured and reproducible (section 9.1):
  - it ends with £47–54 unused;
  - it takes loans in its last round.

  This is not a matter of strategic taste: the AI gives up VP it could have scored.
- **Income level is not a reliable target.** Human advice warns against chasing it, and the AI's planner gains strength while ending with higher income than the heuristic (Assignment 12). No fixed "ideal income" should be imposed.

### 4.2 Development

| Finding | Grade | Evidence |
|---|---|---|
| Developing costs an action and 1 iron per tile; lightbulb potteries cannot be developed | **R** | Rulebook |
| Level I tiles leave at the end of the Canal Era; Level II+ tiles stay and score again | **R** | Rulebook |
| Develop toward Level II+ industries built in the Canal Era, so they score twice | E | N4, N7\*; review S1/S5 (U) |
| Developing without a route to build wastes actions | E | Review S1 (U); **V:** Assignments 9–10 (late developments were almost never built) |
| Developing away Level I breweries is not automatically right | D | N3, N1 vs common advice |
| Early development forces loans sooner | O | N12\* |

**AI comparison.**
- **It hardly develops.** The production AI develops 0.8–1.4 times per player per game, 0.1–0.3 of them in the Canal Era. The old heuristic developed 5.4–6.3 times (Assignment 9).
- **What it does develop, it uses:** 67–72% of developed industries are built afterwards. In the Assignment 9 diagnostic the heuristic built about half (51%) of what it developed.
- **It does keep tiles across the era boundary.** The mean level of its Canal-Era tiles is 1.3–1.7, and it builds 1.6–4.1 Level II+ tiles per player in the Canal Era, 1.5–3.1 of which survive to the end. That is "incidental" double-scoring.
- **Interpretation:**
  - The position value has no term for development: it sees only the change in VP, income and money.
  - So development is chosen only when the build it enables falls inside the four-action horizon.
  - Human advice suggests a longer reason to develop (double-scoring tiles, access to Rail-Era levels).
  - Whether more development would win more games is **unknown**: Assignments 9–10 showed over-development was costly.

### 4.3 Industries

| Industry | Human view (grade) | AI behaviour |
|---|---|---|
| **Breweries** | Most important or scarce; enable sales and double rails (E: N1, N2, N4) | Builds 1.4–1.8 per Canal and 1.5–2.0 per Rail Era (Assignment 12 self-play). Sales use its own beer 33–37 times, merchant beer 48–68 and opponents' beer 4–14 (per 6–10 games) |
| **Cotton** | Strong if uncontested; contested at 2 players (D: N4 vs N13\*/N15\*) | Built about 1.6–2.0 times per player per game, with no specialisation |
| **Manufactured goods** | Situational; high levels score well (O: N2) | 1.7–2.6 per player per game |
| **Pottery** | Highest ceiling, easy to block; needs a suitable hand and merchants (E: N2; review S1 U) | 0.7–1.0 per player per game |
| **Coal** | Support industry; over-building it is a common mistake; it feeds opponents (E: N1, N4) | 3.6–6.0 per player per game. Its builds take coal from its own mines 21–40% of the time and from opponents' 32–43% |
| **Iron** | Higher-level iron is an edge in the Rail Era; iron makes overbuilding possible (O: N9\*) | 2.1–3.2 per player per game |

Build counts in this table come from the Assignment 12 three-action self-play (50 games per player count); the beer counts come from this assignment's diagnostics.

**Specialisation versus flexibility.**
- No source verified here supports a universally dominant industry.
- The cotton claims are tied to 2-player games with a single cotton player (D).
- The AI is flexible by construction: every decision re-ranks all candidates, with no notion of a goal.
- Whether a committed specialisation would beat that is untested (section 10, H-IND).

## 5. Network, beer and shared resources

| Finding | Grade | Evidence |
|---|---|---|
| A link scores its neighbours' link icons on flipped tiles, plus 2 per merchant; canal links are removed after Canal scoring | **R** | Rulebook |
| Double rail: 2 links for £15, plus coal per link, plus 1 beer from a brewery | **R** | Rulebook |
| Links are a major, efficient source of VP; rails often 6+ VP; build many rails, few canals | E/D | N4, N6\*, N7\*; "few canals" disputed |
| Links gain value as neighbours flip later, including opponents' flips | **V** | Section 9.3: +1.3 to +2.2 VP per link after it is built; in 3- and 4-player games about half from opponents |
| Beer is scarce and contested; build your own supply | E | N1, N2, N3 |
| Use opponents' networks and breweries opportunistically | O | N15\*; review S1/S2 (U) |
| Opponents' coal and iron serve your builds, and yours serve theirs | E | N1, N4 |

**AI comparison.**
- **Short-term link value only.** The planner values a link only by what it would score if the era ended now. Yet links built by the AI gain on average another 1.3 (2 players, Canal) to 2.2 VP (4 players, Rail) before their era ends, so the AI under-rates links next to industries that will flip. The size of that bias's cost is unknown.
- **Double rail** is in production since Assignment 10. The planner sees it only through the heuristic's double-rail candidate.
- **Shared beer.** The AI already leans on merchant beer, its largest source. Opponents' breweries supply only 5–12% of its beer, so it seldom depends on beer an opponent could take first.

## 6. Opponent awareness

**What human sources say (E/O).**
- Look at rivals' boards, network and likely builds.
- Watch who competes for cotton and beer.
- Overbuilding checks a runaway leader.
- Turn order (who spent least) matters.
- None of the sources reviewed measures prediction accuracy. All of it is qualitative.

**What the public game state supports**, without hidden cards:

| Signal | Shows | Use for prediction |
|---|---|---|
| An opponent's network and adjacent free spaces | Where they can build or link next | Legal options (exact) |
| Their unflipped sellable tiles, with merchant connections | Pending sales, and the beer they will consume | Likely options (strong) |
| Their lowest remaining tile levels (player boards are public) | Which industries they can still build, and at what level | Legal options |
| Money, income, loans | Whether they can afford expensive actions | Legal and likely options |
| Discarded cards (face up) | Some information about the deck | Weak |
| Rounds left and turn order | How many actions they have before ours | Exact |

**Three questions, kept separate:**
- **What an opponent can legally do** is computable from the observation, apart from hand cards.
- **What would benefit them** can be approximated by running our own heuristic or planner from their seat.
- **What they will choose** cannot be known without their hand. A fair model must either average over the cards we cannot see (resampling them from the unseen pool, as the fairness tests already do) or use card-free proxies.

**AI comparison.**
- Within its current turn the planner is exact.
- **Beyond the turn it assumes opponents do nothing,** and discounts those gains by 0.6. In self-play, 15–19% of its next-turn plans are illegal by the time it moves (section 9.4).
- The AI never reasons about turn order or about denying an opponent.

## 7. Era-level and long-term planning

| Finding | Grade | Evidence |
|---|---|---|
| Two eras; Level I tiles and canal links removed at the end of the Canal Era; Level II+ tiles score in both | **R** | Rulebook |
| An investment must be able to pay off before its era ends (or survive into the next) | R/E | Rulebook mechanics; review 12 (U); **V:** Assignment 10 develop horizon |
| Canal-Era choices decide Rail-Era success; treat the eras as one arc | O | N15\* |
| Front-load non-scoring actions; score in the Rail Era | O | N7\* |
| Openings must respect the actual hand | Method | Review 11 |

**AI comparison.**
- **The horizon is four of its own actions:** this turn and the next. It covers 2 to 5% of a player's 31–39 actions.
- **Long-term effects enter only through the position value:**
  - expected VP of unflipped tiles;
  - income, which the heuristic's weight scales by the rounds left in the era;
  - money.
- **The position value cannot see:**
  - tiles that will survive into the Rail Era (Level II+ in the Canal Era);
  - links' future value;
  - the end of the game for money;
  - industries that development would unlock.
- **Consequence:** era-level behaviour such as early development or positioning for the Rail Era appears only when it happens to pay off within two turns.

## 8. Conflicting viewpoints and limits of the evidence

**Conflicts:**

| Topic | Positions | Status |
|---|---|---|
| Developing away Level I breweries | Develop past them (common advice), versus keep them for beer supply and score (N3) | D |
| Early cotton | A strong winning plan (N4; review S5/S6, U), versus contested, avoid unless the only cotton player (N13\*, N15\*) | D; likely depends on player count and opponents |
| Canals | Build few, since they are removed and score little (N7\*), versus dynamic link scoring makes them worth more (review S2, U) | D. **Our data:** Canal-Era links score 3.3–4.1 VP each by the era's end |
| Turn order | Spending free actions on it is a mistake (N4), versus managing it is a key skill (N7\*) | D |
| Income | Coal for income pays for itself (N2), versus high income is not needed (N11\*) | D, but reconcilable: income is a means, not a goal |

**Limits:**
1. **No forum or BGG source could be read in full.** The excerpts are short, can mislead, and may be paraphrased by the search tool. Claims marked S\* came through a sub-agent's searches and were not seen directly.
2. **Many sources address beginners.** Advice like "don't overbuild coal" tells us what new players get wrong, not what experts do.
3. **High-score anecdotes** (for example 2-player cotton, or 5 VP per action) depend on opponents and player count. None is a controlled comparison.
4. **The AI's own data are self-play.** They show what the production AI does, not whether a different policy would win more. Every "gap" in section 9 is a hypothesis about strength until tested.
5. **This environment's network policy is the main limitation.** Running the verification again where boardgamegeek.com and reddit.com are reachable would upgrade or remove the U and S\* claims.

## 9. Capability-gap analysis of the production AI

**The diagnostics.**
- `scripts/research/ai-gap.js` ran 24 self-play games: the four-action planner in every seat, with no wall-clock cut-off so the games are reproducible.
- Seeds were 902001–902010 (2 players), 903001–903008 (3 players) and 904001–904006 (4 players).
- Full output is in `research-a13/gap-{2,3,4}.md`, which the commands in section 13 regenerate. Mean final VP was 96.5–103.8 per player.

**Each gap is classified by where it lives:**
- the **evaluator** (position value);
- **candidate generation** (the heuristic's shortlist);
- **depth** (the four-action horizon);
- **opponent prediction**;
- **goal selection**.

### 9.1 Endgame cash and last-round loans — gap confirmed (evaluator and candidate generation)

| Measure | 2 players | 3 players | 4 players |
|---|---|---|---|
| Money at the end (mean / max) | £46.5 / £170 | £53.9 / £157 | £46.8 / £129 |
| Money at the start of the last round | £34.2 | £43.1 | £38.6 |
| Last-round decisions that were loans | 12 of 40 | 14 of 48 | 13 of 48 |
| Last-round non-scoring decisions with a 1+ VP link legal and affordable | 12 (30%) | 14 (29%) | 12 (25%) |
| …turns that then ended with such a link still unbuilt (final turn not counted) | 2 | 6 | 8 |

**Reproducible example** (`ai-gap-trace.js --players 4 --seed 904002 --player 0 --round 8`):
- **The situation.** Rail round 8, the last round. Player 0 has £24 and two actions left.
- **The plan chosen** is "take a loan, then sell", valued at +20.0 by the position value.
- **The better alternative.** Linking Derby–Uttoxeter (7 VP at once) and then making the same sale is valued at **+24.0**.
- **Why the planner missed it:**
  1. **Candidate generation.** The heuristic scores that link −0.35, ranking it 5th of 10 links. The planner takes only the top 3 links, so it never considers it.
  2. **Evaluator.** The loan is rated +3.4 in the final round: £30 at the heuristic's money weight, less a small income cost. Yet money left at the end only breaks ties.
- **The outcome.** The player ends the turn with £54 and the 7-VP link unbuilt. The same happens to players 2 and 3 in that game.

**Why it matters:**
- A loan in the last round never pays off, and the money it raises cannot score.
- Links available at the end of the game are often worth 3–8 VP.
- At 4 players, 8 turns in 6 games left such a link unbuilt, plausibly several VP per player per game. The exact cost needs an experiment.

**Root cause:** the evaluator and candidate generation, not depth.

### 9.2 Development — representational gap (evaluator and goal selection); cost unknown

| Measure | 2 players | 3 players | 4 players |
|---|---|---|---|
| Develop actions per player per game (Canal / Rail) | 0.3 / 1.1 | 0.2 / 0.6 | 0.1 / 0.7 |
| Developed industries built afterwards | 67% | 69% | 72% |
| Mean level of tiles built, Canal / Rail | 1.7 / 2.7 | 1.6 / 2.7 | 1.3 / 2.6 |
| Level II+ tiles built in the Canal Era (per player) | 4.1 | 3.3 | 1.6 |
| …still on the board at the end | 3.1 | 3.0 | 1.5 |

**Examples of development without a later build** (`gap-2.md`): seed 902001, player 0 developed a manufacturer with 10 game rounds left, and breweries and cotton with 5 left. None was built afterwards.

**Assessment.**
- **It contradicts no rule** and does not obviously lose VP. The planner beat the heavier-developing heuristic by 32–43 VP on held-out seeds (Assignment 11).
- **But the evaluator cannot represent the human reason to develop:** reaching tiles that score twice, or higher Rail-Era levels. It develops only when the payoff is within the horizon.
- **It explains the smaller Level II+ Canal investment at 4 players** (1.6 per player), where Canal rounds are fewest.
- **Status:** a plausible missed opportunity; not established.

### 9.3 Links — evaluator gap (no anticipation of future flips)

| Measure (per link built by the AI) | 2p Canal | 2p Rail | 3p Canal | 3p Rail | 4p Canal | 4p Rail |
|---|---|---|---|---|---|---|
| VP if the era ended when built | 2.0 | 2.8 | 1.9 | 2.6 | 1.9 | 2.4 |
| VP at the era's end | 3.3 | 4.4 | 3.8 | 4.4 | 4.1 | 4.5 |
| Gain from its own later flips | 1.0 | 1.0 | 1.1 | 0.9 | 1.2 | 1.0 |
| Gain from opponents' later flips | 0.3 | 0.6 | 0.8 | 0.9 | 1.0 | 1.1 |

**What the table shows:**
- Links end their era worth 1.3–2.2 VP more than when built, an increase of 55–115%.
- Opponents' flips supply a growing share as the player count rises: at 4 players, about half.
- The position value counts only the value at the time of building, so the AI under-rates links next to tiles that are likely to flip (its own unflipped tiles, opponents' pending sales).
- **The links the AI builds are almost never worthless:** only 4–14% were worth 0 VP when built, and almost all of those gained value.
- So the gap is in **ranking** links, not in building bad ones.
- **Status:** mechanism verified; competitive cost unknown.

### 9.4 Opponent interference — the real disruption is contested spaces and links, not beer

| Measure | 2 players | 3 players | 4 players |
|---|---|---|---|
| Plans with an action beyond the current turn | 700 | 744 | 648 |
| That action still legal at the AI's next decision (any card) | 85% | 84% | 81% |
| …and actually played | 21% | 22% | 20% |
| Failures: build space taken or unreachable | 55 | 60 | 69 |
| Failures: link taken or unreachable | 29 | 38 | 37 |
| Failures: beer gone | 4 | 7 | 6 |
| Failures: sale no longer possible | 10 | 7 | 6 |
| Failures: other (iron, money, loan limit, merchant) | 8 | 7 | 4 |

**Findings:**
- **Interference grows with player count.** About one planned next-turn action in six is invalidated by the time the AI moves (15% at 2 players, 19% at 4).
- **Occupied spaces and links cause 80–90% of failures.** Beer causes 4–6% (4–7 failures out of 650–750 plans).
- **Most plans are re-made anyway.** Only about 21% of planned next-turn actions are actually played. That is partly the horizon effect: a new plan with new information. A planned action can therefore be wasted even when it stays legal.
- **Implication:** the review's P1 ("predicting threats to shared beer") is not where this AI loses its plans. Contested spaces and links are. Beer may still matter more for human players, who rely on opponents' beer more than this AI does (it uses opponents' beer for only 5–12% of sales).

### 9.5 Loans and collapse — known, partly evaluator

- **Loans** run at about 4.4–6.0 per player per game (Canal 2.6–3.5, Rail 1.8–2.5), with 0.8–0.9 in the game's last two rounds.
- **Collapse.** One player in 68 player-games (2 players, seed 902001) collapsed to the −10 income floor with 0 VP; Assignment 12 found 4 in 450. The same evaluator term is responsible: money valued at a fixed rate whatever the time left.

### 9.6 What the AI already does in line with human advice

- **Rails over canals:** it builds 4.8–6.9 rails against 3.9–4.7 canals per player per game, and double rails since Assignment 10.
- **No over-development** (the opposite risk now), and no development late in the game.
- **No over-built coal for income:** the planner chooses on VP and income together.
- **It sells what it builds:** only 0.2–0.3 sellable tiles per player are left unflipped at the game's end (Assignment 12).
- **It uses merchant beer heavily,** sparing its own breweries.
- **It is flexible:** no fixed specialisation.

### 9.7 Summary of gaps

| Gap | Where it lives | Evidence | Likely impact |
|---|---|---|---|
| Money valued at the end of the game; last-round loans | Evaluator | **V** (trace, measurement) | Medium: several VP in some games, plus the rare collapse |
| Scoring links not proposed as candidates | Candidate generation | **V** (trace) | Medium |
| Links valued only at their current value | Evaluator | **V** (mechanism) | Unknown |
| Development without a long-term value | Evaluator and goal selection | **V** (behaviour) | Unknown; could be negative |
| Next-turn plans invalidated by opponents | Opponent prediction | **V** (15–19% of plans) | Unknown |
| No turn-order reasoning | Evaluator | Representational only | Unknown |
| No value for cards in hand | Evaluator | Representational only (Assignment 12) | Unknown |

## 10. Prioritised hypothesis catalogue

**Priority** combines four things:
- evidence quality (R/V above E above O/D/U);
- potential impact;
- feasibility;
- the demonstrated AI weakness.

"A14", "A15" and "A16" are the proposed assignments. Every hypothesis is to be
tested against the production AI under pre-registered criteria on held-out
seeds, as in Assignments 7–12.

| ID | Hypothesis | Human evidence | Conflicting evidence | Suspected AI weakness | Intervention | Metrics | Complexity and cost | Risks | Priority / where |
|---|---|---|---|---|---|---|---|---|---|
| **H-CASH** | Valuing money by the opportunities left to spend it reduces waste | **R:** money only breaks ties. E: "maximise VP, not money" (N10\*, N5) | None on the end of the game. Mid-game liquidity is valued (D) | Money at full value in the last rounds; last-round loans (9.1) | Scale the money term in the position value by remaining spending opportunities (zero at the last action), without changing income weights | Held-out VP and win share; money left; last-round loans; collapse rate | Very low: one evaluator term; no cost | Under-funding late builds if scaled too early. Test 2–3 schedules | **P1**: a small evaluator experiment before or alongside A14 (or the first part of A16) |
| **H-CAND** | Proposing VP-scoring links (and other immediate scorers) as candidates improves late decisions | **R:** link scoring. E: rails often worth 6+ VP (N6\*, N4) | None | The heuristic ranks links by access; scoring links are missed (9.1 trace) | Add the top 1–2 links by immediate link VP (and best sale value) to the planner's candidates | VP; last-round links missed; decision time | Low: 1–2 more candidates, about +10–20% time | Slightly slower; more speculative links early on | **P1**: with H-CASH |
| **H-OPP-SPACE** | Predicting contested build spaces and links improves cross-turn plans | O/U: watch rivals' boards and networks (review S2/S4); E: cotton and beer contested (D) | No measured accuracy in any source | 15–19% of next-turn plans invalidated, mostly occupied spaces and links (9.4) | Discount or drop plan steps whose space or link a plausible opponent move would take before our turn (section 11) | Prediction calibration; plan validity; held-out VP | Medium: one opponent heuristic call per opponent per decision, about +30–60% time | Over-pessimism; extra cost | **P1**: A14, the main model |
| **H-OPP-BEER** (review P1) | Predicting threats to shared beer improves planning | E: beer scarce and contested (N1–N3); review S1/S2 (U) | **V:** beer causes only 4–6% of this AI's plan failures | Rarely binding for this AI | Include beer and cube consumption in the opponent model above, not separately | Beer-related plan failures; calibration | Low on top of H-OPP-SPACE | Little measurable effect | **P2**: part of A14, not a separate model |
| **H-RAIL** | Anticipating future flips next to a link improves network decisions | **R:** link scoring. **V:** links gain +1.3–2.2 VP after building (9.3); review 01 (U) | "Build few canals" (N7\*) | Link value counted only now | Add to the position value the expected value of link icons on neighbouring unflipped tiles: own (flip probability) and opponents' (sale readiness) | VP; link VP at era end per link; links built | Low to medium: evaluator term; small cost | Double counting with the industry terms; over-linking | **P1**: A16 (or the evaluator experiment) |
| **H-DEV** | Linking development to attainable builds increases its value | E: develop toward Level II+ that scores twice (N4, N7\*). **V:** develop-then-build conversion matters (Assignments 9–10) | D: brewery development (N3); over-development was costly (Assignments 9–10) | No long-term value for development (9.2) | Value a developed tile by the best attainable build it unlocks (cards, space, iron, rounds) and its persistence into the Rail Era | Develop-then-build rate; Level II+ Canal tiles; VP | Medium: candidate and evaluator terms | Re-creating the heuristic's over-development | **P2**: A16 |
| **H-ERA** | Valuing a tile's persistence into the next era (and the end of the game) improves investment timing | **R:** Level II+ scores in both eras. E: N4, N7\* | O only on timing | The position value ignores era boundaries | Era-aware terms: expected second-era VP for Level II+ Canal tiles; worthless Level I and canal links near the Canal end | VP by era; tiles surviving; held-out VP | Medium | Mis-calibration around the boundary | **P2**: A16 |
| **H-IND** | Flexible objectives outperform rigid specialisation | D: cotton dominance (N4, review S5/S6 U) versus contested (N13\*, N15\*) | Strongly player-count dependent | None shown: the AI is flexible | Test a "committed industry" goal bonus against flexible play, by player count | VP and win share by player count; mixed tables | Medium | Specialisation may only work against weak opponents | **P3**: A16, low priority |
| **H-TURN** | Accounting for turn order (spend versus act first) improves contested plays | D: N4 versus N7\*. **R:** order follows money spent (rulebook, N16) | Disputed | The AI ignores turn order | A small term for expected turn position when competing for contested spaces | Contested-space wins; VP | Medium | Noise; little effect | **P3**: after A14 |
| **H-HAND** | Valuing cards in hand improves scouting and discards | O | Assignment 10: discard rules were neutral | The position value ignores the hand | A card-usefulness term in the position value | VP; scouts; discards | Low | Already neutral once (Assignment 10) | **P3** |

## 11. Recommendations for Assignment 14 (opponent modelling)

**Aim.** Make the planner's next-turn steps account for what opponents are
likely to do first, using public information only. Keep the four-action
planner; do not build an opponent game tree.

**Recommended models** (a small set, each compared with the current
"opponents pass" assumption):

1. **M0, the baseline.** Opponents do nothing between our turns (production), with the 0.6 discount.
2. **M1, contested-step discount (public, card-free).** For each next-turn plan step, estimate the chance that an opponent takes that space or link first, from public signals:
   - is it adjacent to their network?
   - can they afford it?
   - does their player board have that industry at a level they can build?
   - is it a merchant link?

   Multiply the step's value by (1 − chance). It is cheap, needs no simulation and is easily audited. The chances are fitted on self-play logs, not on forum advice.
3. **M2, one heuristic move per opponent (fair sampling).** Before the AI's next turn, let each opponent between our turns play the heuristic's best move on the observation, with their hidden hand **resampled from the unseen cards** (the fairness tests' "alternate world"). It is applied once, or averaged over 2–4 samples. Our next-turn steps then face a plausible board, including beer and cubes used.
4. **M3, worst-of-k (robustness variant).** Value next-turn steps by the worst of k sampled opponent responses. This tests whether pessimism helps.

**Evaluation (pre-register):**
- **Calibration:** predicted against observed invalidation of next-turn steps. The current rate is 15–19%, mostly spaces and links.
- **Plan validity and realisation.**
- **Held-out VP and win share** against production at 2, 3 and 4 players, and in mixed tables.
- **Decision time** against the Assignment 12 budgets: M2 adds about 1–3 heuristic calls per opponent per decision.
- **Fairness:** no hidden cards, checked with the alternate-world test.

**Expected difficulty:**
- **M1** is simplest and could show quickly whether contested-space awareness pays.
- **M2** is more faithful but costs time; at 4 players the four-action budget leaves little headroom on slow devices.
- **Implement in Assignment 15** only the model whose held-out gain survives.

**Not recommended for Assignment 14:**
- a separate beer model (fold beer and cubes into M2);
- full opponent search;
- learning opponent policies.

## 12. Recommendations for Assignment 16 (long-term strategic modelling)

**Aim.** Give the planner reasons to invest beyond its four-action horizon
without replacing it. A **strategic layer** should feed the existing tactical
planner in two ways:
- as extra terms in the position value;
- as extra candidates in the planner's shortlist.

**Recommended components, in priority order:**

1. **End-of-game awareness (H-CASH, H-CAND).**
   - If not already done in a small evaluator experiment, this comes first.
   - The money term falls to zero as spending opportunities run out.
   - Scoring links and sales are always proposed as candidates.
   - The cheapest, best-evidenced gain.
2. **Expected link value (H-RAIL).** Credit a link with the expected link icons of neighbouring tiles likely to flip by the era's end: own unflipped tiles by flip probability, opponents' by sale readiness.
3. **Era-aware investment (H-ERA).** Credit Level II+ Canal-Era tiles with their expected Rail-Era score, and discount Level I tiles and canal links near the end of the Canal Era.
4. **Goal-directed development (H-DEV).** Value a Develop by the best attainable build it unlocks (cards in hand or likely, a free space, iron price, rounds left), so development happens when it leads somewhere.
5. **Strategic flexibility (H-IND).** Test only after 1–4. Compare a light "current objective" bias (for example an industry or region chosen per era) with pure flexibility. Human evidence for specialisation is disputed and player-count specific.

**Method.**
- Each component is one evaluator or candidate change with its own pre-registered test.
- Components are combined only after each passes, as in Assignments 8–12.
- Watch for double counting: for example, link value against industry VP for the same tile.
- Decision time should change little: these are evaluation terms, not search.

**Ordering note.** The evidence suggests the cheapest and surest gains (H-CASH,
H-CAND, perhaps H-RAIL) are evaluator and candidate fixes, not opponent
modelling. It would be reasonable to test them first, as a short evaluator
experiment, so that Assignment 14's opponent models are measured against the
improved planner. That is a recommendation, not a change of plan.

## 13. Reproducing the diagnostics

The diagnostics use Node.js 22+ and are deterministic, because the planner runs
without its wall-clock cut-off. Raw output goes to the git-ignored
`research-a13/` folder. Neither script changes the game or the AI.

```
node scripts/research/ai-gap.js --players 2 --seeds 10 --examples 4 > research-a13/gap-2.md   # about 3 min
node scripts/research/ai-gap.js --players 3 --seeds 8 --examples 4 > research-a13/gap-3.md
node scripts/research/ai-gap.js --players 4 --seeds 6 --examples 4 > research-a13/gap-4.md
node scripts/research/ai-gap-trace.js --players 4 --seed 904002 --player 0 --round 8         # the section 9.1 example
```

Earlier assignments supply the remaining AI evidence:
- Assignment 7: loans.
- Assignments 9 and 10: selling and development.
- Assignments 11 and 12: planner behaviour and self-play.

| New file | Purpose |
|---|---|
| `scripts/research/ai-gap.js` | Capability-gap diagnostics: cash, development, link anticipation, plan disruption, beer, loans |
| `scripts/research/ai-gap-trace.js` | Trace of one last-round decision: the plan chosen, candidates, and alternatives' position values |
| `docs/research/human-strategy-a13.md` | This report |
