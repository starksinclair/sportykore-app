import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View, type GestureResponderEvent } from "react-native";

import { useTheme } from "@/color/use-theme";
import { EntityLogo } from "@/components/ui";

import type { OwnedLeague } from "../types";

type Props = {
  league: OwnedLeague;
  onPress: () => void;
  onShare?: () => void;
};

export function ManageLeagueRow({ league, onPress, onShare }: Props) {
  const theme = useTheme();
  const seasonLabel = league.activeSeason?.name ?? "No active season";
  const handleShare = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onShare?.();
  };

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-[22px] border px-4 py-4 active:opacity-85"
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
    >
      <EntityLogo
        logoUrl={league.logoUrl}
        variant="league"
        size="md"
        tone="dark"
        accessibilityLabel={`${league.name} logo`}
      />
      <View className="min-w-0 flex-1 gap-1">
        <Text
          className="text-[15px]"
          style={{ color: theme.text }}
          numberOfLines={1}
        >
          {league.name}
        </Text>
        <Text
          className="text-xs"
          style={{ color: theme.textSubtle }}
          numberOfLines={1}
        >
          {seasonLabel}
        </Text>
        <View className="self-start rounded-full px-2.5 py-1" style={{ backgroundColor: theme.accentMuted }}>
          <Text
            className="text-[10px] uppercase tracking-wide"
            style={{ color: theme.accent }}
          >
            League admin
          </Text>
        </View>
      </View>
      {onShare ? (
        <Pressable
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel={`Share invite for ${league.name}`}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:opacity-85"
          style={{ backgroundColor: theme.accentMuted }}
        >
          <Ionicons name="share-social-outline" size={17} color={theme.accent} />
        </Pressable>
      ) : null}
      <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: theme.cardMuted }}>
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </View>
    </Pressable>
  );
}
