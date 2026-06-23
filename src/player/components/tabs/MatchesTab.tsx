import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiGame, ApiPlayerSeason } from "@/api/entities";
import { EntityLogo } from "@/components/ui";
import { formatPlayedAt } from "@/lib/datetime";
import { useGamePhaseLabel } from "@/hooks/useGamePhaseLabel";
import { fonts } from "@/theme/fonts";

type Props = {
  season: ApiPlayerSeason | null;
};

export function PlayerMatchesTab({ season }: Props) {
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
      <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
        Select a league and season to view fixtures.
      </Text>
    );
  }

  if (!games.length) {
    return (
      <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
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
  const phase = useGamePhaseLabel(game);
  const isHome = game.homeTeam?.id === teamId;
  const opponent = isHome ? game.awayTeam : game.homeTeam;
  const venue = isHome ? "Home" : "Away";

  return (
    <Pressable
      onPress={() => router.push(`/match/${game.id}`)}
      className="rounded-[22px] bg-white/6 px-4 py-4 active:bg-white/10"
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-1.5">
          <View className="flex-row items-center gap-2">
            <EntityLogo logoUrl={teamLogoUrl} variant="team" size="xs" tone="dark" />
            <Text style={{ fontFamily: fonts.bodyBold }} className="text-white">
              {teamName}
            </Text>
            <Text style={{ fontFamily: fonts.body }} className="text-white/45">
              vs
            </Text>
            <EntityLogo
              logoUrl={opponent?.logoUrl}
              variant="team"
              size="xs"
              tone="dark"
            />
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="flex-1 text-white"
              numberOfLines={1}
            >
              {opponent?.name ?? "TBD"}
            </Text>
          </View>
          <Text
            style={{ fontFamily: fonts.body }}
            className="text-xs text-white/55"
          >
            {venue} · {formatPlayedAt(game.playedAt)} · {phase}
          </Text>
        </View>
        {game.homeScore != null && game.awayScore != null ? (
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className="text-[#E6A817]"
          >
            {game.homeScore}-{game.awayScore}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
