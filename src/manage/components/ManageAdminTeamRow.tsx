import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { EntityLogo } from "@/components/ui";
import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

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
      className="flex-row items-center gap-4 rounded-[20px] border border-neutral-200 bg-white px-4 py-4 active:bg-neutral-50"
      style={styles.card}
    >
      <EntityLogo
        logoUrl={team.logoUrl}
        variant="team"
        size="md"
        tone="brand"
        accessibilityLabel={`${team.name} logo`}
      />
      <View className="min-w-0 flex-1 gap-1">
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-[15px] text-neutral-950"
          numberOfLines={1}
        >
          {team.name}
        </Text>
        <Text
          style={{ fontFamily: fonts.body }}
          className="text-xs text-neutral-500"
          numberOfLines={1}
        >
          {team.league.name} · {seasonLabel}
        </Text>
        <Text
          style={{ fontFamily: fonts.bodySemibold }}
          className="text-[11px] uppercase tracking-wide text-brand-700"
        >
          Team admin
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowColor: colors.scoreboardBlack,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
});
