import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";

import type { ApiGameDetail, GameStatus } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { colors } from "@/constants";
import { calculateCurrentMinute } from "@/lib/game-time";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import { useGameLineups } from "@/lineup/hooks";
import type { GameLineup } from "@/lineup/types";
import { useDeleteStat, useRecordSubstitutions } from "@/manage/hooks";
import {
  pairSubstitutionEvents,
  type PairedSubstitution,
} from "@/manage/utils/stats";
import { fonts } from "@/theme/fonts";

const MAX_DRAFT_SUBS = 11;

const LIVE_SUB_STATUSES = new Set<GameStatus>([
  "first_half",
  "half_time",
  "second_half",
  "extra_time",
  "penalty_shootout",
  "paused",
  "live",
]);

type DraftRow = {
  key: string;
  playerOffId: number | null;
  playerOnId: number | null;
  minute: string;
};

type PickerTarget = {
  rowKey: string;
  role: "off" | "on";
};

type Props = {
  game: ApiGameDetail;
  leagueId: number;
  seasonId: number;
  teamId: number;
  enabled: boolean;
};

function isLiveSubStatus(status: GameStatus): boolean {
  return LIVE_SUB_STATUSES.has(status);
}

function newDraftRow(defaultMinute: string): DraftRow {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    playerOffId: null,
    playerOnId: null,
    minute: defaultMinute,
  };
}

function playerLabel(entry: GameLineup | undefined): string {
  if (!entry) return "Select player";
  const name = entry.player?.name ?? "Unknown";
  return entry.jerseyNumber != null ? `#${entry.jerseyNumber} ${name}` : name;
}

