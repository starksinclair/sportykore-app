import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import type { ApiGame, ApiPlayerWithStats, GameStatus } from "@/api/entities";
import { EntityLogo } from "@/components/ui";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { ErrorState } from "@/components/ui/error-state";
import { colors } from "@/constants";
import { formatPlayedAtShortDate, formatPlayedAtTime } from "@/lib/datetime";
import { messageForResourceLoad } from "@/lib/show-error-toast";
import { useTeamDetail } from "@/team";

type Props = {
  leagueId: number;
  teamId: number;
  seasonId: number;
};

const EDITABLE_STATUSES: GameStatus[] = ["scheduled", "postponed"];

function statusLabel(status: GameStatus): string {
  if (status === "scheduled") return "Upcoming";
  if (status === "postponed") return "Postponed";
  if (
    status === "first_half" ||
    status === "second_half" ||
    status === "extra_time" ||
    status === "paused" ||
    status === "half_time" ||
    status === "live"
  ) {
    return "Live";
  }
  if (status === "full_time" || status === "completed") return "FT";
  if (status === "cancelled") return "Cancelled";
  return status;
}

function opponentFor(game: ApiGame, teamId: number) {
  if (game.homeTeam?.id === teamId) return game.awayTeam;
  if (game.awayTeam?.id === teamId) return game.homeTeam;
  return null;
}

function positionLabel(position: ApiPlayerWithStats["position"]): string {
  if (!position) return "-";
  return position.charAt(0).toUpperCase() + position.slice(1);
}

export function TeamLineupHubScreen({ leagueId, teamId, seasonId }: Props) {
  const router = useRouter();
  const teamQuery = useTeamDetail(teamId);
  const insets = useSafeAreaInsets();
  const leagueBlock = useMemo(() => {
    const leagues = teamQuery.data?.leagues ?? [];
    return (
      leagues.find((entry) => entry.id === leagueId) ??
      leagues[0] ??
      null
    );
  }, [teamQuery.data, leagueId]);

  const seasonBlock = useMemo(() => {
    const seasons = leagueBlock?.seasons ?? [];
    if (seasonId > 0) {
      return seasons.find((entry) => entry.id === seasonId) ?? null;
    }
    return (
      seasons.find((entry) => entry.status === "active") ??
      seasons[0] ??
      null
    );
  }, [leagueBlock, seasonId]);

  const resolvedSeasonId = seasonBlock?.id ?? (seasonId > 0 ? seasonId : 0);
  const teamGames = useMemo(() => {
    const games = seasonBlock?.games ?? [];
    return [...games].sort(
      (a, b) =>
        new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime(),
    );
  }, [seasonBlock]);

  const roster = seasonBlock?.players ?? [];
  const teamInfo = teamQuery.data?.team ?? null;
  const leagueName = leagueBlock?.name;

  const openLineup = (gameId: number) => {
    router.push(
      `/manage/${leagueId}/team/${teamId}/lineup/${gameId}?seasonId=${resolvedSeasonId}`,
    );
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <BlackPatternBackground
          baseColor={colors.scoreboardBlack}
          stripeColor={colors.patternStripe}
        />

        <View className="px-5 pb-2">
          <View className="flex-row items-center gap-3 pb-4 pt-2">
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
                {teamInfo?.name ?? "Team"}
              </Text>
              {leagueName ? (
                <Text
                  className="text-sm text-white/55"
                >
                  {leagueName}
                </Text>
              ) : null}
            </View>
          </View>

          {teamInfo ? (
            <View className="mb-3 flex-row items-center gap-3">
              <EntityLogo
                logoUrl={teamInfo.logoUrl}
                variant="team"
                size="sm"
                tone="dark"
              />
              <Text
                className="flex-1 text-sm text-white/55"
              >
                Set lineups for fixtures. Roster is view-only.
              </Text>
            </View>
          ) : null}
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="gap-6 pb-12"
          contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
        >
          {teamQuery.isLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : teamQuery.isError || !teamQuery.data ? (
            <ErrorState
              message={
                teamQuery.isError
                  ? messageForResourceLoad(teamQuery.error, "Team")
                  : "Team not found."
              }
              onRetry={() => teamQuery.refetch()}
            />
          ) : !seasonBlock ? (
            <View className="rounded-[22px] border border-dashed border-white/15 bg-white/5 px-5 py-8">
              <Text
                className="text-base text-white"
              >
                No active season
              </Text>
              <Text
                className="pt-2 text-sm leading-6 text-white/55"
              >
                Ask the league admin to activate a season before setting
                lineups.
              </Text>
            </View>
          ) : (
            <>
              <View className="gap-3">
                <Text
                  className="text-xs uppercase tracking-[2px] text-white/45"
                >
                  Fixtures
                </Text>
                {teamGames.length === 0 ? (
                  <View className="rounded-[22px] border border-dashed border-white/15 bg-white/5 px-5 py-8">
                    <Text
                      className="text-base text-white"
                    >
                      No fixtures yet
                    </Text>
                    <Text
                      className="pt-2 text-sm leading-6 text-white/55"
                    >
                      When the league admin schedules games for this team,
                      they will show up here for lineup setup.
                    </Text>
                  </View>
                ) : (
                  teamGames.map((game) => {
                    const opponent = opponentFor(game, teamId);
                    const editable = EDITABLE_STATUSES.includes(game.status);
                    return (
                      <Pressable
                        key={game.id}
                        onPress={() => openLineup(game.id)}
                        className="flex-row items-center gap-3 rounded-[20px] bg-white/6 px-4 py-4 active:bg-white/10"
                      >
                        <View className="flex-1 gap-1">
                          <Text
                            className="text-white"
                          >
                            vs {opponent?.name ?? "TBD"}
                          </Text>
                          <Text
                            className="text-sm text-white/55"
                          >
                            {formatPlayedAtShortDate(game.playedAt)} ·{" "}
                            {formatPlayedAtTime(game.playedAt)}
                            {game.venueName ? ` · ${game.venueName}` : ""}
                          </Text>
                        </View>
                        <View
                          className={[
                            "rounded-full px-2.5 py-1",
                            editable ? "bg-accent-400/20" : "bg-white/10",
                          ].join(" ")}
                        >
                          <Text
                            className={
                              editable
                                ? "text-xs text-accent-300"
                                : "text-xs text-white/55"
                            }
                          >
                            {statusLabel(game.status)}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color="rgba(255,255,255,0.45)"
                        />
                      </Pressable>
                    );
                  })
                )}
              </View>

              <View className="gap-3">
                <Text
                  className="text-xs uppercase tracking-[2px] text-white/45"
                >
                  Squad
                </Text>
                {roster.length === 0 ? (
                  <Text
                    className="text-sm text-white/45"
                  >
                    No players on this team for the season yet.
                  </Text>
                ) : (
                  roster.map((player) => (
                    <View
                      key={player.id}
                      className="flex-row items-center gap-3 rounded-[16px] bg-white/6 px-4 py-3"
                    >
                      <EntityLogo
                        logoUrl={player.avatarUrl}
                        variant="player"
                        size="sm"
                        tone="brand"
                        accessibilityLabel={player.name}
                      />
                      <View className="flex-1">
                        <Text
                          className="text-sm text-white"
                          numberOfLines={1}
                        >
                          {player.name}
                        </Text>
                        <Text
                          className="text-xs text-white/45"
                        >
                          {positionLabel(player.position)}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
