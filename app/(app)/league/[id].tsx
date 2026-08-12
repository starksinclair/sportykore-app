import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import type { ApiStage } from "@/api/entities";
import { NotFound } from "@/components/not-found";
import {
  DetailTabs,
  EntityLogo,
  SeasonPicker,
  type DetailTab,
  type SeasonOption,
} from "@/components/ui";
import { DetailScreenShell } from "@/components/ui/detail-screen-shell";
import { colors } from "@/constants";
import { hasGroupStage } from "@/groups";
import {
  hasRoundRobinStage,
  knockoutStages,
  pickPrimaryStage,
} from "@/knockout";
import { useLeagueDetail } from "@/league";
import { LeagueBracketTab } from "@/league/components/tabs/BracketTab";
import { LeagueMatchesTab } from "@/league/components/tabs/MatchesTab";
import { LeagueOverviewTab } from "@/league/components/tabs/OverviewTab";
import { LeagueStageStandingsPanel } from "@/league/components/tabs/StageStandingsPanel";
import { LeagueStatsTab } from "@/league/components/tabs/StatsTab";
import { messageForResourceLoad } from "@/lib/show-error-toast";
import { useTrackView } from "@/lib/use-track-view";
import { LeagueNotificationToggle } from "@/notifications";

type TabKey = "overview" | "matches" | "standings" | "bracket" | "stats";

export default function LeagueRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const leagueId = Number(id);
  const isValidId = Number.isFinite(leagueId) && leagueId > 0;
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [activeStageId, setActiveStageId] = useState<number | null>(null);

  const query = useLeagueDetail(isValidId ? leagueId : 0, seasonId);

  useTrackView(
    "league_viewed",
    query.data ? leagueId : null,
    query.data
      ? {
          league_id: query.data.season.league.id,
          league_name: query.data.season.league.name,
          season_id: query.data.season.id,
          season_name: query.data.season.name,
        }
      : undefined,
  );

  const stages = query.data?.season.stages ?? [];
  const primary = pickPrimaryStage(stages);
  const knockouts = knockoutStages(stages);
  const hasRr = hasRoundRobinStage(stages);
  const hasGroup = hasGroupStage(stages);
  const hasTableStage = hasRr || hasGroup;

  useEffect(() => {
    if (primary && activeStageId == null) {
      setActiveStageId(primary.id);
    }
  }, [primary, activeStageId]);

  const selectedStage: ApiStage | null =
    stages.find((s) => s.id === activeStageId) ?? primary;

  const standingStage: ApiStage | null =
    selectedStage?.stageType === "round_robin" ||
    selectedStage?.stageType === "group"
      ? selectedStage
      : stages.find((s) => s.stageType === "group") ??
        stages.find((s) => s.stageType === "round_robin") ??
        null;

  const tabs: readonly DetailTab<TabKey>[] = useMemo(() => {
    const list: DetailTab<TabKey>[] = [{ key: "overview", label: "Overview" }];
    if (hasTableStage) {
      list.push({ key: "matches", label: "Matches" });
      list.push({ key: "standings", label: "Standings" });
    }
    if (knockouts.length > 0) {
      list.push({ key: "bracket", label: "Bracket" });
    }
    list.push({ key: "stats", label: "Stats" });
    return list;
  }, [hasTableStage, knockouts.length]);

  useEffect(() => {
    if (!tabs.some((t) => t.key === activeTab)) {
      setActiveTab("overview");
    }
  }, [tabs, activeTab]);

  if (!isValidId) {
    return (
      <DetailScreenShell title="Competition" tabletMaxWidth={1120}>
        <NotFound message="Invalid competition id" />
      </DetailScreenShell>
    );
  }

  if (query.isLoading && !query.data) {
    return (
      <DetailScreenShell title="Competition" tabletMaxWidth={1120}>
        <View className="items-center py-20">
          <ActivityIndicator color={colors.accent} />
        </View>
      </DetailScreenShell>
    );
  }

  if (query.isError || !query.data) {
    return (
      <DetailScreenShell title="Competition" tabletMaxWidth={1120}>
        <NotFound
          message={
            query.isError
              ? messageForResourceLoad(query.error, "Competition")
              : "Competition not found."
          }
        />
      </DetailScreenShell>
    );
  }

  const { season, seasons, statTypes } = query.data;
  const seasonOptions: SeasonOption[] = seasons.map((entry) => ({
    id: entry.id,
    name: entry.name,
    status: entry.status,
  }));

  const matchesForTab =
    selectedStage?.stageType === "group"
      ? (season.games ?? []).filter(
          (g) =>
            g.stageId === selectedStage.id ||
            (g.stageGroupId != null &&
              (selectedStage.groups ?? []).some((gr) => gr.id === g.stageGroupId)),
        )
      : season.games;

  return (
    <DetailScreenShell
      title={season.league.name}
      tabletMaxWidth={1120}
      rightAccessory={
        <View className="flex-row items-center gap-2">
          <LeagueNotificationToggle leagueId={season.league.id} />
          <EntityLogo
            logoUrl={season.league.logoUrl}
            variant="league"
            size="sm"
            tone="dark"
          />
        </View>
      }
      headerContent={
        <>
          <SeasonPicker
            seasons={seasonOptions}
            activeSeasonId={seasonId ?? season.id}
            onSelect={setSeasonId}
          />
          {stages.length > 1 ? (
            <View className="mb-2 flex-row flex-wrap gap-2">
              {stages
                .slice()
                .sort((a, b) => a.sequence - b.sequence)
                .map((stage) => {
                  const active = stage.id === selectedStage?.id;
                  return (
                    <Pressable
                      key={stage.id}
                      onPress={() => {
                        setActiveStageId(stage.id);
                        if (stage.stageType === "knockout") {
                          setActiveTab("bracket");
                        } else if (
                          stage.stageType === "round_robin" ||
                          stage.stageType === "group"
                        ) {
                          setActiveTab("standings");
                        }
                      }}
                      className={`rounded-full border px-3 py-1.5 ${
                        active
                          ? "border-accent-400 bg-accent-500/20"
                          : "border-white/15 bg-white/5"
                      }`}
                    >
                      <Text
                        className={
                          active
                            ? "text-xs text-accent-200"
                            : "text-xs text-white/60"
                        }
                      >
                        {stage.name}
                      </Text>
                    </Pressable>
                  );
                })}
            </View>
          ) : null}
          <DetailTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            scrollable
          />
        </>
      }
    >
      {activeTab === "overview" ? <LeagueOverviewTab season={season} /> : null}
      {activeTab === "matches" ? (
        <LeagueMatchesTab games={matchesForTab ?? []} />
      ) : null}
      {activeTab === "standings" && standingStage ? (
        <LeagueStageStandingsPanel
          stage={standingStage}
          fallbackStandings={season.standings}
        />
      ) : null}
      {activeTab === "bracket" && selectedStage?.stageType === "knockout" ? (
        <LeagueBracketTab stage={selectedStage} />
      ) : null}
      {activeTab === "bracket" &&
      selectedStage?.stageType !== "knockout" &&
      knockouts[0] ? (
        <LeagueBracketTab stage={knockouts[0]} />
      ) : null}
      {activeTab === "stats" ? (
        <LeagueStatsTab statTypes={statTypes} stats={season.stats} />
      ) : null}
    </DetailScreenShell>
  );
}
