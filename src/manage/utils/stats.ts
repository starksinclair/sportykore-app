import type { ApiPlayer, ApiStat } from "@/api/entities";
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

function statSlug(stat: ApiStat): string {
  return stat.type?.name?.toLowerCase() ?? "";
}

export function isSubstitutionOffStat(stat: ApiStat): boolean {
  return statSlug(stat) === "substitution_off";
}

export function isSubstitutionOnStat(stat: ApiStat): boolean {
  return statSlug(stat) === "substitution_on";
}

export type PairedSubstitution = {
  off: ApiStat;
  on: ApiStat;
  minute: number | null;
  teamId: number | undefined;
  playerOff: ApiPlayer | undefined;
  playerOn: ApiPlayer | undefined;
};

/** Pair substitution_off / substitution_on rows for display and undo. */
export function pairSubstitutionEvents(stats: ApiStat[]): PairedSubstitution[] {
  const offs = stats.filter(isSubstitutionOffStat);
  const ons = stats.filter(isSubstitutionOnStat);
  const usedOnIds = new Set<number>();
  const pairs: PairedSubstitution[] = [];

  for (const off of offs) {
    const on =
      ons.find((candidate) => {
        if (usedOnIds.has(candidate.id)) return false;
        if (candidate.team?.id !== off.team?.id) return false;
        if ((candidate.minute ?? null) !== (off.minute ?? null)) return false;
        const offRelated = off.relatedPlayer?.id;
        const onPlayer = candidate.player?.id;
        const onRelated = candidate.relatedPlayer?.id;
        const offPlayer = off.player?.id;
        if (offRelated != null && onPlayer != null && offRelated === onPlayer) {
          return true;
        }
        if (onRelated != null && offPlayer != null && onRelated === offPlayer) {
          return true;
        }
        return false;
      }) ??
      ons.find((candidate) => {
        if (usedOnIds.has(candidate.id)) return false;
        if (candidate.team?.id !== off.team?.id) return false;
        return (candidate.minute ?? null) === (off.minute ?? null);
      });

    if (!on) continue;
    usedOnIds.add(on.id);
    pairs.push({
      off,
      on,
      minute: off.minute ?? on.minute ?? null,
      teamId: off.team?.id ?? on.team?.id,
      playerOff: off.player,
      playerOn: on.player ?? off.relatedPlayer,
    });
  }

  return pairs.sort((a, b) => {
    const ma = a.minute ?? Number.POSITIVE_INFINITY;
    const mb = b.minute ?? Number.POSITIVE_INFINITY;
    return ma - mb || a.off.id - b.off.id;
  });
}
