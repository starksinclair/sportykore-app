import type { GameClockFields } from "@/lib/game-time";
import { formatLiveMinuteLabel } from "@/lib/game-time";

function liveGame(overrides: Partial<GameClockFields> = {}): GameClockFields {
  return {
    status: "first_half",
    firstHalfDuration: 45,
    secondHalfDuration: 45,
    extraTimeDuration: 15,
    firstHalfStartedAt: "2026-01-01T12:00:00.000Z",
    secondHalfStartedAt: null,
    extraTimeStartedAt: null,
    pausedAt: null,
    pausedFromStatus: null,
    currentMinute: 0,
    ...overrides,
  };
}

describe("formatLiveMinuteLabel", () => {
  it("shows 1' at kickoff instead of 0'", () => {
    expect(formatLiveMinuteLabel(liveGame(), 0)).toBe("1'");
  });

  it("shows regulation minutes as in-play minute numbers", () => {
    expect(formatLiveMinuteLabel(liveGame(), 44)).toBe("45'");
  });

  it("shows first-half stoppage time from 45+1'", () => {
    expect(formatLiveMinuteLabel(liveGame(), 45)).toBe("45+1'");
    expect(formatLiveMinuteLabel(liveGame(), 46)).toBe("45+2'");
  });

  it("shows second half starting at 46'", () => {
    expect(
      formatLiveMinuteLabel(
        liveGame({
          status: "second_half",
          secondHalfStartedAt: "2026-01-01T13:00:00.000Z",
        }),
        45,
      ),
    ).toBe("46'");
  });

  it("shows second-half stoppage time from 90+1'", () => {
    expect(formatLiveMinuteLabel(liveGame({ status: "second_half" }), 90)).toBe(
      "90+1'",
    );
  });
});
