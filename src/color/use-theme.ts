/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useAppearance } from "./appearance-context";
import { Colors } from "./theme";

export function useTheme() {
  const { colorScheme } = useAppearance();

  return Colors[colorScheme];
}
