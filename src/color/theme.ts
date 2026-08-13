/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "../../global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#000000",
    textMuted: "#4B5563",
    textSubtle: "#6B7280",
    textInverse: "#FFFFFF",
    background: "#ffffff",
    backgroundMuted: "#F8FAFC",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    surface: "#FFFFFF",
    surfaceMuted: "#F8FAFC",
    surfaceRaised: "#FFFFFF",
    card: "#FFFFFF",
    cardMuted: "#F8FAFC",
    cardBorder: "#E5E7EB",
    inputBackground: "#FFFFFF",
    inputBorder: "#CBD5E1",
    textSecondary: "#60646C",
    brand: "#4A148C",
    brandMuted: "#F4ECFB",
    accent: "#9A6700",
    accentMuted: "#FFF4CC",
    danger: "#DC2626",
    dangerMuted: "#FEF2F2",
    success: "#15803D",
    successMuted: "#F0FDF4",
    patternBase: "#F8FAFC",
    patternStripe: "rgba(74, 20, 140, 0.06)",
    overlay: "rgba(15, 23, 42, 0.42)",
  },
  dark: {
    text: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.7)",
    textSubtle: "rgba(255, 255, 255, 0.5)",
    textInverse: "#111827",
    background: "#000000",
    backgroundMuted: "#121212",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    surface: "#121212",
    surfaceMuted: "#1A1A1C",
    surfaceRaised: "#202024",
    card: "rgba(255, 255, 255, 0.06)",
    cardMuted: "rgba(255, 255, 255, 0.04)",
    cardBorder: "rgba(255, 255, 255, 0.1)",
    inputBackground: "rgba(255, 255, 255, 0.06)",
    inputBorder: "rgba(255, 255, 255, 0.12)",
    textSecondary: "#B0B4BA",
    brand: "#A877DC",
    brandMuted: "rgba(74, 20, 140, 0.35)",
    accent: "#E6A817",
    accentMuted: "rgba(230, 168, 23, 0.14)",
    danger: "#FCA5A5",
    dangerMuted: "rgba(239, 68, 68, 0.12)",
    success: "#86EFAC",
    successMuted: "rgba(34, 197, 94, 0.14)",
    patternBase: "#0d0d0d",
    patternStripe: "rgba(230, 168, 23, 0.06)",
    overlay: "rgba(0, 0, 0, 0.35)",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type AppColorScheme = keyof typeof Colors;
export type ThemePreference = AppColorScheme | "system";

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
