import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import type { ApiGameDetail, GameStatus } from "@/api/entities";
import { useTheme } from "@/color/use-theme";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { calculateCurrentMinute } from "@/lib/game-time";
import { posthog } from "@/lib/posthog";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import { useGameLineups } from "@/lineup/hooks";
import type { GameLineup } from "@/lineup/types";
import { useDeleteStat, useRecordSubstitutions } from "@/manage/hooks";
import {
  pairSubstitutionEvents,
  type PairedSubstitution,
} from "@/manage/utils/stats";

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
  const theme = useTheme();
  const lineupsQuery = useGameLineups(game.id);
  const recordMutation = useRecordSubstitutions(leagueId, seasonId, game.id);
  const deleteMutation = useDeleteStat(leagueId, seasonId);

  const defaultMinute = String(
    Math.max(0, Math.min(130, Math.round(calculateCurrentMinute(game) || 0))),
  );

  const [drafts, setDrafts] = useState<DraftRow[]>(() => [
    newDraftRow(defaultMinute),
  ]);

  useEffect(() => {
    setDrafts([newDraftRow(defaultMinute)]);
  }, [defaultMinute, teamId, game.id]);

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

  const optionsForDraft = (
    row: DraftRow,
    role: "off" | "on",
  ): GameLineup[] => {
    const pool = role === "off" ? starters : bench;
    const taken = role === "off" ? takenOffIds : takenOnIds;
    const currentId = role === "off" ? row.playerOffId : row.playerOnId;
    return pool.filter(
      (entry) => entry.playerId === currentId || !taken.has(entry.playerId),
    );
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
      posthog?.capture("substitutions_recorded", {
        league_id: leagueId,
        season_id: seasonId,
        game_id: game.id,
        substitution_count: substitutions.length,
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
    <View
      className="gap-4 rounded-[24px] border px-4 py-4"
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: theme.accentMuted }}
        >
          <Ionicons name="swap-horizontal-outline" size={20} color={theme.accent} />
        </View>
        <View className="min-w-0 flex-1">
          <Text style={{ color: theme.text }}>
            Substitutions
          </Text>
          <Text
            className="text-xs leading-5"
            style={{ color: theme.textSubtle }}
            numberOfLines={2}
          >
            Record player swaps from the selected team lineup.
          </Text>
        </View>
      </View>

      {canDraft ? (
        <View className="gap-3">
          {!hasLineup && !lineupsQuery.isLoading ? (
            <Text className="text-sm" style={{ color: theme.textSubtle }}>
              Set this team’s lineup before recording substitutions.
            </Text>
          ) : null}

          {lineupsQuery.isLoading ? (
            <View className="items-center py-3">
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : null}

          {hasLineup
            ? drafts.map((row, index) => {
                const off = starters.find((s) => s.playerId === row.playerOffId);
                const on = bench.find((s) => s.playerId === row.playerOnId);
                return (
                  <View
                    key={row.key}
                    className="gap-3 rounded-[20px] border px-3 py-3"
                    style={{
                      backgroundColor: theme.cardMuted,
                      borderColor: theme.cardBorder,
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="text-sm"
                        style={{ color: theme.text }}
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
                          className="h-8 w-8 items-center justify-center rounded-lg"
                          style={{ backgroundColor: theme.dangerMuted }}
                        >
                          <Ionicons name="trash-outline" size={16} color={theme.danger} />
                        </Pressable>
                      ) : null}
                    </View>

                    <PlayerDropdown
                      label="Player off"
                      helper="Starter leaving the pitch"
                      placeholder="Select starter"
                      options={optionsForDraft(row, "off")}
                      selected={off}
                      emptyText="No starters available."
                      onSelect={(entry) =>
                        updateDraft(row.key, { playerOffId: entry.playerId })
                      }
                      theme={theme}
                    />

                    <PlayerDropdown
                      label="Player on"
                      helper="Bench player coming on"
                      placeholder="Select bench player"
                      options={optionsForDraft(row, "on")}
                      selected={on}
                      emptyText="No bench players available."
                      onSelect={(entry) =>
                        updateDraft(row.key, { playerOnId: entry.playerId })
                      }
                      theme={theme}
                    />

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
                <SubstitutionActionButton
                  icon="add"
                  label="Add substitution"
                  onPress={handleAddRow}
                  disabled={isBusy || drafts.length >= MAX_DRAFT_SUBS}
                  tone="subtle"
                  theme={theme}
                />
              </View>
              <View className="flex-1">
                <SubstitutionActionButton
                  icon="save-outline"
                  label="Save"
                  onPress={() => void handleSave()}
                  loading={recordMutation.isPending}
                  disabled={isBusy}
                  tone="gold"
                  theme={theme}
                />
              </View>
            </View>
          ) : null}
        </View>
      ) : (
          <Text className="text-sm" style={{ color: theme.textSubtle }}>
          Substitutions can be recorded while the match is live.
        </Text>
      )}

      <View
        className="gap-2 border-t pt-4"
        style={{ borderColor: theme.cardBorder }}
      >
        <Text
          className="text-[11px] uppercase tracking-wider"
          style={{ color: theme.textSubtle }}
        >
          Recorded
        </Text>
        {recorded.length === 0 ? (
          <Text className="text-sm" style={{ color: theme.textSubtle }}>
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
                className="flex-row items-center gap-3 rounded-xl px-3 py-3"
                style={{ backgroundColor: theme.cardMuted }}
              >
                <View className="flex-1">
                  <Text
                    className="text-sm"
                    style={{ color: theme.text }}
                  >
                    {offName} → {onName}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: theme.textSubtle }}
                  >
                    {minuteLabel}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDeletePair(pair)}
                  disabled={isBusy}
                  accessibilityLabel={`Delete substitution ${offName} for ${onName}`}
                  className="h-10 w-10 items-center justify-center rounded-xl active:opacity-85"
                  style={{ backgroundColor: theme.dangerMuted }}
                >
                  <Ionicons name="trash-outline" size={18} color={theme.danger} />
                </Pressable>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

function PlayerDropdown({
  label,
  helper,
  placeholder,
  options,
  selected,
  emptyText,
  onSelect,
  theme,
}: {
  label: string;
  helper: string;
  placeholder: string;
  options: GameLineup[];
  selected?: GameLineup;
  emptyText: string;
  onSelect: (entry: GameLineup) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter((entry) => playerLabel(entry).toLowerCase().includes(q))
    : options;

  const handleSelect = (entry: GameLineup) => {
    onSelect(entry);
    setOpen(false);
    setQuery("");
  };

  return (
    <View className="gap-2">
      <Text
        className="text-xs uppercase tracking-wide"
        style={{ color: theme.textMuted }}
      >
        {label}
      </Text>
      <View
        className="overflow-hidden rounded-[18px] border"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        <Pressable
          onPress={() => setOpen((current) => !current)}
          className="flex-row items-center gap-3 px-3.5 py-3"
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <View
            className="h-9 w-9 items-center justify-center rounded-2xl"
            style={{ backgroundColor: theme.accentMuted }}
          >
            <Ionicons
              name={selected ? "person" : "person-outline"}
              size={18}
              color={theme.accent}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text
              className="text-sm"
              style={{ color: selected ? theme.text : theme.textSubtle }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {selected ? playerLabel(selected) : placeholder}
            </Text>
            <Text
              className="pt-0.5 text-xs"
              style={{ color: theme.textSubtle }}
              numberOfLines={1}
            >
              {selected ? helper : `${options.length} available`}
            </Text>
          </View>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color={theme.textSubtle}
          />
        </Pressable>

        {open ? (
          <View
            className="border-t"
            style={{ backgroundColor: theme.surface, borderColor: theme.cardBorder }}
          >
            {options.length > 5 ? (
              <View
                className="flex-row items-center gap-2 border-b px-3 py-2"
                style={{ borderColor: theme.cardBorder }}
              >
                <Ionicons
                  name="search"
                  size={16}
                  color={theme.textSubtle}
                />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search players"
                  placeholderTextColor={theme.textSubtle}
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: theme.text,
                    paddingVertical: 6,
                  }}
                />
                {query ? (
                  <Pressable onPress={() => setQuery("")} hitSlop={8}>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={theme.textSubtle}
                    />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 220 }}
            >
              {filtered.map((entry) => {
                const active = selected?.playerId === entry.playerId;
                return (
                  <Pressable
                    key={entry.id}
                    onPress={() => handleSelect(entry)}
                    className="flex-row items-center gap-3 border-b px-3.5 py-3 active:opacity-85"
                    style={{
                      backgroundColor: active ? theme.accentMuted : "transparent",
                      borderColor: theme.cardBorder,
                    }}
                  >
                    <Text
                      className="w-9 text-xs"
                      style={{ color: theme.textSubtle }}
                      numberOfLines={1}
                    >
                      {entry.jerseyNumber != null ? `#${entry.jerseyNumber}` : "-"}
                    </Text>
                    <Text
                      className="min-w-0 flex-1 text-sm"
                      style={{ color: active ? theme.accent : theme.text }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {entry.player?.name ?? "Unknown"}
                    </Text>
                    {active ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.accent}
                      />
                    ) : (
                      <View
                        className="h-5 w-5 rounded-full border"
                        style={{ borderColor: theme.cardBorder }}
                      />
                    )}
                  </Pressable>
                );
              })}
              {filtered.length === 0 ? (
                <Text
                  className="px-4 py-4 text-sm"
                  style={{ color: theme.textSubtle }}
                >
                  {q ? `No players match "${query.trim()}".` : emptyText}
                </Text>
              ) : null}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function SubstitutionActionButton({
  icon,
  label,
  tone,
  loading,
  disabled,
  onPress,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: "gold" | "subtle";
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const inactive = disabled || loading;
  const gold = tone === "gold";

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      className={`h-11 flex-row items-center justify-center gap-1.5 rounded-full border px-3 active:opacity-90 ${
        inactive ? "opacity-50" : ""
      }`}
      style={{
        backgroundColor: gold ? theme.accent : theme.cardMuted,
        borderColor: gold ? theme.accent : theme.cardBorder,
      }}
    >
      {loading ? (
        <ActivityIndicator
          color={gold ? theme.textInverse : theme.text}
          size="small"
        />
      ) : (
        <>
          <Ionicons
            name={icon}
            size={16}
            color={gold ? theme.textInverse : theme.text}
          />
          <Text
            className="min-w-0 text-center text-xs"
            style={{ color: gold ? theme.textInverse : theme.text }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
