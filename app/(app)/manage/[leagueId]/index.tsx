import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
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
import {
  ManageGamesTab,
  ManagePlayersTabPlaceholder,
  ManageSettingsTab,
  useManageLeagueDetail,
} from "@/manage";

type TabKey = "games" | "players" | "settings";

const TABS: readonly DetailTab<TabKey>[] = [
  { key: "games", label: "Games" },
  { key: "players", label: "Players" },
  { key: "settings", label: "Settings" },
];

export default function ManageLeagueRoute() {
  const { leagueId: leagueIdParam } = useLocalSearchParams<{ leagueId: string }>();
  const leagueId = Number(leagueIdParam);
  const isValidId = Number.isFinite(leagueId) && leagueId > 0;
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("games");

  const query = useManageLeagueDetail(isValidId ? leagueId : 0, seasonId);

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
      subtitle="League admin"
      headerContent={
        <>
          <SeasonPicker
            seasons={seasonOptions}
            activeSeasonId={activeSeasonId}
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
      {activeTab === "games" ? (
        <ManageGamesTab
          leagueId={leagueId}
          seasonId={activeSeasonId}
          games={season.games ?? []}
          statTypes={statTypes}
        />
      ) : null}
      {activeTab === "players" ? <ManagePlayersTabPlaceholder /> : null}
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
