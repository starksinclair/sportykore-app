import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { NotFound } from "@/components/not-found";
import { DetailTabs, type DetailTab } from "@/components/ui";
import { DetailScreenShell } from "@/components/ui/detail-screen-shell";
import { colors } from "@/constants";
import { useMatchDetail } from "@/match";
import { MatchLineupsTab } from "@/match/components/tabs/LineupsTab";
import { MatchOverviewTab } from "@/match/components/tabs/OverviewTab";
import { MatchStatsTab } from "@/match/components/tabs/StatsTab";

type TabKey = "overview" | "lineups" | "stats";

const TABS: readonly DetailTab<TabKey>[] = [
  { key: "overview", label: "Overview" },
  { key: "lineups", label: "Lineups" },
  { key: "stats", label: "Stats" },
];

export default function MatchRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const gameId = Number(id);
  const isValidId = Number.isFinite(gameId) && gameId > 0;
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const query = useMatchDetail(isValidId ? gameId : 0);

  if (!isValidId) {
    return (
      <DetailScreenShell title="Match">
        <NotFound message="Invalid match id" />
      </DetailScreenShell>
    );
  }

  if (query.isLoading && !query.data) {
    return (
      <DetailScreenShell title="Match">
        <View className="items-center py-20">
          <ActivityIndicator color={colors.accent} />
        </View>
      </DetailScreenShell>
    );
  }

  if (query.isError || !query.data) {
    return (
      <DetailScreenShell title="Match">
        <NotFound message="Match not found" />
      </DetailScreenShell>
    );
  }

  const detail = query.data;
  const title = detail.league?.name ?? "Match";
  const matchup =
    detail.homeTeam && detail.awayTeam
      ? `${detail.homeTeam.name} vs ${detail.awayTeam.name}`
      : undefined;

  return (
    <DetailScreenShell
      leagueId={detail.league?.id ?? 0}
      title={title}
      subtitle={matchup}
      headerContent={
        <DetailTabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      }
    >
      {activeTab === "overview" ? <MatchOverviewTab detail={detail} /> : null}
      {activeTab === "lineups" ? (
        <MatchLineupsTab
          homeTeam={detail.homeTeam}
          awayTeam={detail.awayTeam}
          stats={detail.stats}
        />
      ) : null}
      {activeTab === "stats" ? (
        <MatchStatsTab
          stats={detail.stats}
          homeTeamId={detail.homeTeam?.id}
          awayTeamId={detail.awayTeam?.id}
        />
      ) : null}
    </DetailScreenShell>
  );
}
