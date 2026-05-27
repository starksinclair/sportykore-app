# Detail screens — API gaps

This file tracks the data the entity detail screens (League, Team, Player,
Match) would like to render but cannot yet, because the backend does not expose
the data. Each row lists the gap, where it lands in the UI, and what we ship in
v1 until the backend catches up.

See `ROUTES.md` for the current shapes returned by each detail endpoint.

| Gap                                          | Impact                          | v1 workaround                                                                                                                                                                                                                                                |
| -------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Match lineups                                | Match → Lineups tab             | `GameDetail` has no lineup payload. The Lineups tab renders a "coming soon" placeholder.                                                                                                                                                                     |
| League description / Player of the Season    | League → Overview               | `SeasonDetail` does not include a written description nor a designated "player of the season". The Overview tab derives a top performer from `stats` (goals → assists tiebreak) and omits the description entirely.                                          |
| Match team-stats aggregation                 | Match → Stats                   | `GameDetail.stats` is a flat list of events. The Stats tab groups events by `type.displayName` and counts per-side totals using `team.id` against the match's `homeTeam.id` / `awayTeam.id`.                                                                 |

When the backend lands one of these, replace the corresponding placeholder /
derivation and remove the row from this file.
