import { useEffect } from "react";
import { View, type ViewProps } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export type PulsingDotProps = Omit<ViewProps, "children"> & {
  size?: number;
  color?: string;
  duration?: number;
};

export function PulsingDot({
  size = 6,
  color = "#ef4444",
  duration = 1400,
  style,
  ...rest
}: PulsingDotProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, [duration, progress]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - progress.value),
    transform: [{ scale: 1 + progress.value * 1.8 }],
  }));

  return (
    <View
      style={[
        { width: size, height: size, alignItems: "center", justifyContent: "center" },
        style,
      ]}
      {...rest}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          haloStyle,
        ]}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
