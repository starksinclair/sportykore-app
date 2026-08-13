import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiStat, ApiStatType } from "@/api/entities";
import { useTheme } from "@/color/use-theme";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { iconForStatType, orderStatTypes } from "@/lib/stat-types";

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
  const theme = useTheme();
  const { isTablet } = useAdaptiveLayout();
  const groups = useMemo(
    () => buildGroups(statTypes, stats),
    [statTypes, stats],
  );

  if (!groups.length) {
    return (
      <Text className="text-sm" style={{ color: theme.textSubtle }}>
        No stat events recorded for this season yet.
      </Text>
    );
  }

  return (
    <View className={isTablet ? "flex-row flex-wrap gap-5" : "gap-6"}>
      {groups.map((group) => (
        <View
          key={group.type.id}
          className="gap-3"
          style={isTablet ? { width: "48%" } : undefined}
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name={group.icon} size={16} color={theme.accent} />
            <Text
              className="text-[12px] uppercase tracking-[2px]"
              style={{ color: theme.textSubtle }}
            >
              {group.title}
            </Text>
          </View>
          <View
            className="overflow-hidden rounded-[20px] border"
            style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
          >
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
                  index !== arr.length - 1 ? "border-b" : "",
                ].join(" ")}
                style={{ borderColor: theme.cardBorder }}
              >
                <Text
                  className="w-6 text-[12px]"
                  style={{ color: theme.textSubtle }}
                >
                  {index + 1}
                </Text>
                <Text
                  className="flex-1"
                  style={{ color: theme.text }}
                  numberOfLines={1}
                >
                  {entry.playerName}
                </Text>
                <Text
                  style={{ color: theme.accent }}
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
