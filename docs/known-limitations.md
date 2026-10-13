# Known Limitations and Future Work

This is the current list. The assignment reports in [`history/`](README.md#history)
record the limitations as they stood at each stage.

## Gameplay and interface

- **Hotseat only.** All players share one screen. There is no online multiplayer.
- **Hands are not hidden between human players.** When the turn changes, the next player can see the previous player's hand.
- **No save, load or undo in the interface.** The engine supports them through `serialize` / `deserialize` and `clone` ([`state-model.md`](state-model.md)), but no UI uses them yet.
- **No automated browser tests.** CI tests the engine headlessly; the interface is checked by hand.

## AI

- **The AI plans a few actions ahead (since Assignment 12).** Normal and Hard plan four of their own actions ahead (`js/aiPlanner.js`) on the player's observation, with a 2.5 s limit per decision. Easy plays the heuristic AI inherited from upstream and improved in Assignments 6–10 ([planning AI](research/ai-planning-a12.md)).
- **Fair information (since Assignment 6).** Every difficulty decides on the player's observation, so no AI sees opponents' hands, the deck order or the game RNG ([AI corrections](research/ai-corrections-a6.md)). The research baseline `AIPlayer.LEGACY_A5` keeps the old Hard leak on purpose and is not a fair benchmark.
- **The AI is still weak, and its levels are close together.** The [AI audit](research/ai-baseline-audit.md) and the [Assignment 6 report](research/ai-corrections-a6.md) give the measurements. Overbuild scoring was fixed in Assignment 8 ([overbuild research](research/ai-overbuild-a8.md); +3.6 to +4.0 VP per game). Building sellable industries where they could not be sold was fixed in Assignment 9 ([investment research](research/ai-invest-a9.md); +9.3 to +10.5 VP per game). Assignment 10 added double rail links and stopped development in the last two rounds ([audit closure](research/ai-audit-a10.md); +5.2 to +8.1 VP). The [audit checklist](research/ai-audit-checklist.md) gives the status of every original finding. Normal and Hard are still level (+0.7 ± 2.3 VP): separating the levels needs a decision on what each should be.
- **Development is valued without asking whether the industry will be built.** Since Assignment 10 the AI no longer develops in the game's last two rounds, but about a third of developed industries are still never built (two thirds before).
- **Discards and resource sources are simple.** The AI discards the first card a non-Build action accepts, and leaves coal, iron and beer sources to the engine. Assignment 10 tested better-looking rules for both; neither made a measurable difference.
- **The planner's position value has known gaps** ([Assignment 12](research/ai-planning-a12.md), section 7):
  - It keeps valuing money at the end of the game, so the AI finishes with £50–67 unspent.
  - It can over-borrow late, so about 1% of player-games collapse into loans and shortfalls.
  - It gives no value to development or to cards in hand.
- **Normal and Hard are identical, and Easy is much weaker.** Choosing what each level should be is a product decision still to be made.
- **On slow devices the AI can pause the page for up to about 2.7 s.** With the CPU throttled 4×, four-action decisions average 0.8–0.9 s, and the planner runs on the main thread. A Web Worker would remove the pause if it matters on real phones.
- **Frequent loans (about 5 per player per game).** Assignment 7 found these are mostly a rational response to the AI being chronically out of cash. No better loan rule was found, so the heuristic is kept ([loan research](research/ai-loans-a7.md)). The cash shortage comes from the spending heuristics. Fixing overbuilding in Assignment 8 did not reduce loans; the Assignment 9 selling change reduced them slightly (by 0.2–0.4).

## Engine

- **Low-level steps are still public.** `advanceTurn`, `endCanalEra`, `applyMove` and similar can be called directly for focused tests. Real games must go through `play`; this is documented, not enforced.
- **Performance.** A clone takes about 70 µs, and a fully expanded `getLegalMoves` about 10–30 ms with up to about 560 moves. Deep search would want lazy move generation or a cheaper move list.

## Rules interpretations

Where the rulebook is not explicit, the engine keeps the behaviour of the
original implementation:

- **Gloucester's free develop may be skipped.** The rulebook describes the bonus without saying it is compulsory.

The [rules audit](history/brass-review-findings.md) records how every other
rules question was settled.

## Maintenance

- **No software licence.** Neither this fork nor the upstream repository has a licence file, so the default copyright rules apply. A licence can only be added by, or with the agreement of, the copyright holders, starting with the upstream author.
- **Artwork copyright.** The bundled board, card, tile and player-mat art under `assets/` is the publisher's copyright, inherited from upstream. Anyone redistributing the project should consider replacing it ([`board-artwork.md`](board-artwork.md)).
- **No `package.json`.** The project has no dependencies, so there is no `npm test`. The commands are documented in [`testing.md`](testing.md) and run in CI.
- **Cache-busting query strings.** `index.html` loads scripts with `?v=5`. Bump the number when a change must reach browsers that cached the old files.

## Future work

- An AI that uses the engine's decision, legal-move and clone APIs, and respects hidden information.
- A save/load and undo interface built on the existing engine support.
- Hiding hands between human players in hotseat games.
