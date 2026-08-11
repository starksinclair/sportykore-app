import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { EntityLogo } from "@/components/ui";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { ErrorState } from "@/components/ui/error-state";
import { colors } from "@/constants";
import { messageForResourceLoad } from "@/lib/show-error-toast";
import { LineupEditor } from "@/lineup/components/LineupEditor";
import { teamPlayersToRosterRows } from "@/lineup/utils";
import { useMatchDetail } from "@/match";
import { useTeamDetail } from "@/team";

type Props = {
  leagueId: number;
  teamId: number;
  gameId: number;
  seasonId: number;
};

export function LineupEditorScreen({
  leagueId,
  teamId,
  gameId,
  seasonId,
}: Props) {
  const router = useRouter();
  const matchQuery = useMatchDetail(gameId);
  const teamQuery = useTeamDetail(teamId);
  const insets = useSafeAreaInsets();
  const seasonPlayers = useMemo(() => {
    const leagues = teamQuery.data?.leagues ?? [];
    const league =
      leagues.find((entry) => entry.id === leagueId) ?? leagues[0] ?? null;
    const seasons = league?.seasons ?? [];
    const season =
      (seasonId > 0
        ? seasons.find((entry) => entry.id === seasonId)
        : null) ??
      seasons.find((entry) => entry.status === "active") ??
      seasons[0] ??
      null;
    return season?.players ?? [];
  }, [teamQuery.data, leagueId, seasonId]);

  const roster = useMemo(() => {
    const team = teamQuery.data?.team;
    if (!team) return [];
    return teamPlayersToRosterRows(seasonPlayers, team);
  }, [seasonPlayers, teamQuery.data?.team]);

  const game = matchQuery.data;
  const team =
    game?.homeTeam?.id === teamId
      ? game.homeTeam
      : game?.awayTeam?.id === teamId
        ? game.awayTeam
        : teamQuery.data?.team ?? null;

  const opponent =
    game?.homeTeam?.id === teamId
      ? game.awayTeam
      : game?.awayTeam?.id === teamId
        ? game.homeTeam
        : null;

  return (
    <View className="flex-1 bg-[#121212]">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <BlackPatternBackground
          baseColor={colors.scoreboardBlack}
          stripeColor={colors.patternStripe}
        />

        <View className="flex-row items-center gap-3 px-5 pb-4 pt-2">
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            className="h-11 w-11 items-center justify-center rounded-full bg-white/10 active:bg-white/15"
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
          <View className="flex-1">
            <Text
              className="text-xl text-white"
            >
              Set lineup
            </Text>
          </View>
        </View>

        {team ? (
          <View className="mb-2 flex-row items-center gap-3 px-5">
            <EntityLogo logoUrl={team.logoUrl} variant="team" size="sm" tone="dark" />
            <View className="flex-1">
              <Text className="text-white">
                {team.name}
              </Text>
              {opponent ? (
                <Text className="text-sm text-white/55">
                  vs {opponent.name}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="pb-12"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 16,
          }}
        >
          {matchQuery.isLoading || teamQuery.isLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : matchQuery.isError || !game ? (
            <ErrorState
              message={
                matchQuery.isError
                  ? messageForResourceLoad(matchQuery.error, "Match")
                  : "Match not found."
              }
              onRetry={() => matchQuery.refetch()}
            />
          ) : teamQuery.isError ? (
            <ErrorState
              message={messageForResourceLoad(teamQuery.error, "Team")}
              onRetry={() => teamQuery.refetch()}
            />
          ) : (
            <LineupEditor
              gameId={gameId}
              teamId={teamId}
              roster={roster}
              gameStatus={game.status}
              onSaved={() => router.back()}
              embedded
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
