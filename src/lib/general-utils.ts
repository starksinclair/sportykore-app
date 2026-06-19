import { GameStatus } from "@/api/entities";

export function isLiveGameStatus(status: GameStatus): boolean {
  return (
    status === "first_half" ||
    status === "second_half" ||
    status === "extra_time" ||
    status === "half_time" ||
    status === "paused" ||
    status === "live" ||
    status === "break"
  );
}

export function isActivePlayStatus(status: GameStatus): boolean {
  return (
    status === "first_half" ||
    status === "second_half" ||
    status === "extra_time" ||
    status === "live"
  );
}
