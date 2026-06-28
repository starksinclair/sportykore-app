import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type {
  ApiTeam,
  ApiTeamLeague,
  ApiTeamSeason,
} from "@/api/entities";
import { EntityLogo } from "@/components/ui";
import { colors } from "@/constants";
import { formatPlayedAt } from "@/lib/datetime";
import { fonts } from "@/theme/fonts";

import {
  deriveTeamRecord,
  deriveTopPlayer,
  findStandingFor,
} from "../../utils";

type Props = {
  team: ApiTeam;
  league: ApiTeamLeague | null;
  season: ApiTeamSeason | null;
};

export function TeamOverviewTab({ team, league, season }: Props) {
  const router = useRouter();
  const teamId = team.id;

  const games = useMemo(() => season?.games ?? [], [season?.games]);
  const players = useMemo(() => season?.players ?? [], [season?.players]);

  const topPlayer = useMemo(() => deriveTopPlayer(players), [players]);
  const standing = useMemo(
    () => findStandingFor(season, teamId),
    [season, teamId],
  );
  // Prefer the backend-computed standings row when present, otherwise derive
  // W/D/L from completed `season.games` so the cards still populate while a
  // season's standings table is empty.
  const record = useMemo(() => {
    if (standing) {
      return {
        wins: standing.wins,
        draws: standing.draws,
        losses: standing.losses,
        goalsFor: standing.goalsFor,
        goalsAgainst: standing.goalsAgainst,
        played: standing.played,
      };
    }
    return deriveTeamRecord(games, teamId);
  }, [standing, games, teamId]);

  const recent = useMemo(
    () =>
      [...games]
        .filter((g) => g.status === "full_time")
        .sort(
          (a, b) =>
            new Date(b.playedAt).valueOf() - new Date(a.playedAt).valueOf(),
        )
        .slice(0, 5),
    [games],
  );

  return (
    <View className="gap-6">
      <View className="rounded-[28px] bg-white/6 px-5 py-6">
        <View className="flex-row items-center gap-4">
          <EntityLogo
            logoUrl={team.logoUrl}
            variant="team"
            size="lg"
            tone="brand"
            accessibilityLabel={`${team.name} logo`}
          />
          <View className="flex-1">
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-[24px] text-white"
            >
              {team.name}
            </Text>
            {league ? (
              <Pressable onPress={() => router.push(`/league/${league.id}`)}>
                <Text
                  style={{ fontFamily: fonts.body }}
                  className="pt-1 text-sm text-[#E6A817]"
                >
                  {league.name}
                  {season ? ` · ${season.name}` : ""}
                </Text>
              </Pressable>
            ) : null}
            {standing ? (
              <Text
                style={{ fontFamily: fonts.body }}
                className="pt-1 text-xs text-white/55"
              >
                Position #{standing.position} · {standing.points} pts
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View className="flex-row gap-3">
        <MiniCard label="W" value={record.wins} accent />
        <MiniCard label="D" value={record.draws} />
        <MiniCard label="L" value={record.losses} />
        <MiniCard label="GD" value={record.goalsFor - record.goalsAgainst} />
      </View>

      {topPlayer ? (
        <Section title="Top Player">
          <Pressable
            onPress={() => router.push(`/player/${topPlayer.player.id}`)}
            className="rounded-[24px] bg-white/6 px-5 py-5 active:bg-white/10"
          >
            <View className="flex-row items-center gap-4">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-[#364156]">
                <Text
                  style={{ fontFamily: fonts.bodyBold }}
                  className="text-lg text-white"
                >
                  {initials(topPlayer.player.name)}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  style={{ fontFamily: fonts.bodyBold }}
                  className="text-white"
                >
                  {topPlayer.player.name}
                </Text>
                <Text
                  style={{ fontFamily: fonts.body }}
                  className="pt-1 text-sm text-[#E6A817]"
                >
                  {topPlayer.goals} goals · {topPlayer.assists} assists
                </Text>
              </View>
            </View>
          </Pressable>
        </Section>
      ) : null}

      <Section title="Recent Results">
        {recent.length ? (
          recent.map((game) => (
            <Pressable
              key={game.id}
              onPress={() => router.push(`/match/${game.id}`)}
              className="rounded-[22px] bg-white/6 px-4 py-4 active:bg-white/10"
            >
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-white"
              >
                {game.homeTeam?.name ?? "TBD"} {game.homeScore ?? "-"} -{" "}
                {game.awayScore ?? "-"} {game.awayTeam?.name ?? "TBD"}
              </Text>
              <Text
                style={{ fontFamily: fonts.body }}
                className="pt-2 text-sm text-white/55"
              >
                {formatPlayedAt(game.playedAt)}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text
            style={{ fontFamily: fonts.body }}
            className="text-sm text-white/55"
          >
            No completed games yet.
          </Text>
        )}
      </Section>
    </View>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
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
        style={{ fontFamily: fonts.bodyBold }}
        className="text-[12px] uppercase tracking-[2px] text-white/55"
      >
        {title}
      </Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}

function MiniCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <View className="flex-1 rounded-[18px] bg-white/6 px-3 py-4">
      <Text
        style={{
          fontFamily: fonts.bodyBold,
          color: accent ? colors.accent : "#FFFFFF",
        }}
        className="text-center text-[22px]"
      >
        {value}
      </Text>
      <Text
        style={{ fontFamily: fonts.body }}
        className="pt-1 text-center text-xs text-white/55"
      >
        {label}
      </Text>
    </View>
  );
}
