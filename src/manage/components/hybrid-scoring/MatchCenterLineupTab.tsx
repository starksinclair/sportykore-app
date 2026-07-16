import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import type { ApiGameDetail, GameStatus } from "@/api/entities";
import { LineupEditor } from "@/lineup/components/LineupEditor";
import type { LeagueRosterRow } from "@/manage/types";
import { fonts } from "@/theme/fonts";

import { MatchCenterSubstitutionPanel } from "./MatchCenterSubstitutionPanel";
import { TeamTabs, type TeamSide } from "./TeamTabs";

const LIVE_SUB_STATUSES = new Set<GameStatus>([
  "first_half",
  "half_time",
  "second_half",
  "extra_time",
  "penalty_shootout",
  "paused",
  "live",
]);

type Props = {
  game: ApiGameDetail;
  leagueId: number;
  seasonId: number;
  homeTeamId: number;
  awayTeamId: number;
  roster: LeagueRosterRow[];
};

export function MatchCenterLineupTab({
  game,
  leagueId,
  seasonId,
  homeTeamId,
  awayTeamId,
  roster,
}: Props) {
  const [activeSide, setActiveSide] = useState<TeamSide>("home");
  const activeTeamId = activeSide === "home" ? homeTeamId : awayTeamId;

  const teamRoster = useMemo(
    () => roster.filter((row) => row.team.id === activeTeamId),
    [roster, activeTeamId],
  );

  const subEnabled = LIVE_SUB_STATUSES.has(game.status);

  return (
    <View className="gap-4">
      <View className="gap-4 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
        <TeamTabs
          homeLabel={game.homeTeam?.name ?? "Home"}
          awayLabel={game.awayTeam?.name ?? "Away"}
          activeSide={activeSide}
          onSideChange={setActiveSide}
        />

        <MatchCenterSubstitutionPanel
          game={game}
          leagueId={leagueId}
          seasonId={seasonId}
          teamId={activeTeamId}
          enabled={subEnabled}
        />
      </View>

      <View className="gap-4 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
        {teamRoster.length === 0 ? (
          <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
            No players on this team for the season.
          </Text>
        ) : (
          <LineupEditor
            gameId={game.id}
            teamId={activeTeamId}
            roster={roster}
            gameStatus={game.status}
            embedded
          />
        )}
      </View>
    </View>
  );
}
