import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiGame } from "@/api/entities";
import { useTheme } from "@/color/use-theme";
import { EntityLogo, GamePhaseLabel } from "@/components/ui";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { formatPlayedAt } from "@/lib/datetime";

type Props = {
  games: ApiGame[];
};

export function LeagueMatchesTab({ games }: Props) {
  const theme = useTheme();
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
      <Text className="text-sm" style={{ color: theme.textSubtle }}>
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
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => router.push(`/match/${game.id}`)}
      className="rounded-[22px] border px-4 py-4 active:opacity-85"
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
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
            <Text style={{ color: theme.text }}>
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
            <Text style={{ color: theme.text }}>
              {game.awayTeam?.name ?? "TBD"}
            </Text>
          </View>
        </View>
        <View className="items-end gap-1">
          <Text
            style={{ color: theme.accent }}
          >
            {game.homeScore ?? "-"}
          </Text>
          <Text
            style={{ color: theme.accent }}
          >
            {game.awayScore ?? "-"}
          </Text>
        </View>
      </View>
      <View className="flex-row flex-wrap items-center pt-3">
        <Text
          className="text-xs uppercase tracking-[1.5px]"
          style={{ color: theme.textSubtle }}
        >
          {formatPlayedAt(game.playedAt)} ·{" "}
        </Text>
        <GamePhaseLabel
          game={game}
          textClassName="text-xs uppercase tracking-[1.5px]"
          style={{ color: theme.textSubtle }}
        />
      </View>
    </Pressable>
  );
}
