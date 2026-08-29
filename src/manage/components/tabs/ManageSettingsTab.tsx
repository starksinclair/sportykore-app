import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiLeague, ApiSeason, SeasonStatus } from "@/api/entities";
import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { NativeDatePickerField } from "@/components/ui/native-date-picker-field";
import {
  GroupFormatConfigControl,
  buildDefaultGroupConfig,
  type GroupFormatFormState,
} from "@/groups";
import {
  KnockoutTieFormatControl,
  buildKnockoutConfig,
  type TieFormatSelection,
} from "@/knockout";
import { TiebreakerPicker } from "@/league/components/TiebreakerPicker";
import { DIVISION_OPTIONS } from "@/league/league-create-constants";
import {
  DEFAULT_TIEBREAKER,
  type TiebreakerRule,
} from "@/league/tiebreaker-options";
import {
  leagueDurationProgress,
  parseCalendarDate,
  toCalendarDateString,
} from "@/lib/datetime";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";

import { useCreateSeason, useUpdateLeague } from "../../hooks";
import { SeasonStatusEnum } from "../../types";
import { EditSeasonSheet } from "../seasons/EditSeasonSheet";
import { SeasonStatusPicker } from "../seasons/SeasonStatusPicker";

type Props = {
  leagueId: number;
  league: ApiLeague;
  seasons: ApiSeason[];
  activeSeasonId: number;
  onSeasonCreated: (seasonId: number) => void;
};

