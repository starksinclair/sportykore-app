import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiStat } from "@/api/entities";
import { colors } from "@/constants";
import {
  iconForStatType,
  isGoalsStat,
  isOwnGoalStat,
} from "@/lib/stat-types";
import { fonts } from "@/theme/fonts";

type TeamSide = "home" | "away" | "neutral";

type TimelineEvent = {
  stat: ApiStat;
  side: TeamSide;
  assist?: ApiStat;
};

type Props = {
  stats: ApiStat[];
  homeTeamId?: number;
  awayTeamId?: number;
  onPlayerPress?: (playerId: number) => void;
};

export function MatchEventsTimeline({
  stats,
  homeTeamId,
  awayTeamId,
  onPlayerPress,
}: Props) {
  const events = useMemo(
    () => buildTimelineEvents(stats, homeTeamId, awayTeamId),
    [stats, homeTeamId, awayTeamId],
  );

  if (!events.length) {
    return (
      <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
        No events recorded yet.
      </Text>
    );
  }

  return (
    <View className="relative overflow-hidden rounded-[20px] bg-white/6 px-3 py-4">
      <View
        className="absolute bottom-4 left-1/2 top-4 w-px -translate-x-1/2 bg-white/15"
        pointerEvents="none"
      />

      <View className="gap-3">
        {events.map((event) => (
          <EventTimelineRow
            key={event.stat.id}
            event={event}
            onPlayerPress={onPlayerPress}
          />
        ))}
      </View>
    </View>
  );
}

function buildTimelineEvents(
  stats: ApiStat[],
  homeTeamId?: number,
  awayTeamId?: number,
): TimelineEvent[] {
  const assistsByGoalPlayer = new Map<number, ApiStat>();
  const visible: ApiStat[] = [];

  for (const stat of stats) {
    const slug = stat.type?.name?.toLowerCase();
    if (slug === "assists" || slug === "assist") {
      if (stat.relatedPlayer?.id != null) {
        assistsByGoalPlayer.set(stat.relatedPlayer.id, stat);
      }
      continue;
    }
    visible.push(stat);
  }

  const sorted = [...visible].sort((a, b) => {
    const ma = a.minute ?? Number.POSITIVE_INFINITY;
    const mb = b.minute ?? Number.POSITIVE_INFINITY;
    if (ma !== mb) return ma - mb;
    const stoppageA = a.isStoppageTime ? 1 : 0;
    const stoppageB = b.isStoppageTime ? 1 : 0;
    if (stoppageA !== stoppageB) return stoppageA - stoppageB;
    return a.id - b.id;
  });

  return sorted.map((stat) => {
    const side = resolveSide(stat, homeTeamId, awayTeamId);
    const isGoal = isGoalsStat(stat) || isOwnGoalStat(stat);
    const assist =
      isGoal && stat.player?.id != null
        ? assistsByGoalPlayer.get(stat.player.id)
        : undefined;

    return { stat, side, assist };
  });
}

function resolveSide(
  stat: ApiStat,
  homeTeamId?: number,
  awayTeamId?: number,
): TeamSide {
  if (stat.team?.id != null && stat.team.id === homeTeamId) return "home";
  if (stat.team?.id != null && stat.team.id === awayTeamId) return "away";
  return "neutral";
}

function EventTimelineRow({
  event,
  onPlayerPress,
}: {
  event: TimelineEvent;
  onPlayerPress?: (playerId: number) => void;
}) {
  const { stat, side, assist } = event;
  const minuteLabel = formatMinute(stat);

  if (side === "neutral") {
    return (
      <View className="items-center gap-2">
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-xs text-accent-400"
        >
          {minuteLabel}
        </Text>
        <EventBubble
          stat={stat}
          assist={assist}
          align="center"
          onPlayerPress={onPlayerPress}
        />
      </View>
    );
  }

  return (
    <View className="flex-row items-start gap-2">
      <View className="min-h-[1px] flex-1 justify-center">
        {side === "home" ? (
          <EventBubble
            stat={stat}
            assist={assist}
            align="start"
            onPlayerPress={onPlayerPress}
          />
        ) : null}
      </View>

      <View className="z-10 w-12 items-center pt-1">
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-xs text-accent-400"
        >
          {minuteLabel}
        </Text>
      </View>

      <View className="min-h-[1px] flex-1 justify-center">
        {side === "away" ? (
          <EventBubble
            stat={stat}
            assist={assist}
            align="end"
            onPlayerPress={onPlayerPress}
          />
        ) : null}
      </View>
    </View>
  );
}

function EventBubble({
  stat,
  assist,
  align,
  onPlayerPress,
}: {
  stat: ApiStat;
  assist?: ApiStat;
  align: "start" | "end" | "center";
  onPlayerPress?: (playerId: number) => void;
}) {
  const typeName = stat.type?.displayName ?? stat.type?.name ?? "Event";
  const unaccredited =
    stat.isUnaccredited || (isGoalsStat(stat) && !stat.player);
  const playerName = unaccredited
    ? "Unaccredited"
    : (stat.player?.name ?? "Unknown");
  const playerId = stat.player?.id;
  const iconName = stat.type ? iconForStatType(stat.type) : "stats-chart-outline";
  const iconColor = iconColorForStat(stat);

  const alignClass =
    align === "end"
      ? "items-end self-end"
      : align === "center"
        ? "items-center self-center"
        : "items-start self-start";

  const textAlignClass =
    align === "end" ? "text-right" : align === "center" ? "text-center" : "";

  const content = (
    <View
      className={[
        "max-w-full flex-row gap-2 rounded-xl bg-white/8 px-3 py-2.5",
        alignClass,
      ].join(" ")}
    >
      {align !== "end" ? (
        <Ionicons name={iconName} size={16} color={iconColor} />
      ) : null}
      <View className={align === "end" ? "items-end" : align === "center" ? "items-center" : ""}>
        <Text
          style={{ fontFamily: fonts.bodySemibold }}
          className={["text-sm text-white", textAlignClass].join(" ")}
          numberOfLines={2}
        >
          {playerName}
        </Text>
        <Text
          style={{ fontFamily: fonts.body }}
          className={["pt-0.5 text-xs text-white/55", textAlignClass].join(" ")}
          numberOfLines={1}
        >
          {typeName}
        </Text>
        {assist ? (
          <Text
            style={{ fontFamily: fonts.body }}
            className={["pt-0.5 text-xs text-white/45", textAlignClass].join(" ")}
            numberOfLines={1}
          >
            {assist.player?.name ?? "Assist"}
          </Text>
        ) : null}
      </View>
      {align === "end" ? (
        <Ionicons name={iconName} size={16} color={iconColor} />
      ) : null}
    </View>
  );

  if (playerId == null || onPlayerPress == null) {
    return content;
  }

  return (
    <Pressable
      onPress={() => onPlayerPress(playerId)}
      className={alignClass}
    >
      {content}
    </Pressable>
  );
}

function formatMinute(stat: ApiStat): string {
  if (stat.minute == null) return "—";
  return `${stat.minute}${stat.isStoppageTime ? "+" : ""}'`;
}

function iconColorForStat(stat: ApiStat): string {
  const slug = stat.type?.name?.toLowerCase();
  if (slug === "goals" || slug === "own_goal") return colors.accent;
  if (slug === "yellow_card") return colors.signInYellow;
  if (slug === "red_card") return colors.liveRed;
  return "rgba(255,255,255,0.7)";
}
