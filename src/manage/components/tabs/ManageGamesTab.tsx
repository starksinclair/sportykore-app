import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiGame, ApiStatType } from "@/api/entities";
import { useTheme } from "@/color/use-theme";
import { DetailTabs, type DetailTab } from "@/components/ui/detail-tabs";

import { partitionGames } from "../../utils/games";
import { AddGameSheet } from "../games/AddGameSheet";
import { GamesSection } from "../games/GamesSection";

type GameFilter = "live" | "upcoming" | "results";

const GAME_TABS: readonly DetailTab<GameFilter>[] = [
  { key: "live", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "results", label: "Results" },
];

type Props = {
  leagueId: number;
  seasonId: number;
  games: ApiGame[];
  statTypes: ApiStatType[];
  /** False for pure knockout seasons - fixtures come from seed / next-round. */
  canScheduleRoundRobin?: boolean;
};

export function ManageGamesTab({
  leagueId,
  seasonId,
  games,
  canScheduleRoundRobin = true,
}: Props) {
  const theme = useTheme();
  const [addOpen, setAddOpen] = useState(false);
  const { live, upcoming, results } = useMemo(
    () => partitionGames(games),
    [games],
  );

  const [activeFilter, setActiveFilter] = useState<GameFilter>(
    live.length > 0 ? "live" : "upcoming",
  );

  useEffect(() => {
    setActiveFilter(live.length > 0 ? "live" : "upcoming");
  }, [live.length, seasonId]);

  const activeGames =
    activeFilter === "live"
      ? live
      : activeFilter === "upcoming"
        ? upcoming
        : results;

  const emptyMessage =
    activeFilter === "live"
      ? "No live matches right now. Create a game, then open it to kick off."
      : activeFilter === "upcoming"
        ? canScheduleRoundRobin
          ? "To kick off a game, create one."
          : "Knockout fixtures appear after you seed the bracket."
        : "Completed and cancelled games appear here.";

  return (
    <View className="gap-6 pb-8">
      <View
        className="rounded-[24px] border px-4 py-4"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        <View className="flex-row items-center gap-3">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: theme.accentMuted }}
          >
            <Ionicons name="calendar-outline" size={22} color={theme.accent} />
          </View>
          <View className="min-w-0 flex-1">
            <Text style={{ color: theme.text }}>
              Match schedule
            </Text>
            <Text
              className="text-xs leading-5"
              style={{ color: theme.textSubtle }}
              numberOfLines={2}
            >
              {canScheduleRoundRobin
                ? "Create fixtures, then open a game to kick off and run live scoring."
                : "Knockout games are created by seeding. Open Knockout to manage the bracket."}
            </Text>
          </View>
          {canScheduleRoundRobin ? (
            <Pressable
              onPress={() => setAddOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Add game"
              className="h-10 flex-row items-center gap-1.5 rounded-full px-3 active:opacity-90"
              style={{ backgroundColor: theme.accent }}
            >
              <Ionicons name="add" size={16} color={theme.textInverse} />
              <Text
                className="text-xs"
                style={{ color: theme.textInverse }}
                numberOfLines={1}
              >
                Add
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <DetailTabs
        tabs={GAME_TABS}
        activeTab={activeFilter}
        onTabChange={setActiveFilter}
        scrollable
      />

      <GamesSection
        games={activeGames}
        leagueId={leagueId}
        seasonId={seasonId}
        variant={activeFilter}
        emptyMessage={emptyMessage}
      />

      {canScheduleRoundRobin ? (
        <AddGameSheet
          visible={addOpen}
          onClose={() => setAddOpen(false)}
          leagueId={leagueId}
          seasonId={seasonId}
        />
      ) : null}
    </View>
  );
}
