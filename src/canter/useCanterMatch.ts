import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Matter from "matter-js";
import { makeMutable, useSharedValue, type SharedValue } from "react-native-reanimated";

import {
  allBodiesAtRest,
  applyKnockback,
  BALL_LABEL,
  CanterEngine,
  canterLabel,
  createCanterEngine,
  resetPositions,
  stepEngine,
} from "./physics/engine";
import {
  MAX_DRAG_DISTANCE,
  MAX_LAUNCH_SPEED,
  MIN_LAUNCH_SPEED,
  PHYSICS_FIXED_TIMESTEP_MS,
  REST_SPEED_THRESHOLD,
  REST_STABLE_FRAMES,
  RETALIATION_IMPULSE_SPEED,
} from "./constants";
import { applyTurnResult, createInitialMatchState, startSecondHalf } from "./matchReducer";
import { CAPTAIN_IDS, DEMO_AWAY_TEAM, DEMO_BALL_START, DEMO_HOME_TEAM } from "./demo/demoData";
import type { MatchState, TeamSide, Vec2 } from "./types";

function otherSide(side: TeamSide): TeamSide {
  return side === "home" ? "away" : "home";
}

function sideOfCanterId(canterId: string): TeamSide {
  return canterId.startsWith("home-") ? "home" : "away";
}

const ALL_PLAYERS = [
  ...DEMO_HOME_TEAM.players.map((p) => ({ ...p, side: "home" as TeamSide })),
  ...DEMO_AWAY_TEAM.players.map((p) => ({ ...p, side: "away" as TeamSide })),
];

export interface CanterMatchApi {
  matchState: MatchState;
  ballPosition: SharedValue<Vec2>;
  canterPositions: Map<string, SharedValue<Vec2>>;
  selectedCanterId: string | null;
  isResolving: boolean;
  selectCanter: (canterId: string) => void;
  flick: (dirX: number, dirY: number, dragDistance: number) => void;
  proceedFromHalfTime: () => void;
  resetMatch: () => void;
  canSelect: (canterId: string) => boolean;
  maxDragDistance: number;
}

