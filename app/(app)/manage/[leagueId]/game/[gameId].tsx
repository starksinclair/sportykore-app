import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import type { ApiGameDetail, ApiStat } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { DetailTabs } from "@/components/ui/detail-tabs";
import { LiveMinute } from "@/components/ui/live-minute";
import { colors } from "@/constants";
import { useLiveMinute } from "@/hooks/useLiveMinute";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import { useMatchDetail } from "@/match";
import { fonts } from "@/theme/fonts";

import {
  useTransmitGameListener,
  type GameSSEPayload,
} from "@/lib/transmit";
import { GameControls } from "@/manage/components/GameControls";
import {
  HybridScoringPanel,
  MatchCenterGoalsTab,
  MatchCenterLineupTab,
  MatchCenterStatsTab,
} from "@/manage/components/hybrid-scoring";
import {
  useAccreditStat,
  useCreateStat,
  useDeleteStat,
  useManageLeagueDetail,
  useSeasonRoster,
  useUpdateGameScore,
} from "@/manage/hooks";
import type { LeagueRosterRow, MatchEventKey } from "@/manage/types";
import { resolveStatTypeId } from "@/manage/utils/games";
import {
  findLatestUnaccreditedGoal,
  partitionGoalStats,
} from "@/manage/utils/stats";

type CenterTab = "score" | "goals" | "stats" | "lineup";

const TABS = [
  { key: "score" as const, label: "Score" },
  { key: "goals" as const, label: "Goals" },
  { key: "stats" as const, label: "Stats" },
  { key: "lineup" as const, label: "Lineup" },
];

