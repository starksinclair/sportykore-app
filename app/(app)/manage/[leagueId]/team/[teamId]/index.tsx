import { useLocalSearchParams } from "expo-router";

import { TeamLineupHubScreen } from "@/lineup";

export default function TeamLineupHubPage() {
  const params = useLocalSearchParams<{
    leagueId: string;
    teamId: string;
    seasonId?: string;
  }>();

  const leagueId = Number(params.leagueId);
  const teamId = Number(params.teamId);
  const seasonId = Number(params.seasonId);

  if (!Number.isFinite(leagueId) || !Number.isFinite(teamId)) {
    return null;
  }

  return (
    <TeamLineupHubScreen
      leagueId={leagueId}
      teamId={teamId}
      seasonId={Number.isFinite(seasonId) && seasonId > 0 ? seasonId : 0}
    />
  );
}
