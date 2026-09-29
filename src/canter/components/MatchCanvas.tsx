import { useCallback, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import { Canvas, Group, Rect } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";

import { MAX_DRAG_DISTANCE, PITCH_HEIGHT, PITCH_WIDTH } from "../constants";
import { DEMO_AWAY_TEAM, DEMO_HOME_TEAM } from "../demo/demoData";
import { pitchGlow } from "../ownerVisuals";
import type { CanterMatchApi } from "../useCanterMatch";
import { AimGuide } from "./AimGuide";
import { AnimatedCanter } from "./AnimatedCanter";
import { BallDot } from "./BallDot";
import { PitchMarkings } from "./PitchMarkings";

interface MatchCanvasProps {
  match: CanterMatchApi;
}

const ALL_PLAYERS = [
  ...DEMO_HOME_TEAM.players.map((p) => ({
    ...p,
    side: "home" as const,
    fillColor: DEMO_HOME_TEAM.primaryColor,
    ringColor: DEMO_HOME_TEAM.secondaryColor,
  })),
  ...DEMO_AWAY_TEAM.players.map((p) => ({
    ...p,
    side: "away" as const,
    fillColor: DEMO_AWAY_TEAM.primaryColor,
    ringColor: DEMO_AWAY_TEAM.secondaryColor,
  })),
];

export function MatchCanvas({ match }: MatchCanvasProps) {
  const [layoutWidth, setLayoutWidth] = useState(PITCH_WIDTH);
  const scale = layoutWidth / PITCH_WIDTH;
  const canvasHeight = PITCH_HEIGHT * scale;

  const dragActive = useSharedValue(false);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const aimX = useSharedValue(0);
  const aimY = useSharedValue(0);

  const activeCanterIdRef = useRef<string | null>(null);
  const aimColor =
    match.matchState.currentTurn === "home"
      ? DEMO_HOME_TEAM.primaryColor
      : DEMO_AWAY_TEAM.primaryColor;
  const glow = pitchGlow(match.matchState);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setLayoutWidth(e.nativeEvent.layout.width);
  }, []);

  const findCanterAt = useCallback(
    (px: number, py: number): string | null => {
      let bestId: string | null = null;
      let bestDist = Infinity;
      for (const player of ALL_PLAYERS) {
        if (!match.canSelect(player.id)) continue;
        const pos = match.canterPositions.get(player.id);
        if (!pos) continue;
        const dx = pos.value.x - px;
        const dy = pos.value.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist < 26 && dist < bestDist) {
          bestDist = dist;
          bestId = player.id;
        }
      }
      return bestId;
    },
    [match],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .onBegin((e) => {
          const px = e.x / scale;
          const py = e.y / scale;
          const hit = findCanterAt(px, py);
          activeCanterIdRef.current = hit;
          if (!hit) return;

          match.selectCanter(hit);
          const pos = match.canterPositions.get(hit);
          const ox = pos ? pos.value.x : px;
          const oy = pos ? pos.value.y : py;
          originX.value = ox;
          originY.value = oy;
          aimX.value = ox;
          aimY.value = oy;
          dragActive.value = true;
        })
        .onUpdate((e) => {
          if (!activeCanterIdRef.current) return;
          const px = e.x / scale;
          const py = e.y / scale;
          const dx = px - originX.value;
          const dy = py - originY.value;
          const dist = Math.hypot(dx, dy);
          if (dist > MAX_DRAG_DISTANCE) {
            const ratio = MAX_DRAG_DISTANCE / dist;
            aimX.value = originX.value + dx * ratio;
            aimY.value = originY.value + dy * ratio;
          } else {
            aimX.value = px;
            aimY.value = py;
          }
        })
        .onEnd(() => {
          const canterId = activeCanterIdRef.current;
          activeCanterIdRef.current = null;
          dragActive.value = false;
          if (!canterId) return;

          const dx = aimX.value - originX.value;
          const dy = aimY.value - originY.value;
          const dragDistance = Math.hypot(dx, dy);
          if (dragDistance < 6) return;

          match.flick(-dx, -dy, dragDistance);
        }),
    [aimX, aimY, dragActive, findCanterAt, match, originX, originY, scale],
  );

  return (
    <View onLayout={onLayout} style={{ width: "100%", aspectRatio: PITCH_WIDTH / PITCH_HEIGHT }}>
      <GestureDetector gesture={pan}>
        <Canvas style={{ width: layoutWidth, height: canvasHeight }}>
          <Group transform={[{ scale }]}>
            <PitchMarkings />
            {glow ? (
              <Rect
                x={0}
                y={0}
                width={PITCH_WIDTH}
                height={PITCH_HEIGHT}
                color={glow.color}
                opacity={glow.opacity}
              />
            ) : null}
            {ALL_PLAYERS.map((player) => {
              const pos = match.canterPositions.get(player.id);
              if (!pos) return null;
              return (
                <AnimatedCanter
                  key={player.id}
                  position={pos}
                  fillColor={player.fillColor}
                  ringColor={player.ringColor}
                  role={player.role}
                  isSelected={match.selectedCanterId === player.id}
                  isCaptain={player.isCaptain}
                />
              );
            })}
            <BallDot position={match.ballPosition} />
            <AimGuide
              active={dragActive}
              originX={originX}
              originY={originY}
              aimX={aimX}
              aimY={aimY}
              color={aimColor}
            />
          </Group>
        </Canvas>
      </GestureDetector>
    </View>
  );
}
