import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiGame } from "@/api/entities";
import { EntityLogo, GamePhaseLabel } from "@/components/ui";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { formatPlayedAt } from "@/lib/datetime";

type Props = {
  games: ApiGame[];
};

export function LeagueMatchesTab({ games }: Props) {
  const { isTablet } = useAdaptiveLayout();
  const sorted = useMemo(
    () =>
      [...games].sort(
        (a, b) =>
          new Date(b.playedAt).valueOf() - new Date(a.playedAt).valueOf(),
      ),
    [games],
  );

  if (!sorted.length) {
    return (
      <Text
        className="text-sm text-white/55"
      >
        No matches scheduled in this season yet.
      </Text>
    );
  }

  return (
    <View className={isTablet ? "flex-row flex-wrap gap-3" : "gap-3"}>
      {sorted.map((game) => (
        <View
          key={game.id}
          style={isTablet ? { width: "48%" } : undefined}
        >
          <LeagueMatchRow game={game} />
        </View>
      ))}
    </View>
  );
}

function LeagueMatchRow({ game }: { game: ApiGame }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/match/${game.id}`)}
      className="rounded-[22px] bg-white/6 px-4 py-4 active:bg-white/10"
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-2">
          <View className="flex-row items-center gap-2">
            <EntityLogo
              logoUrl={game.homeTeam?.logoUrl}
              variant="team"
              size="xs"
              tone="dark"
            />
            <Text className="text-white">
              {game.homeTeam?.name ?? "TBD"}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <EntityLogo
              logoUrl={game.awayTeam?.logoUrl}
              variant="team"
              size="xs"
              tone="dark"
            />
            <Text className="text-white">
              {game.awayTeam?.name ?? "TBD"}
            </Text>
          </View>
        </View>
        <View className="items-end gap-1">
          <Text
            className="text-[#E6A817]"
          >
            {game.homeScore ?? "-"}
          </Text>
          <Text
            className="text-[#E6A817]"
          >
            {game.awayScore ?? "-"}
          </Text>
        </View>
      </View>
      <View className="flex-row flex-wrap items-center pt-3">
        <Text
          className="text-xs uppercase tracking-[1.5px] text-white/45"
        >
          {formatPlayedAt(game.playedAt)} ·{" "}
        </Text>
        <GamePhaseLabel
          game={game}
          textClassName="text-xs uppercase tracking-[1.5px] text-white/45"
        />
      </View>
    </Pressable>
  );
}
