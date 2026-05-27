# Time and timezone conventions

Sportykore stores **all instants in UTC** in the database (`played_at`, timestamps, etc.).  
Clients **display** times in the user's local timezone.  
When filtering **"games on a calendar day"**, the API uses the user's **IANA timezone**, not a UTC calendar day.

## Model

| Concern | Rule |
| --- | --- |
| **Storage** | UTC (`timestamptz` / ISO strings with `Z`) |
| **API responses** | ISO 8601 UTC (e.g. `2026-05-23T17:30:00.000Z`) |
| **UI display** | `new Date(iso)` + `toLocaleString()` or helpers in `src/lib/datetime.ts` |
| **"Games on May 23" filter** | `gameDate` = calendar date the user picked; `timeZone` = their IANA zone |

## Frontend helpers (`src/lib/datetime.ts`)

- `toCalendarDateParam(date)` — local `YYYY-MM-DD` for `gameDate`
- `getUserTimeZone()` — IANA zone from `Intl`
- `formatPlayedAt(iso)` — full local date + time
- `formatPlayedAtTime(iso)` — time only (match rows)
- `formatPlayedAtDate(iso)` — short date (match lists)

## API: `GET /api/v1/leagues`

See [ROUTES.md](./ROUTES.md). Always send `gameDate` + `timeZone` (see `fetchLeagues` in `src/home/api/leagues.ts`).
