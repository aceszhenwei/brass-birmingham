# Human playtesting (Assignment 17)

Play a normal browser match against the AI, dismiss the Rail scoring review,
and click **Export Game Log** on the final results screen. Keep the downloaded
JSON: it is a complete diagnostic record, including hidden hands and future
cards. Export is unavailable before game over. No upload or backend is involved.

Copy each completed JSON into `research/human-games/games/`, then run from the
repository root:

```bash
node scripts/research/analyze-human-games.js
```

Read [report.md](report.md). New JSON files are discovered each run; no registry
or source edits are needed. Keep originals when updating the AI. Games are
identified by UUID and include exact engine and policy source hashes, player
count, seat types and difficulty. The report separates player counts and
policy/difficulty, and excludes synthetic, AI-only and human-only games from
human-versus-AI aggregates. Source labels are declared metadata, not proof
that a person actually played the nominal human seat.

Invalid, incomplete, incompatible or duplicate files appear by filename and
reason in the report and on stderr; the command exits nonzero. Valid files
are still reported, explicitly as a partial dataset. Correct the errors before
drawing conclusions. Duplicate detection checks both IDs and identical replay
content, even when someone changes an ID.

## Inspect a decision

Report flags include a game ID, player, era, round and one-based action index.
For example, after adding that real game to the collection:

```bash
node scripts/research/inspect-human-game.js --game GAME_ID --action 42
```

Inspection validates the whole log and reconstructs the state before that
action. It prints the player's cash, income and hand, board, resources,
recorded move, actual events/outcome and up to 30 legal alternatives. These
are default-resource-choice legal moves, not ranked suggestions or all possible
resource combinations. It runs no AI search and makes no optimality claims.
Era-end flags point to the action that triggered scoring (which can belong to
a different player). Final-cash flags point to that player's last action;
the reason states their final cash, which can also include later income.

Threshold flags are review prompts: late loans while holding at least £30,
unflipped tiles with printed VP of at least 5, links scoring at most 1 VP,
developed types never built later, and final cash of at least £30. Access,
resource supply, discarded options and circumstances can justify these moves.
Develop flags cover paid Develop actions; merchant bonus development is still
present in the replay but does not get that heuristic flag. Other expensive
investments and missed opportunities need manual inspection; automatic
counterfactual search and move grading are deferred.

Scoring is exact: Canal and Rail industry/link VP come from actual engine
events; merchant bonuses and shortfall penalties appear separately as other
VP. Tile counts are board counts at each scoring, so surviving Canal tiles
can also appear at Rail scoring. Network action counts and link counts differ
when a double Rail action builds two links. Builds list industry and level;
flipped/unflipped counts, loans, sales, development, income and cash are shown.
The report describes observations and hypotheses, never validated AI changes.
Small samples do not establish reliable win rates. Shared first places count
for each winning side. Averages are per seat, not per game.

## Try the complete workflow without human data

Two [synthetic samples](samples/) are committed separately. Even the seat
marked human was controlled by the unmodified Easy policy. They are **not
human evidence**, and are never included in genuine human aggregates.

```bash
node scripts/research/analyze-human-games.js --dir research/human-games/samples --out research/human-games/sample-report.md
node scripts/research/inspect-human-game.js --dir research/human-games/samples --game synthetic-2p-1701 --action 42
```

See [sample-report.md](sample-report.md). To reproduce the two sample files,
run `node scripts/research/generate-human-game-samples.js` (two complete games;
no competitive study). The sample report is deterministic and has no timestamp.
Custom collections/output files use `--dir DIR --out FILE`.

## Format and reproducibility

`js/gameRecorder.js` defines format `brass-birmingham/diagnostic-game`, version
1. Required fields:

| Field | Purpose |
|---|---|
| `id`, `createdAt`, `source` | Unique game identity, creation time, `browser` or `synthetic` |
| `engine`, `policy`, `players`, `numPlayers`, `seed` | Exact source hashes and seat configuration |
| `initialState` | Existing engine serialization, including initial hidden cards and RNG |
| `actions[]` | One-based index, actor, fully resolved move, before/after turn context, actual events and resulting state digest |
| `complete`, `error`, `final` | Completion/failure state; final serialization and ranking |

There is one initial snapshot and one final snapshot, not a snapshot per move.
Rejected moves and previews are not recorded. Undo/reset truncates reverted
history before replacement actions are appended. Repainting or changing
screens does not affect recording. The recorder uses a separate crypto UUID
and never draws from the gameplay or AI RNG. Failed recording never changes
a successful game action; final export explains failure instead of offering a
valid-looking incomplete file. State digests detect accidental corruption,
not malicious forgery. Replay also verifies events, exact final state/ranking,
seeded setup and the actor/era/round/action sequence through `GameLogic.play`.

There are no existing player-facing save/load controls. For developer saves,
pair `uiManager.recorder.checkpoint(gameState, uiManager.aiRng)` with the save.
`GameRecord.Recorder.restore(envelope)` validates the prefix and returns
`{ recorder, state, aiRng }`. Rebind the UI/logic to that state and restore both
recorder and AI RNG when continuing; do not store diagnostic envelopes in a
player-visible view. Loading a bare state cannot recreate missing history.
Reloading/closing the page loses an unexported game; automatic browser
persistence and a new save UI are deferred.

`node scripts/research/record-version.js` checks exact source identities.
Engine/policy edits require an intentional `--write` and compatible new
samples. Old source identities are rejected explicitly: analyse those games
with their matching repository revision rather than silently replaying them
against changed rules. Keep old logs and that Git revision. Multi-revision
migration is deferred; the report groups supported policy/difficulty metadata.
No production strategy, scoring, card distribution, information access or
shared simulation methodology changes in A17.