export function MatchCenterSubstitutionPanel({
  game,
  leagueId,
  seasonId,
  teamId,
  enabled,
}: Props) {
  const lineupsQuery = useGameLineups(game.id);
  const recordMutation = useRecordSubstitutions(leagueId, seasonId, game.id);
  const deleteMutation = useDeleteStat(leagueId, seasonId);

  const defaultMinute = String(
    Math.max(0, Math.min(130, Math.round(calculateCurrentMinute(game) || 0))),
  );

  const [drafts, setDrafts] = useState<DraftRow[]>(() => [
    newDraftRow(defaultMinute),
  ]);
  const [picker, setPicker] = useState<PickerTarget | null>(null);

  useEffect(() => {
    setDrafts([newDraftRow(defaultMinute)]);
    setPicker(null);
  }, [teamId, game.id]);

  const teamGroup = useMemo(
    () => lineupsQuery.data?.find((g) => g.team.id === teamId),
    [lineupsQuery.data, teamId],
  );

  const starters = teamGroup?.starters ?? [];
  const bench = teamGroup?.substitutes ?? [];

  const recorded = useMemo(() => {
    return pairSubstitutionEvents(game.stats ?? []).filter(
      (pair) => pair.teamId === teamId,
    );
  }, [game.stats, teamId]);

  const takenOffIds = useMemo(() => {
    const ids = new Set<number>();
    for (const row of drafts) {
      if (row.playerOffId != null) ids.add(row.playerOffId);
    }
    return ids;
  }, [drafts]);

  const takenOnIds = useMemo(() => {
    const ids = new Set<number>();
    for (const row of drafts) {
      if (row.playerOnId != null) ids.add(row.playerOnId);
    }
    return ids;
  }, [drafts]);

  const pickerOptions = useMemo(() => {
    if (!picker) return [];
    const pool = picker.role === "off" ? starters : bench;
    const taken = picker.role === "off" ? takenOffIds : takenOnIds;
    const current = drafts.find((d) => d.key === picker.rowKey);
    const currentId =
      picker.role === "off" ? current?.playerOffId : current?.playerOnId;
    return pool.filter(
      (entry) => entry.playerId === currentId || !taken.has(entry.playerId),
    );
  }, [picker, starters, bench, takenOffIds, takenOnIds, drafts]);

  const canDraft = enabled && isLiveSubStatus(game.status);
  const isBusy = recordMutation.isPending || deleteMutation.isPending;

  const updateDraft = (key: string, patch: Partial<DraftRow>) => {
    setDrafts((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  };

  const handleAddRow = () => {
    if (drafts.length >= MAX_DRAFT_SUBS) {
      showInfoToast("Limit reached", "You can record up to 11 substitutions at once.");
      return;
    }
    setDrafts((prev) => [...prev, newDraftRow(defaultMinute)]);
  };

  const handleSave = async () => {
    const incomplete = drafts.some(
      (row) =>
        row.playerOffId == null ||
        row.playerOnId == null ||
        row.minute.trim().length === 0,
    );
    if (incomplete || drafts.length === 0) {
      showInfoToast(
        "Incomplete",
        "Pick a player off, a player on, and a minute for each swap.",
      );
      return;
    }

    const substitutions = [];
    for (const row of drafts) {
      const minute = Number(row.minute);
      if (!Number.isFinite(minute) || minute < 0 || minute > 130) {
        showInfoToast("Invalid minute", "Minute must be between 0 and 130.");
        return;
      }
      substitutions.push({
        playerOffId: row.playerOffId as number,
        playerOnId: row.playerOnId as number,
        minute,
      });
    }

    try {
      await recordMutation.mutateAsync({
        gameId: game.id,
        leagueId,
        seasonId,
        teamId,
        substitutions,
      });
      setDrafts([newDraftRow(defaultMinute)]);
    } catch {
      // Toast handled by mutation.
    }
  };

  const handleDeletePair = (pair: PairedSubstitution) => {
    const offName = pair.playerOff?.name ?? "Player off";
    const onName = pair.playerOn?.name ?? "Player on";
    Alert.alert(
      "Remove substitution",
      `Delete ${offName} → ${onName}? You can record it again if this was a mistake.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({
                statId: pair.off.id,
                gameId: game.id,
              });
              await deleteMutation.mutateAsync({
                statId: pair.on.id,
                gameId: game.id,
              });
            } catch (err) {
              showThrownAsToast(err, "Could not delete substitution");
            }
          },
        },
      ],
    );
  };

  const hasLineup = starters.length > 0;

  return (
    <View className="gap-4 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
      <View className="gap-1">
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-xs uppercase tracking-[2px] text-white/55"
        >
          Substitutions
        </Text>
       
      </View>

      {canDraft ? (
        <View className="gap-3">
          {!hasLineup && !lineupsQuery.isLoading ? (
            <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
              Set this team’s lineup before recording substitutions.
            </Text>
          ) : null}

          {lineupsQuery.isLoading ? (
            <View className="items-center py-3">
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : null}

          {hasLineup
            ? drafts.map((row, index) => {
                const off = starters.find((s) => s.playerId === row.playerOffId);
                const on = bench.find((s) => s.playerId === row.playerOnId);
                return (
                  <View
                    key={row.key}
                    className="gap-3 rounded-xl border border-white/10 bg-white/6 px-3 py-3"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        style={{ fontFamily: fonts.bodyBold }}
                        className="text-sm text-white"
                      >
                        Swap {index + 1}
                      </Text>
                      {drafts.length > 1 ? (
                        <Pressable
                          onPress={() =>
                            setDrafts((prev) => prev.filter((d) => d.key !== row.key))
                          }
                          hitSlop={8}
                          accessibilityLabel={`Remove swap ${index + 1}`}
                          className="h-8 w-8 items-center justify-center rounded-lg bg-white/10"
                        >
                          <Ionicons name="trash-outline" size={16} color="#fca5a5" />
                        </Pressable>
                      ) : null}
                    </View>

                    <Pressable
                      onPress={() => setPicker({ rowKey: row.key, role: "off" })}
                      className="rounded-xl bg-white/8 px-3 py-3 active:bg-white/12"
                    >
                      <Text
                        style={{ fontFamily: fonts.body }}
                        className="text-[11px] uppercase text-white/45"
                      >
                        Player off (starter)
                      </Text>
                      <Text
                        style={{ fontFamily: fonts.bodySemibold }}
                        className="pt-1 text-sm text-white"
                      >
                        {playerLabel(off)}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setPicker({ rowKey: row.key, role: "on" })}
                      className="rounded-xl bg-white/8 px-3 py-3 active:bg-white/12"
                    >
                      <Text
                        style={{ fontFamily: fonts.body }}
                        className="text-[11px] uppercase text-white/45"
                      >
                        Player on (bench)
                      </Text>
                      <Text
                        style={{ fontFamily: fonts.bodySemibold }}
                        className="pt-1 text-sm text-white"
                      >
                        {playerLabel(on)}
                      </Text>
                    </Pressable>

                    <View className="w-28">
                      <AuthTextField
                        label="Minute"
                        value={row.minute}
                        onChangeText={(value) =>
                          updateDraft(row.key, { minute: value })
                        }
                        keyboardType="number-pad"
                        placeholder="0"
                      />
                    </View>
                  </View>
                );
              })
            : null}

          {hasLineup ? (
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button
                  variant="ghost"
                  label="Add substitution"
                  onPress={handleAddRow}
                  disabled={isBusy || drafts.length >= MAX_DRAFT_SUBS}
                  className="h-11 border border-white/15"
                />
              </View>
              <View className="flex-1">
                <Button
                  variant="authPurple"
                  label="Save"
                  onPress={() => void handleSave()}
                  loading={recordMutation.isPending}
                  disabled={isBusy}
                  className="h-11"
                />
              </View>
            </View>
          ) : null}
        </View>
      ) : (
        <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
          Substitutions can be recorded while the match is live.
        </Text>
      )}

      <View className="gap-2 border-t border-white/10 pt-4">
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-[11px] uppercase tracking-wider text-white/45"
        >
          Recorded
        </Text>
        {recorded.length === 0 ? (
          <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
            No substitutions recorded for this team yet.
          </Text>
        ) : (
          recorded.map((pair) => {
            const offName = pair.playerOff?.name ?? "Unknown";
            const onName = pair.playerOn?.name ?? "Unknown";
            const minuteLabel =
              pair.minute != null ? `${pair.minute}'` : "-";
            return (
              <View
                key={`${pair.off.id}-${pair.on.id}`}
                className="flex-row items-center gap-3 rounded-xl bg-white/6 px-3 py-3"
              >
                <View className="flex-1">
                  <Text
                    style={{ fontFamily: fonts.bodySemibold }}
                    className="text-sm text-white"
                  >
                    {offName} → {onName}
                  </Text>
                  <Text
                    style={{ fontFamily: fonts.body }}
                    className="text-xs text-white/45"
                  >
                    {minuteLabel}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDeletePair(pair)}
                  disabled={isBusy}
                  accessibilityLabel={`Delete substitution ${offName} for ${onName}`}
                  className="h-10 w-10 items-center justify-center rounded-xl bg-white/10 active:bg-white/15"
                >
                  <Ionicons name="trash-outline" size={18} color="#fca5a5" />
                </Pressable>
              </View>
            );
          })
        )}
      </View>

      <BottomSheetModal
        visible={picker != null}
        onClose={() => setPicker(null)}
        title={picker?.role === "off" ? "Player off" : "Player on"}
        subtitle={
          picker?.role === "off"
            ? "Choose a starter leaving the pitch."
            : "Choose a bench player coming on."
        }
        variant="dark"
      >
        <View className="gap-2 pb-4">
          {pickerOptions.length === 0 ? (
            <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
              No available players.
            </Text>
          ) : (
            pickerOptions.map((entry) => (
              <Pressable
                key={entry.id}
                onPress={() => {
                  if (!picker) return;
                  updateDraft(
                    picker.rowKey,
                    picker.role === "off"
                      ? { playerOffId: entry.playerId }
                      : { playerOnId: entry.playerId },
                  );
                  setPicker(null);
                }}
                className="rounded-xl bg-white/8 px-4 py-3 active:bg-white/12"
              >
                <Text
                  style={{ fontFamily: fonts.bodySemibold }}
                  className="text-sm text-white"
                >
                  {playerLabel(entry)}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </BottomSheetModal>
    </View>
  );
}
