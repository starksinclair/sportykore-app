import { Pressable, Text, View } from "react-native";

import type { ApiStat } from "@/api/entities";
import { useTheme } from "@/color/use-theme";

import { isUnaccreditedGoal } from "../../utils/stats";

type Props = {
  homeGoals: ApiStat[];
  awayGoals: ApiStat[];
  homeTeamName: string;
  awayTeamName: string;
  assistsByGoalPlayer: Map<number, ApiStat>;
  onAccredit: (stat: ApiStat, team: "home" | "away") => void;
};

export function MatchCenterGoalsTab({
  homeGoals,
  awayGoals,
  homeTeamName,
  awayTeamName,
  assistsByGoalPlayer,
  onAccredit,
}: Props) {
  const theme = useTheme();
  const maxRows = Math.max(homeGoals.length, awayGoals.length);

  if (maxRows === 0) {
    return (
      <Text className="text-sm" style={{ color: theme.textSubtle }}>
        No goals recorded yet.
      </Text>
    );
  }

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between px-1">
        <Text
          className="flex-1 text-xs uppercase tracking-wide"
          style={{ color: theme.textMuted }}
          numberOfLines={1}
        >
          {homeTeamName}
        </Text>
        <Text
          className="w-12 text-center text-xs uppercase tracking-wide"
          style={{ color: theme.textSubtle }}
        >
          Min
        </Text>
        <Text
          className="flex-1 text-right text-xs uppercase tracking-wide"
          style={{ color: theme.textMuted }}
          numberOfLines={1}
        >
          {awayTeamName}
        </Text>
      </View>

      {Array.from({ length: maxRows }, (_, index) => {
        const home = homeGoals[index];
        const away = awayGoals[index];
        return (
          <View key={index} className="flex-row items-start gap-2">
            <GoalCell
              stat={home}
              align="start"
              team="home"
              assistsByGoalPlayer={assistsByGoalPlayer}
              onAccredit={onAccredit}
              theme={theme}
            />
            <Text
              className="w-12 pt-1 text-center text-sm"
              style={{ color: theme.accent }}
            >
              {formatGoalMinute(home ?? away)}
            </Text>
            <GoalCell
              stat={away}
              align="end"
              team="away"
              assistsByGoalPlayer={assistsByGoalPlayer}
              onAccredit={onAccredit}
              theme={theme}
            />
          </View>
        );
      })}
    </View>
  );
}

function formatGoalMinute(stat: ApiStat | undefined): string {
  if (stat?.minute == null) return "-";
  return `${stat.minute}${stat.isStoppageTime ? "+" : ""}'`;
}

function GoalCell({
  stat,
  align,
  team,
  assistsByGoalPlayer,
  onAccredit,
  theme,
}: {
  stat: ApiStat | undefined;
  align: "start" | "end";
  team: "home" | "away";
  assistsByGoalPlayer: Map<number, ApiStat>;
  onAccredit: (stat: ApiStat, team: "home" | "away") => void;
  theme: ReturnType<typeof useTheme>;
}) {
  if (!stat) {
    return <View className="flex-1" />;
  }

  const unaccredited = isUnaccreditedGoal(stat);
  const playerName = unaccredited
    ? "Unaccredited"
    : (stat.player?.name ?? "Unknown");
  const assist =
    stat.player?.id != null
      ? assistsByGoalPlayer.get(stat.player.id)
      : undefined;

  return (
    <View className={`flex-1 ${align === "end" ? "items-end" : "items-start"}`}>
      <Text
        className={`text-sm ${align === "end" ? "text-right" : ""}`}
        style={{ color: theme.text }}
      >
        {playerName}
        {stat.isPenalty ? (
          <Text className="text-xs" style={{ color: theme.textSubtle }}>
            {" "}(pen.)
          </Text>
        ) : null}
      </Text>
      {assist ? (
        <Text
          className={`pt-0.5 text-xs ${align === "end" ? "text-right" : ""}`}
          style={{ color: theme.textSubtle }}
        >
          {assist.player?.name ?? "Assist"}
        </Text>
      ) : null}
      {unaccredited ? (
        <Pressable
          onPress={() => onAccredit(stat, team)}
          className="mt-2 rounded-full px-3 py-1"
          style={{ backgroundColor: theme.accentMuted }}
        >
          <Text className="text-xs" style={{ color: theme.accent }}>
            Accredit
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
