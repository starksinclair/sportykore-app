import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiGame, ApiPlayerSeason } from "@/api/entities";
import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import { EntityLogo } from "@/components/ui";
import { useGamePhaseLabel } from "@/hooks/useGamePhaseLabel";
import { formatPlayedAt } from "@/lib/datetime";

type Props = {
  season: ApiPlayerSeason | null;
};

export function PlayerMatchesTab({ season }: Props) {
  const theme = useTheme();
  const games = useMemo(
    () =>
      [...(season?.games ?? [])].sort(
        (a, b) =>
          new Date(b.playedAt).valueOf() - new Date(a.playedAt).valueOf(),
      ),
    [season],
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

  const teamId = season.team.id;

  return (
    <View className="gap-3">
      {games.map((game) => (
        <PlayerMatchRow
          key={game.id}
          game={game}
          teamId={teamId}
          teamName={season.team.name}
          teamLogoUrl={season.team.logoUrl}
        />
      ))}
    </View>
  );
}

function PlayerMatchRow({
  game,
  teamId,
  teamName,
  teamLogoUrl,
}: {
  game: ApiGame;
  teamId: number;
  teamName: string;
  teamLogoUrl: string | null;
}) {
  const router = useRouter();
  const theme = useTheme();
  const { isDark } = useAppearance();
  const phase = useGamePhaseLabel(game);
  const isHome = game.homeTeam?.id === teamId;
  const opponent = isHome ? game.awayTeam : game.homeTeam;
  const venue = isHome ? "Home" : "Away";

  return (
    <Pressable
      onPress={() => router.push(`/match/${game.id}`)}
      className="rounded-[22px] px-4 py-4"
      style={({ pressed }) => ({
        backgroundColor: pressed ? theme.cardMuted : theme.card,
      })}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-1.5">
          <View className="flex-row items-center gap-2">
            <EntityLogo
              logoUrl={teamLogoUrl}
              variant="team"
              size="xs"
              tone={isDark ? "dark" : "light"}
            />
            <Text style={{ color: theme.text }}>
              {teamName}
            </Text>
            <Text style={{ color: theme.textSubtle }}>
              vs
            </Text>
            <EntityLogo
              logoUrl={opponent?.logoUrl}
              variant="team"
              size="xs"
              tone={isDark ? "dark" : "light"}
            />
            <Text
              className="flex-1"
              style={{ color: theme.text }}
              numberOfLines={1}
            >
              {opponent?.name ?? "TBD"}
            </Text>
          </View>
          <Text
            className="text-xs"
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
