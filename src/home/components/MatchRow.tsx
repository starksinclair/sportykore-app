import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatPlayedAtTime } from "@/lib/datetime";
import { phaseLabel } from "@/lib/general-utils";
import { fonts } from "@/theme/fonts";

import type { ApiGame } from "../types";
import { TvScoreboardModal } from "./TvScoreboardModal";

type Props = {
  game: ApiGame;
};

export function MatchRow({ game }: Props) {
  const router = useRouter();
  const [tvOpen, setTvOpen] = useState(false);
  const isLive = game.status === "live" || game.status === "break";
  const showScore =
    game.status === "live" ||
    game.status === "break" ||
    game.status === "completed";

  return (
    <>
      <Pressable
        onPress={() => router.push(`/match/${game.id}`)}
        className="flex-row items-start gap-3 px-3 py-2 active:bg-neutral-50"
      >
        <View className="w-12 items-center">
          <Text
            style={[styles.timeLabel, { fontFamily: fonts.bodyBold }]}
            className="text-[10px] text-neutral-950"
          >
            {formatPlayedAtTime(game.playedAt)}
          </Text>
          <Text
            style={{ fontFamily: fonts.bodySemibold }}
            className={
              isLive
                ? "text-[10px] uppercase tracking-[1px] text-[#ba0c2f]"
                : "text-[10px] uppercase tracking-[1px] text-neutral-500"
            }
          >
            {phaseLabel(game.status, game.currentMinute)}
          </Text>
        </View>

        <View className="flex-1 gap-1.5">
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            numberOfLines={1}
            className="text-[14px] text-neutral-950"
          >
            {game.homeTeam?.name ?? "TBD"}
          </Text>
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            numberOfLines={1}
            className="text-[14px] text-neutral-950"
          >
            {game.awayTeam?.name ?? "TBD"}
          </Text>
        </View>

        {showScore ? (
          <View className="min-w-[24px] items-end gap-1.5 pt-[1px]">
            <Text
              style={[styles.score, { fontFamily: fonts.bodyBold }]}
              className="text-[15px] text-[#ba0c2f]"
            >
              {game.homeScore ?? "-"}
            </Text>
            <Text
              style={[styles.score, { fontFamily: fonts.bodyBold }]}
              className="text-[15px] text-[#ba0c2f]"
            >
              {game.awayScore ?? "-"}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => setTvOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open TV scoreboard"
          hitSlop={8}
          className="ml-2 h-9 w-9 items-center justify-center rounded-full bg-neutral-100 active:bg-neutral-200"
        >
          <Ionicons name="tv-outline" size={16} color="#111827" />
        </Pressable>
      </Pressable>

      <TvScoreboardModal
        game={game}
        visible={tvOpen}
        onClose={() => setTvOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  timeLabel: {
    letterSpacing: 0.4,
  },
  score: {
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.6,
  },
});
