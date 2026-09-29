import { Circle, Group, Line, Rect } from "@shopify/react-native-skia";

import {
  CENTER_CIRCLE_RADIUS,
  GK_AREA_DEPTH,
  GK_AREA_STROKE,
  GK_AREA_WIDTH,
  GOAL_DEPTH,
  GOAL_WIDTH,
  PENALTY_AREA_DEPTH,
  PENALTY_AREA_WIDTH,
  PITCH_COLORS,
  PITCH_HEIGHT,
  PITCH_MARGIN,
  PITCH_WIDTH,
} from "../constants";

const cx = PITCH_WIDTH / 2;
const cy = PITCH_HEIGHT / 2;
const lineWidth = 2;

export function PitchMarkings() {
  return (
    <Group>
      <Rect
        x={0}
        y={0}
        width={PITCH_WIDTH}
        height={PITCH_HEIGHT}
        color={PITCH_COLORS.grassB}
      />
      <Rect
        x={PITCH_MARGIN}
        y={PITCH_MARGIN}
        width={PITCH_WIDTH - PITCH_MARGIN * 2}
        height={PITCH_HEIGHT - PITCH_MARGIN * 2}
        color={PITCH_COLORS.grassA}
      />

      {/* outer boundary */}
      <Rect
        x={PITCH_MARGIN}
        y={PITCH_MARGIN}
        width={PITCH_WIDTH - PITCH_MARGIN * 2}
        height={PITCH_HEIGHT - PITCH_MARGIN * 2}
        style="stroke"
        strokeWidth={lineWidth}
        color={PITCH_COLORS.lines}
      />

      {/* halfway line */}
      <Line
        p1={{ x: PITCH_MARGIN, y: cy }}
        p2={{ x: PITCH_WIDTH - PITCH_MARGIN, y: cy }}
        strokeWidth={lineWidth}
        color={PITCH_COLORS.lines}
      />

      {/* center circle + spot */}
      <Circle
        cx={cx}
        cy={cy}
        r={CENTER_CIRCLE_RADIUS}
        style="stroke"
        strokeWidth={lineWidth}
        color={PITCH_COLORS.lines}
      />
      <Circle cx={cx} cy={cy} r={3} color={PITCH_COLORS.centerSpot} />

      {/* penalty areas */}
      <Rect
        x={cx - PENALTY_AREA_WIDTH / 2}
        y={PITCH_MARGIN}
        width={PENALTY_AREA_WIDTH}
        height={PENALTY_AREA_DEPTH}
        style="stroke"
        strokeWidth={lineWidth}
        color={PITCH_COLORS.lines}
      />
      <Rect
        x={cx - PENALTY_AREA_WIDTH / 2}
        y={PITCH_HEIGHT - PITCH_MARGIN - PENALTY_AREA_DEPTH}
        width={PENALTY_AREA_WIDTH}
        height={PENALTY_AREA_DEPTH}
        style="stroke"
        strokeWidth={lineWidth}
        color={PITCH_COLORS.lines}
      />

      {/* goalkeeper areas */}
      <Rect
        x={cx - GK_AREA_WIDTH / 2}
        y={PITCH_MARGIN}
        width={GK_AREA_WIDTH}
        height={GK_AREA_DEPTH}
        style="stroke"
        strokeWidth={lineWidth}
        color={GK_AREA_STROKE}
      />
      <Rect
        x={cx - GK_AREA_WIDTH / 2}
        y={PITCH_HEIGHT - PITCH_MARGIN - GK_AREA_DEPTH}
        width={GK_AREA_WIDTH}
        height={GK_AREA_DEPTH}
        style="stroke"
        strokeWidth={lineWidth}
        color={GK_AREA_STROKE}
      />

      {/* goal mouths */}
      <Rect
        x={cx - GOAL_WIDTH / 2}
        y={PITCH_MARGIN - GOAL_DEPTH}
        width={GOAL_WIDTH}
        height={GOAL_DEPTH}
        color={PITCH_COLORS.goalNet}
      />
      <Rect
        x={cx - GOAL_WIDTH / 2}
        y={PITCH_HEIGHT - PITCH_MARGIN}
        width={GOAL_WIDTH}
        height={GOAL_DEPTH}
        color={PITCH_COLORS.goalNet}
      />
    </Group>
  );
}
