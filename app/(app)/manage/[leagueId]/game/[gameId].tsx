import { useLocalSearchParams } from "expo-router";

import { ManageMatchCenterScreen, useManageLeagueDetail } from "@/manage";

export default function ManageMatchCenterRoute() {
  const params = useLocalSearchParams<{
    leagueId: string;
    gameId: string;
    seasonId?: string;
  }>();

  const leagueId = Number(params.leagueId);
  const gameId = Number(params.gameId);
  const seasonId = Number(params.seasonId);

  const query = useManageLeagueDetail(
    Number.isFinite(leagueId) && leagueId > 0 ? leagueId : 0,
    Number.isFinite(seasonId) && seasonId > 0 ? seasonId : null,
  );

  const resolvedSeasonId =
    Number.isFinite(seasonId) && seasonId > 0
      ? seasonId
      : (query.data?.season.id ?? 0);

  if (!Number.isFinite(leagueId) || leagueId <= 0 || !Number.isFinite(gameId) || gameId <= 0) {
    return null;
  }

  return (
    <ManageMatchCenterScreen
      leagueId={leagueId}
      seasonId={resolvedSeasonId}
      gameId={gameId}
      statTypes={query.data?.statTypes ?? []}
    />
  );
}
