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
- **The Hard AI reads opponents' hands.** It does not respect hidden information. A future AI should observe `state.getPlayerView(id)` instead. Measured, the leak gives no detectable strength ([AI audit, F1](research/ai-baseline-audit.md#22-confirmed-hard-reads-opponents-hands-f1)).
- **The AI is weak and its levels are close together.** It scores 34–44 VP per player. Easy is only modestly weaker than Normal, and Normal and Hard are equal at 2 players. The [AI audit](research/ai-baseline-audit.md) lists the confirmed defects behind this (a wrong rounds-remaining estimate, a loan spiral, overbuilding its own tiles, over-development) and a plan to fix them.

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
