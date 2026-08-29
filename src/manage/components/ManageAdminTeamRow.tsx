import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/color/use-theme";
import { EntityLogo } from "@/components/ui";

import type { AdminTeamManaged } from "../types";

type Props = {
  team: AdminTeamManaged;
  onPress: () => void;
};

export function ManageAdminTeamRow({ team, onPress }: Props) {
  const theme = useTheme();
  const seasonLabel = team.activeSeason?.name ?? "No active season";

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-[22px] border px-4 py-4 active:opacity-85"
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
    >
      <EntityLogo
        logoUrl={team.logoUrl}
        variant="team"
        size="md"
        tone="dark"
        accessibilityLabel={`${team.name} logo`}
      />
      <View className="min-w-0 flex-1 gap-1">
        <Text
          className="text-[15px]"
          style={{ color: theme.text }}
          numberOfLines={1}
        >
          {team.name}
        </Text>
        <Text
          className="text-xs"
          style={{ color: theme.textSubtle }}
          numberOfLines={1}
        >
          {team.league.name} · {seasonLabel}
        </Text>
        <View className="self-start rounded-full px-2.5 py-1" style={{ backgroundColor: theme.brandMuted }}>
          <Text
            className="text-[10px] uppercase tracking-wide"
            style={{ color: theme.brand }}
          >
            Team manager
          </Text>
        </View>
      </View>
      <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: theme.cardMuted }}>
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </View>
    </Pressable>
  );
}
