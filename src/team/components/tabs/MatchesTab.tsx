import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiTeam, ApiTeamSeason } from "@/api/entities";
import { formatPlayedAt } from "@/lib/datetime";
import { fonts } from "@/theme/fonts";

type Props = {
  team: ApiTeam;
  season: ApiTeamSeason | null;
};

export function TeamMatchesTab({ team, season }: Props) {
  const router = useRouter();
  const games = useMemo(
    () =>
      [...(season?.games ?? [])].sort(
        (a, b) =>
          new Date(b.playedAt).valueOf() - new Date(a.playedAt).valueOf(),
      ),
    [season?.games],
  );

  if (!season) {
    return (
      <Text
        style={{ fontFamily: fonts.body }}
        className="text-sm text-white/55"
      >
        Select a league and season to view fixtures.
      </Text>
    );
  }

  if (!games.length) {
    return (
      <Text
        style={{ fontFamily: fonts.body }}
        className="text-sm text-white/55"
      >
        No fixtures recorded for {season.name} yet.
      </Text>
    );
  }

  return (
    <View className="gap-3">
      {games.map((game) => {
        const isHome = game.homeTeam?.id === team.id;
        const venue = isHome ? "Home" : "Away";
        return (
          <Pressable
            key={game.id}
            onPress={() => router.push(`/match/${game.id}`)}
            className="rounded-[22px] bg-white/6 px-4 py-4 active:bg-white/10"
          >
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text style={{ fontFamily: fonts.bodyBold }} className="text-white">
                  {game.homeTeam?.name ?? "TBD"} vs{" "}
                  {game.awayTeam?.name ?? "TBD"}
                </Text>
                <Text
                  style={{ fontFamily: fonts.body }}
                  className="pt-1 text-xs text-white/55"
                >
                  {venue} · {formatPlayedAt(game.playedAt)} · {game.status}
                </Text>
              </View>
              {game.homeScore != null && game.awayScore != null ? (
                <Text
                  style={{ fontFamily: fonts.bodyBold }}
                  className="text-[#E6A817]"
                >
                  {game.homeScore}-{game.awayScore}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
