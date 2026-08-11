import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiSeasonDetail } from "@/api/entities";
import { colors } from "@/constants";
import { formatPlayedAt } from "@/lib/datetime";
import { isLiveGameStatus } from "@/lib/general-utils";
import { isGoalsStat } from "@/lib/stat-types";
import { SeasonFormatBanner } from "../SeasonFormatBanner";

type Props = {
  season: ApiSeasonDetail;
};

export function LeagueOverviewTab({ season }: Props) {
  const router = useRouter();
  const counts = useMemo(() => deriveCounts(season), [season]);
  const topScorer = useMemo(() => deriveTopScorer(season), [season]);
  const recentResults = useMemo(
    () =>
      season.games
        .filter((g) => g.status === "full_time")
        .sort(
          (a, b) =>
            new Date(b.playedAt).valueOf() - new Date(a.playedAt).valueOf(),
        )
        .slice(0, 5),
    [season.games],
  );

  return (
    <View className="gap-6">

      {season.league.description && (
          <View className="flex-row items-center gap-3">
            <Text className="text-white text-[16px]"> {season.league.description}</Text>
          </View>
       ) }

      <SeasonFormatBanner stages={season.stages ?? []} />

      <View className="flex-row gap-3">
        <StatCard label="Teams" value={counts.teams} />
        <StatCard label="Matches" value={counts.matches} />
        <StatCard label="Live" value={counts.live} />
      </View>

      {topScorer ? (
        <Section title="Player Of The Season">
          <Pressable
            onPress={() => router.push(`/player/${topScorer.player.id}`)}
            className="rounded-[24px] bg-white/6 px-5 py-5 active:bg-white/10"
          >
            <View className="flex-row items-center gap-4">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-[#364156]">
                <Text
                  className="text-xl text-white"
                >
                  {initials(topScorer.player.name)}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className="text-[20px] text-white"
                >
                  {topScorer.player.name}
                </Text>
                <Text
                  className="pt-2 text-sm text-[#E6A817]"
                >
                  {topScorer.goals} goals · {topScorer.assists} assists
                </Text>
              </View>
            </View>
          </Pressable>
        </Section>
      ) : null}

      <Section title="Recent Results">
        {recentResults.length ? (
          recentResults.map((game) => (
            <Pressable
              key={game.id}
              onPress={() => router.push(`/match/${game.id}`)}
              className="rounded-[22px] bg-white/6 px-4 py-4 active:bg-white/10"
            >
              <Text
                className="text-white"
              >
                {game.homeTeam?.name ?? "TBD"} {game.homeScore ?? "-"} -{" "}
                {game.awayScore ?? "-"} {game.awayTeam?.name ?? "TBD"}
              </Text>
              <Text
                className="pt-2 text-sm text-white/55"
              >
                {formatPlayedAt(game.playedAt)}
              </Text>
            </Pressable>
          ))
        ) : (
          <EmptyText>No recent results yet.</EmptyText>
        )}
      </Section>
    </View>
  );
}

function deriveCounts(season: ApiSeasonDetail) {
  const teamIds = new Set<number>();
  for (const standing of season.standings) {
    if (standing.team?.id != null) teamIds.add(standing.team.id);
  }
  for (const game of season.games) {
    if (game.homeTeam?.id != null) teamIds.add(game.homeTeam.id);
    if (game.awayTeam?.id != null) teamIds.add(game.awayTeam.id);
  }
  return {
    teams: teamIds.size,
    matches: season.games.length,
    live: season.games.filter((g) => isLiveGameStatus(g.status)).length,
  };
}

function deriveTopScorer(season: ApiSeasonDetail) {
  const totals = new Map<
    number,
    { player: { id: number; name: string }; goals: number; assists: number }
  >();
  for (const stat of season.stats) {
    if (!stat.player) continue;
    const key = stat.player.id;
    const entry =
      totals.get(key) ??
      { player: stat.player, goals: 0, assists: 0 };
    if (isGoalsStat(stat)) entry.goals += stat.numericValue ?? 1;
    const display = stat.type?.displayName?.toLowerCase() ?? "";
    if (display.includes("assist")) entry.assists += stat.numericValue ?? 1;
    totals.set(key, entry);
  }
  const ranked = Array.from(totals.values()).sort(
    (a, b) => b.goals - a.goals || b.assists - a.assists,
  );
  return ranked[0] ?? null;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 rounded-[22px] bg-white/6 px-3 py-4">
      <Text
        style={{ color: colors.accent }}
        className="text-center text-[24px]"
      >
        {value}
      </Text>
      <Text
        className="pt-1 text-center text-xs text-white/55"
      >
        {label}
      </Text>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: import("react").ReactNode;
}) {
  return (
    <View className="gap-3">
      <Text
        className="text-[12px] uppercase tracking-[2px] text-white/55"
      >
        {title}
      </Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}

function EmptyText({ children }: { children: string }) {
  return (
    <Text
      className="text-sm text-white/55"
    >
      {children}
    </Text>
  );
}
