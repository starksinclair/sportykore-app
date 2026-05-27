import { Text, type TextProps } from "react-native";

import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

export type LogoVariant = "full" | "short";

const COPY: Record<LogoVariant, string> = {
  full: "SportyKore",
  short: "SK",
};

export type LogoProps = Omit<TextProps, "children"> & {
  /** `"full"` → SportyKore, `"short"` → SK */
  variant?: LogoVariant;
  /** Default brand yellow */
  color?: string;
  fontSize?: number;
  lineHeight?: number;
};

export function Logo({
  variant = "full",
  color = colors.accent,
  fontSize = 10,
  lineHeight,
  style,
  ...rest
}: LogoProps) {
  const text = COPY[variant];
  const lh = lineHeight ?? Math.round(fontSize * (variant === "short" ? 1.05 : 1.05));

  return (
    <Text
      accessibilityRole="text"
      {...rest}
      style={[{ fontFamily: fonts.brand, fontSize, lineHeight: lh, color }, style]}
    >
      {text}
    </Text>
  );
}