export function ManageSettingsTab({
  leagueId,
  league,
  seasons,
  activeSeasonId,
  onSeasonCreated,
}: Props) {
  const { isDark } = useAppearance();
  const theme = useTheme();
  const updateLeagueMutation = useUpdateLeague(leagueId, activeSeasonId);
  const createSeasonMutation = useCreateSeason(leagueId, activeSeasonId);

  const [name, setName] = useState(league.name);
  const [description, setDescription] = useState(league.description ?? "");
  const [startDate, setStartDate] = useState(toCalendarDateString(league.startDate));
  const [endDate, setEndDate] = useState(toCalendarDateString(league.endDate));
  const [divisionId, setDivisionId] = useState<(typeof DIVISION_OPTIONS)[number]["id"]>("open");
  const [tiebreakerId, setTiebreakerId] = useState<TiebreakerRule>(
    league.tiebreaker ?? DEFAULT_TIEBREAKER,
  );

  const [editingSeason, setEditingSeason] = useState<ApiSeason | null>(null);
  const [newSeasonName, setNewSeasonName] = useState("");
  const [newSeasonStatus, setNewSeasonStatus] = useState<SeasonStatus>(
    SeasonStatusEnum.Inactive,
  );
  const [newSeasonFormat, setNewSeasonFormat] = useState<
    "league" | "knockout" | "group"
  >("league");
  const [newSeasonTieFormat, setNewSeasonTieFormat] = useState<TieFormatSelection>({
    kind: "single",
  });
  const [newSeasonThirdPlace, setNewSeasonThirdPlace] = useState(false);
  const [newSeasonGroupForm, setNewSeasonGroupForm] =
    useState<GroupFormatFormState>({
      groupCount: 2,
      doubleRoundRobin: false,
      perGroup: 2,
    });

  useEffect(() => {
    setName(league.name);
    setDescription(league.description ?? "");
    setStartDate(toCalendarDateString(league.startDate));
    setEndDate(toCalendarDateString(league.endDate));
    setTiebreakerId(league.tiebreaker ?? DEFAULT_TIEBREAKER);
  }, [
    league.id,
    league.name,
    league.description,
    league.startDate,
    league.endDate,
    league.tiebreaker,
  ]);

  const handleSaveLeague = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showInfoToast("Name required", "Enter a league name.");
      return;
    }
    const durationError = validateLeagueDuration(startDate, endDate);
    if (durationError) {
      showInfoToast("Invalid duration", durationError);
      return;
    }
    try {
      await updateLeagueMutation.mutateAsync({
        name: trimmed,
        description: description.trim() || null,
        gender: divisionId === "open" ? null : divisionId,
        tiebreaker: tiebreakerId,
        startDate: toCalendarDateString(startDate) || null,
        endDate: toCalendarDateString(endDate) || null,
      });
      showInfoToast("League updated", "Your changes were saved.");
    } catch (err) {
      showThrownAsToast(err, "Could not update league");
    }
  };

  const handleAddSeason = async () => {
    const trimmed = newSeasonName.trim();
    if (!trimmed) {
      showInfoToast("Season name required", "e.g. 2027 - Spring");
      return;
    }
    try {
      const created = await createSeasonMutation.mutateAsync({
        name: trimmed,
        status: newSeasonStatus,
        format: newSeasonFormat,
        knockout:
          newSeasonFormat === "knockout"
            ? {
                name: "Cup",
                config: buildKnockoutConfig(
                  newSeasonTieFormat,
                  newSeasonThirdPlace,
                ),
              }
            : undefined,
        group:
          newSeasonFormat === "group"
            ? {
                name: "Group Stage",
                config: buildDefaultGroupConfig({
                  groupCount: newSeasonGroupForm.groupCount,
                  doubleRoundRobin: newSeasonGroupForm.doubleRoundRobin,
                  perGroup: newSeasonGroupForm.perGroup,
                }),
              }
            : undefined,
      });
      setNewSeasonName("");
      setNewSeasonStatus(SeasonStatusEnum.Inactive);
      setNewSeasonFormat("league");
      setNewSeasonTieFormat({ kind: "single" });
      setNewSeasonThirdPlace(false);
      setNewSeasonGroupForm({
        groupCount: 2,
        doubleRoundRobin: false,
        perGroup: 2,
      });
      onSeasonCreated(created.id);
      showInfoToast("Season created", `"${created.name}" is now available in the picker.`);
    } catch (err) {
      showThrownAsToast(err, "Could not create season");
    }
  };

  return (
    <View className="gap-8 pb-10">
      <View
        className="gap-4 rounded-[24px] border px-4 py-5"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        <Text className="text-lg" style={{ color: theme.text }}>
          Edit league
        </Text>
        <Text className="text-sm" style={{ color: theme.textSubtle }}>
          Updates apply to the whole league, not just the selected season.
        </Text>

        <AuthTextField
          label="League name"
          value={name}
          onChangeText={setName}
        />
        <AuthTextField
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <View className="gap-2">
          <Text
            className="text-xs uppercase tracking-wide"
            style={{ color: theme.textSubtle }}
          >
            League duration
          </Text>
          <LeagueDurationProgress startDate={startDate} endDate={endDate} />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <NativeDatePickerField
                label="Start date"
                value={startDate}
                onChange={(value) => setStartDate(value ?? "")}
                placeholder="Pick start date"
                maximumDate={parseCalendarDate(endDate) ?? undefined}
                variant={isDark ? "dark" : "light"}
              />
            </View>
            <View className="flex-1">
              <NativeDatePickerField
                label="End date"
                value={endDate}
                onChange={(value) => setEndDate(value ?? "")}
                placeholder="Pick end date"
                minimumDate={parseCalendarDate(startDate) ?? undefined}
                variant={isDark ? "dark" : "light"}
              />
            </View>
          </View>
        </View>

        <View className="gap-2">
          <Text
            className="text-xs uppercase tracking-wide"
            style={{ color: theme.textSubtle }}
          >
            Division
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {DIVISION_OPTIONS.map((opt) => {
              const active = divisionId === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setDivisionId(opt.id)}
                  className="rounded-xl border px-3 py-2 active:opacity-85"
                  style={{
                    backgroundColor: active ? theme.brandMuted : theme.cardMuted,
                    borderColor: active ? theme.brand : theme.cardBorder,
                  }}
                >
                  <Text
                    style={{ color: active ? theme.brand : theme.textMuted }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs leading-5" style={{ color: theme.textSubtle }}>
            Changing the tiebreaker re-sorts the active season table immediately.
          </Text>
          <TiebreakerPicker
            value={tiebreakerId}
            onChange={setTiebreakerId}
            variant={isDark ? "dark" : "light"}
          />
        </View>

        <Button
          variant="authPurple"
          label={updateLeagueMutation.isPending ? "Saving…" : "Save league"}
          loading={updateLeagueMutation.isPending}
          onPress={() => void handleSaveLeague()}
        />
      </View>

      <View
        className="gap-4 rounded-[24px] border px-4 py-5"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        <Text className="text-lg" style={{ color: theme.text }}>
          Seasons
        </Text>
        <Text className="text-sm leading-6" style={{ color: theme.textSubtle }}>
          Each season has its own fixtures, roster, and standings. Mark a season as{" "}
          <Text style={{ color: theme.text }}>
            Active
          </Text>{" "}
          to run it now - any other active season in this league is marked{" "}
          <Text style={{ color: theme.text }}>
            Completed
          </Text>{" "}
          automatically. Tap the edit icon to rename a season or change its status.
        </Text>

        {seasons.length > 0 ? (
          <View className="gap-1 rounded-xl px-3 py-3" style={{ backgroundColor: theme.cardMuted }}>
            <Text
              className="text-xs uppercase tracking-wide"
              style={{ color: theme.textSubtle }}
            >
              All seasons
            </Text>
            {seasons.map((season) => (
              <View key={season.id} className="flex-row items-center gap-2 py-1">
                <Text
                  numberOfLines={1}
                  className="flex-1 text-sm"
                  style={{
                    color: season.id === activeSeasonId ? theme.accent : theme.textMuted,
                  }}
                >
                  {season.name} · {season.status}
                  {season.id === activeSeasonId ? " · selected" : ""}
                </Text>
                <Pressable
                  onPress={() => setEditingSeason(season)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${season.name}`}
                  className="h-9 w-9 shrink-0 items-center justify-center rounded-xl active:opacity-85"
                  style={{ backgroundColor: theme.card }}
                >
                  <Ionicons name="create-outline" size={17} color={theme.textMuted} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View
        className="gap-4 rounded-[24px] border px-4 py-5"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        <Text className="text-lg" style={{ color: theme.text }}>
          Add season
        </Text>
        <Text className="text-sm leading-6" style={{ color: theme.textSubtle }}>
          Start a new campaign when you begin a fresh table. Use{" "}
          <Text style={{ color: theme.text }}>
            Inactive
          </Text>{" "}
          for upcoming seasons, or{" "}
            <Text style={{ color: theme.text }}>
            Active
          </Text>{" "}
          to switch straight into the new season.
        </Text>

        <AuthTextField
          label="Season name"
          value={newSeasonName}
          onChangeText={setNewSeasonName}
          placeholder="2027 - Spring"
        />

        <SeasonStatusPicker
          label="Initial status"
          value={newSeasonStatus}
          onChange={setNewSeasonStatus}
        />

        <View className="gap-2">
          <Text
            className="text-xs uppercase tracking-wide"
            style={{ color: theme.textMuted }}
          >
            Format
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {(
              [
                { id: "league" as const, label: "League (round-robin)" },
                { id: "knockout" as const, label: "Knockouts" },
                { id: "group" as const, label: "Groups" },
              ] as const
            ).map((opt) => {
              const active = newSeasonFormat === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setNewSeasonFormat(opt.id)}
                  className="rounded-xl border px-3 py-2"
                  style={{
                    backgroundColor: active ? theme.brandMuted : theme.cardMuted,
                    borderColor: active ? theme.brand : theme.cardBorder,
                  }}
                >
                  <Text
                    style={{ color: active ? theme.brand : theme.textSubtle }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {newSeasonFormat === "knockout" ? (
            <KnockoutTieFormatControl
              value={newSeasonTieFormat}
              onChange={setNewSeasonTieFormat}
              hasThirdPlace={newSeasonThirdPlace}
              onHasThirdPlaceChange={setNewSeasonThirdPlace}
              tone={isDark ? "dark" : "light"}
            />
          ) : null}
          {newSeasonFormat === "group" ? (
            <GroupFormatConfigControl
              value={newSeasonGroupForm}
              onChange={setNewSeasonGroupForm}
              tone={isDark ? "dark" : "light"}
            />
          ) : null}
        </View>

        <Button
          variant="accent"
          label={createSeasonMutation.isPending ? "Creating…" : "Add season"}
          loading={createSeasonMutation.isPending}
          onPress={() => void handleAddSeason()}
        />
      </View>

      <EditSeasonSheet
        visible={editingSeason != null}
        onClose={() => setEditingSeason(null)}
        leagueId={leagueId}
        season={editingSeason}
        onUpdated={onSeasonCreated}
      />
    </View>
  );
}

function LeagueDurationProgress({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const theme = useTheme();
  const progress = leagueDurationProgress(startDate, endDate);
  if (progress == null) {
    return (
      <Text className="text-xs leading-5" style={{ color: theme.textSubtle }}>
        Set start and end dates to track league progress.
      </Text>
    );
  }

  const pct = Math.round(progress * 100);
  const statusLabel =
    progress <= 0 ? "Not started" : progress >= 1 ? "Complete" : `${pct}% through`;

  return (
    <View className="gap-2 rounded-xl px-3 py-3" style={{ backgroundColor: theme.cardMuted }}>
      <View className="flex-row items-center justify-between gap-2">
        <Text
          className="text-xs"
          style={{ color: theme.textSubtle }}
          numberOfLines={1}
        >
          {startDate.trim()}
        </Text>
        <Text
          className="text-xs"
          style={{ color: theme.accent }}
        >
          {statusLabel}
        </Text>
        <Text
          className="text-right text-xs"
          style={{ color: theme.textSubtle }}
          numberOfLines={1}
        >
          {endDate.trim()}
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: theme.cardBorder }}>
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: theme.accent }}
        />
      </View>
    </View>
  );
}

function validateLeagueDuration(startDate: string, endDate: string): string | null {
  const start = startDate.trim();
  const end = endDate.trim();
  if (!start && !end) return null;
  if (start && !parseCalendarDate(start)) {
    return "Start date must be YYYY-MM-DD.";
  }
  if (end && !parseCalendarDate(end)) {
    return "End date must be YYYY-MM-DD.";
  }
  if (start && end) {
    const startParsed = parseCalendarDate(start)!;
    const endParsed = parseCalendarDate(end)!;
    if (endParsed.getTime() < startParsed.getTime()) {
      return "End date must be on or after the start date.";
    }
  }
  return null;
}
