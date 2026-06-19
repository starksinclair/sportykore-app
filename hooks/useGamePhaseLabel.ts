import type { GameClockFields } from "@/lib/game-time";
import { formatLiveMinuteLabel } from "@/lib/game-time";

import { useLiveMinute } from "./useLiveMinute";

/** Live phase label (e.g. `32'`, `HT`, `45+2'`) derived from period timestamps. */
export function useGamePhaseLabel(
  game: GameClockFields | null | undefined,
): string {
  const minute = useLiveMinute(game);
  return game ? formatLiveMinuteLabel(game, minute) : "";
}
