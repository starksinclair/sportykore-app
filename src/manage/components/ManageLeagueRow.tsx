import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

import type { OwnedLeague } from "../types";

type Props = {
  league: OwnedLeague;
  onPress: () => void;
};

export function ManageLeagueRow({ league, onPress }: Props) {
  const seasonLabel = league.activeSeason?.name ?? "No active season";

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-[20px] border border-neutral-200 bg-white px-4 py-4 active:bg-neutral-50"
      style={styles.card}
    >
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#4A148C]">
        <Ionicons name="trophy-outline" size={22} color="#FFFFFF" />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-[15px] text-neutral-950"
          numberOfLines={1}
        >
          {league.name}
        </Text>
        <Text
          style={{ fontFamily: fonts.body }}
          className="text-xs text-neutral-500"
          numberOfLines={1}
        >
          {seasonLabel}
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
