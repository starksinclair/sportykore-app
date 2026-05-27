import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiPlayerWithStats, ApiTeamSeason } from "@/api/entities";
import {
  groupPlayersByPosition,
  shortForPosition,
  type PositionGroup,
} from "@/lib/positions";
import { isGoalsStat } from "@/lib/stat-types";
import { fonts } from "@/theme/fonts";

type Props = {
  season: ApiTeamSeason | null;
};

type PlayerLine = ApiPlayerWithStats & {
  goals: number;
  assists: number;
  events: number;
};

export function TeamSquadTab({ season }: Props) {
  const router = useRouter();
  const groups = useMemo(
    () => buildGroupedSquad(season?.players ?? []),
    [season?.players],
  );

  if (!season) {
    return (
      <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
        Select a league and season to view the squad.
      </Text>
    );
  }

  if (!groups.length) {
    return (
      <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
        Squad roster not available for this season yet.
      </Text>
    );
  }

  return (
    <View className="gap-6">
      {groups.map((group) => (
        <View key={group.position ?? "unassigned"} className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-[12px] uppercase tracking-[2px] text-white/55"
            >
              {group.label}
            </Text>
            <Text
              style={{ fontFamily: fonts.body }}
              className="text-[11px] text-white/45"
            >
              {group.players.length}
            </Text>
          </View>
          <View className="gap-2">
            {group.players.map((player) => (
              <Pressable
                key={player.id}
                onPress={() => router.push(`/player/${player.id}`)}
                className="flex-row items-center gap-3 rounded-[18px] bg-white/6 px-4 py-4 active:bg-white/10"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#364156]">
                  <Text
                    style={{ fontFamily: fonts.bodyBold }}
                    className="text-[11px] text-white"
                  >
                    {shortForPosition(player.position)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    style={{ fontFamily: fonts.bodyBold }}
                    className="text-white"
                  >
                    {player.name}
                  </Text>
                  {player.goals > 0 || player.assists > 0 ? (
                    <Text
                      style={{ fontFamily: fonts.body }}
                      className="pt-1 text-xs text-white/55"
                    >
                      {player.goals} goal{player.goals === 1 ? "" : "s"} ·{" "}
                      {player.assists} assist
                      {player.assists === 1 ? "" : "s"}
                    </Text>
                  ) : player.events > 0 ? (
                    <Text
                      style={{ fontFamily: fonts.body }}
                      className="pt-1 text-xs text-white/45"
                    >
                      {player.events} event{player.events === 1 ? "" : "s"}{" "}
                      recorded
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function buildGroupedSquad(
  players: ApiPlayerWithStats[],
): PositionGroup<PlayerLine>[] {
  const lines: PlayerLine[] = players.map((player) => {
    let goals = 0;
    let assists = 0;
    for (const stat of player.stats) {
      const slug = stat.type?.name?.toLowerCase() ?? "";
      const display = stat.type?.displayName?.toLowerCase() ?? "";
      const inc = stat.numericValue ?? 1;
      if (isGoalsStat(stat)) goals += inc;
      if (slug === "assists" || display.includes("assist")) assists += inc;
    }
    return { ...player, goals, assists, events: player.stats.length };
  });

  // Sort within each position by goals → assists → name. groupPlayersByPosition
  // preserves the input order per bucket, so sort here first.
  lines.sort(
    (a, b) =>
      b.goals - a.goals ||
      b.assists - a.assists ||
      a.name.localeCompare(b.name),
  );

  return groupPlayersByPosition(lines);
}