export default function ManageMatchCenterPage() {
  const params = useLocalSearchParams<{
    leagueId: string;
    gameId: string;
    seasonId?: string;
  }>();

  const leagueId = Number(params.leagueId);
  const gameId = Number(params.gameId);
  const seasonIdParam = Number(params.seasonId);

  const leagueQuery = useManageLeagueDetail(
    Number.isFinite(leagueId) && leagueId > 0 ? leagueId : 0,
    Number.isFinite(seasonIdParam) && seasonIdParam > 0 ? seasonIdParam : null,
  );

  const seasonId =
    Number.isFinite(seasonIdParam) && seasonIdParam > 0
      ? seasonIdParam
      : (leagueQuery.data?.season.id ?? 0);

  const statTypes = leagueQuery.data?.statTypes ?? [];

  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<CenterTab>("score");
  const [pendingTeam, setPendingTeam] = useState<"home" | "away" | null>(null);
  const [pendingStatId, setPendingStatId] = useState<number | null>(null);
  const [scorerId, setScorerId] = useState<number | null>(null);
  const [assistId, setAssistId] = useState<number | null>(null);
  const [isOwnGoal, setIsOwnGoal] = useState(false);
  const [minute, setMinute] = useState("0");
  const [ssePatch, setSsePatch] = useState<Partial<ApiGameDetail>>({});
  const [statMinute, setStatMinute] = useState("0");
  const [recording, setRecording] = useState<{
    eventKey: MatchEventKey;
    playerId: number;
  } | null>(null);

  const detailQuery = useMatchDetail(gameId, { staleTime: 0 });
  const rosterQuery = useSeasonRoster(leagueId, seasonId);
  const scoreMutation = useUpdateGameScore(gameId, leagueId, seasonId);
  const accreditMutation = useAccreditStat(gameId, leagueId, seasonId);
  const createStatMutation = useCreateStat(leagueId, seasonId);
  const deleteStatMutation = useDeleteStat(leagueId, seasonId);

  const resetAccredit = useCallback(() => {
    setPendingTeam(null);
    setPendingStatId(null);
    setScorerId(null);
    setAssistId(null);
    setIsOwnGoal(false);
  }, []);

  const onGameEvent = useCallback(
    (payload: GameSSEPayload) => {
      switch (payload.type) {
        case "status_changed":
          setSsePatch((prev) => ({
            ...prev,
            status: payload.status,
            firstHalfStartedAt:
              payload.firstHalfStartedAt !== undefined
                ? payload.firstHalfStartedAt
                : prev.firstHalfStartedAt,
            secondHalfStartedAt:
              payload.secondHalfStartedAt !== undefined
                ? payload.secondHalfStartedAt
                : prev.secondHalfStartedAt,
            extraTimeStartedAt:
              payload.extraTimeStartedAt !== undefined
                ? payload.extraTimeStartedAt
                : prev.extraTimeStartedAt,
            pausedAt:
              payload.pausedAt !== undefined ? payload.pausedAt : prev.pausedAt,
            pausedFromStatus:
              payload.pausedFromStatus !== undefined
                ? payload.pausedFromStatus
                : prev.pausedFromStatus,
            homeScore:
              payload.homeScore !== undefined
                ? payload.homeScore
                : prev.homeScore,
            awayScore:
              payload.awayScore !== undefined
                ? payload.awayScore
                : prev.awayScore,
          }));
          break;
        case "score_updated":
          setSsePatch((prev) => ({
            ...prev,
            homeScore: payload.homeScore,
            awayScore: payload.awayScore,
          }));
          break;
        case "stat_accredited":
          void queryClient.invalidateQueries({ queryKey: ["match", gameId] });
          void queryClient.invalidateQueries({
            queryKey: ["manage", "league", leagueId],
          });
          break;
      }
    },
    [gameId, leagueId, queryClient],
  );

  useTransmitGameListener(gameId, onGameEvent);

  const game = useMemo(() => {
    if (!detailQuery.data) return undefined;
    return { ...detailQuery.data, ...ssePatch };
  }, [detailQuery.data, ssePatch]);

  const liveMinute = useLiveMinute(game);
  const homeTeamId = game?.homeTeam?.id;
  const awayTeamId = game?.awayTeam?.id;

  useEffect(() => {
    if (!pendingTeam || pendingStatId != null || !game || homeTeamId == null) {
      return;
    }
    const teamId = pendingTeam === "home" ? homeTeamId : awayTeamId!;
    const stat = findLatestUnaccreditedGoal(game.stats ?? [], teamId);
    if (stat) setPendingStatId(stat.id);
  }, [pendingTeam, pendingStatId, game, homeTeamId, awayTeamId]);

  const goalPartition = useMemo(() => {
    if (homeTeamId == null || awayTeamId == null) {
      return { home: [], away: [], assistsByGoalPlayer: new Map() };
    }
    return partitionGoalStats(game?.stats ?? [], homeTeamId, awayTeamId);
  }, [game?.stats, homeTeamId, awayTeamId]);

  useEffect(() => {
    if (liveMinute > 0) {
      setStatMinute(String(liveMinute));
    }
  }, [liveMinute]);

  if (
    !Number.isFinite(leagueId) ||
    leagueId <= 0 ||
    !Number.isFinite(gameId) ||
    gameId <= 0
  ) {
    return null;
  }

  if (detailQuery.isLoading && !game) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0F0F10]">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!game || homeTeamId == null || awayTeamId == null) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0F0F10] px-6">
        <Text style={{ fontFamily: fonts.body }} className="text-center text-white/70">
          Match not found.
        </Text>
        <Button
          variant="secondary"
          label="Go back"
          onPress={() => router.back()}
          className="mt-4"
        />
      </View>
    );
  }

  const handleIncrement = async (team: "home" | "away") => {
    try {
      const res = await scoreMutation.mutateAsync({ team, action: "increment" });
      setSsePatch((prev) => ({
        ...prev,
        homeScore: res.homeScore ?? prev.homeScore ?? game.homeScore,
        awayScore: res.awayScore ?? prev.awayScore ?? game.awayScore,
      }));
      setPendingTeam(team);
      setMinute(String(liveMinute > 0 ? liveMinute : 0));
      setScorerId(null);
      setAssistId(null);
      setIsOwnGoal(false);
      if (res.statId) {
        setPendingStatId(res.statId);
      } else {
        setPendingStatId(null);
        await detailQuery.refetch();
      }
    } catch (err) {
      showThrownAsToast(err, "Could not update score");
    }
  };

  const handleDecrement = async (team: "home" | "away") => {
    try {
      const res = await scoreMutation.mutateAsync({ team, action: "decrement" });
      setSsePatch((prev) => ({
        ...prev,
        homeScore: res.homeScore ?? prev.homeScore ?? game.homeScore,
        awayScore: res.awayScore ?? prev.awayScore ?? game.awayScore,
      }));
      if (pendingTeam === team) resetAccredit();
      await detailQuery.refetch();
    } catch (err) {
      showThrownAsToast(err, "Could not update score");
    }
  };

  const handleLogGoal = async () => {
    if (!pendingStatId || scorerId == null) return;
    const parsedMinute = Number(minute);
    if (!Number.isFinite(parsedMinute) || parsedMinute < 0) {
      showInfoToast("Invalid minute", "Enter a valid match minute.");
      return;
    }
    try {
      await accreditMutation.mutateAsync({
        statId: pendingStatId,
        payload: {
          playerId: scorerId,
          assistPlayerId: assistId,
          isOwnGoal,
          minute: parsedMinute,
        },
      });
      resetAccredit();
    } catch (err) {
      showThrownAsToast(err, "Could not log goal");
    }
  };

  const handleAccreditFromGoals = (stat: ApiStat, team: "home" | "away") => {
    setActiveTab("score");
    setPendingTeam(team);
    setPendingStatId(stat.id);
    setMinute(String(stat.minute ?? liveMinute));
    setScorerId(null);
    setAssistId(null);
    setIsOwnGoal(false);
  };

  const recordInlineStat = async (
    eventKey: MatchEventKey,
    row: LeagueRosterRow,
  ) => {
    const statTypeId = resolveStatTypeId(statTypes, eventKey);
    if (!statTypeId) {
      showInfoToast("Unknown event", "Stat type not configured on server.");
      return;
    }
    const parsedMinute = Number(statMinute);
    const minute =
      Number.isFinite(parsedMinute) && parsedMinute >= 0
        ? parsedMinute
        : liveMinute > 0
          ? liveMinute
          : undefined;

    setRecording({ eventKey, playerId: row.player.id });
    try {
      await createStatMutation.mutateAsync({
        gameId,
        leagueId,
        seasonId,
        teamId: row.team.id,
        playerId: row.player.id,
        statTypeId,
        minute,
      });
    } catch (err) {
      showThrownAsToast(err, "Could not record event");
    } finally {
      setRecording(null);
    }
  };

  const handleFullTimeComplete = () => {
    setSsePatch({});
    router.back();
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-[#0F0F10]" edges={["top", "bottom"]}>
      <BlackPatternBackground
        baseColor="#0F0F10"
        stripeColor="rgba(230, 168, 23, 0.06)"
      />
      {/* <SafeAreaView className="flex-1" edges={["top", "bottom"]}> */}
        <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className="text-xs uppercase tracking-[2px] text-white/50"
          >
            Live match center
          </Text>
          <View className="w-11" />
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="gap-5 pb-10"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={detailQuery.isFetching} onRefresh={() => void detailQuery.refetch()} />}
        >
          <View className="items-center gap-2 rounded-[28px] border border-white/10 bg-white/5 px-4 py-6">
            <LiveMinute game={game} />
            <View className="w-full flex-row items-center justify-between gap-4">
              <TeamScore
                name={game.homeTeam?.name ?? "Home"}
                score={game.homeScore}
              />
              <Text
                style={{ fontFamily: fonts.displayBold }}
                className="text-2xl text-white/30"
              >
                –
              </Text>
              <TeamScore
                name={game.awayTeam?.name ?? "Away"}
                score={game.awayScore}
                align="right"
              />
            </View>
          </View>

          <GameControls
            game={game}
            leagueId={leagueId}
            seasonId={seasonId}
            onFullTime={handleFullTimeComplete}
          />

          <DetailTabs
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            scrollable
          />

          {activeTab === "score" ? (
            <HybridScoringPanel
              game={game}
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              roster={rosterQuery.data ?? []}
              pendingTeam={pendingTeam}
              scorerId={scorerId}
              assistId={assistId}
              isOwnGoal={isOwnGoal}
              minute={minute}
              scorePending={scoreMutation.isPending}
              accreditPending={accreditMutation.isPending}
              onIncrement={(team) => void handleIncrement(team)}
              onDecrement={(team) => void handleDecrement(team)}
              onSelectScorer={(id) =>
                setScorerId((prev) => (prev === id ? null : id))
              }
              onSelectAssist={(id) =>
                setAssistId((prev) => (prev === id ? null : id))
              }
              onToggleOwnGoal={() => {
                setIsOwnGoal((prev) => !prev);
                setAssistId(null);
              }}
              onMinuteChange={setMinute}
              onLogGoal={() => void handleLogGoal()}
              onSkip={resetAccredit}
            />
          ) : null}

          {activeTab === "goals" ? (
            <MatchCenterGoalsTab
              homeGoals={goalPartition.home}
              awayGoals={goalPartition.away}
              homeTeamName={game.homeTeam?.name ?? "Home"}
              awayTeamName={game.awayTeam?.name ?? "Away"}
              assistsByGoalPlayer={goalPartition.assistsByGoalPlayer}
              onAccredit={handleAccreditFromGoals}
            />
          ) : null}

          {activeTab === "stats" ? (
            <MatchCenterStatsTab
              game={game}
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              roster={rosterQuery.data ?? []}
              statMinute={statMinute}
              onStatMinuteChange={setStatMinute}
              recording={recording}
              onRecordStat={(eventKey, row) => void recordInlineStat(eventKey, row)}
              onDeleteStat={async (statId) => {
                try {
                  await deleteStatMutation.mutateAsync({ statId, gameId });
                } catch (err) {
                  showThrownAsToast(err);
                }
              }}
            />
          ) : null}

          {activeTab === "lineup" ? (
            <MatchCenterLineupTab
              game={game}
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              roster={rosterQuery.data ?? []}
            />
          ) : null}
        </ScrollView>
      {/* </SafeAreaView> */}
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

function TeamScore({
  name,
  score,
  align,
}: {
  name: string;
  score: number | null;
  align?: "right";
}) {
  return (
    <View className={`flex-1 ${align === "right" ? "items-end" : "items-start"}`}>
      <Text
        style={{ fontFamily: fonts.bodySemibold }}
        className="text-sm text-white/70"
        numberOfLines={2}
      >
        {name}
      </Text>
      <Text
        style={{ fontFamily: fonts.displayBold }}
        className="pt-2 text-5xl text-[#E6A817]"
      >
        {score ?? 0}
      </Text>
    </View>
  );
}

