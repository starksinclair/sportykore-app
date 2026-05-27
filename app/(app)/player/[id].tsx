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
import { CountryLabel } from "@/components/ui/CountryFlag";
import { DetailScreenShell } from "@/components/ui/detail-screen-shell";
import { colors } from "@/constants";
import { usePlayerDetail } from "@/player";
import { PlayerCareerTab } from "@/player/components/tabs/CareerTab";
import { PlayerMatchesTab } from "@/player/components/tabs/MatchesTab";
import { PlayerOverviewTab } from "@/player/components/tabs/OverviewTab";

type TabKey = "overview" | "matches" | "career";

const TABS: readonly DetailTab<TabKey>[] = [
  { key: "overview", label: "Overview" },
  { key: "matches", label: "Matches" },
  { key: "career", label: "Career" },
];

export default function PlayerRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const playerId = Number(id);
  const isValidId = Number.isFinite(playerId) && playerId > 0;
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [leagueId, setLeagueId] = useState<number | null>(null);
  const [seasonId, setSeasonId] = useState<number | null>(null);

  const query = usePlayerDetail(isValidId ? playerId : 0);
  const detail = query.data ?? null;

  const selectedLeague = useMemo(() => {
    if (!detail) return null;
    return (
      detail.leagues.find((league) => league.id === leagueId) ??
      detail.leagues[0] ??
      null
    );
  }, [detail, leagueId]);

  const selectedSeason = useMemo(() => {
    if (!selectedLeague) return null;
    return (
      selectedLeague.seasons.find((season) => season.id === seasonId) ??
      selectedLeague.seasons[0] ??
      null
    );
  }, [selectedLeague, seasonId]);

  // Reset season selection when the active league changes so we don't carry a
  // dangling season id from a different league.
  useEffect(() => {
    if (!selectedLeague) return;
    const stillValid = selectedLeague.seasons.some((s) => s.id === seasonId);
    if (!stillValid) setSeasonId(selectedLeague.seasons[0]?.id ?? null);
  }, [selectedLeague, seasonId]);

  if (!isValidId) {
    return (
      <DetailScreenShell title="Player">
        <NotFound message="Invalid player id" />
      </DetailScreenShell>
    );
  }

  if (query.isLoading && !detail) {
    return (
      <DetailScreenShell title="Player">
        <View className="items-center py-20">
          <ActivityIndicator color={colors.accent} />
        </View>
      </DetailScreenShell>
    );
  }

  if (query.isError || !detail) {
    return (
      <DetailScreenShell title="Player">
        <NotFound message="Player not found" />
      </DetailScreenShell>
    );
  }

  const { player, statTypes, leagues } = detail;

  const leagueOptions: SeasonOption[] = leagues.map((league) => ({
    id: league.id,
    name: league.name,
  }));
  const seasonOptions: SeasonOption[] = (selectedLeague?.seasons ?? []).map(
    (season) => ({ id: season.id, name: season.name, status: season.status }),
  );

  const showLeagueAndSeason =
    activeTab === "overview" ||
    activeTab === "matches";

  return (
    <DetailScreenShell
      title={player.name}
      subtitle={
        player.country ? (
          <CountryLabel code={player.country.code} name={player.country.name} />
        ) : undefined
      }
      headerContent={
        <>
          {showLeagueAndSeason && leagueOptions.length > 1 ? (
            <SeasonPicker
              label="League"
              seasons={leagueOptions}
              activeSeasonId={selectedLeague?.id ?? null}
              onSelect={(id) => {
                setLeagueId(id);
                setSeasonId(null);
              }}
            />
          ) : null}
          {showLeagueAndSeason && seasonOptions.length > 0 ? (
            <SeasonPicker
              seasons={seasonOptions}
              activeSeasonId={selectedSeason?.id ?? null}
              onSelect={setSeasonId}
            />
          ) : null}
          <DetailTabs
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </>
      }
    >
      {activeTab === "overview" ? (
        <PlayerOverviewTab
          player={player}
          leagues={leagues}
          statTypes={statTypes}
          league={selectedLeague}
          season={selectedSeason}
        />
      ) : null}
      {activeTab === "matches" ? (
        <PlayerMatchesTab season={selectedSeason} />
      ) : null}
      {activeTab === "career" ? (
        <PlayerCareerTab leagues={leagues} statTypes={statTypes} />
      ) : null}
    </DetailScreenShell>
  );
}
