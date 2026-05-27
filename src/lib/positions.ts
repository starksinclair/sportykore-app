import type { ApiPlayer, PlayerPosition } from "@/api/entities";

/**
 * Back-to-front canonical order used for any roster or lineup display.
 * `null` (unassigned) is intentionally rendered last.
 */
export const POSITION_ORDER: ReadonlyArray<PlayerPosition | null> = [
  "goalkeeper",
  "defence",
  "midfield",
  "attack",
  null,
];

export const POSITION_LABELS: Record<PlayerPosition, string> = {
  goalkeeper: "Goalkeepers",
  defence: "Defenders",
  midfield: "Midfielders",
  attack: "Attackers",
};

export const POSITION_SHORT: Record<PlayerPosition, string> = {
  goalkeeper: "GK",
  defence: "DEF",
  midfield: "MID",
  attack: "ATT",
};

export const UNASSIGNED_LABEL = "Unassigned";
export const UNASSIGNED_SHORT = "—";

/** Bucket of players sharing a position; `position: null` collects unassigned. */
export type PositionGroup<T extends { position?: PlayerPosition | null }> = {
  position: PlayerPosition | null;
  label: string;
  players: T[];
};

/**
 * Group `players` by `position` in canonical back-to-front order. Empty
 * buckets are dropped so consumers can map straight to UI sections.
 */
export function groupPlayersByPosition<
  T extends { position?: PlayerPosition | null },
>(players: T[]): PositionGroup<T>[] {
  const buckets = new Map<PlayerPosition | null, T[]>();
  for (const player of players) {
    const key = player.position ?? null;
    const existing = buckets.get(key);
    if (existing) existing.push(player);
    else buckets.set(key, [player]);
  }

  const groups: PositionGroup<T>[] = [];
  for (const position of POSITION_ORDER) {
    const bucket = buckets.get(position);
    if (!bucket?.length) continue;
    groups.push({
      position,
      label: position ? POSITION_LABELS[position] : UNASSIGNED_LABEL,
      players: bucket,
    });
  }
  return groups;
}

/** Human-friendly long label for a single player's position. */
export function labelForPosition(
  position: PlayerPosition | null | undefined,
): string {
  if (!position) return UNASSIGNED_LABEL;
  // Drop the trailing "s" so a single player reads "Goalkeeper" instead of "Goalkeepers".
  return POSITION_LABELS[position].replace(/s$/, "");
}

/** Compact 2–3 letter badge for a single player's position. */
export function shortForPosition(
  position: PlayerPosition | null | undefined,
): string {
  if (!position) return UNASSIGNED_SHORT;
  return POSITION_SHORT[position];
}

/** Convenience type guard for narrowing `ApiPlayer` to one with a position. */
export function hasPosition(
  player: ApiPlayer,
): player is ApiPlayer & { position: PlayerPosition } {
  return player.position != null;
}
