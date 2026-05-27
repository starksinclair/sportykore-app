import type { Ionicons } from "@expo/vector-icons";

import type { ApiStat, ApiStatType } from "@/api/entities";

/** Canonical display order for stat type sections across league + player screens. */
export const STAT_TYPE_SLUG_ORDER = [
  "goals",
  "own_goal",
  "assists",
  "yellow_card",
  "red_card",
  "saves",
  "shots_on_target",
  "fouls_conceded",
  "substitution_on",
  "substitution_off",
] as const;

/**
 * Maps backend `iconName` values (and a few `name` fallbacks) to Ionicons.
 * Unknown identifiers render the generic `stats-chart-outline` icon.
 */
const ICON_BY_SLUG: Record<string, keyof typeof Ionicons.glyphMap> = {
  "soccer-ball": "football-outline",
  goals: "football-outline",
  "soccer-ball-own": "football-outline",
  own_goal: "football-outline",
  handshake: "git-merge-outline",
  assists: "git-merge-outline",
  "square-yellow": "warning-outline",
  yellow_card: "warning-outline",
  "square-red": "warning-outline",
  red_card: "warning-outline",
  glove: "hand-left-outline",
  saves: "hand-left-outline",
  target: "locate-outline",
  shots_on_target: "locate-outline",
  whistle: "alert-circle-outline",
  fouls_conceded: "alert-circle-outline",
  "sub-on": "arrow-up-circle-outline",
  substitution_on: "arrow-up-circle-outline",
  "sub-off": "arrow-down-circle-outline",
  substitution_off: "arrow-down-circle-outline",
};

/** Stable display order for stat types, unknown slugs sink to the bottom. */
export function orderStatTypes(statTypes: ApiStatType[]): ApiStatType[] {
  const rank = (type: ApiStatType) => {
    const slug = type.name.toLowerCase();
    const idx = STAT_TYPE_SLUG_ORDER.indexOf(
      slug as (typeof STAT_TYPE_SLUG_ORDER)[number],
    );
    return idx === -1 ? STAT_TYPE_SLUG_ORDER.length : idx;
  };
  return [...statTypes].sort((a, b) => rank(a) - rank(b));
}

/** Pick an Ionicons glyph for a stat type, prefering `iconName` then `name`. */
export function iconForStatType(
  type: ApiStatType,
): keyof typeof Ionicons.glyphMap {
  if (type.iconName) {
    const fromIcon = ICON_BY_SLUG[type.iconName.toLowerCase()];
    if (fromIcon) return fromIcon;
  }
  return ICON_BY_SLUG[type.name.toLowerCase()] ?? "stats-chart-outline";
}

/**
 * Sums `numericValue` (defaulting to 1 per event) for every stat that matches
 * the given stat type id. Used by the player Season + Career screens to count
 * how many of each event a player accumulated within a slice of `stats`.
 */
export function totalForStatType(stats: ApiStat[], statTypeId: number): number {
  let total = 0;
  for (const stat of stats) {
    if (stat.type?.id !== statTypeId) continue;
    total += stat.numericValue ?? 1;
  }
  return total;
}

/** True when the stat type is a regular goal (not an own goal). */
export function isGoalsStat(stat: ApiStat): boolean {
  return stat.type?.name?.toLowerCase() === "goals";
}

/** True when the stat type is an own goal. */
export function isOwnGoalStat(stat: ApiStat): boolean {
  return stat.type?.name?.toLowerCase() === "own_goal";
}
