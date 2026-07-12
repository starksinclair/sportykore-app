import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, View } from "react-native";

import type { ApiStat, ApiTeam } from "@/api/entities";
import { DetailTabs } from "@/components/ui/detail-tabs";
import { LineupPitchView } from "@/lineup/components/LineupPitchView";
import type { TeamLineupGroup } from "@/lineup/types";
import { fonts } from "@/theme/fonts";

type TeamSide = "home" | "away";

type Props = {
  homeTeam?: ApiTeam;
  awayTeam?: ApiTeam;
  lineups: TeamLineupGroup[];
  stats?: ApiStat[];
};

export function MatchLineupsTab({
  homeTeam,
  awayTeam,
  lineups,
  stats = [],
}: Props) {
  const [activeSide, setActiveSide] = useState<TeamSide>("home");

  const homeGroup = lineups.find((g) => g.team.id === homeTeam?.id);
  const awayGroup = lineups.find((g) => g.team.id === awayTeam?.id);

  if (!homeTeam && !awayTeam) {
    return (
      <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
        Teams not assigned to this match yet.
      </Text>
    );
  }

  const hasAnyLineup =
    (homeGroup?.starters.length ?? 0) > 0 ||
    (awayGroup?.starters.length ?? 0) > 0;

  if (!hasAnyLineup) {
    return (
      <View className="items-center gap-3 rounded-[24px] border border-white/10 bg-white/5 px-6 py-10">
        <Ionicons
          name="football-outline"
          size={32}
          color="rgba(255,255,255,0.6)"
        />
        <Text style={{ fontFamily: fonts.bodyBold }} className="text-lg text-white">
          Lineups not submitted yet
        </Text>
        <Text
          style={{ fontFamily: fonts.body }}
          className="text-center text-sm text-white/55"
        >
          Official team sheets will appear here once managers confirm their
          starting elevens.
        </Text>
      </View>
    );
  }

  const tabs = [
    ...(homeTeam
      ? [{ key: "home" as const, label: homeTeam.name }]
      : []),
    ...(awayTeam
      ? [{ key: "away" as const, label: awayTeam.name }]
      : []),
  ];

  const resolvedSide: TeamSide =
    tabs.some((t) => t.key === activeSide)
      ? activeSide
      : (tabs[0]?.key ?? "home");

  const activeTeam = resolvedSide === "home" ? homeTeam : awayTeam;
  const activeGroup = resolvedSide === "home" ? homeGroup : awayGroup;

  return (
    <View className="gap-5">
      {tabs.length > 1 ? (
        <DetailTabs
          tabs={tabs}
          activeTab={resolvedSide}
          onTabChange={setActiveSide}
          scrollable
        />
      ) : null}

      {activeTeam && activeGroup && (activeGroup.starters.length ?? 0) > 0 ? (
        <LineupPitchView group={activeGroup} tone="dark" stats={stats} />
      ) : activeTeam ? (
        <TeamMissingLineup teamName={activeTeam.name} />
      ) : null}
    </View>
  );
}

function TeamMissingLineup({ teamName }: { teamName: string }) {
  return (
    <View className="rounded-[20px] border border-dashed border-white/15 bg-white/5 px-5 py-6">
      <Text style={{ fontFamily: fonts.bodyBold }} className="text-white">
        {teamName}
      </Text>
      <Text
        style={{ fontFamily: fonts.body }}
        className="pt-1 text-sm text-white/55"
      >
        Lineup not submitted yet.
      </Text>
    </View>
  );
}
