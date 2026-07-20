import { ActivityIndicator, Text, View } from "react-native";

import type { ApiStage } from "@/api/entities";
import { colors } from "@/constants";
import {
  GroupStandingsView,
  LeagueStandingsTab,
} from "@/league/components/tabs/StandingsTab";
import { useStageStandings } from "@/groups";
import { fonts } from "@/theme/fonts";

type Props = {
  stage: ApiStage;
  highlightTeamId?: number;
  /** Fallback when stage standings endpoint fails / empty (legacy season.standings). */
  fallbackStandings?: Parameters<typeof LeagueStandingsTab>[0]["standings"];
};

export function LeagueStageStandingsPanel({
  stage,
  highlightTeamId,
  fallbackStandings,
}: Props) {
  const query = useStageStandings(stage.id, true);

  if (query.isLoading && !query.data) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (query.isError || !query.data?.tables?.length) {
    if (fallbackStandings?.length) {
      return (
        <LeagueStandingsTab
          standings={fallbackStandings}
          highlightTeamId={highlightTeamId}
        />
      );
    }
    return (
      <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
        Standings not available yet.
      </Text>
    );
  }

  if (stage.stageType === "group") {
    return (
      <GroupStandingsView
        tables={query.data.tables}
        highlightTeamId={highlightTeamId}
      />
    );
  }

  const table = query.data.tables[0];
  return (
    <LeagueStandingsTab
      standings={table?.rows ?? []}
      highlightTeamId={highlightTeamId}
    />
  );
}
