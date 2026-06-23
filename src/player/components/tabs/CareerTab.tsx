import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type {
  ApiPlayerLeague,
  ApiPlayerSeason,
  ApiStatType,
} from "@/api/entities";
import { EntityLogo } from "@/components/ui";
import { iconForStatType, orderStatTypes } from "@/lib/stat-types";
import { fonts } from "@/theme/fonts";

import {
  distinctTeams,
  seasonSummaryTotals,
} from "../../utils";

type Props = {
  leagues: ApiPlayerLeague[];
  statTypes: ApiStatType[];
};

export function PlayerCareerTab({ leagues, statTypes }: Props) {
  const router = useRouter();
  const orderedTypes = useMemo(() => orderStatTypes(statTypes), [statTypes]);
  const teams = useMemo(() => distinctTeams(leagues), [leagues]);

  if (!leagues.length) {
    return (
      <View className="items-center gap-3 rounded-[24px] border border-white/10 bg-white/5 px-6 py-10">
        <Ionicons name="time-outline" size={32} color="rgba(255,255,255,0.6)" />
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-lg text-white"
        >
          No career history yet
        </Text>
        <Text
          style={{ fontFamily: fonts.body }}
          className="text-center text-sm text-white/55"
        >
          We&apos;ll show every club and season the player has been part of as
          soon as they appear in a roster.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-6">
      {teams.length ? (
        <Section title="Clubs">
          <View className="flex-row flex-wrap gap-2">
            {teams.map((team) => (
              <Pressable
                key={team.id}
                onPress={() => router.push(`/team/${team.id}`)}
                className="flex-row items-center gap-2 rounded-full border border-white/10 bg-white/6 py-2 pl-2 pr-3 active:bg-white/10"
              >
                <EntityLogo
                  logoUrl={team.logoUrl}
                  variant="team"
                  size="xs"
                  tone="dark"
                />
                <Text
                  style={{ fontFamily: fonts.bodySemibold }}
                  className="text-xs text-white"
                >
                  {team.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>
      ) : null}

      {leagues.map((league) => (
        <LeagueBlock
          key={league.id}
          league={league}
          statTypes={orderedTypes}
          onLeaguePress={() => router.push(`/league/${league.id}`)}
          onTeamPress={(teamId) => router.push(`/team/${teamId}`)}
        />
      ))}
    </View>
  );
}

function LeagueBlock({
  league,
  statTypes,
  onLeaguePress,
  onTeamPress,
}: {
  league: ApiPlayerLeague;
  statTypes: ApiStatType[];
  onLeaguePress: () => void;
  onTeamPress: (teamId: number) => void;
}) {
  return (
    <View className="gap-3">
      <Pressable
        onPress={onLeaguePress}
        className="flex-row items-center justify-between rounded-[20px] bg-white/6 px-4 py-3 active:bg-white/10"
      >
        <View className="flex-row items-center gap-3">
          <EntityLogo
            logoUrl={league.logoUrl}
            variant="league"
            size="sm"
            tone="brand"
          />
          <View>
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-white"
            >
              {league.name}
            </Text>
            <Text
              style={{ fontFamily: fonts.body }}
              className="pt-0.5 text-xs text-white/55"
            >
              {league.seasons.length} season
              {league.seasons.length === 1 ? "" : "s"}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
      </Pressable>

      <View className="gap-2">
        {league.seasons.map((season) => (
          <SeasonRow
            key={season.id}
            season={season}
            statTypes={statTypes}
            onPress={() => onTeamPress(season.team.id)}
          />
        ))}
      </View>
    </View>
  );
}

function SeasonRow({
  season,
  statTypes,
  onPress,
}: {
  season: ApiPlayerSeason;
  statTypes: ApiStatType[];
  onPress: () => void;
}) {
  const totals = useMemo(
    () => seasonSummaryTotals(season.stats ?? [], statTypes),
    [season.stats, statTypes],
  );
  const gameCount = season.games?.length ?? 0;

  return (
    <Pressable
      onPress={onPress}
      className="rounded-[18px] bg-white/6 px-4 py-3 active:bg-white/10"
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-2">
          <EntityLogo
            logoUrl={season.team.logoUrl}
            variant="team"
            size="xs"
            tone="dark"
          />
          <View className="flex-1">
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-white"
            >
              {season.name}
            </Text>
            <Text
              style={{ fontFamily: fonts.body }}
              className="pt-0.5 text-xs text-white/55"
            >
              {season.team.name} · {season.status} · {gameCount} fixture
              {gameCount === 1 ? "" : "s"}
            </Text>
          </View>
        </View>
      </View>

      {totals.length ? (
        <View className="flex-row flex-wrap gap-2 pt-3">
          {totals.slice(0, 6).map(({ type, total }) => (
            <View
              key={type.id}
              className="flex-row items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1"
            >
              <Ionicons
                name={iconForStatType(type)}
                size={12}
                color="#E6A817"
              />
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-[11px] text-white"
              >
                {total}
              </Text>
              <Text
                style={{ fontFamily: fonts.body }}
                className="text-[11px] text-white/55"
              >
                {type.displayName}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
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
