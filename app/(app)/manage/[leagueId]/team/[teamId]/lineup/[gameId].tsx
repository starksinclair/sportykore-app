import { useLocalSearchParams } from "expo-router";

import { LineupEditorScreen } from "@/lineup";

export default function TeamLineupEditorPage() {
  const params = useLocalSearchParams<{
    leagueId: string;
    teamId: string;
    gameId: string;
    seasonId?: string;
  }>();

  const leagueId = Number(params.leagueId);
  const teamId = Number(params.teamId);
  const gameId = Number(params.gameId);
  const seasonId = Number(params.seasonId);

  if (
    !Number.isFinite(leagueId) ||
    !Number.isFinite(teamId) ||
    !Number.isFinite(gameId)
  ) {
    return null;
  }

  return (
    <LineupEditorScreen
      leagueId={leagueId}
      teamId={teamId}
      gameId={gameId}
      seasonId={Number.isFinite(seasonId) && seasonId > 0 ? seasonId : 0}
    />
  );
}
