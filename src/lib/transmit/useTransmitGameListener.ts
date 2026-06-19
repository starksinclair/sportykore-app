import { useEffect } from "react";

import { getTransmitManager } from "./manager";
import type { GameSSEPayload } from "./types";

type Options = {
  enabled?: boolean;
};

export function useTransmitGameListener(
  gameId: number,
  onEvent: (payload: GameSSEPayload) => void,
  { enabled = true }: Options = {},
): void {
  useEffect(() => {
    if (!enabled || gameId <= 0) return;
    return getTransmitManager().addListener(gameId, onEvent);
  }, [enabled, gameId, onEvent]);
}
