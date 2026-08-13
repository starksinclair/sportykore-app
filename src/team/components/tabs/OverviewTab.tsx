import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type {
  ApiStanding,
  ApiTeam,
  ApiTeamLeague,
  ApiTeamSeason,
} from "@/api/entities";
import { useTheme } from "@/color/use-theme";
import { EntityLogo } from "@/components/ui";
import { formatPlayedAt } from "@/lib/datetime";

import {
  deriveTeamRecord,
  deriveTopPlayer,
  findStandingFor,
} from "../../utils";

type Props = {
  team: ApiTeam;
  league: ApiTeamLeague | null;
  season: ApiTeamSeason | null;
  /** Live stage-standings row (points/position include deductions); falls
   * back to the static `season.standings` snapshot when not yet loaded. */
  liveStanding?: ApiStanding | null;
};

export function TeamOverviewTab({ team, league, season, liveStanding }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const teamId = team.id;

  const games = useMemo(() => season?.games ?? [], [season?.games]);
  const players = useMemo(() => season?.players ?? [], [season?.players]);

  const topPlayer = useMemo(() => deriveTopPlayer(players), [players]);
  const standing = useMemo(
    () => liveStanding ?? findStandingFor(season, teamId),
    [liveStanding, season, teamId],
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
      <View
        className="rounded-[28px] border px-5 py-6"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
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
              className="text-[24px]"
              style={{ color: theme.text }}
            >
              {team.name}
            </Text>
            {league ? (
              <Pressable onPress={() => router.push(`/league/${league.id}`)}>
                <Text
                  className="pt-1 text-sm"
                  style={{ color: theme.accent }}
                >
                  {league.name}
                  {season ? ` · ${season.name}` : ""}
                </Text>
              </Pressable>
            ) : null}
            {standing ? (
              <Text
                className="pt-1 text-xs"
                style={{ color: theme.textSubtle }}
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
            className="rounded-[24px] border px-5 py-5 active:opacity-85"
            style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
          >
            <View className="flex-row items-center gap-4">
              <View
                className="h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.brand }}
              >
                <Text
                  className="text-lg"
                  style={{ color: theme.textInverse }}
                >
                  {initials(topPlayer.player.name)}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  style={{ color: theme.text }}
                >
                  {topPlayer.player.name}
                </Text>
                <Text
                  className="pt-1 text-sm"
                  style={{ color: theme.accent }}
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
              className="rounded-[22px] border px-4 py-4 active:opacity-85"
              style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
            >
              <Text
                style={{ color: theme.text }}
              >
                {game.homeTeam?.name ?? "TBD"} {game.homeScore ?? "-"} -{" "}
                {game.awayScore ?? "-"} {game.awayTeam?.name ?? "TBD"}
              </Text>
              <Text
                className="pt-2 text-sm"
                style={{ color: theme.textSubtle }}
              >
                {formatPlayedAt(game.playedAt)}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text
            className="text-sm"
            style={{ color: theme.textSubtle }}
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
  const theme = useTheme();

  return (
    <View className="gap-3">
      <Text
        className="text-[12px] uppercase tracking-[2px]"
        style={{ color: theme.textSubtle }}
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
  const theme = useTheme();

  return (
    <View
      className="flex-1 rounded-[18px] border px-3 py-4"
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
    >
      <Text
        style={{
          color: accent ? theme.accent : theme.text,
        }}
        className="text-center text-[22px]"
      >
        {value}
      </Text>
      <Text
        className="pt-1 text-center text-xs"
        style={{ color: theme.textSubtle }}
      >
        {label}
      </Text>
    </View>
  );
}
