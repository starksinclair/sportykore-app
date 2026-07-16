import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import type { ApiStage } from "@/api/entities";
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
import { LeagueBracketTab } from "@/league/components/tabs/BracketTab";
import { LeagueMatchesTab } from "@/league/components/tabs/MatchesTab";
import { LeagueOverviewTab } from "@/league/components/tabs/OverviewTab";
import { LeagueStandingsTab } from "@/league/components/tabs/StandingsTab";
import { LeagueStatsTab } from "@/league/components/tabs/StatsTab";
import { useLeagueDetail } from "@/league";
import {
  hasRoundRobinStage,
  knockoutStages,
  pickPrimaryStage,
} from "@/knockout";
import { fonts } from "@/theme/fonts";

type TabKey = "overview" | "matches" | "standings" | "bracket" | "stats";

export default function LeagueRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const leagueId = Number(id);
  const isValidId = Number.isFinite(leagueId) && leagueId > 0;
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [activeStageId, setActiveStageId] = useState<number | null>(null);

  const query = useLeagueDetail(isValidId ? leagueId : 0, seasonId);

  const stages = query.data?.season.stages ?? [];
  const primary = pickPrimaryStage(stages);
  const knockouts = knockoutStages(stages);
  const hasRr = hasRoundRobinStage(stages);

  useEffect(() => {
    if (primary && activeStageId == null) {
      setActiveStageId(primary.id);
    }
  }, [primary, activeStageId]);

  const selectedStage: ApiStage | null =
    stages.find((s) => s.id === activeStageId) ?? primary;

  const tabs: readonly DetailTab<TabKey>[] = useMemo(() => {
    const list: DetailTab<TabKey>[] = [{ key: "overview", label: "Overview" }];
    if (hasRr) {
      list.push({ key: "matches", label: "Matches" });
      list.push({ key: "standings", label: "Standings" });
    }
    if (knockouts.length > 0) {
      list.push({ key: "bracket", label: "Bracket" });
    }
    list.push({ key: "stats", label: "Stats" });
    return list;
  }, [hasRr, knockouts.length]);

  useEffect(() => {
    if (!tabs.some((t) => t.key === activeTab)) {
      setActiveTab("overview");
    }
  }, [tabs, activeTab]);

  if (!isValidId) {
    return (
      <DetailScreenShell title="Competition">
        <NotFound message="Invalid competition id" />
      </DetailScreenShell>
    );
  }

  if (query.isLoading && !query.data) {
    return (
      <DetailScreenShell title="Competition">
        <View className="items-center py-20">
          <ActivityIndicator color={colors.accent} />
        </View>
      </DetailScreenShell>
    );
  }

  if (query.isError || !query.data) {
    return (
      <DetailScreenShell title="Competition">
        <NotFound message="Competition not found" />
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
                        } else if (stage.stageType === "round_robin") {
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
                        style={{ fontFamily: fonts.bodySemibold }}
                        className={
                          active ? "text-xs text-accent-200" : "text-xs text-white/60"
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
          />
        </>
      }
    >
      {activeTab === "overview" ? <LeagueOverviewTab season={season} /> : null}
      {activeTab === "matches" ? <LeagueMatchesTab games={season.games} /> : null}
      {activeTab === "standings" ? (
        <LeagueStandingsTab standings={season.standings} />
      ) : null}
      {activeTab === "bracket" && selectedStage?.stageType === "knockout" ? (
        <LeagueBracketTab stage={selectedStage} />
      ) : null}
      {activeTab === "bracket" && selectedStage?.stageType !== "knockout" && knockouts[0] ? (
        <LeagueBracketTab stage={knockouts[0]} />
      ) : null}
      {activeTab === "stats" ? (
        <LeagueStatsTab statTypes={statTypes} stats={season.stats} />
      ) : null}
    </DetailScreenShell>
  );
}
