import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { ApiStat, ApiStatType } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { colors } from "@/constants";
import { phaseLabel } from "@/lib/general-utils";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import { iconForStatType } from "@/lib/stat-types";
import { useMatchDetail } from "@/match";
import { fonts } from "@/theme/fonts";

import {
  useCreateStat,
  useDeleteStat,
  useSeasonRoster,
  useUpdateGame,
} from "../hooks";
import type { LeagueRosterRow, MatchEventKey } from "../types";
import { MatchEventStatName } from "../types";
import {
  applyScoreDelta,
  resolveStatTypeId,
  scoresAffectingStat,
} from "../utils/games";

type Mode = "auto" | "manual";

const EVENT_KEYS: MatchEventKey[] = [
  "Goal",
  "OwnGoal",
  "Assist",
  "Yellow",
  "Red",
];

type Props = {
  leagueId: number;
  seasonId: number;
  gameId: number;
  statTypes: ApiStatType[];
};

export function ManageMatchCenterScreen({
  leagueId,
  seasonId,
  gameId,
  statTypes,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("auto");
  const [pendingEvent, setPendingEvent] = useState<MatchEventKey | null>(null);
  const [pendingTeamId, setPendingTeamId] = useState<number | null>(null);
  const [assistPickerOpen, setAssistPickerOpen] = useState(false);
  const [goalContext, setGoalContext] = useState<{
    playerId: number;
    teamId: number;
    statTypeId: number;
    slug: string;
  } | null>(null);

  const detailQuery = useMatchDetail(gameId, {
    refetchInterval: (data) =>
      data?.status === "live" || data?.status === "break" ? 5_000 : false,
    staleTime: 0,
  });

  const rosterQuery = useSeasonRoster(leagueId, seasonId);
  const updateGameMutation = useUpdateGame(leagueId, seasonId);
  const createStatMutation = useCreateStat(leagueId, seasonId);
  const deleteStatMutation = useDeleteStat(leagueId, seasonId);

  const game = detailQuery.data;
  const homeTeamId = game?.homeTeam?.id;
  const awayTeamId = game?.awayTeam?.id;

  const sortedStats = useMemo(() => {
    const stats = game?.stats ?? [];
    return [...stats].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }, [game?.stats]);

  const rosterForTeam = useMemo(() => {
    if (!pendingTeamId) return [];
    return (rosterQuery.data ?? []).filter(
      (row) => row.team.id === pendingTeamId && row.status === "active",
    );
  }, [rosterQuery.data, pendingTeamId]);

  const assistRoster = useMemo(() => {
    if (!goalContext) return [];
    return (rosterQuery.data ?? []).filter(
      (row) =>
        row.team.id === goalContext.teamId &&
        row.status === "active" &&
        row.player.id !== goalContext.playerId,
    );
  }, [rosterQuery.data, goalContext]);

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

  const isLive = game.status === "live" || game.status === "break";

  const adjustScore = async (side: "home" | "away", delta: number) => {
    const home = game.homeScore ?? 0;
    const away = game.awayScore ?? 0;
    const next =
      side === "home"
        ? { homeScore: Math.max(0, home + delta), awayScore: away }
        : { homeScore: home, awayScore: Math.max(0, away + delta) };
    try {
      await updateGameMutation.mutateAsync({ gameId, payload: next });
    } catch (err) {
      showThrownAsToast(err, "Could not update score");
    }
  };

  const recordStat = async (
    eventKey: MatchEventKey,
    playerId: number,
    teamId: number,
    relatedPlayerId?: number,
  ) => {
    const statTypeId = resolveStatTypeId(statTypes, eventKey);
    if (!statTypeId) {
      showInfoToast("Unknown event", "Stat type not configured on server.");
      return;
    }
    const slug = MatchEventStatName[eventKey];
    try {
      await createStatMutation.mutateAsync({
        gameId,
        leagueId,
        seasonId,
        teamId,
        playerId,
        statTypeId,
        relatedPlayerId,
        minute: game.currentMinute > 0 ? game.currentMinute : undefined,
      });

      if (scoresAffectingStat(slug)) {
        const next = applyScoreDelta(
          game.homeScore,
          game.awayScore,
          teamId,
          homeTeamId,
          awayTeamId,
          slug,
        );
        await updateGameMutation.mutateAsync({ gameId, payload: next });
      }

      setPendingEvent(null);
      setPendingTeamId(null);
      setGoalContext(null);
      setAssistPickerOpen(false);
      await detailQuery.refetch();
    } catch (err) {
      showThrownAsToast(err, "Could not record event");
    }
  };

  const onPickSideForEvent = (eventKey: MatchEventKey) => {
    setPendingEvent(eventKey);
    setAssistPickerOpen(true);
  };

  const onPickTeam = (teamId: number) => {
    setPendingTeamId(teamId);
  };

  const onPickPlayer = async (row: LeagueRosterRow) => {
    if (!pendingEvent) return;
    const slug = MatchEventStatName[pendingEvent];

    if (pendingEvent === "Goal") {
      const statTypeId = resolveStatTypeId(statTypes, "Goal");
      if (!statTypeId) return;
      setGoalContext({
        playerId: row.player.id,
        teamId: row.team.id,
        statTypeId,
        slug,
      });
      setAssistPickerOpen(true);
      setPendingTeamId(null);
      return;
    }

    await recordStat(pendingEvent, row.player.id, row.team.id);
  };

  const onSkipAssist = async () => {
    if (!goalContext) return;
    await recordStat("Goal", goalContext.playerId, goalContext.teamId);
  };

  const onPickAssist = async (row: LeagueRosterRow) => {
    if (!goalContext) return;
    await recordStat("Goal", goalContext.playerId, goalContext.teamId, row.player.id);
  };

  const handleEndMatch = () => {
    Alert.alert("End match", "Mark this game as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End match",
        onPress: async () => {
          try {
            await updateGameMutation.mutateAsync({
              gameId,
              payload: { status: "completed" },
            });
            router.back();
          } catch (err) {
            showThrownAsToast(err);
          }
        },
      },
    ]);
  };

  const handleUndoLast = async () => {
    const last = sortedStats[0];
    if (!last) {
      showInfoToast("Nothing to undo", "No events recorded yet.");
      return;
    }
    Alert.alert("Undo last event", "Delete the most recent stat?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Undo",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteStatMutation.mutateAsync({ statId: last.id, gameId });
            await detailQuery.refetch();
          } catch (err) {
            showThrownAsToast(err);
          }
        },
      },
    ]);
  };

  const pickerTitle = goalContext
    ? "Assist (optional)"
    : pendingTeamId
      ? "Pick player"
      : pendingEvent
        ? `Pick side — ${pendingEvent}`
        : "Pick side";

  const pickerSubtitle = goalContext
    ? "Select assisting player or skip"
    : pendingTeamId
      ? "Active roster only"
      : "Home or away";

  const showTeamPicker = assistPickerOpen && pendingEvent && !pendingTeamId && !goalContext;
  const showPlayerPicker = assistPickerOpen && pendingTeamId != null && !goalContext;
  const showAssistPicker = assistPickerOpen && goalContext != null;

  return (
    <View className="flex-1 bg-[#0F0F10]">
      <BlackPatternBackground
        baseColor="#0F0F10"
        stripeColor="rgba(230, 168, 23, 0.06)"
      />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="px-5 pb-2 pt-1">
          <View className="mx-auto w-full max-w-[760px] flex-row items-center justify-between">
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
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <View className="mx-auto w-full max-w-[760px] gap-5">
            <View className="items-center gap-2 rounded-[28px] border border-white/10 bg-white/5 px-4 py-6">
              <Text
                style={{ fontFamily: fonts.body }}
                className="text-xs uppercase tracking-wide text-white/45"
              >
                {phaseLabel(game.status, game.currentMinute)}
              </Text>
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

            <View className="flex-row rounded-full bg-white/10 p-1">
              {(["auto", "manual"] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  className={`flex-1 rounded-full py-2.5 ${
                    mode === m ? "bg-brand-500" : ""
                  }`}
                >
                  <Text
                    style={{ fontFamily: fonts.bodySemibold }}
                    className={`text-center text-sm capitalize ${
                      mode === m ? "text-white" : "text-white/55"
                    }`}
                  >
                    {m}
                  </Text>
                </Pressable>
              ))}
            </View>

            {mode === "manual" ? (
              <View className="gap-4 rounded-[24px] bg-white/6 px-4 py-4">
                <Text
                  style={{ fontFamily: fonts.bodyBold }}
                  className="text-sm text-white"
                >
                  Manual score
                </Text>
                <View className="flex-row justify-between gap-6">
                  <ManualSide
                    label={game.homeTeam?.name ?? "Home"}
                    onMinus={() => void adjustScore("home", -1)}
                    onPlus={() => void adjustScore("home", 1)}
                  />
                  <ManualSide
                    label={game.awayTeam?.name ?? "Away"}
                    onMinus={() => void adjustScore("away", -1)}
                    onPlus={() => void adjustScore("away", 1)}
                  />
                </View>
              </View>
            ) : (
              <View className="gap-3">
                <Text
                  style={{ fontFamily: fonts.bodyBold }}
                  className="text-xs uppercase tracking-wide text-white/45"
                >
                  Record event
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {EVENT_KEYS.map((key) => (
                    <Pressable
                      key={key}
                      onPress={() => onPickSideForEvent(key)}
                      className="rounded-xl bg-white/10 px-4 py-3 active:bg-white/15"
                    >
                      <Text
                        style={{ fontFamily: fonts.bodySemibold }}
                        className="text-sm text-white"
                      >
                        {key === "OwnGoal" ? "Own goal" : key}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text
                  style={{ fontFamily: fonts.bodyBold }}
                  className="text-xs uppercase tracking-wide text-white/45"
                >
                  Recent events
                </Text>
                <Pressable onPress={() => void handleUndoLast()}>
                  <Text
                    style={{ fontFamily: fonts.bodySemibold }}
                    className="text-xs text-accent-400"
                  >
                    Undo last
                  </Text>
                </Pressable>
              </View>
              {sortedStats.length === 0 ? (
                <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
                  No events yet.
                </Text>
              ) : (
                sortedStats.map((stat) => (
                  <StatRow
                    key={stat.id}
                    stat={stat}
                    onDelete={() => {
                      Alert.alert("Delete event", "Remove this stat?", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: async () => {
                            try {
                              await deleteStatMutation.mutateAsync({
                                statId: stat.id,
                                gameId,
                              });
                              await detailQuery.refetch();
                            } catch (err) {
                              showThrownAsToast(err);
                            }
                          },
                        },
                      ]);
                    }}
                  />
                ))
              )}
            </View>

            {isLive ? (
              <Button
                variant="secondary"
                label="End match"
                onPress={handleEndMatch}
                loading={updateGameMutation.isPending}
              />
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomSheetModal
        visible={assistPickerOpen}
        onClose={() => {
          setAssistPickerOpen(false);
          setPendingEvent(null);
          setPendingTeamId(null);
          setGoalContext(null);
        }}
        title={pickerTitle}
        subtitle={pickerSubtitle}
      >
        {showTeamPicker ? (
          <View className="gap-2">
            <PickerButton
              label={game.homeTeam?.name ?? "Home"}
              onPress={() => onPickTeam(homeTeamId)}
            />
            <PickerButton
              label={game.awayTeam?.name ?? "Away"}
              onPress={() => onPickTeam(awayTeamId)}
            />
          </View>
        ) : null}

        {showPlayerPicker ? (
          <View className="gap-2">
            {rosterForTeam.length === 0 ? (
              <Text style={{ fontFamily: fonts.body }} className="text-sm text-slate-600">
                No active players on this team for the season.
              </Text>
            ) : (
              rosterForTeam.map((row) => (
                <PickerButton
                  key={row.id}
                  label={row.player.name}
                  sub={row.jerseyNumber ? `#${row.jerseyNumber}` : undefined}
                  onPress={() => void onPickPlayer(row)}
                />
              ))
            )}
          </View>
        ) : null}

        {showAssistPicker ? (
          <View className="gap-2">
            <Button variant="ghost" label="No assist" onPress={() => void onSkipAssist()} />
            {assistRoster.map((row) => (
              <PickerButton
                key={row.id}
                label={row.player.name}
                onPress={() => void onPickAssist(row)}
              />
            ))}
          </View>
        ) : null}
      </BottomSheetModal>
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

function ManualSide({
  label,
  onMinus,
  onPlus,
}: {
  label: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View className="flex-1 items-center gap-2">
      <Text
        style={{ fontFamily: fonts.bodySemibold }}
        className="text-center text-sm text-white"
        numberOfLines={2}
      >
        {label}
      </Text>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={onMinus}
          className="h-12 w-12 items-center justify-center rounded-full bg-white/10"
        >
          <Ionicons name="remove" size={24} color="#fff" />
        </Pressable>
        <Pressable
          onPress={onPlus}
          className="h-12 w-12 items-center justify-center rounded-full bg-[#E6A817]"
        >
          <Ionicons name="add" size={24} color="#1a1a1a" />
        </Pressable>
      </View>
    </View>
  );
}

function StatRow({ stat, onDelete }: { stat: ApiStat; onDelete: () => void }) {
  const icon = stat.type ? iconForStatType(stat.type) : "stats-chart-outline";
  const minute =
    stat.minute != null
      ? `${stat.minute}${stat.isStoppageTime ? "+" : ""}'`
      : "";

  return (
    <Pressable
      onLongPress={onDelete}
      className="flex-row items-center gap-3 rounded-2xl bg-white/6 px-3 py-3"
    >
      <Ionicons name={icon} size={20} color={colors.accent} />
      <View className="flex-1">
        <Text style={{ fontFamily: fonts.bodySemibold }} className="text-sm text-white">
          {stat.type?.displayName ?? "Event"} — {stat.player?.name ?? "Player"}
        </Text>
        <Text style={{ fontFamily: fonts.body }} className="text-xs text-white/45">
          {stat.team?.name}
          {stat.relatedPlayer ? ` · Assist: ${stat.relatedPlayer.name}` : ""}
          {minute ? ` · ${minute}` : ""}
        </Text>
      </View>
    </Pressable>
  );
}

function PickerButton({
  label,
  sub,
  onPress,
}: {
  label: string;
  sub?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
    >
      <Text style={{ fontFamily: fonts.bodySemibold }} className="text-slate-900">
        {label}
      </Text>
      {sub ? (
        <Text style={{ fontFamily: fonts.body }} className="text-slate-500">
          {sub}
        </Text>
      ) : null}
    </Pressable>
  );
}
