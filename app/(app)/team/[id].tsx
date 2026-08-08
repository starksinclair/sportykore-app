import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { NotFound } from "@/components/not-found";
import {
  DetailTabs,
  SeasonPicker,
  EntityLogo,
  type DetailTab,
  type SeasonOption,
} from "@/components/ui";
import { DetailScreenShell } from "@/components/ui/detail-screen-shell";
import { colors } from "@/constants";
import { standingStages, useStageStandings } from "@/groups";
import { LeagueStageStandingsPanel } from "@/league/components/tabs/StageStandingsPanel";
import { LeagueStandingsTab } from "@/league/components/tabs/StandingsTab";
import { useSeasonStages } from "@/knockout";
import { useTeamDetail } from "@/team";
import { TeamMatchesTab } from "@/team/components/tabs/MatchesTab";
import { TeamOverviewTab } from "@/team/components/tabs/OverviewTab";
import { TeamSquadTab } from "@/team/components/tabs/SquadTab";

type TabKey = "overview" | "matches" | "squad" | "standings";

const TABS: readonly DetailTab<TabKey>[] = [
  { key: "overview", label: "Overview" },
  { key: "matches", label: "Matches" },
  { key: "squad", label: "Squad" },
  { key: "standings", label: "Standings" },
];

export default function TeamRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = Number(id);
  const isValidId = Number.isFinite(teamId) && teamId > 0;
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [leagueId, setLeagueId] = useState<number | null>(null);
  const [seasonId, setSeasonId] = useState<number | null>(null);

  const query = useTeamDetail(isValidId ? teamId : 0);
  const detail = query.data ?? null;


  const selectedLeague = useMemo(() => {
    if (!detail) return null;
    return (
      detail.leagues?.find((league) => league.id === leagueId) ??
      detail.leagues[0] ??
      null
    );
  }, [detail, leagueId]);

  const selectedSeason = useMemo(() => {
    if (!selectedLeague) return null;
    return (
      selectedLeague.seasons?.find((season) => season.id === seasonId) ??
      selectedLeague.seasons[0] ??
      null
    );
  }, [selectedLeague, seasonId]);

  useEffect(() => {
    if (!selectedLeague) return;
    const stillValid = selectedLeague.seasons.some((s) => s.id === seasonId);
    if (!stillValid) setSeasonId(selectedLeague.seasons[0]?.id ?? null);
  }, [selectedLeague, seasonId]);

  // `selectedSeason.standings` is a static, precomputed snapshot (no zones,
  // no adjustment badges); fetch stages so the live stage-standings query -
  // same one the league page uses, deductions/zones included - can drive
  // this tab instead, with the snapshot only as a loading/error fallback.
  const stagesQuery = useSeasonStages(
    selectedSeason?.id ?? 0,
    Boolean(selectedSeason),
  );
  const standingStage =
    standingStages(stagesQuery.data).find((s) => s.stageType === "group") ??
    standingStages(stagesQuery.data).find(
      (s) => s.stageType === "round_robin",
    ) ??
    null;

  // Same live query backs the Overview tab's position line: the static
  // `season.standings` snapshot doesn't reflect point deductions for group
  // stages, and can lag for round_robin too.
  const standingsQuery = useStageStandings(
    standingStage?.id ?? 0,
    Boolean(standingStage),
  );
  const liveStanding =
    standingsQuery.data?.tables
      .flatMap((t) => t.rows)
      .find((row) => row.team?.id === teamId) ?? null;

  if (!isValidId) {
    return (
      <DetailScreenShell title="Team">
        <NotFound message="Invalid team id" />
      </DetailScreenShell>
    );
  }

  if (query.isLoading && !detail) {
    return (
      <DetailScreenShell title="Team">
        <View className="items-center py-20">
          <ActivityIndicator color={colors.accent} />
        </View>
      </DetailScreenShell>
    );
  }

  if (query.isError || !detail) {
    return (
      <DetailScreenShell title="Team">
        <NotFound message="Team not found" />
      </DetailScreenShell>
    );
  }

  const { team, leagues } = detail;

  const leagueOptions: SeasonOption[] = leagues.map((league) => ({
    id: league.id,
    name: league.name,
  }));
  const seasonOptions: SeasonOption[] = (selectedLeague?.seasons ?? []).map(
    (season) => ({ id: season.id, name: season.name, status: season.status }),
  );

  return (
    <DetailScreenShell
      title={team.name}
      subtitle={selectedLeague?.name}
      rightAccessory={
        <EntityLogo
          logoUrl={team.logoUrl}
          variant="team"
          size="sm"
          tone="dark"
        />
      }
      headerContent={
        <>
          {leagueOptions.length > 1 ? (
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
          {seasonOptions.length > 0 ? (
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
        <TeamOverviewTab
          team={team}
          league={selectedLeague}
          season={selectedSeason}
          liveStanding={liveStanding}
        />
      ) : null}
      {activeTab === "matches" ? (
        <TeamMatchesTab team={team} season={selectedSeason} />
      ) : null}
      {activeTab === "squad" ? <TeamSquadTab season={selectedSeason} /> : null}
      {activeTab === "standings" ? (
        standingStage ? (
          <LeagueStageStandingsPanel
            stage={standingStage}
            highlightTeamId={team.id}
            fallbackStandings={selectedSeason?.standings ?? []}
          />
        ) : (
          <LeagueStandingsTab
            standings={selectedSeason?.standings ?? []}
            highlightTeamId={team.id}
          />
        )
      ) : null}
    </DetailScreenShell>
  );
}
