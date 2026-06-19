import { useEffect, useState } from "react";

import type { GameClockFields } from "@/lib/game-time";
import {
  calculateCurrentMinute,
  shouldTickLiveMinute,
} from "@/lib/game-time";

/**
 * Computes the live match minute locally from period timestamps.
 * Ticks every second while the clock is running — no API polling.
 */
export function useLiveMinute(game: GameClockFields | null | undefined): number {
  const [minute, setMinute] = useState(() =>
    game ? calculateCurrentMinute(game) : 0,
  );

  useEffect(() => {
    if (!game) {
      setMinute(0);
      return;
    }

    const sync = () => setMinute(calculateCurrentMinute(game));

    sync();

    if (!shouldTickLiveMinute(game.status)) {
      return;
    }

    const id = setInterval(sync, 1_000);
    return () => clearInterval(id);
  }, [
    game?.status,
    game?.firstHalfStartedAt,
    game?.secondHalfStartedAt,
    game?.extraTimeStartedAt,
    game?.pausedAt,
    game?.pausedFromStatus,
    game?.firstHalfDuration,
    game?.secondHalfDuration,
    game?.currentMinute,
  ]);

  return minute;
}
