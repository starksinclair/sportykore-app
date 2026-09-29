import { Circle, Group } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { BALL_COLOR, BALL_RADIUS } from "../constants";
import type { Vec2 } from "../types";

export function BallDot({ position }: { position: SharedValue<Vec2> }) {
  const cx = useDerivedValue(() => position.value.x);
  const cy = useDerivedValue(() => position.value.y);

  return (
    <Group>
      <Circle cx={cx} cy={cy} r={BALL_RADIUS} color={BALL_COLOR} />
      <Circle
        cx={cx}
        cy={cy}
        r={BALL_RADIUS}
        style="stroke"
        strokeWidth={1}
        color="#171717"
      />
    </Group>
  );
}
