import { useState } from "react";
import { Text, View } from "react-native";

import type { ApiGame, ApiStatType } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { fonts } from "@/theme/fonts";

import { partitionGames } from "../../utils/games";
import { AddGameSheet } from "../games/AddGameSheet";
import { GamesSection } from "../games/GamesSection";

type Props = {
  leagueId: number;
  seasonId: number;
  games: ApiGame[];
  statTypes: ApiStatType[];
};

export function ManageGamesTab({ leagueId, seasonId, games }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const { live, upcoming, results } = partitionGames(games);

  return (
    <View className="gap-6 pb-8">
      <View className="flex-row items-center justify-between gap-3">
        <Text style={{ fontFamily: fonts.body }} className="flex-1 text-sm text-white/55">
          Schedule fixtures and run live scoring for this season.
        </Text>
        <Button
          variant="authPurple"
          label="Add game"
          onPress={() => setAddOpen(true)}
          className="h-11 px-4"
        />
      </View>

      <GamesSection
        title="Live now"
        games={live}
        leagueId={leagueId}
        seasonId={seasonId}
        variant="live"
        showLiveDot={live.length > 0}
        emptyMessage="No live matches right now."
      />

      <GamesSection
        title="Upcoming"
        games={upcoming}
        leagueId={leagueId}
        seasonId={seasonId}
        variant="upcoming"
        emptyMessage="No scheduled fixtures. Tap Add game to create one."
      />

      <GamesSection
        title="Results"
        games={results}
        leagueId={leagueId}
        seasonId={seasonId}
        variant="results"
        emptyMessage="Completed and cancelled games appear here."
      />

      <AddGameSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        leagueId={leagueId}
        seasonId={seasonId}
      />
    </View>
  );
}
