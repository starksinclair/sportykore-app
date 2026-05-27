export const fonts = {
  brand: "Pacifico_400Regular",
  body: "OpenSans_400Regular",
  bodySemibold: "OpenSans_600SemiBold",
  bodyBold: "OpenSans_700Bold",
  display: "PlayfairDisplay_400Regular",
  displayBold: "PlayfairDisplay_700Bold",
} as const;

export type FontToken = keyof typeof fonts;
