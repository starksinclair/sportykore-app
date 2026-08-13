import { useMemo } from "react";
import { Text, View } from "react-native";

import type { ApiMatchTrackingMetrics, ApiStat } from "@/api/entities";
import { useTheme } from "@/color/use-theme";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";

type Props = {
  stats: ApiStat[];
  tracking?: ApiMatchTrackingMetrics;
  homeTeamId?: number;
  awayTeamId?: number;
};

type Bucket = {
  type: string;
  category: string;
  homeCount: number;
  awayCount: number;
};

export function MatchStatsTab({ stats, tracking, homeTeamId, awayTeamId }: Props) {
  const theme = useTheme();
  const { isTablet } = useAdaptiveLayout();
  const buckets = useMemo(
    () => bucketStats(stats, homeTeamId, awayTeamId),
    [stats, homeTeamId, awayTeamId],
  );

  if (!buckets.length && !tracking) {
    return (
      <Text className="text-sm" style={{ color: theme.textSubtle }}>
        No stat events recorded for this match yet.
      </Text>
    );
  }

  const analyticsSection = tracking ? (
    <Section title="Match Analytics">
      <View
        className="gap-3 rounded-[24px] border px-4 py-5"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        <TrackingRow
          label="Possession"
          homeValue={
            tracking.possessionTracked
              ? `${tracking.teams.home.possessionPct}%`
              : "Not tracked"
          }
          awayValue={
            tracking.possessionTracked
              ? `${tracking.teams.away.possessionPct}%`
              : "Not tracked"
          }
        />
        <TrackingRow
          label="Pass completion"
          homeValue={formatPct(tracking.teams.home.passCompletionPct)}
          awayValue={formatPct(tracking.teams.away.passCompletionPct)}
        />
        <TrackingRow
          label="Shot accuracy"
          homeValue={formatPct(tracking.teams.home.shotAccuracyPct)}
          awayValue={formatPct(tracking.teams.away.shotAccuracyPct)}
        />
        <View className="flex-row gap-2 pt-1">
          <MiniStat
            label="Home attempted passes"
            value={`${tracking.teams.home.passesAttempted}`}
          />
          <MiniStat
            label="Home completed passes"
            value={`${tracking.teams.home.passesCompleted}`}
          />
        </View>
        <View className="flex-row gap-2">
          <MiniStat
            label="Home attempted shots"
            value={`${tracking.teams.home.shotsAttempted}`}
          />
          <MiniStat
            label="Home shots on target"
            value={`${tracking.teams.home.shotsOnTarget}`}
          />
        </View>
        <View className="flex-row gap-2">
          <MiniStat
            label="Away attempted passes"
            value={`${tracking.teams.away.passesAttempted}`}
          />
          <MiniStat
            label="Away completed passes"
            value={`${tracking.teams.away.passesCompleted}`}
          />
        </View>
        <View className="flex-row gap-2">
          <MiniStat
            label="Away attempted shots"
            value={`${tracking.teams.away.shotsAttempted}`}
          />
          <MiniStat
            label="Away shots on target"
            value={`${tracking.teams.away.shotsOnTarget}`}
          />
        </View>
      </View>
    </Section>
  ) : null;

  const teamStatsSection = (
    <Section title="Team Stats">
      {buckets.length ? (
        <View
          className="rounded-[24px] border px-4 py-5"
          style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
        >
          {buckets.map((bucket) => (
            <View
              key={bucket.type}
              className="flex-row items-center justify-between py-2"
            >
              <Text className="text-sm" style={{ color: theme.text }}>
                {bucket.homeCount}
              </Text>
              <Text
                className="flex-1 text-center text-xs uppercase tracking-[1.5px]"
                style={{ color: theme.textSubtle }}
              >
                {bucket.type}
              </Text>
              <Text className="text-sm" style={{ color: theme.text }}>
                {bucket.awayCount}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-sm" style={{ color: theme.textSubtle }}>
          No stat events recorded for this match yet.
        </Text>
      )}
    </Section>
  );

  if (isTablet && analyticsSection) {
    return (
      <View className="flex-row items-start gap-6">
        <View className="min-w-0 flex-1">{analyticsSection}</View>
        <View className="min-w-0 flex-1">{teamStatsSection}</View>
      </View>
    );
  }

  return (
    <View className="gap-6">
      {analyticsSection}
      {teamStatsSection}
    </View>
  );
}

function bucketStats(
  stats: ApiStat[],
  homeTeamId?: number,
  awayTeamId?: number,
): Bucket[] {
  const byType = new Map<string, Bucket>();
  for (const stat of stats) {
    const typeName = stat.type?.displayName ?? stat.type?.name ?? "Event";
    const category = stat.type?.category ?? "Other";
    const bucket =
      byType.get(typeName) ??
      {
        type: typeName,
        category,
        homeCount: 0,
        awayCount: 0,
      };
    if (stat.team?.id != null && stat.team.id === homeTeamId) {
      bucket.homeCount += stat.numericValue ?? 1;
    } else if (stat.team?.id != null && stat.team.id === awayTeamId) {
      bucket.awayCount += stat.numericValue ?? 1;
    }
    byType.set(typeName, bucket);
  }
  return Array.from(byType.values()).sort((a, b) =>
    a.type.localeCompare(b.type),
  );
}

function TrackingRow({
  label,
  homeValue,
  awayValue,
}: {
  label: string;
  homeValue: string;
  awayValue: string;
}) {
  const theme = useTheme();

  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="w-20 text-sm" style={{ color: theme.text }} numberOfLines={1}>
        {homeValue}
      </Text>
      <Text
        className="min-w-0 flex-1 text-center text-[10px] uppercase tracking-[1.4px]"
        style={{ color: theme.textSubtle }}
      >
        {label}
      </Text>
      <Text className="w-20 text-right text-sm" style={{ color: theme.text }} numberOfLines={1}>
        {awayValue}
      </Text>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View
      className="min-w-0 flex-1 rounded-2xl border px-3 py-3"
      style={{ backgroundColor: theme.cardMuted, borderColor: theme.cardBorder }}
    >
      <Text
        className="text-[10px] uppercase"
        style={{ color: theme.textSubtle }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text className="pt-1 text-sm" style={{ color: theme.text }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function formatPct(value: number | undefined) {
  return value != null ? `${value}%` : "0%";
}

function Section({
  title,
  children,
}: {
  title: string;
  children: import("react").ReactNode;
}) {
  const theme = useTheme();

  return (
    <View className="gap-3">
      <Text
        className="text-[12px] uppercase tracking-[2px]"
        style={{ color: theme.textSubtle }}
      >
        {title}
      </Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}
