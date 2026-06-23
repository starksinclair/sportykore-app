import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { colors } from "@/constants";

export type EntityLogoVariant = "league" | "team";
export type EntityLogoSize = "xs" | "sm" | "md" | "lg";
export type EntityLogoTone = "brand" | "light" | "dark" | "accent";

const SIZE_PX: Record<EntityLogoSize, number> = {
  xs: 24,
  sm: 36,
  md: 48,
  lg: 64,
};

const ICON_SIZE: Record<EntityLogoSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 26,
};

const RADIUS: Record<EntityLogoSize, number> = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
};

const FALLBACK_ICON: Record<EntityLogoVariant, keyof typeof Ionicons.glyphMap> = {
  league: "trophy-outline",
  team: "shield-outline",
};

const TONE_STYLES: Record<
  EntityLogoTone,
  { backgroundColor: string; iconColor: string }
> = {
  brand: { backgroundColor: colors.brand, iconColor: "#FFFFFF" },
  light: { backgroundColor: "#F3F4F6", iconColor: "#374151" },
  dark: { backgroundColor: "rgba(255,255,255,0.1)", iconColor: "#FFFFFF" },
  accent: { backgroundColor: "#F3E8FF", iconColor: colors.brand },
};

type Props = {
  logoUrl?: string | null;
  variant: EntityLogoVariant;
  size?: EntityLogoSize;
  tone?: EntityLogoTone;
  accessibilityLabel?: string;
};

export function EntityLogo({
  logoUrl,
  variant,
  size = "md",
  tone = "brand",
  accessibilityLabel,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const dimension = SIZE_PX[size];
  const radius = RADIUS[size];
  const toneStyle = TONE_STYLES[tone];
  const trimmedUrl = logoUrl?.trim() ?? "";
  const showImage = trimmedUrl.length > 0 && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [trimmedUrl]);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      className="items-center justify-center overflow-hidden"
      style={{
        width: dimension,
        height: dimension,
        borderRadius: radius,
        backgroundColor: showImage ? "#FFFFFF" : toneStyle.backgroundColor,
      }}
    >
      {showImage ? (
        <Image
          source={{ uri: trimmedUrl }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Ionicons
          name={FALLBACK_ICON[variant]}
          size={ICON_SIZE[size]}
          color={toneStyle.iconColor}
        />
      )}
    </View>
  );
}
