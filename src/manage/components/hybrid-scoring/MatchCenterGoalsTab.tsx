import { Pressable, Text, View } from "react-native";

import type { ApiStat } from "@/api/entities";
import { fonts } from "@/theme/fonts";

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
  const maxRows = Math.max(homeGoals.length, awayGoals.length);

  if (maxRows === 0) {
    return (
      <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
        No goals recorded yet.
      </Text>
    );
  }

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between px-1">
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="flex-1 text-xs uppercase tracking-wide text-white/55"
          numberOfLines={1}
        >
          {homeTeamName}
        </Text>
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="w-12 text-center text-xs uppercase tracking-wide text-white/35"
        >
          Min
        </Text>
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="flex-1 text-right text-xs uppercase tracking-wide text-white/55"
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
            />
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="w-12 pt-1 text-center text-sm text-[#E6A817]"
            >
              {formatGoalMinute(home ?? away)}
            </Text>
            <GoalCell
              stat={away}
              align="end"
              team="away"
              assistsByGoalPlayer={assistsByGoalPlayer}
              onAccredit={onAccredit}
            />
          </View>
        );
      })}
    </View>
  );
}

function formatGoalMinute(stat: ApiStat | undefined): string {
  if (stat?.minute == null) return "—";
  return `${stat.minute}${stat.isStoppageTime ? "+" : ""}'`;
}

function GoalCell({
  stat,
  align,
  team,
  assistsByGoalPlayer,
  onAccredit,
}: {
  stat: ApiStat | undefined;
  align: "start" | "end";
  team: "home" | "away";
  assistsByGoalPlayer: Map<number, ApiStat>;
  onAccredit: (stat: ApiStat, team: "home" | "away") => void;
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
        style={{ fontFamily: fonts.bodySemibold }}
        className={`text-sm text-white ${align === "end" ? "text-right" : ""}`}
      >
        {playerName}
      </Text>
      {assist ? (
        <Text
          style={{ fontFamily: fonts.body }}
          className={`pt-0.5 text-xs text-white/45 ${align === "end" ? "text-right" : ""}`}
        >
          {assist.player?.name ?? "Assist"}
        </Text>
      ) : null}
      {unaccredited ? (
        <Pressable
          onPress={() => onAccredit(stat, team)}
          className="mt-2 rounded-full bg-accent-500/20 px-3 py-1"
        >
          <Text style={{ fontFamily: fonts.bodySemibold }} className="text-xs text-accent-400">
            Accredit
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
