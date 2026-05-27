import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { CountryFlag } from "@/components/ui/CountryFlag";
import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

import type { ApiCountryWithLeagues } from "../types";

type Props = {
  entry: ApiCountryWithLeagues;
  defaultOpen?: boolean;
};

export function LeagueDirectoryRow({ entry, defaultOpen = false }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View
      className="overflow-hidden rounded-[20px] border border-neutral-200 bg-white"
      style={styles.card}
    >
      <Pressable
        onPress={() => setOpen((current) => !current)}
        className="flex-row items-center justify-between gap-3 px-4 py-4 active:bg-neutral-50"
      >
        <View className="flex-row items-center gap-3">
          <CountryFlag code={entry.code} width={26} />
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className="text-[15px] text-neutral-950"
          >
            {entry.name}
          </Text>
        </View>

        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color="#6B7280"
        />
      </Pressable>

      {open ? (
        <Animated.View entering={FadeIn.duration(160)} className="gap-2 px-4 pb-4">
          {entry.leagues.map((league) => (
            <Pressable
              key={league.id}
              onPress={() => router.push(`/league/${league.id}`)}
              className="flex-row items-center justify-between rounded-[14px] bg-[#F8F8FA] px-4 py-3 active:bg-neutral-100"
            >
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="flex-1 text-[14px] text-neutral-950"
                numberOfLines={1}
              >
                {league.name}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
            </Pressable>
          ))}
        </Animated.View>
      ) : null}
    </View>
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