export function useCanterMatch(): CanterMatchApi {
  const engineRef = useRef<CanterEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = createCanterEngine();
  }

  const ballPosition = useSharedValue<Vec2>(DEMO_BALL_START);

  // Fixed-size demo roster, so it's safe to build one mutable shared value
  // per canter up front via makeMutable (outside the render's hook order).
  const canterPositions = useMemo(() => {
    const map = new Map<string, SharedValue<Vec2>>();
    for (const player of ALL_PLAYERS) {
      map.set(player.id, makeMutable<Vec2>({ x: player.x, y: player.y }));
    }
    return map;
  }, []);

  const [matchState, setMatchState] = useState<MatchState>(() =>
    createInitialMatchState("home"),
  );
  const [selectedCanterId, setSelectedCanterId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const rafRef = useRef<number | null>(null);

  const syncPositionsFromEngine = useCallback(() => {
    const instance = engineRef.current;
    if (!instance) return;
    ballPosition.value = { x: instance.ball.position.x, y: instance.ball.position.y };
    for (const [id, body] of instance.canters.entries()) {
      const sv = canterPositions.get(id);
      if (sv) sv.value = { x: body.position.x, y: body.position.y };
    }
  }, [ballPosition, canterPositions]);

  const canSelect = useCallback(
    (canterId: string) => {
      if (isResolving) return false;
      if (matchState.phase !== "kickoff" && matchState.phase !== "in_progress") return false;
      const isHomeSide = canterId.startsWith("home-");
      return (isHomeSide && matchState.currentTurn === "home") ||
        (!isHomeSide && matchState.currentTurn === "away");
    },
    [isResolving, matchState.currentTurn, matchState.phase],
  );

  const selectCanter = useCallback(
    (canterId: string) => {
      if (!canSelect(canterId)) return;
      setSelectedCanterId(canterId);
    },
    [canSelect],
  );

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => stopLoop, [stopLoop]);

  const flick = useCallback(
    (dirX: number, dirY: number, dragDistance: number) => {
      const instance = engineRef.current;
      const canterId = selectedCanterId;
      if (!instance || !canterId || isResolving) return;
      if (!canSelect(canterId)) return;

      const power = Math.max(
        MIN_LAUNCH_SPEED,
        Math.min(dragDistance / MAX_DRAG_DISTANCE, 1) * MAX_LAUNCH_SPEED,
      );
      const body = instance.canters.get(canterId);
      if (!body) return;

      const len = Math.hypot(dirX, dirY) || 1;
      const nx = dirX / len;
      const ny = dirY / len;

      Matter.Body.setVelocity(body, { x: nx * power, y: ny * power });

      setSelectedCanterId(null);
      setIsResolving(true);

      const flickingSide = sideOfCanterId(canterId);
      const opponentSide = otherSide(flickingSide);
      const opponentCaptainId = CAPTAIN_IDS[opponentSide];
      const opponentOwnerStage =
        opponentSide === "home" ? matchState.ownerHome.stage : matchState.ownerAway.stage;
      const flickerLabel = canterLabel(canterId);
      const captainLabel = canterLabel(opponentCaptainId);

      let scoredBy: TeamSide | null = null;
      let touchedAny = false;
      let flickerTouchedBall = false;
      let touchedOpponentCaptain = false;
      let retaliated = false;
      let lastTouch: string | null = null;
      let frames = 0;
      let stableFrames = 0;
      const maxFrames = 600;

      const loop = () => {
        const step = stepEngine(instance, PHYSICS_FIXED_TIMESTEP_MS);
        if (step.touchedCanterId) {
          touchedAny = true;
          lastTouch = step.touchedCanterId;
        }
        if (step.scored) scoredBy = step.scored;

        for (const [a, b] of step.contacts) {
          const other = a === flickerLabel ? b : b === flickerLabel ? a : null;
          if (other === null) continue;
          if (other === BALL_LABEL) flickerTouchedBall = true;
          if (other === captainLabel) {
            touchedOpponentCaptain = true;
            if (opponentOwnerStage === "vexed" && !retaliated) {
              const captainBody = instance.canters.get(opponentCaptainId);
              if (captainBody) {
                applyKnockback(
                  instance,
                  canterId,
                  captainBody.position.x,
                  captainBody.position.y,
                  RETALIATION_IMPULSE_SPEED,
                );
              }
              retaliated = true;
            }
          }
        }

        syncPositionsFromEngine();
        frames += 1;

        if (allBodiesAtRest(instance, REST_SPEED_THRESHOLD)) {
          stableFrames += 1;
        } else {
          stableFrames = 0;
        }

        if (scoredBy || stableFrames >= REST_STABLE_FRAMES || frames >= maxFrames) {
          rafRef.current = null;

          setMatchState((prev) => {
            const next = applyTurnResult(prev, canterId, {
              scored: scoredBy,
              lastTouchCanterId: lastTouch,
              touchedBall: touchedAny,
              flickerTouchedBall,
              touchedOpponentCaptain,
              retaliated,
            });
            return next;
          });

          if (scoredBy) {
            resetPositions(instance);
            syncPositionsFromEngine();
          }

          setIsResolving(false);
          return;
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    },
    [canSelect, isResolving, matchState.ownerAway.stage, matchState.ownerHome.stage, selectedCanterId, syncPositionsFromEngine],
  );

  const proceedFromHalfTime = useCallback(() => {
    setMatchState((prev) => startSecondHalf(prev));
  }, []);

  const resetMatch = useCallback(() => {
    const instance = engineRef.current;
    if (instance) {
      resetPositions(instance);
      syncPositionsFromEngine();
    }
    setSelectedCanterId(null);
    setIsResolving(false);
    setMatchState(createInitialMatchState("home"));
  }, [syncPositionsFromEngine]);

  return {
    matchState,
    ballPosition,
    canterPositions,
    selectedCanterId,
    isResolving,
    selectCanter,
    flick,
    proceedFromHalfTime,
    resetMatch,
    canSelect,
    maxDragDistance: MAX_DRAG_DISTANCE,
  };
}
