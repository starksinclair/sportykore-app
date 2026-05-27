import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiGame } from "@/api/entities";
import { formatPlayedAt } from "@/lib/datetime";
import { phaseLabel } from "@/lib/general-utils";
import { fonts } from "@/theme/fonts";

type Props = {
  games: ApiGame[];
};

export function LeagueMatchesTab({ games }: Props) {
  const router = useRouter();
  const sorted = useMemo(
    () =>
      [...games].sort(
        (a, b) =>
          new Date(b.playedAt).valueOf() - new Date(a.playedAt).valueOf(),
      ),
    [games],
  );

  if (!sorted.length) {
    return (
      <Text
        style={{ fontFamily: fonts.body }}
        className="text-sm text-white/55"
      >
        No matches scheduled in this season yet.
      </Text>
    );
  }

  return (
    <View className="gap-3">
      {sorted.map((game) => (
        <Pressable
          key={game.id}
          onPress={() => router.push(`/match/${game.id}`)}
          className="rounded-[22px] bg-white/6 px-4 py-4 active:bg-white/10"
        >
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-white"
              >
                {game.homeTeam?.name ?? "TBD"}
              </Text>
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="pt-1 text-white"
              >
                {game.awayTeam?.name ?? "TBD"}
              </Text>
            </View>
            <View className="items-end gap-1">
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-[#E6A817]"
              >
                {game.homeScore ?? "-"}
              </Text>
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-[#E6A817]"
              >
                {game.awayScore ?? "-"}
              </Text>
            </View>
          </View>
          <Text
            style={{ fontFamily: fonts.body }}
            className="pt-3 text-xs uppercase tracking-[1.5px] text-white/45"
          >
            {formatPlayedAt(game.playedAt)} · {phaseLabel(game.status, game.currentMinute)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
