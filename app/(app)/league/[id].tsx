import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { NotFound } from "@/components/not-found";
import {
  DetailTabs,
  type DetailTab,
  EntityLogo,
  SeasonPicker,
  type SeasonOption,
} from "@/components/ui";
import { DetailScreenShell } from "@/components/ui/detail-screen-shell";
import { colors } from "@/constants";
import { LeagueMatchesTab } from "@/league/components/tabs/MatchesTab";
import { LeagueOverviewTab } from "@/league/components/tabs/OverviewTab";
import { LeagueStandingsTab } from "@/league/components/tabs/StandingsTab";
import { LeagueStatsTab } from "@/league/components/tabs/StatsTab";
import { useLeagueDetail } from "@/league";

type TabKey = "overview" | "matches" | "standings" | "stats";

const TABS: readonly DetailTab<TabKey>[] = [
  { key: "overview", label: "Overview" },
  { key: "matches", label: "Matches" },
  { key: "standings", label: "Standings" },
  { key: "stats", label: "Stats" },
];

export default function LeagueRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const leagueId = Number(id);
  const isValidId = Number.isFinite(leagueId) && leagueId > 0;
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const query = useLeagueDetail(isValidId ? leagueId : 0, seasonId);

  if (!isValidId) {
    return (
      <DetailScreenShell title="League">
        <NotFound message="Invalid league id" />
      </DetailScreenShell>
    );
  }

  if (query.isLoading && !query.data) {
    return (
      <DetailScreenShell title="League">
        <View className="items-center py-20">
          <ActivityIndicator color={colors.accent} />
        </View>
      </DetailScreenShell>
    );
  }

  if (query.isError || !query.data) {
    return (
      <DetailScreenShell title="League">
        <NotFound message="League not found" />
      </DetailScreenShell>
    );
  }

  const { season, seasons, statTypes } = query.data;
  const seasonOptions: SeasonOption[] = seasons.map((entry) => ({
    id: entry.id,
    name: entry.name,
    status: entry.status,
  }));

  return (
    <DetailScreenShell
      title={season.league.name}
      rightAccessory={
        <EntityLogo
          logoUrl={season.league.logoUrl}
          variant="league"
          size="sm"
          tone="dark"
        />
      }
      headerContent={
        <>
          <SeasonPicker
            seasons={seasonOptions}
            activeSeasonId={seasonId ?? season.id}
            onSelect={setSeasonId}
          />
          <DetailTabs
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </>
      }
    >
      {activeTab === "overview" ? <LeagueOverviewTab season={season} /> : null}
      {activeTab === "matches" ? <LeagueMatchesTab games={season.games} /> : null}
      {activeTab === "standings" ? (
        <LeagueStandingsTab standings={season.standings} />
      ) : null}
      {activeTab === "stats" ? (
        <LeagueStatsTab statTypes={statTypes} stats={season.stats} />
      ) : null}
    </DetailScreenShell>
  );
}
