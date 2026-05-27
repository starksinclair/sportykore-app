import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiStat, ApiStatType } from "@/api/entities";
import { iconForStatType, orderStatTypes } from "@/lib/stat-types";
import { fonts } from "@/theme/fonts";

type Props = {
  statTypes: ApiStatType[];
  stats: ApiStat[];
};

type LeaderboardEntry = {
  key: string;
  playerId: number | null;
  playerName: string;
  total: number;
};

type StatGroup = {
  type: ApiStatType;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  entries: LeaderboardEntry[];
};

/**
 * League-specific leaderboard titles keyed by backend slug. Falls back to the
 * stat type's `displayName` when the slug is unknown.
 */
const TITLE_BY_SLUG: Record<string, string> = {
  goals: "Top Scorers",
  own_goal: "Own Goals",
  assists: "Top Assists",
  yellow_card: "Yellow Cards Given",
  red_card: "Red Cards Given",
  saves: "Top Goalkeepers",
  shots_on_target: "Most Shots On Target",
  fouls_conceded: "Most Fouls Conceded",
  substitution_on: "Most Substitutions On",
  substitution_off: "Most Substitutions Off",
};

export function LeagueStatsTab({ statTypes, stats }: Props) {
  const router = useRouter();
  const groups = useMemo(
    () => buildGroups(statTypes, stats),
    [statTypes, stats],
  );

  if (!groups.length) {
    return (
      <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
        No stat events recorded for this season yet.
      </Text>
    );
  }

  return (
    <View className="gap-6">
      {groups.map((group) => (
        <View key={group.type.id} className="gap-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name={group.icon} size={16} color="#E6A817" />
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-[12px] uppercase tracking-[2px] text-white/55"
            >
              {group.title}
            </Text>
          </View>
          <View className="overflow-hidden rounded-[20px] bg-white/6">
            {group.entries.slice(0, 8).map((entry, index, arr) => (
              <Pressable
                key={entry.key}
                disabled={entry.playerId == null}
                onPress={() =>
                  entry.playerId != null &&
                  router.push(`/player/${entry.playerId}`)
                }
                className={[
                  "flex-row items-center gap-3 px-4 py-3",
                  index !== arr.length - 1 ? "border-b border-white/10" : "",
                ].join(" ")}
              >
                <Text
                  style={{ fontFamily: fonts.bodyBold }}
                  className="w-6 text-[12px] text-white/55"
                >
                  {index + 1}
                </Text>
                <Text
                  style={{ fontFamily: fonts.bodyBold }}
                  className="flex-1 text-white"
                  numberOfLines={1}
                >
                  {entry.playerName}
                </Text>
                <Text
                  style={{ fontFamily: fonts.bodyBold }}
                  className="text-[#E6A817]"
                >
                  {entry.total}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function buildGroups(
  statTypes: ApiStatType[],
  stats: ApiStat[],
): StatGroup[] {
  const groups: StatGroup[] = [];

  for (const type of orderStatTypes(statTypes)) {
    const totalsByPlayer = new Map<string, LeaderboardEntry>();

    for (const stat of stats) {
      if (stat.type?.id !== type.id) continue;
      const playerId = stat.player?.id ?? null;
      const playerName = stat.player?.name ?? "Unknown";
      const key = `${playerId ?? "n/a"}`;
      const inc = stat.numericValue ?? 1;

      const existing = totalsByPlayer.get(key);
      if (existing) {
        existing.total += inc;
      } else {
        totalsByPlayer.set(key, { key, playerId, playerName, total: inc });
      }
    }

    const entries = Array.from(totalsByPlayer.values())
      .filter((entry) => entry.total > 0)
      .sort((a, b) => b.total - a.total);

    if (!entries.length) continue;

    groups.push({
      type,
      title: titleFor(type),
      icon: iconForStatType(type),
      entries,
    });
  }

  return groups;
}

function titleFor(type: ApiStatType): string {
  return TITLE_BY_SLUG[type.name.toLowerCase()] ?? type.displayName;
}
