import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";

import { getCountryFlagSvg } from "@/lib/country-flag";
import { fonts } from "@/theme/fonts";

export type CountryFlagProps = {
  code: string;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  fallbackIconColor?: string;
};

export function CountryFlag({
  code,
  width = 24,
  height,
  style,
  className,
  fallbackIcon = "globe-outline",
  fallbackIconColor = "#6B7280",
}: CountryFlagProps) {
  const resolvedHeight = height ?? Math.round(width * (2 / 3));
  const svg = useMemo(() => getCountryFlagSvg(code), [code]);

  if (!svg) {
    return (
      <View
        style={[{ width, height: resolvedHeight }, style]}
        className={["items-center justify-center overflow-hidden rounded-[4px] bg-neutral-100", className]
          .filter(Boolean)
          .join(" ")}
      >
        <Ionicons name={fallbackIcon} size={Math.min(width, resolvedHeight) * 0.55} color={fallbackIconColor} />
      </View>
    );
  }

  return (
    <View
      style={[{ width, height: resolvedHeight }, style]}
      className={["overflow-hidden rounded-[4px]", className].filter(Boolean).join(" ")}
    >
      <SvgXml xml={svg} width={width} height={resolvedHeight} />
    </View>
  );
}

export type CountryLabelProps = {
  code: string;
  name: string;
  flagWidth?: number;
  textClassName?: string;
  textStyle?: StyleProp<TextStyle>;
  className?: string;
};

export function CountryLabel({
  code,
  name,
  flagWidth = 16,
  textClassName = "text-xs text-white/55",
  textStyle,
  className,
}: CountryLabelProps) {
  return (
    <View className={["flex-row items-center gap-1.5", className].filter(Boolean).join(" ")}>
      <CountryFlag code={code} width={flagWidth} />
      <Text style={[{ fontFamily: fonts.body }, textStyle]} className={textClassName}>
        {name}
      </Text>
    </View>
  );
}
