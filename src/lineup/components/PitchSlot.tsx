import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { EntityLogo } from "@/components/ui";
import { colors } from "@/constants";
import type { PlayerMatchBadges } from "@/lineup/utils";
import { formatPitchPlayerName, type SlotCoordinate } from "@/lineup/utils";
import { fonts } from "@/theme/fonts";
import { router } from "expo-router";

type Props = {
  label: string;
  coordinate: SlotCoordinate;
  playerName?: string;
  jerseyNumber?: number | null;
  avatarUrl?: string | null;
  badges?: Partial<PlayerMatchBadges> | null;
  /** When true, render avatar + abbreviated name (match lineups). */
  variant?: "default" | "avatar";
  readOnly?: boolean;
  playerId?: number;
  onPress?: () => void;
  onClear?: () => void;
};

export function PitchSlot({
  label,
  coordinate,
  playerName,
  jerseyNumber,
  avatarUrl,
  badges,
  variant = "default",
  readOnly = false,
  playerId,
  onPress,
  onClear,
}: Props) {
  const filled = Boolean(playerName);
  const useAvatar = variant === "avatar" && filled;
  const displayName = playerName ? formatPitchPlayerName(playerName) : "";
  const initial = (playerName?.trim().charAt(0) ?? "?").toUpperCase();

  return (
    <View
      className="absolute items-center"
      style={{
        top: `${coordinate.top}%`,
        left: `${coordinate.left}%`,
        width: useAvatar ? 72 : 88,
        marginLeft: useAvatar ? -36 : -44,
        marginTop: useAvatar ? -34 : -26,
      }}
    >
      <Pressable
        onPress={readOnly ? undefined : onPress}
        disabled={readOnly && !filled}
        accessibilityRole="button"
        accessibilityLabel={
          filled
            ? `${jerseyNumber != null ? `#${jerseyNumber} ` : ""}${playerName}`
            : `Add player to ${label}`
        }
        className={
          useAvatar
            ? "items-center"
            : [
                "min-h-[52px] w-full items-center justify-center rounded-xl px-1 py-1.5",
                filled
                  ? "border-2 border-accent-400 bg-brand-800/90"
                  : "border-2 border-dashed border-accent-300 bg-black/25",
              ].join(" ")
        }
      >
        {useAvatar ? (
          <Pressable onPress={() => router.push(`/player/${playerId}`)} className="items-center gap-1">
            <View className="relative">
              {avatarUrl ? (
                <EntityLogo
                  logoUrl={avatarUrl}
                  variant="player"
                  size="sm"
                  tone="brand"
                  accessibilityLabel={playerName}
                />
              ) : (
                <View className="h-11 w-11 items-center justify-center rounded-full border-2 border-accent-400 bg-brand-800">
                  <Text
                    style={{ fontFamily: fonts.bodyBold }}
                    className="text-base text-accent-300"
                  >
                    {initial}
                  </Text>
                </View>
              )}
              <BadgeCluster badges={badges} />
            </View>
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-center text-[10px] text-accent-300"
            >
              {jerseyNumber != null ? `#${jerseyNumber}` : label}
            </Text>
            <Text
              style={{ fontFamily: fonts.bodySemibold }}
              className="text-center text-[9px] text-white"
              // numberOfLines={1}
            >
              {displayName}
            </Text>
          </Pressable>
        ) : filled ? (
          <View className="items-center gap-0.5">
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-center text-[10px] text-accent-300"
            >
              {jerseyNumber != null ? `#${jerseyNumber}` : label}
            </Text>
            <Text
              style={{ fontFamily: fonts.bodySemibold }}
              className="text-center text-[9px] text-white"
              numberOfLines={2}
            >
              {playerName}
            </Text>
          </View>
        ) : (
          <View className="items-center gap-0.5">
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-[11px] text-accent-200"
            >
              {label}
            </Text>
            {!readOnly ? (
              <Ionicons name="add-circle" size={22} color={colors.accent} />
            ) : null}
          </View>
        )}
      </Pressable>
      {filled && !readOnly && onClear ? (
        <Pressable
          onPress={onClear}
          hitSlop={8}
          accessibilityLabel={`Remove ${playerName}`}
          className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-neutral-900"
        >
          <Ionicons name="close" size={12} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}

export function BadgeCluster({
  badges,
}: {
  badges?: Partial<PlayerMatchBadges> | null;
}) {
  if (!badges) return null;

  const items: {
    key: string;
    count: number;
    bg: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
  }[] = [];

  if ((badges.goals ?? 0) > 0) {
    items.push({
      key: "goals",
      count: badges.goals ?? 0,
      bg: "bg-white",
      icon: "football",
      iconColor: "#121212",
    });
  }
  if ((badges.assists ?? 0) > 0) {
    items.push({
      key: "assists",
      count: badges.assists ?? 0,
      bg: "bg-accent-400",
      icon: "git-merge",
      iconColor: "#121212",
    });
  }
  if ((badges.yellowCards ?? 0) > 0) {
    items.push({
      key: "yellow",
      count: badges.yellowCards ?? 0,
      bg: "bg-white",
      icon: "square",
      iconColor: "#EAB308",
    });
  }
  if ((badges.redCards ?? 0) > 0) {
    items.push({
      key: "red",
      count: badges.redCards ?? 0,
      bg: "bg-white",
      icon: "square",
      iconColor: "#DC2626",
    });
  }

  if (items.length === 0) return null;

  return (
    <View className="absolute -right-1 -top-1 flex-col items-end gap-0.5">
      {items.map((item) => (
        <View
          key={item.key}
          className={[
            "h-4 min-w-4 flex-row items-center justify-center rounded-full px-0.5",
            item.bg,
          ].join(" ")}
        >
          {item.key === "yellow" || item.key === "red" ? (
            <View
              className="h-2.5 w-2 rounded-[1px]"
              style={{
                backgroundColor: item.key === "yellow" ? "#EAB308" : "#DC2626",
              }}
            />
          ) : (
            <Ionicons name={item.icon} size={10} color={item.iconColor} />
          )}
          {item.count > 1 ? (
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="pl-0.5 text-[8px] text-neutral-900"
            >
              {item.count}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}
