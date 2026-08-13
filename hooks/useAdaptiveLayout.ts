import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

const TABLET_MIN_WIDTH = 768;
const WIDE_TABLET_MIN_WIDTH = 1024;

export function useAdaptiveLayout() {
  const { width, height } = useWindowDimensions();

  return useMemo(
    () => ({
      width,
      height,
      isTablet: width >= TABLET_MIN_WIDTH,
      isWideTablet: width >= WIDE_TABLET_MIN_WIDTH,
    }),
    [height, width],
  );
}
