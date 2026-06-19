import type { ApiGame, GameStatus } from "@/api/entities";

export type GameClockFields = Pick<
  ApiGame,
  | "status"
  | "firstHalfDuration"
  | "secondHalfDuration"
  | "extraTimeDuration"
  | "firstHalfStartedAt"
  | "secondHalfStartedAt"
  | "extraTimeStartedAt"
  | "pausedAt"
  | "pausedFromStatus"
  | "currentMinute"
>;

const TICKING_STATUSES = new Set<GameStatus>([
  "first_half",
  "second_half",
  "extra_time",
  "live",
]);

const LIVE_PERIOD_STATUSES = new Set<GameStatus>([
  "first_half",
  "second_half",
  "extra_time",
  "half_time",
  "live",
  "break",
]);

const FROZEN_CLOCK_STATUSES = new Set<GameStatus>([
  "scheduled",
  "half_time",
  "full_time",
  "completed",
  "cancelled",
  "postponed",
  "paused",
]);

function differenceInMinutes(now: Date, then: Date): number {
  return Math.max(0, Math.floor((now.getTime() - then.getTime()) / 60_000));
}

/** Elapsed minutes are 0-based; football displays the minute currently in play (1-based). */
function toDisplayMinute(elapsedMinute: number): number {
  return Math.max(1, elapsedMinute + 1);
}

export function isGameClockTicking(status: GameStatus): boolean {
  return TICKING_STATUSES.has(status);
}

export function isGameLivePeriod(status: GameStatus): boolean {
  return LIVE_PERIOD_STATUSES.has(status);
}

export function calculateCurrentMinute(
  game: GameClockFields,
  now: Date = new Date(),
): number {
  const firstHalfDuration = game.firstHalfDuration ?? 45;
  const secondHalfDuration = game.secondHalfDuration ?? 45;

  switch (game.status) {
    case "scheduled":
    case "postponed":
    case "cancelled":
      return 0;
    case "paused": {
      if (!game.pausedAt || !game.pausedFromStatus) {
        return game.currentMinute ?? 0;
      }
      return calculateCurrentMinute(
        { ...game, status: game.pausedFromStatus },
        new Date(game.pausedAt),
      );
    }
    case "half_time":
    case "break":
      return firstHalfDuration;
    case "full_time":
    case "completed":
      return firstHalfDuration + secondHalfDuration;
    case "first_half":
    case "live": {
      if (!game.firstHalfStartedAt) {
        return game.currentMinute ?? 0;
      }
      return differenceInMinutes(now, new Date(game.firstHalfStartedAt));
    }
    case "second_half": {
      if (!game.secondHalfStartedAt) {
        return game.currentMinute ?? firstHalfDuration;
      }
      return (
        firstHalfDuration +
        differenceInMinutes(now, new Date(game.secondHalfStartedAt))
      );
    }
    case "extra_time": {
      if (!game.extraTimeStartedAt) {
        return firstHalfDuration + secondHalfDuration;
      }
      return (
        firstHalfDuration +
        secondHalfDuration +
        differenceInMinutes(now, new Date(game.extraTimeStartedAt))
      );
    }
    default:
      return game.currentMinute ?? 0;
  }
}

export function formatLiveMinuteLabel(
  game: GameClockFields,
  minute: number,
): string {
  const firstHalfDuration = game.firstHalfDuration ?? 45;
  const secondHalfDuration = game.secondHalfDuration ?? 45;
  const fullTimeMinute = firstHalfDuration + secondHalfDuration;

  switch (game.status) {
    case "half_time":
    case "break":
      return "HT";
    case "full_time":
    case "completed":
      return "FT";
    case "postponed":
      return "PST";
    case "cancelled":
      return "CAN";
    case "scheduled":
      return "TBD";
    case "paused": {
      const display = toDisplayMinute(minute);
      return display > 1 ? `${display}' - Paused` : "Paused";
    }
    case "first_half":
    case "live": {
      const display = toDisplayMinute(minute);
      if (display > firstHalfDuration) {
        return `${firstHalfDuration}+${display - firstHalfDuration}'`;
      }
      return `${display}'`;
    }
    case "second_half": {
      const display = toDisplayMinute(minute);
      if (display > fullTimeMinute) {
        return `${fullTimeMinute}+${display - fullTimeMinute}'`;
      }
      return `${display}'`;
    }
    case "extra_time":
      return `${toDisplayMinute(minute)}'`;
    default:
      return minute >= 0 ? `${toDisplayMinute(minute)}'` : "";
  }
}

export function shouldTickLiveMinute(status: GameStatus): boolean {
  return !FROZEN_CLOCK_STATUSES.has(status) && isGameClockTicking(status);
}
