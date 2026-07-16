import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { NotFound } from "@/components/not-found";
import {
  DetailTabs,
  SeasonPicker,
  type DetailTab,
  type SeasonOption,
} from "@/components/ui";
import { DetailScreenShell } from "@/components/ui/detail-screen-shell";
import { colors } from "@/constants";
import { hasRoundRobinStage } from "@/knockout";
import {
  ManageGamesTab,
  ManageKnockoutTab,
  ManagePlayersTab,
  ManageSettingsTab,
  ManageTeamsTab,
  ManageVenuesTab,
  useLeagueTeams,
  useManageLeagueDetail,
} from "@/manage";

type TabKey =
  | "games"
  | "knockout"
  | "teams"
  | "players"
  | "venues"
  | "settings";

export default function ManageLeagueRoute() {
  const { leagueId: leagueIdParam } = useLocalSearchParams<{ leagueId: string }>();
  const leagueId = Number(leagueIdParam);
  const isValidId = Number.isFinite(leagueId) && leagueId > 0;
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("games");

  const query = useManageLeagueDetail(isValidId ? leagueId : 0, seasonId);
  const teamsQuery = useLeagueTeams(leagueId, isValidId);

  useEffect(() => {
    if (query.data?.season.id != null && seasonId === null) {
      setSeasonId(query.data.season.id);
    }
  }, [query.data?.season.id, seasonId]);

  const stages = query.data?.season.stages ?? [];
  const hasRr = hasRoundRobinStage(stages);

  const tabs: readonly DetailTab<TabKey>[] = useMemo(
    () => [
      { key: "games", label: "Games" },
      { key: "knockout", label: "Knockout" },
      { key: "teams", label: "Teams" },
      { key: "players", label: "Players" },
      { key: "venues", label: "Venues" },
      { key: "settings", label: "Settings" },
    ],
    [],
  );

  if (!isValidId) {
    return (
      <DetailScreenShell title="Manage">
        <NotFound message="Invalid league id" />
      </DetailScreenShell>
    );
  }

  if (query.isLoading && !query.data) {
    return (
      <DetailScreenShell title="Manage">
        <View className="items-center py-20">
          <ActivityIndicator color={colors.accent} />
        </View>
      </DetailScreenShell>
    );
  }

  if (query.isError || !query.data) {
    return (
      <DetailScreenShell title="Manage">
        <NotFound message="League not found or you do not have access" />
      </DetailScreenShell>
    );
  }

  const { season, seasons, statTypes } = query.data;
  const seasonOptions: SeasonOption[] = seasons.map((entry) => ({
    id: entry.id,
    name: entry.name,
    status: entry.status,
  }));

  const activeSeasonId = seasonId ?? season.id;

  return (
    <DetailScreenShell
      title={season.league.name}
      subtitle="Competition admin"
      headerContent={
        <>
          <SeasonPicker
            seasons={seasonOptions}
            activeSeasonId={activeSeasonId}
            onSelect={setSeasonId}
          />
          <DetailTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </>
      }
    >
      {activeTab === "games" ? (
        <ManageGamesTab
          leagueId={leagueId}
          seasonId={activeSeasonId}
          games={season.games ?? []}
          statTypes={statTypes}
          canScheduleRoundRobin={hasRr || stages.length === 0}
        />
      ) : null}
      {activeTab === "knockout" ? (
        <ManageKnockoutTab
          leagueId={leagueId}
          seasonId={activeSeasonId}
          stages={stages}
          teams={teamsQuery.data ?? []}
        />
      ) : null}
      {activeTab === "teams" ? (
        <ManageTeamsTab
          leagueId={leagueId}
          seasonId={activeSeasonId}
          teams={teamsQuery.data ?? []}
          isLoading={teamsQuery.isLoading}
        />
      ) : null}
      {activeTab === "players" ? (
        <ManagePlayersTab
          leagueId={leagueId}
          leagueName={season.league.name}
          seasonId={activeSeasonId}
          teams={teamsQuery.data ?? []}
        />
      ) : null}
      {activeTab === "venues" ? <ManageVenuesTab leagueId={leagueId} /> : null}
      {activeTab === "settings" ? (
        <ManageSettingsTab
          leagueId={leagueId}
          league={season.league}
          seasons={seasons}
          activeSeasonId={activeSeasonId}
          onSeasonCreated={(id) => setSeasonId(id)}
        />
      ) : null}
    </DetailScreenShell>
  );
}
