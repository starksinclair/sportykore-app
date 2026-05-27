/**
 * SportyKore brand tokens — keep in sync with tailwind.config.js and WAITLIST_BRAND_GUIDE.md.
 */

export const colors = {
  brand: "#4A148C",
  brand600: "#3B1070",
  brandActive: "#4f2478",
  accent: "#E6A817",
  accentBright: "#f9b923",
  signInYellow: "#F2A900",
  authPurple: "#5D2A8E",
  scoreboardBlack: "#121212",
  introPurple: "#3C096C",
  liveRed: "#ba0c2f",
  darkLabel: "#171717",
  white: "#FFFFFF",
  tabInactive: "#9AA3B2",
  patternStripe: "rgba(230, 168, 23, 0.08)",
  patternStripeStrong: "rgba(230, 168, 23, 0.1)",
} as const;

export const calendar = {
  weekdayLabels: ["S", "M", "T", "W", "T", "F", "S"] as const,
  monthLabelFormat: new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }),
} as const;

export function scoreboardPattern(
  stripeOpacity: "default" | "strong" = "default",
) {
  return {
    baseColor: colors.scoreboardBlack,
    stripeColor:
      stripeOpacity === "strong"
        ? colors.patternStripeStrong
        : colors.patternStripe,
  };
}
