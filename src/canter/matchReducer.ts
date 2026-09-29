import {
  MATCH_HALF_DURATION_MS,
  OWNER_ANNOYED_MIN,
  OWNER_CALM_TURNS,
  OWNER_COLLECT_HITS,
  OWNER_MESSAGES,
  OWNER_VEXED_MIN,
  OWNER_WARNING_MIN,
  TURN_CLOCK_DECREMENT_MS,
} from "./constants";
import type { MatchState, OwnerStage, OwnerState, TeamSide, TurnResult } from "./types";

function createInitialOwnerState(): OwnerState {
  return { stage: "normal", hits: 0, calmCounter: 0 };
}

export function createInitialMatchState(startingTurn: TeamSide = "home"): MatchState {
  return {
    phase: "kickoff",
    currentTurn: startingTurn,
    half: 1,
    clockRemainingMs: MATCH_HALF_DURATION_MS,
    scoreHome: 0,
    scoreAway: 0,
    lastTouchCanterId: null,
    turnNo: 0,
    statsHome: { shots: 0, passes: 0, touches: 0 },
    statsAway: { shots: 0, passes: 0, touches: 0 },
    ownerHome: createInitialOwnerState(),
    ownerAway: createInitialOwnerState(),
    toast: null,
    voided: false,
  };
}

function stageFromHits(hits: number): OwnerStage {
  if (hits >= OWNER_VEXED_MIN) return "vexed";
  if (hits >= OWNER_WARNING_MIN) return "warning";
  if (hits >= OWNER_ANNOYED_MIN) return "annoyed";
  return "normal";
}

function otherSide(side: TeamSide): TeamSide {
  return side === "home" ? "away" : "home";
}

function sideOfCanterId(canterId: string): TeamSide {
  return canterId.startsWith("home-") ? "home" : "away";
}

export function applyTurnResult(
  state: MatchState,
  flickedCanterId: string,
  result: TurnResult,
): MatchState {
  const flickingSide = sideOfCanterId(flickedCanterId);
  const next: MatchState = {
    ...state,
    turnNo: state.turnNo + 1,
    lastTouchCanterId: result.lastTouchCanterId ?? state.lastTouchCanterId,
  };

  const stats = flickingSide === "home" ? { ...next.statsHome } : { ...next.statsAway };
  if (result.touchedBall) {
    stats.touches += 1;
    if (result.lastTouchCanterId && sideOfCanterId(result.lastTouchCanterId) === flickingSide) {
      stats.passes += 1;
    }
  }
  if (flickingSide === "home") next.statsHome = stats;
  else next.statsAway = stats;

  if (result.scored) {
    if (result.scored === "home") next.scoreHome += 1;
    else next.scoreAway += 1;

    const scorerStats = result.scored === "home" ? { ...next.statsHome } : { ...next.statsAway };
    scorerStats.shots += 1;
    if (result.scored === "home") next.statsHome = scorerStats;
    else next.statsAway = scorerStats;
  }

  next.clockRemainingMs = Math.max(0, next.clockRemainingMs - TURN_CLOCK_DECREMENT_MS);
  next.currentTurn = otherSide(flickingSide);

  if (next.clockRemainingMs <= 0) {
    if (next.half === 1) {
      next.phase = "half_time";
    } else {
      next.phase = "full_time";
    }
  } else {
    next.phase = "in_progress";
  }

  applyOwnerMechanic(next, flickingSide, result);

  return next;
}

/** Mutates `next` in place: owner rage, calm-down, retaliation toast, and the
 * casual-mode "collect the ball" match-void ending. */
function applyOwnerMechanic(
  next: MatchState,
  flickingSide: TeamSide,
  result: TurnResult,
) {
  const opponentSide = otherSide(flickingSide);
  const opponentKey = opponentSide === "home" ? "ownerHome" : "ownerAway";
  const flickerKey = flickingSide === "home" ? "ownerHome" : "ownerAway";

  const qualifyingHit = result.touchedOpponentCaptain && !result.flickerTouchedBall;
  let toastMessage: string | null = null;

  // The team being vexed: hits accrue, stage advances, and enough of them
  // ends the match (casual mode: void, nobody wins — chaos is the fun).
  const opponentOwner = { ...next[opponentKey] };
  const wasVexed = opponentOwner.stage === "vexed";

  if (qualifyingHit) {
    opponentOwner.hits += 1;
    opponentOwner.calmCounter = 0;
    opponentOwner.stage = stageFromHits(opponentOwner.hits);

    if (wasVexed && opponentOwner.hits >= OWNER_COLLECT_HITS) {
      toastMessage = OWNER_MESSAGES.collect;
      next.voided = true;
      next.phase = "full_time";
    } else if (!wasVexed && opponentOwner.stage === "vexed") {
      toastMessage = OWNER_MESSAGES.vexed;
    } else if (opponentOwner.stage === "warning") {
      toastMessage = OWNER_MESSAGES.warning;
    } else if (opponentOwner.stage === "annoyed") {
      toastMessage = OWNER_MESSAGES.annoyed;
    }
  }

  if (!toastMessage && result.retaliated) {
    toastMessage = OWNER_MESSAGES.retaliation;
  }

  next[opponentKey] = opponentOwner;

  // The flicking side's own owner calms down over their own idle turns.
  const flickerOwner = { ...next[flickerKey] };
  if (flickerOwner.stage !== "normal") {
    flickerOwner.calmCounter += 1;
    if (flickerOwner.calmCounter >= OWNER_CALM_TURNS) {
      next[flickerKey] = createInitialOwnerState();
    } else {
      next[flickerKey] = flickerOwner;
    }
  }

  // A team scoring puts their own captain's mind at ease.
  if (result.scored) {
    const scorerKey = result.scored === "home" ? "ownerHome" : "ownerAway";
    next[scorerKey] = createInitialOwnerState();
  }

  next.toast = toastMessage ? { id: next.turnNo, message: toastMessage } : null;
}

export function startSecondHalf(state: MatchState): MatchState {
  return {
    ...state,
    half: 2,
    clockRemainingMs: MATCH_HALF_DURATION_MS,
    phase: "in_progress",
    currentTurn: otherSide(state.currentTurn),
  };
}

export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function matchResult(state: MatchState): "home" | "away" | "draw" {
  if (state.scoreHome === state.scoreAway) return "draw";
  return state.scoreHome > state.scoreAway ? "home" : "away";
}
