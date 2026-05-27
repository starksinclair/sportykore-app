import { useMemo } from "react";
import { Text, View } from "react-native";

import type { ApiStat } from "@/api/entities";
import { fonts } from "@/theme/fonts";

type Props = {
  stats: ApiStat[];
  homeTeamId?: number;
  awayTeamId?: number;
};

type Bucket = {
  type: string;
  category: string;
  homeCount: number;
  awayCount: number;
};

export function MatchStatsTab({ stats, homeTeamId, awayTeamId }: Props) {
  const buckets = useMemo(
    () => bucketStats(stats, homeTeamId, awayTeamId),
    [stats, homeTeamId, awayTeamId],
  );

  if (!buckets.length) {
    return (
      <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
        No stat events recorded for this match yet.
      </Text>
    );
  }

  return (
    <View className="gap-6">
      <Section title="Team Stats">
        <View className="rounded-[24px] bg-white/6 px-4 py-5">
          {buckets.map((bucket) => (
            <View
              key={bucket.type}
              className="flex-row items-center justify-between py-2"
            >
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-sm text-white"
              >
                {bucket.homeCount}
              </Text>
              <Text
                style={{ fontFamily: fonts.body }}
                className="flex-1 text-center text-xs uppercase tracking-[1.5px] text-white/55"
              >
                {bucket.type}
              </Text>
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-sm text-white"
              >
                {bucket.awayCount}
              </Text>
            </View>
          ))}
        </View>
      </Section>
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

function Section({
  title,
  children,
}: {
  title: string;
  children: import("react").ReactNode;
}) {
  return (
    <View className="gap-3">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-[12px] uppercase tracking-[2px] text-white/55"
      >
        {title}
      </Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}
