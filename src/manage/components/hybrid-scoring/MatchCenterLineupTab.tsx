import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import type { ApiGameDetail } from "@/api/entities";
import { fonts } from "@/theme/fonts";

import type { LeagueRosterRow } from "../../types";
import { TeamTabs, type TeamSide } from "./TeamTabs";

type Props = {
  game: ApiGameDetail;
  homeTeamId: number;
  awayTeamId: number;
  roster: LeagueRosterRow[];
};

export function MatchCenterLineupTab({
  game,
  homeTeamId,
  awayTeamId,
  roster,
}: Props) {
  const [activeSide, setActiveSide] = useState<TeamSide>("home");
  const activeTeamId = activeSide === "home" ? homeTeamId : awayTeamId;

  const players = useMemo(
    () => roster.filter((row) => row.team.id === activeTeamId),
    [roster, activeTeamId],
  );

  return (
    <View className="gap-4 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
      <TeamTabs
        homeLabel={game.homeTeam?.name ?? "Home"}
        awayLabel={game.awayTeam?.name ?? "Away"}
        activeSide={activeSide}
        onSideChange={setActiveSide}
      />

      {players.length === 0 ? (
        <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
          No players on this team for the season.
        </Text>
      ) : (
        players.map((item) => (
          <View
            key={item.id}
            className="mb-2 flex-row items-center justify-between rounded-xl bg-white/6 px-3 py-3"
          >
            <View className="flex-row items-center gap-3">
              <Text
                style={{ fontFamily: fonts.body }}
                className="w-8 text-xs text-white/45"
              >
                {item.jerseyNumber ? `#${item.jerseyNumber}` : "—"}
              </Text>
              <Text
                style={{ fontFamily: fonts.bodySemibold }}
                className="text-sm text-white"
              >
                {item.player.name}
              </Text>
            </View>
            <Text
              style={{ fontFamily: fonts.body }}
              className="text-xs capitalize text-white/45"
            >
              {item.status}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
