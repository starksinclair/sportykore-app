import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiGame, ApiTeam, ApiTeamSeason } from "@/api/entities";
import { useTheme } from "@/color/use-theme";
import { EntityLogo } from "@/components/ui";
import { useGamePhaseLabel } from "@/hooks/useGamePhaseLabel";
import { formatPlayedAt } from "@/lib/datetime";

type Props = {
  team: ApiTeam;
  season: ApiTeamSeason | null;
};

export function TeamMatchesTab({ team, season }: Props) {
  const theme = useTheme();
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
      <Text className="text-sm" style={{ color: theme.textSubtle }}>
        Select a league and season to view fixtures.
      </Text>
    );
  }

  if (!games.length) {
    return (
      <Text className="text-sm" style={{ color: theme.textSubtle }}>
        No fixtures recorded for {season.name} yet.
      </Text>
    );
  }

  return (
    <View className="gap-3">
      {games.map((game) => (
        <TeamMatchRow key={game.id} game={game} team={team} />
      ))}
    </View>
  );
}

function TeamMatchRow({ game, team }: { game: ApiGame; team: ApiTeam }) {
  const router = useRouter();
  const theme = useTheme();
  const phase = useGamePhaseLabel(game);
  const isHome = game.homeTeam?.id === team.id;
  const venue = isHome ? "Home" : "Away";

  return (
    <Pressable
      onPress={() => router.push(`/match/${game.id}`)}
      className="rounded-[22px] border px-4 py-4 active:opacity-85"
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-1.5">
          <View className="flex-row items-center gap-2">
            <EntityLogo
              logoUrl={game.homeTeam?.logoUrl}
              variant="team"
              size="xs"
              tone="dark"
            />
            <Text style={{ color: theme.text }}>
              {game.homeTeam?.name ?? "TBD"}
            </Text>
            <Text style={{ color: theme.textSubtle }}>
              vs
            </Text>
            <EntityLogo
              logoUrl={game.awayTeam?.logoUrl}
              variant="team"
              size="xs"
              tone="dark"
            />
            <Text
              className="flex-1"
              style={{ color: theme.text }}
              numberOfLines={1}
            >
              {game.awayTeam?.name ?? "TBD"}
            </Text>
          </View>
          <Text
            className="pt-1 text-xs"
            style={{ color: theme.textSubtle }}
          >
            {venue} · {formatPlayedAt(game.playedAt)} · {phase}
          </Text>
        </View>
        {game.homeScore != null && game.awayScore != null ? (
          <Text
            style={{ color: theme.accent }}
          >
            {game.homeScore}-{game.awayScore}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
