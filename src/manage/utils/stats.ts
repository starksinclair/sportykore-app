import type { ApiStat } from "@/api/entities";
import { isGoalsStat, isOwnGoalStat } from "@/lib/stat-types";

export function isGoalStat(stat: ApiStat): boolean {
  return isGoalsStat(stat) || isOwnGoalStat(stat);
}

export function isUnaccreditedGoal(stat: ApiStat): boolean {
  if (stat.isUnaccredited) return isGoalsStat(stat) || !stat.type;
  return isGoalsStat(stat) && !stat.player;
}

export function findLatestUnaccreditedGoal(
  stats: ApiStat[],
  teamId: number,
): ApiStat | undefined {
  return [...stats]
    .filter((s) => s.team?.id === teamId && isUnaccreditedGoal(s))
    .sort((a, b) => b.id - a.id)[0];
}

export function partitionGoalStats(
  stats: ApiStat[],
  homeTeamId: number,
  awayTeamId: number,
) {
  const goals = stats.filter(isGoalStat).sort((a, b) => {
    const ma = a.minute ?? 0;
    const mb = b.minute ?? 0;
    return ma - mb || a.id - b.id;
  });

  const assistsByGoalPlayer = new Map<number, ApiStat>();
  for (const stat of stats) {
    const slug = stat.type?.name?.toLowerCase();
    if (slug !== "assists" && slug !== "assist") continue;
    if (stat.relatedPlayer?.id != null) {
      assistsByGoalPlayer.set(stat.relatedPlayer.id, stat);
    }
  }

  return {
    home: goals.filter((g) => g.team?.id === homeTeamId),
    away: goals.filter((g) => g.team?.id === awayTeamId),
    assistsByGoalPlayer,
  };
}
