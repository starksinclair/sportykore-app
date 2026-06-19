import type { ApiGame, ApiStatType } from "@/api/entities";

import { MatchEventStatName, type MatchEventKey } from "../types";

export type PartitionedGames = {
  live: ApiGame[];
  upcoming: ApiGame[];
  results: ApiGame[];
};

const LIVE_STATUSES = new Set([
  "first_half",
  "half_time",
  "second_half",
  "extra_time",
  "paused",
  "live",
  "break",
]);
const UPCOMING_STATUSES = new Set(["scheduled", "postponed"]);
const RESULTS_STATUSES = new Set(["full_time", "completed", "cancelled"]);

export function partitionGames(games: ApiGame[]): PartitionedGames {
  const live: ApiGame[] = [];
  const upcoming: ApiGame[] = [];
  const results: ApiGame[] = [];

  for (const game of games) {
    if (LIVE_STATUSES.has(game.status)) {
      live.push(game);
    } else if (UPCOMING_STATUSES.has(game.status)) {
      upcoming.push(game);
    } else if (RESULTS_STATUSES.has(game.status)) {
      results.push(game);
    }
  }

  const byPlayedAtAsc = (a: ApiGame, b: ApiGame) =>
    new Date(a.playedAt).valueOf() - new Date(b.playedAt).valueOf();
  const byPlayedAtDesc = (a: ApiGame, b: ApiGame) =>
    new Date(b.playedAt).valueOf() - new Date(a.playedAt).valueOf();

  live.sort(byPlayedAtAsc);
  upcoming.sort(byPlayedAtAsc);
  results.sort(byPlayedAtDesc);

  return { live, upcoming, results };
}

export function resolveStatTypeId(
  statTypes: ApiStatType[],
  eventKey: MatchEventKey,
): number | null {
  const slug = MatchEventStatName[eventKey].toLowerCase();
  const match = statTypes.find((t) => t.name.toLowerCase() === slug);
  return match?.id ?? null;
}

/** Client-owned score update when recording goals / own goals. */
export function applyScoreDelta(
  homeScore: number | null,
  awayScore: number | null,
  teamId: number,
  homeTeamId: number,
  awayTeamId: number,
  statSlug: string,
): { homeScore: number; awayScore: number } {
  const home = homeScore ?? 0;
  const away = awayScore ?? 0;
  const slug = statSlug.toLowerCase();

  if (slug === MatchEventStatName.Goal) {
    if (teamId === homeTeamId) return { homeScore: home + 1, awayScore: away };
    return { homeScore: home, awayScore: away + 1 };
  }

  if (slug === MatchEventStatName.OwnGoal) {
    if (teamId === homeTeamId) return { homeScore: home, awayScore: away + 1 };
    return { homeScore: home + 1, awayScore: away };
  }

  return { homeScore: home, awayScore: away };
}

export function scoresAffectingStat(slug: string): boolean {
  const s = slug.toLowerCase();
  return s === MatchEventStatName.Goal || s === MatchEventStatName.OwnGoal;
}
