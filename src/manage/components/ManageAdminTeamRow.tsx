import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { EntityLogo } from "@/components/ui";
import { colors } from "@/constants";

import type { AdminTeamManaged } from "../types";

type Props = {
  team: AdminTeamManaged;
  onPress: () => void;
};

export function ManageAdminTeamRow({ team, onPress }: Props) {
  const seasonLabel = team.activeSeason?.name ?? "No active season";

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 active:bg-white/10"
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
          className="text-[15px] text-white"
          numberOfLines={1}
        >
          {team.name}
        </Text>
        <Text
          className="text-xs text-white/50"
          numberOfLines={1}
        >
          {team.league.name} · {seasonLabel}
        </Text>
        <View className="self-start rounded-full bg-brand-500/35 px-2.5 py-1">
          <Text
            className="text-[10px] uppercase tracking-wide text-white"
          >
            Team manager
          </Text>
        </View>
      </View>
      <View className="h-9 w-9 items-center justify-center rounded-full bg-white/8">
        <Ionicons name="chevron-forward" size={18} color={colors.white} />
      </View>
    </Pressable>
  );
}
