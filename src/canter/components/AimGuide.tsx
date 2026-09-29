import { Circle, Group, Line } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

interface AimGuideProps {
  active: SharedValue<boolean>;
  originX: SharedValue<number>;
  originY: SharedValue<number>;
  aimX: SharedValue<number>;
  aimY: SharedValue<number>;
  color: string;
}

/**
 * Draws the slingshot-style aim line from the flick origin out to the flick
 * target (the launch direction is the mirror of this line back through the
 * canter), plus a dot marking the pull point.
 */
export function AimGuide({ active, originX, originY, aimX, aimY, color }: AimGuideProps) {
  const p1 = useDerivedValue(() => ({ x: originX.value, y: originY.value }));
  const p2 = useDerivedValue(() => ({ x: aimX.value, y: aimY.value }));
  const launchX = useDerivedValue(() => originX.value * 2 - aimX.value);
  const launchY = useDerivedValue(() => originY.value * 2 - aimY.value);
  const launchTarget = useDerivedValue(() => ({ x: launchX.value, y: launchY.value }));
  const opacity = useDerivedValue(() => (active.value ? 1 : 0));

  return (
    <Group opacity={opacity}>
      <Line p1={p1} p2={p2} color="rgba(255,255,255,0.55)" strokeWidth={2} />
      <Line p1={p1} p2={launchTarget} color={color} strokeWidth={3} />
      <Circle cx={aimX} cy={aimY} r={6} color="rgba(255,255,255,0.75)" />
    </Group>
  );
}
