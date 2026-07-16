import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import type { ApiGame, ApiStatType } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { DetailTabs, type DetailTab } from "@/components/ui/detail-tabs";
import { fonts } from "@/theme/fonts";

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
  /** False for pure knockout seasons — fixtures come from seed / next-round. */
  canScheduleRoundRobin?: boolean;
};

export function ManageGamesTab({
  leagueId,
  seasonId,
  games,
  canScheduleRoundRobin = true,
}: Props) {
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
  }, [seasonId]);

  const activeGames =
    activeFilter === "live"
      ? live
      : activeFilter === "upcoming"
        ? upcoming
        : results;

  const emptyMessage =
    activeFilter === "live"
      ? "No live matches right now."
      : activeFilter === "upcoming"
        ? canScheduleRoundRobin
          ? "No scheduled fixtures. Tap Add game to create one."
          : "Knockout fixtures appear after you seed the bracket."
        : "Completed and cancelled games appear here.";

  return (
    <View className="gap-6 pb-8">
      <View className="flex-row items-center justify-between gap-3">
        <Text style={{ fontFamily: fonts.body }} className="flex-1 text-sm text-white/55">
          {canScheduleRoundRobin
            ? "Schedule fixtures and run live scoring for this season."
            : "Knockout games are created by seeding — open Knockout to manage the bracket."}
        </Text>
        {canScheduleRoundRobin ? (
          <Button
            variant="authPurple"
            label="Add game"
            onPress={() => setAddOpen(true)}
            className="h-11 px-4"
          />
        ) : null}
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
