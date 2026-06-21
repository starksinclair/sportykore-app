import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { CountryLabel } from "@/components/ui/CountryFlag";
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
      <View
        className="flex-row items-center justify-between gap-3 px-4 py-4 active:bg-neutral-50"
      >
        <TouchableOpacity onPress={() => router.push(`/country/${entry.id}`)}>
        <CountryLabel
          code={entry.code}
          name={entry.name}
          className="gap-3"
          flagWidth={26}
          textClassName="text-[16px] text-neutral-950 font-bold"
        />
        </TouchableOpacity>

        <Pressable onPress={() => setOpen((current) => !current)}>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color="#6B7280"
        />
        </Pressable>
        
      </View>

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
