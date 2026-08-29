import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, View } from "react-native";

import type { ApiStat, ApiTeam } from "@/api/entities";
import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import { DetailTabs } from "@/components/ui/detail-tabs";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { LineupPitchView } from "@/lineup/components/LineupPitchView";
import type { TeamLineupGroup } from "@/lineup/types";

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
  const { isDark } = useAppearance();
  const theme = useTheme();
  const { isTablet } = useAdaptiveLayout();
  const [activeSide, setActiveSide] = useState<TeamSide>("home");

  const homeGroup = lineups.find((g) => g.team.id === homeTeam?.id);
  const awayGroup = lineups.find((g) => g.team.id === awayTeam?.id);

  if (!homeTeam && !awayTeam) {
    return (
      <Text className="text-sm" style={{ color: theme.textSubtle }}>
        Teams not assigned to this match yet.
      </Text>
    );
  }

  const hasAnyLineup =
    (homeGroup?.starters.length ?? 0) > 0 ||
    (awayGroup?.starters.length ?? 0) > 0;

  if (!hasAnyLineup) {
    return (
      <View
        className="items-center gap-3 rounded-[24px] border px-6 py-10"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        <Ionicons
          name="football-outline"
          size={32}
          color={theme.textMuted}
        />
        <Text className="text-lg" style={{ color: theme.text }}>
          Lineups not submitted yet
        </Text>
        <Text
          className="text-center text-sm"
          style={{ color: theme.textSubtle }}
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

  if (isTablet && tabs.length > 1) {
    return (
      <View className="flex-row items-start gap-6">
        <View className="min-w-0 flex-1 gap-3">
          <Text
            className="text-[12px] uppercase tracking-[2px]"
            style={{ color: theme.textSubtle }}
          >
            {homeTeam?.name ?? "Home"}
          </Text>
          {homeTeam && homeGroup && (homeGroup.starters.length ?? 0) > 0 ? (
            <LineupPitchView group={homeGroup} tone={isDark ? "dark" : "light"} stats={stats} />
          ) : homeTeam ? (
            <TeamMissingLineup teamName={homeTeam.name} />
          ) : null}
        </View>
        <View className="min-w-0 flex-1 gap-3">
          <Text
            className="text-[12px] uppercase tracking-[2px]"
            style={{ color: theme.textSubtle }}
          >
            {awayTeam?.name ?? "Away"}
          </Text>
          {awayTeam && awayGroup && (awayGroup.starters.length ?? 0) > 0 ? (
            <LineupPitchView group={awayGroup} tone={isDark ? "dark" : "light"} stats={stats} />
          ) : awayTeam ? (
            <TeamMissingLineup teamName={awayTeam.name} />
          ) : null}
        </View>
      </View>
    );
  }

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
        <LineupPitchView group={activeGroup} tone={isDark ? "dark" : "light"} stats={stats} />
      ) : activeTeam ? (
        <TeamMissingLineup teamName={activeTeam.name} />
      ) : null}
    </View>
  );
}

function TeamMissingLineup({ teamName }: { teamName: string }) {
  const theme = useTheme();

  return (
    <View
      className="rounded-[20px] border border-dashed px-5 py-6"
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
    >
      <Text style={{ color: theme.text }}>
        {teamName}
      </Text>
      <Text
        className="pt-1 text-sm"
        style={{ color: theme.textSubtle }}
      >
        Lineup not submitted yet.
      </Text>
    </View>
  );
}
