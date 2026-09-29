import { Circle, Group } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { CANTER_RADIUS } from "../constants";
import type { CanterRole, Vec2 } from "../types";

interface AnimatedCanterProps {
  position: SharedValue<Vec2>;
  fillColor: string;
  ringColor: string;
  role: CanterRole;
  isSelected: boolean;
  isCaptain?: boolean;
}

export function AnimatedCanter({
  position,
  fillColor,
  ringColor,
  role,
  isSelected,
  isCaptain,
}: AnimatedCanterProps) {
  const cx = useDerivedValue(() => position.value.x);
  const cy = useDerivedValue(() => position.value.y);
  const badgeCx = useDerivedValue(() => position.value.x + CANTER_RADIUS * 0.62);
  const badgeCy = useDerivedValue(() => position.value.y - CANTER_RADIUS * 0.62);
  const radius = role === "gk" ? CANTER_RADIUS + 2 : CANTER_RADIUS;

  return (
    <Group>
      <Circle cx={cx} cy={cy} r={radius} color={fillColor} />
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        style="stroke"
        strokeWidth={isSelected ? 3 : 1.5}
        color={isSelected ? "#FFFFFF" : ringColor}
      />
      {isCaptain ? (
        <Group>
          <Circle cx={badgeCx} cy={badgeCy} r={5.5} color="#FFD447" />
          <Circle
            cx={badgeCx}
            cy={badgeCy}
            r={5.5}
            style="stroke"
            strokeWidth={1}
            color="#171717"
          />
        </Group>
      ) : null}
    </Group>
  );
}
