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
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import type { ApiGameDetail, ApiPlayerAward, ApiStat, GameStatus } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { DetailTabs } from "@/components/ui/detail-tabs";
import { LiveMinute } from "@/components/ui/live-minute";
import { colors } from "@/constants";
import { useLiveMinute } from "@/hooks/useLiveMinute";
import {
  messageForResourceLoad,
  showInfoToast,
  showThrownAsToast,
} from "@/lib/show-error-toast";
import { useMatchDetail } from "@/match";

import { useStageBracket } from "@/knockout";
import {
  useTransmitGameListener,
  type GameSSEPayload,
} from "@/lib/transmit";
import { GameControls } from "@/manage/components/GameControls";
import { MatchSeriesHeader } from "@/manage/components/MatchSeriesHeader";
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
  const insets = useSafeAreaInsets();
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
  const [isPenalty, setIsPenalty] = useState(false);
  const [minute, setMinute] = useState("1");
  const [ssePatch, setSsePatch] = useState<Partial<ApiGameDetail>>({});
  const [statMinute, setStatMinute] = useState("0");
  const [flowGuideOpen, setFlowGuideOpen] = useState(false);
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
    setIsPenalty(false);
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
        case "tracking_updated":
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

  const stageId = game?.stageId ?? 0;
  const bracketQuery = useStageBracket(stageId);
  const seriesTie = useMemo(() => {
    const tieId = game?.tieId;
    if (tieId == null) return null;
    return bracketQuery.data?.ties.find((t) => t.id === tieId) ?? null;
  }, [bracketQuery.data?.ties, game?.tieId]);

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
        <Text className="text-center text-white/70">
          {detailQuery.isError
            ? messageForResourceLoad(detailQuery.error, "Match")
            : "Match not found."}
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

  const applyOptimisticScore = (
    team: "home" | "away",
    action: "increment" | "decrement",
  ) => {
    const previous = {
      homeScore: game.homeScore ?? 0,
      awayScore: game.awayScore ?? 0,
    };
    const next = { ...previous };

    if (team === "home") {
      next.homeScore =
        action === "increment"
          ? previous.homeScore + 1
          : Math.max(0, previous.homeScore - 1);
    } else {
      next.awayScore =
        action === "increment"
          ? previous.awayScore + 1
          : Math.max(0, previous.awayScore - 1);
    }

    setSsePatch((prev) => ({ ...prev, ...next }));
    return previous;
  };

  const restoreScore = (score: { homeScore: number; awayScore: number }) => {
    setSsePatch((prev) => ({ ...prev, ...score }));
  };

  const handleIncrement = async (team: "home" | "away") => {
    const previousScore = applyOptimisticScore(team, "increment");
    try {
      const res = await scoreMutation.mutateAsync({ team, action: "increment" });
      setSsePatch((prev) => ({
        ...prev,
        homeScore: res.homeScore ?? prev.homeScore ?? game.homeScore,
        awayScore: res.awayScore ?? prev.awayScore ?? game.awayScore,
      }));
      setPendingTeam(team);
      setMinute(String(Math.max(1, liveMinute)));
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
      restoreScore(previousScore);
      resetAccredit();
      showThrownAsToast(err, "Could not update score");
    }
  };

  const handleDecrement = async (team: "home" | "away") => {
    const previousScore = applyOptimisticScore(team, "decrement");
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
      restoreScore(previousScore);
      showThrownAsToast(err, "Could not update score");
    }
  };

  const handleLogGoal = async () => {
    if (!pendingStatId || scorerId == null) return;
    const parsedMinute = Number(minute);
    if (!Number.isFinite(parsedMinute) || parsedMinute < 1) {
      showInfoToast("Invalid minute", "Enter a match minute of 1 or later.");
      return;
    }
    try {
      await accreditMutation.mutateAsync({
        statId: pendingStatId,
        payload: {
          playerId: scorerId,
          assistPlayerId: assistId,
          isOwnGoal,
          isPenalty,
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
    setMinute(String(Math.max(1, stat.minute ?? liveMinute)));
    setScorerId(null);
    setAssistId(null);
    setIsOwnGoal(false);
    setIsPenalty(false);
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

  const handleMotmSaved = (award: ApiPlayerAward) => {
    setSsePatch((prev) => ({ ...prev, awards: [award] }));
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
            className="text-xs uppercase tracking-[2px] text-white/50"
          >
            Live match center
          </Text>
          <View className="w-11" />
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="gap-5 pb-10"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 90 
          }}
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
            {game.homePenaltyScore != null && game.awayPenaltyScore != null ? (
              <Text
                className="text-sm text-accent-200"
              >
                Pens {game.homePenaltyScore}–{game.awayPenaltyScore}
              </Text>
            ) : game.status === "penalty_shootout" ? (
              <Text
                className="text-sm text-accent-200"
              >
                Penalty shootout
              </Text>
            ) : null}
          </View>

          <MatchSeriesHeader game={game} tie={seriesTie} />

          <MatchDayFlowGuide
            game={game}
            expanded={flowGuideOpen}
            onToggle={() => setFlowGuideOpen((prev) => !prev)}
          />

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
              leagueId={leagueId}
              seasonId={seasonId}
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              roster={rosterQuery.data ?? []}
              liveMinute={liveMinute}
              pendingTeam={pendingTeam}
              scorerId={scorerId}
              assistId={assistId}
              isOwnGoal={isOwnGoal}
              isPenalty={isPenalty}
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
              onTogglePenalty={() => setIsPenalty((prev) => !prev)}
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
              leagueId={leagueId}
              seasonId={seasonId}
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              roster={rosterQuery.data ?? []}
              onMotmSaved={handleMotmSaved}
            />
          ) : null}
        </ScrollView>
      {/* </SafeAreaView> */}
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

type MatchFlowStep = {
  key: string;
  title: string;
  helper: string;
  statuses: GameStatus[];
};

const MATCH_FLOW_STEPS: MatchFlowStep[] = [
  {
    key: "setup",
    title: "Lineups",
    helper: "Set squads before kickoff.",
    statuses: ["scheduled", "postponed"],
  },
  {
    key: "firstHalf",
    title: "First half",
    helper: "Start the clock and record events.",
    statuses: ["first_half", "live"],
  },
  {
    key: "halfTime",
    title: "Half time",
    helper: "Pause before the second half.",
    statuses: ["half_time", "break"],
  },
  {
    key: "secondHalf",
    title: "Second half",
    helper: "Finish normal time or choose a decider.",
    statuses: ["second_half", "extra_time", "penalty_shootout", "paused"],
  },
  {
    key: "finished",
    title: "End game",
    helper: "Save the final result.",
    statuses: ["full_time", "completed", "cancelled"],
  },
];

const matchStatusGuidance: Partial<
  Record<GameStatus, { title: string; detail: string }>
> = {
  scheduled: {
    title: "Next: start first half",
    detail: "Lineups can still be set, then start the match clock from Match clock.",
  },
  postponed: {
    title: "Next: start first half",
    detail: "Use this once the match is ready to be played.",
  },
  first_half: {
    title: "Now: first half is live",
    detail: "Use Score for goals and Stats for cards, saves, fouls, and substitutions.",
  },
  live: {
    title: "Now: first half is live",
    detail: "Use Score for goals and Stats for cards, saves, fouls, and substitutions.",
  },
  half_time: {
    title: "Next: start second half",
    detail: "The clock is stopped until you start the second half.",
  },
  break: {
    title: "Next: start second half",
    detail: "The clock is stopped until you start the second half.",
  },
  second_half: {
    title: "Next: end game or choose a decider",
    detail: "End the game for a final result, or move to extra time or penalties when rules require it.",
  },
  extra_time: {
    title: "Now: extra time is live",
    detail: "Keep recording events, then end the game or move to penalties.",
  },
  penalty_shootout: {
    title: "Next: enter penalty scores",
    detail: "Confirm unequal penalty scores so SportyKore can close the match with a winner.",
  },
  paused: {
    title: "Next: resume match",
    detail: "Resume returns the game to the period it was in before the pause.",
  },
  full_time: {
    title: "Match finished",
    detail: "The final score is saved and the match is read-only for lineup changes.",
  },
  completed: {
    title: "Match finished",
    detail: "The final score is saved and the match is read-only for lineup changes.",
  },
  cancelled: {
    title: "Match cancelled",
    detail: "This match is closed and no live actions are available.",
  },
};

function flowStatusForGame(game: ApiGameDetail): GameStatus {
  if (game.status !== "paused") return game.status;
  if (game.pausedFromStatus === "first_half" || game.pausedFromStatus === "live") {
    return "first_half";
  }
  if (game.pausedFromStatus === "extra_time") return "extra_time";
  if (game.pausedFromStatus === "penalty_shootout") return "penalty_shootout";
  return "second_half";
}

function MatchDayFlowGuide({
  game,
  expanded,
  onToggle,
}: {
  game: ApiGameDetail;
  expanded: boolean;
  onToggle: () => void;
}) {
  const status = game.status;
  const flowStatus = flowStatusForGame(game);
  const activeIndex = Math.max(
    0,
    MATCH_FLOW_STEPS.findIndex((step) => step.statuses.includes(flowStatus)),
  );
  const guidance =
    matchStatusGuidance[status] ??
    matchStatusGuidance.scheduled!;

  return (
    <View className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04]">
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={expanded ? "Hide match day flow" : "Show match day flow"}
        className="flex-row items-start gap-3 px-4 py-4 active:bg-white/5"
      >
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-accent-500/15">
          <Ionicons name="map-outline" size={19} color={colors.accent} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-white">
            Match day flow
          </Text>
          <Text className="pt-1 text-xs leading-5 text-white/50">
            {guidance.title}
          </Text>
        </View>
        {status === "paused" ? (
          <View className="rounded-full bg-white/10 px-2.5 py-1">
            <Text className="text-[10px] uppercase text-white/60">
              Paused
            </Text>
          </View>
        ) : null}
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="rgba(255,255,255,0.65)"
        />
      </Pressable>

      {expanded ? (
        <View className="gap-4 border-t border-white/10 px-4 pb-4 pt-4">
          <View className="gap-2">
            {MATCH_FLOW_STEPS.map((step, index) => {
              const isActive = index === activeIndex;
              const isDone = index < activeIndex;
              return (
                <View
                  key={step.key}
                  className={`flex-row items-center gap-3 rounded-2xl border px-3 py-3 ${
                    isActive
                      ? "border-accent-400/60 bg-accent-500/15"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <View
                    className={`h-8 w-8 items-center justify-center rounded-full ${
                      isActive
                        ? "bg-accent-500"
                        : isDone
                          ? "bg-brand-500"
                          : "bg-white/10"
                    }`}
                  >
                    <Ionicons
                      name={isDone ? "checkmark" : isActive ? "ellipse" : "ellipse-outline"}
                      size={15}
                      color={isActive ? colors.darkLabel : colors.white}
                    />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text
                      className={isActive ? "text-sm text-accent-100" : "text-sm text-white"}
                      numberOfLines={1}
                    >
                      {step.title}
                    </Text>
                    <Text
                      className="pt-0.5 text-xs leading-5 text-white/50"
                      numberOfLines={2}
                    >
                      {step.helper}
                    </Text>
                  </View>
                  {isActive ? (
                    <View className="rounded-full bg-accent-500 px-2.5 py-1">
                      <Text className="text-[10px] uppercase text-neutral-950">
                        Now
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          <View className="rounded-2xl border border-accent-400/20 bg-accent-500/10 px-3 py-3">
            <Text className="text-sm leading-6 text-accent-100">
              {guidance.detail}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
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
        className="text-sm text-white/70"
        numberOfLines={2}
      >
        {name}
      </Text>
      <Text
        className="pt-2 text-5xl text-[#E6A817]"
      >
        {score ?? 0}
      </Text>
    </View>
  );
}
