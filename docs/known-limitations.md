# Known Limitations and Future Work

This is the current list. The assignment reports in [`history/`](README.md#history)
record the limitations as they stood at each stage.

## Gameplay and interface

- **Hotseat only.** All players share one screen. There is no online multiplayer.
- **Hands are not hidden between human players.** When the turn changes, the next player can see the previous player's hand.
- **No save, load or undo in the interface.** The engine supports them through `serialize` / `deserialize` and `clone` ([`state-model.md`](state-model.md)), but no UI uses them yet.
- **No automated browser tests.** CI tests the engine headlessly; the interface is checked by hand.

## AI

- **The AI is heuristic** (Easy / Normal / Hard), inherited from upstream and unchanged by this fork apart from bug fixes.
- **Fair information (since Assignment 6).** Every difficulty decides on the player's observation, so no AI sees opponents' hands, the deck order or the game RNG ([AI corrections](research/ai-corrections-a6.md)). The research baseline `AIPlayer.LEGACY_A5` keeps the old Hard leak on purpose and is not a fair benchmark.
- **The AI is still weak, and its levels are close together.** The [AI audit](research/ai-baseline-audit.md) and the [Assignment 6 report](research/ai-corrections-a6.md) give the measurements. Overbuild scoring was fixed in Assignment 8 ([overbuild research](research/ai-overbuild-a8.md); +3.6 to +4.0 VP per game). The remaining confirmed defects (over-development, careless discards) are scheduled for later work.
- **Frequent loans (about 5 per player per game).** Assignment 7 found these are mostly a rational response to the AI being chronically out of cash. No better loan rule was found, so the heuristic is kept ([loan research](research/ai-loans-a7.md)). The cash shortage comes from the spending heuristics. Fixing overbuilding in Assignment 8 did not reduce loans.

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
- **Cache-busting query strings.** `index.html` loads scripts with `?v=3`. Bump the number when a change must reach browsers that cached the old files.

## Future work

- An AI that uses the engine's decision, legal-move and clone APIs, and respects hidden information.
- A save/load and undo interface built on the existing engine support.
- Hiding hands between human players in hotseat games.
