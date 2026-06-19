import type { GameStatus, PausedFromStatus } from "@/api/entities";

export type GameStatusChangedPayload = {
  type: "status_changed";
  status: GameStatus;
  firstHalfStartedAt?: string | null;
  secondHalfStartedAt?: string | null;
  extraTimeStartedAt?: string | null;
  pausedAt?: string | null;
  pausedFromStatus?: PausedFromStatus | null;
  homeScore?: number | null;
  awayScore?: number | null;
};

export type ScoreUpdatedPayload = {
  type: "score_updated";
  homeScore: number | null;
  awayScore: number | null;
};

export type StatAccreditedPayload = {
  type: "stat_accredited";
  statId: number;
};

export type GameSSEPayload =
  | GameStatusChangedPayload
  | ScoreUpdatedPayload
  | StatAccreditedPayload;

export function parseTransmitMessage(raw: unknown): GameSSEPayload | null {
  if (!isGameSSEPayload(raw)) return null;
  return raw;
}

export function isGameSSEPayload(parsed: unknown): parsed is GameSSEPayload {
  return (
    parsed != null &&
    typeof parsed === "object" &&
    "type" in parsed &&
    typeof (parsed as GameSSEPayload).type === "string"
  );
}

export function gameChannel(gameId: number): string {
  return `games/${gameId}`;
}

export function gameIdFromChannel(channel: string): number | null {
  const match = /^games\/(\d+)$/.exec(channel);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}
