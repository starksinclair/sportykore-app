import type {
  ApiGame,
  ApiPlayerWithStats,
  ApiTeamSeason,
} from "@/api/entities";
import { isGoalsStat } from "@/lib/stat-types";

export type TeamRecord = {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  played: number;
};

/** Compute W/D/L + goal totals for `teamId` from `games`. */
export function deriveTeamRecord(games: ApiGame[], teamId: number): TeamRecord {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let played = 0;

  for (const game of games) {
    if (game.status !== "completed") continue;
    if (game.homeScore == null || game.awayScore == null) continue;
    const isHome = game.homeTeam?.id === teamId;
    const us = isHome ? game.homeScore : game.awayScore;
    const them = isHome ? game.awayScore : game.homeScore;
    goalsFor += us;
    goalsAgainst += them;
    played += 1;
    if (us > them) wins += 1;
    else if (us === them) draws += 1;
    else losses += 1;
  }

  return { wins, draws, losses, goalsFor, goalsAgainst, played };
}

export type TopPlayerSummary = {
  player: { id: number; name: string };
  goals: number;
  assists: number;
};

/** Pick the best player in `players` ranked by goals → assists. */
export function deriveTopPlayer(
  players: ApiPlayerWithStats[],
): TopPlayerSummary | null {
  const ranked = players
    .map((player) => {
      let goals = 0;
      let assists = 0;
      for (const stat of player.stats) {
        const slug = stat.type?.name?.toLowerCase() ?? "";
        const display = stat.type?.displayName?.toLowerCase() ?? "";
        const inc = stat.numericValue ?? 1;
        if (isGoalsStat(stat)) goals += inc;
        if (slug === "assists" || display.includes("assist")) assists += inc;
      }
      return { player: { id: player.id, name: player.name }, goals, assists };
    })
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists);

  const top = ranked[0];
  if (!top) return null;
  return top.goals > 0 || top.assists > 0 ? top : null;
}

/**
 * Find the row in `standings` that corresponds to `teamId`. Useful for
 * surfacing league position on the team overview header.
 */
export function findStandingFor(season: ApiTeamSeason | null, teamId: number) {
  return season?.standings?.find((row) => row.team?.id === teamId) ?? null;
}
