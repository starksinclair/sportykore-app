import { Image, type ImageStyle } from "expo-image";
import { Text, type TextProps } from "react-native";

import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

const LOGO_IMAGE = require("@/assets/images/logo.png");

export type LogoVariant = "full" | "short" | "image";

const COPY: Record<Exclude<LogoVariant, "image">, string> = {
  full: "SportyKore",
  short: "SK",
};

export type LogoProps = Omit<TextProps, "children"> & {
  /** `"full"` → SportyKore, `"short"` → SK, `"image"` → logo asset */
  variant?: LogoVariant;
  /** Default brand yellow (text variants only) */
  color?: string;
  fontSize?: number;
  lineHeight?: number;
  /** Image variant size — defaults from `fontSize` when omitted */
  imageWidth?: number;
  imageHeight?: number;
};

export function Logo({
  variant = "full",
  color = colors.accent,
  fontSize = 10,
  lineHeight,
  imageWidth,
  imageHeight,
  style,
  ...rest
}: LogoProps) {
  if (variant === "image") {
    const width = imageWidth ?? fontSize * 3;
    const height = imageHeight ?? fontSize * 3;

    return (
      <Image
        source={LOGO_IMAGE}
        contentFit="contain"
        accessibilityRole="image"
        accessibilityLabel="SportyKore"
        style={[{ width, height }, style as ImageStyle | undefined]}
      />
    );
  }

  const text = COPY[variant];
  const lh = lineHeight ?? Math.round(fontSize * 1.05);

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
