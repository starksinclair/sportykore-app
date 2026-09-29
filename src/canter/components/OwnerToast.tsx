import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/constants";

import type { OwnerToast as OwnerToastData } from "../types";

interface OwnerToastProps {
  toast: OwnerToastData | null;
}

export function OwnerToast({ toast }: OwnerToastProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-8);

  useEffect(() => {
    if (!toast) return;
    cancelAnimation(opacity);
    cancelAnimation(translateY);
    opacity.value = 0;
    translateY.value = -8;
    opacity.value = withTiming(1, { duration: 180 });
    translateY.value = withTiming(0, { duration: 180 });
    opacity.value = withDelay(2200, withTiming(0, { duration: 260 }));
  }, [toast, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!toast) return null;

  return (
    <Animated.View style={[styles.container, style]} pointerEvents="none">
      <Text style={styles.text} numberOfLines={2}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 8,
    left: 24,
    right: 24,
    alignItems: "center",
    zIndex: 20,
  },
  text: {
    backgroundColor: "rgba(18,18,18,0.92)",
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    overflow: "hidden",
    textAlign: "center",
  },
});
