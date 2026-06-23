import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type {
  ApiPlayer,
  ApiPlayerLeague,
  ApiPlayerSeason,
  ApiStatType,
} from "@/api/entities";
import { EntityLogo } from "@/components/ui";
import { labelForPosition } from "@/lib/positions";
import { fonts } from "@/theme/fonts";

import { aggregatePlayerStats, collectAllStats, countAllGames } from "../../utils";

type Props = {
  player: ApiPlayer & { country: { code: string; name: string } | null };
  leagues: ApiPlayerLeague[];
  statTypes: ApiStatType[];
  league: ApiPlayerLeague | null;
  season: ApiPlayerSeason | null;
};

export function PlayerOverviewTab({ player, leagues, league, season }: Props) {
  const router = useRouter();
  const seasonTotals = useMemo(
    () => aggregatePlayerStats(season?.stats ?? []),
    [season?.stats],
  );
  const careerTotals = useMemo(
    () => aggregatePlayerStats(collectAllStats(leagues)),
    [leagues],
  );
  const careerGames = useMemo(() => countAllGames(leagues), [leagues]);

  return (
    <View className="gap-6">
      <View className="items-center gap-4 rounded-[28px] bg-white/6 px-5 py-8">
        <View className="h-28 w-28 items-center justify-center rounded-full bg-[#364156]">
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className="text-[34px] text-white"
          >
            {initials(player.name)}
          </Text>
        </View>
        <View className="items-center">
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className="text-[28px] text-white"
          >
            {player.name}
          </Text>
          {player.position ? (
            <View className="mt-2 rounded-full border border-white/10 bg-white/8 px-3 py-1">
              <Text
                style={{ fontFamily: fonts.bodySemibold }}
                className="text-[11px] uppercase tracking-[1.5px] text-white/80"
              >
                {labelForPosition(player.position)}
              </Text>
            </View>
          ) : null}
          {season?.team ? (
            <Pressable
              onPress={() => router.push(`/team/${season.team.id}`)}
              className="mt-2 flex-row items-center gap-2"
            >
              <EntityLogo
                logoUrl={season.team.logoUrl}
                variant="team"
                size="xs"
                tone="dark"
              />
              <Text
                style={{ fontFamily: fonts.body }}
                className="text-[15px] text-[#10E3B1]"
              >
                {season.team.name}
              </Text>
            </Pressable>
          ) : null}
          {league ? (
            <Text
              style={{ fontFamily: fonts.body }}
              className="pt-1 text-xs text-white/55"
            >
              {league.name}
              {season ? ` · ${season.name}` : ""}
            </Text>
          ) : null}
        </View>
      </View>

      {season ? (
        <Section title={`This Season · ${season.name}`}>
          <View className="flex-row flex-wrap gap-3">
            <StatCard
              icon="football-outline"
              value={seasonTotals.goals}
              label="Goals"
            />
            <StatCard
              icon="git-merge-outline"
              value={seasonTotals.assists}
              label="Assists"
            />
            <StatCard
              icon="person-outline"
              value={season.games?.length ?? 0}
              label="Fixtures"
            />
            <StatCard
              icon="warning-outline"
              value={seasonTotals.cards}
              label="Cards"
            />
          </View>
        </Section>
      ) : null}

      <Section title="Career Totals">
        <View className="flex-row flex-wrap gap-3">
          <StatCard
            icon="football-outline"
            value={careerTotals.goals}
            label="Goals"
          />
          <StatCard
            icon="git-merge-outline"
            value={careerTotals.assists}
            label="Assists"
          />
          <StatCard
            icon="person-outline"
            value={careerGames}
            label="Games"
          />
          <StatCard
            icon="warning-outline"
            value={careerTotals.cards}
            label="Cards"
          />
        </View>
      </Section>
    </View>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
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

function StatCard({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
}) {
  return (
    <View className="min-w-[140px] flex-1 rounded-[22px] bg-white/6 px-4 py-5">
      <Ionicons name={icon} size={24} color="#E6A817" />
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="pt-4 text-[28px] text-white"
      >
        {value}
      </Text>
      <Text
        style={{ fontFamily: fonts.body }}
        className="pt-1 text-sm text-white/55"
      >
        {label}
      </Text>
    </View>
  );
}
