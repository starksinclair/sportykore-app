import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type {
  ApiPlayerLeague,
  ApiPlayerSeason,
  ApiStatType,
} from "@/api/entities";
import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import { EntityLogo } from "@/components/ui";
import { iconForStatType, orderStatTypes } from "@/lib/stat-types";

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
  const theme = useTheme();
  const { isDark } = useAppearance();
  const orderedTypes = useMemo(() => orderStatTypes(statTypes), [statTypes]);
  const teams = useMemo(() => distinctTeams(leagues), [leagues]);

  if (!leagues.length) {
    return (
      <View
        className="items-center gap-3 rounded-[24px] border px-6 py-10"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
        }}
      >
        <Ionicons name="time-outline" size={32} color={theme.textMuted} />
        <Text
          className="text-lg"
          style={{ color: theme.text }}
        >
          No career history yet
        </Text>
        <Text
          className="text-center text-sm"
          style={{ color: theme.textSubtle }}
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
                className="flex-row items-center gap-2 rounded-full border py-2 pl-2 pr-3 active:opacity-85"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                }}
              >
                <EntityLogo
                  logoUrl={team.logoUrl}
                  variant="team"
                  size="xs"
                  tone={isDark ? "dark" : "light"}
                />
                <Text
                  className="text-xs"
                  style={{ color: theme.text }}
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
  const theme = useTheme();

  return (
    <View className="gap-3">
      <Pressable
        onPress={onLeaguePress}
        className="flex-row items-center justify-between rounded-[20px] px-4 py-3"
        style={({ pressed }) => ({
          backgroundColor: pressed ? theme.cardMuted : theme.card,
        })}
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
              style={{ color: theme.text }}
            >
              {league.name}
            </Text>
            <Text
              className="pt-0.5 text-xs"
              style={{ color: theme.textSubtle }}
            >
              {league.seasons.length} season
              {league.seasons.length === 1 ? "" : "s"}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
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
  const theme = useTheme();
  const { isDark } = useAppearance();
  const totals = useMemo(
    () => seasonSummaryTotals(season.stats ?? [], statTypes),
    [season.stats, statTypes],
  );
  const gameCount = season.games?.length ?? 0;

  return (
    <Pressable
      onPress={onPress}
      className="rounded-[18px] px-4 py-3"
      style={({ pressed }) => ({
        backgroundColor: pressed ? theme.cardMuted : theme.card,
      })}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-2">
          <EntityLogo
            logoUrl={season.team.logoUrl}
            variant="team"
            size="xs"
            tone={isDark ? "dark" : "light"}
          />
          <View className="flex-1">
            <Text
              style={{ color: theme.text }}
            >
              {season.name}
            </Text>
            <Text
              className="pt-0.5 text-xs"
              style={{ color: theme.textSubtle }}
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
              className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{ backgroundColor: theme.cardMuted }}
            >
              <Ionicons
                name={iconForStatType(type)}
                size={12}
                color={theme.accent}
              />
              <Text
                className="text-[11px]"
                style={{ color: theme.text }}
              >
                {total}
              </Text>
              <Text
                className="text-[11px]"
                style={{ color: theme.textSubtle }}
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
