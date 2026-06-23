import type { ApiPlayerLeague, ApiStat, ApiStatType } from "@/api/entities";
import { isGoalsStat } from "@/lib/stat-types";

const TOTALS_BY_SLUG = {
  assists: "assist",
  yellow_card: "yellow",
  red_card: "red",
} as const;

export type PlayerTotals = {
  goals: number;
  assists: number;
  appearances: number;
  cards: number;
};

/**
 * Folds raw `ApiStat[]` events into the chip values shown on the player screen.
 * Matches by `type.name` first (canonical slug) and falls back to substring
 * matches on `displayName` for forward compatibility with new stat types.
 */
export function aggregatePlayerStats(stats: ApiStat[]): PlayerTotals {
  let goals = 0;
  let assists = 0;
  let cards = 0;
  for (const stat of stats) {
    const slug = stat.type?.name?.toLowerCase() ?? "";
    const display = stat.type?.displayName?.toLowerCase() ?? "";
    const inc = stat.numericValue ?? 1;
    if (isGoalsStat(stat)) {
      goals += inc;
    }
    if (slug === "assists" || display.includes(TOTALS_BY_SLUG.assists)) {
      assists += inc;
    }
    if (
      slug === "yellow_card" ||
      slug === "red_card" ||
      display.includes(TOTALS_BY_SLUG.yellow_card) ||
      display.includes(TOTALS_BY_SLUG.red_card)
    ) {
      cards += inc;
    }
  }
  return {
    goals,
    assists,
    appearances: stats.length,
    cards,
  };
}

/** Flatten every stat across every league/season for career-wide aggregates. */
export function collectAllStats(leagues: ApiPlayerLeague[]): ApiStat[] {
  const out: ApiStat[] = [];
  for (const league of leagues) {
    for (const season of league.seasons) {
      if (season.stats) out.push(...season.stats);
    }
  }
  return out;
}

/** Count unique games across every league/season. */
export function countAllGames(leagues: ApiPlayerLeague[]): number {
  const seen = new Set<number>();
  for (const league of leagues) {
    for (const season of league.seasons) {
      for (const game of season.games ?? []) seen.add(game.id);
    }
  }
  return seen.size;
}

/** Distinct teams the player has been part of, ordered by most recent season. */
export function distinctTeams(
  leagues: ApiPlayerLeague[],
): { id: number; name: string; logoUrl: string | null }[] {
  const seen = new Map<number, { name: string; logoUrl: string | null }>();
  for (const league of leagues) {
    for (const season of league.seasons) {
      if (!seen.has(season.team.id)) {
        seen.set(season.team.id, {
          name: season.team.name,
          logoUrl: season.team.logoUrl,
        });
      }
    }
  }
  return Array.from(seen.entries()).map(([id, team]) => ({
    id,
    name: team.name,
    logoUrl: team.logoUrl,
  }));
}

/**
 * Returns the totals for the stat types most relevant to a season summary
 * card on the career tab: goals, assists, yellow cards, red cards.
 */
export function seasonSummaryTotals(
  stats: ApiStat[],
  statTypes: ApiStatType[],
): { type: ApiStatType; total: number }[] {
  const ranked: { type: ApiStatType; total: number }[] = [];
  for (const type of statTypes) {
    let total = 0;
    for (const stat of stats) {
      if (stat.type?.id !== type.id) continue;
      total += stat.numericValue ?? 1;
    }
    if (total > 0) ranked.push({ type, total });
  }
  return ranked;
}
