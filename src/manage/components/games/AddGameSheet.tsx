import { Ionicons } from "@expo/vector-icons";
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { ApiTeam } from "@/api/entities";
import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import { Button } from "@/components/ui/Button";
import { EntityLogo } from "@/components/ui";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { NativeDatePickerField } from "@/components/ui/native-date-picker-field";
import {
  formatPlayedAtDate,
  formatPlayedAtTime,
  toCalendarDateParam,
} from "@/lib/datetime";
import { posthog } from "@/lib/posthog";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";

import { useCreateGame, useLeagueTeams } from "../../hooks";
import {
  GameVenuePicker,
  venuePayloadFromSelection,
  type GameVenueSelection,
} from "./GameVenuePicker";

type Props = {
  visible: boolean;
  onClose: () => void;
  leagueId: number;
  seasonId: number;
};

type ScheduleStep = "details" | "preview";

function buildPlayedAtIso(dateStr: string, timeStr: string): string | null {
  const date = dateStr.trim();
  const time = timeStr.trim();
  if (!date) return null;
  if (!time) return date;
  const parsed = new Date(`${date}T${time}:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function venueSelectionLabel(selection: GameVenueSelection): string {
  if (selection.kind === "venue") return selection.name;
  if (selection.kind === "one_off") return selection.venueName.trim() || "One-off venue";
  return "Venue not set";
}

function TeamPicker({
  label,
  teams,
  selectedId,
  onSelect,
  excludeId,
  theme,
}: {
  label: string;
  teams: ApiTeam[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  excludeId?: number | null;
  theme: ReturnType<typeof useTheme>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const options = teams.filter((t) => t.id !== excludeId);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter((team) => team.name.toLowerCase().includes(q))
    : options;
  const selectedTeam = teams.find((team) => team.id === selectedId);
  const hasSelection = selectedTeam != null;

  const handleSelect = (id: number) => {
    onSelect(id);
    setOpen(false);
    setQuery("");
  };

  const handleClear = () => {
    onSelect(null);
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
        style={{ backgroundColor: theme.cardMuted, borderColor: theme.cardBorder }}
      >
        <Pressable
          onPress={() => setOpen((current) => !current)}
          className="flex-row items-center gap-3 px-3.5 py-3"
          accessibilityRole="button"
          accessibilityLabel={`Choose ${label.toLowerCase()}`}
        >
          <View
            className="h-9 w-9 items-center justify-center rounded-2xl"
            style={{ backgroundColor: theme.accentMuted }}
          >
            <Ionicons
              name={hasSelection ? "shield-checkmark" : "shield-outline"}
              size={18}
              color={theme.accent}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text
              className="text-sm"
              style={{ color: hasSelection ? theme.text : theme.textSubtle }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {selectedTeam?.name ?? `Choose ${label.toLowerCase()}`}
            </Text>
            <Text
              className="pt-0.5 text-xs"
              style={{ color: theme.textSubtle }}
              numberOfLines={1}
            >
              {hasSelection
                ? label
                : `${options.length} team${options.length === 1 ? "" : "s"} available`}
            </Text>
          </View>
          {hasSelection ? (
            <Pressable
              onPress={handleClear}
              hitSlop={10}
              className="rounded-lg px-2 py-1"
            >
              <Text
                className="text-xs"
                style={{ color: theme.textMuted }}
              >
                Clear
              </Text>
            </Pressable>
          ) : null}
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
                  placeholder="Search teams"
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
              {filtered.map((team) => (
                <TeamOptionRow
                  key={team.id}
                  label={team.name}
                  selected={selectedId === team.id}
                  onPress={() => handleSelect(team.id)}
                  theme={theme}
                />
              ))}
              {filtered.length === 0 ? (
                <Text
                  className="px-4 py-4 text-sm"
                  style={{ color: theme.textSubtle }}
                >
                  {`No teams match "${query.trim()}".`}
                </Text>
              ) : null}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function TeamOptionRow({
  label,
  selected,
  onPress,
  theme,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b px-3.5 py-3 active:opacity-85"
      style={{
        backgroundColor: selected ? theme.accentMuted : "transparent",
        borderColor: theme.cardBorder,
      }}
    >
      <View className="min-w-0 flex-1">
        <Text
          className="text-sm"
          style={{ color: selected ? theme.accent : theme.text }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
      ) : (
        <View
          className="h-5 w-5 rounded-full border"
          style={{ borderColor: theme.cardBorder }}
        />
      )}
    </Pressable>
  );
}

export function AddGameSheet({ visible, onClose, leagueId, seasonId }: Props) {
  const { isDark } = useAppearance();
  const theme = useTheme();
  const teamsQuery = useLeagueTeams(leagueId, visible);
  const createMutation = useCreateGame(leagueId, seasonId);

  const defaultDate = toCalendarDateParam(new Date());
  const [homeTeamId, setHomeTeamId] = useState<number | null>(null);
  const [awayTeamId, setAwayTeamId] = useState<number | null>(null);
  const [dateStr, setDateStr] = useState(defaultDate);
  const [timeStr, setTimeStr] = useState("15:00");
  const [venueSelection, setVenueSelection] = useState<GameVenueSelection>({
    kind: "none",
  });
  const [firstHalfMinutes, setFirstHalfMinutes] = useState("45");
  const [secondHalfMinutes, setSecondHalfMinutes] = useState("45");
  const [step, setStep] = useState<ScheduleStep>("details");

  const teams = teamsQuery.data ?? [];
  const canSubmit =
    homeTeamId != null &&
    awayTeamId != null &&
    homeTeamId !== awayTeamId &&
    dateStr.trim().length > 0 &&
    timeStr.trim().length > 0 &&
    !createMutation.isPending;

  const resetAndClose = () => {
    setHomeTeamId(null);
    setAwayTeamId(null);
    setDateStr(toCalendarDateParam(new Date()));
    setTimeStr("15:00");
    setVenueSelection({ kind: "none" });
    setFirstHalfMinutes("45");
    setSecondHalfMinutes("45");
    setStep("details");
    onClose();
  };

  const parseHalfMinutes = (value: string, label: string): number | null => {
    const n = Number(value.trim());
    if (!Number.isInteger(n) || n < 1 || n > 120) {
      showInfoToast("Invalid duration", `${label} must be a whole number between 1 and 120.`);
      return null;
    }
    return n;
  };

  const getValidatedDraft = () => {
    const playedAt = buildPlayedAtIso(dateStr, timeStr);
    if (!playedAt || homeTeamId == null || awayTeamId == null) {
      showInfoToast("Missing fields", "Pick both teams and a valid kick-off date and time.");
      return null;
    }
    if (homeTeamId === awayTeamId) {
      showInfoToast("Choose two teams", "Home and away teams must be different.");
      return null;
    }
    const firstHalfDuration = parseHalfMinutes(firstHalfMinutes, "First half");
    if (firstHalfDuration == null) return null;
    const secondHalfDuration = parseHalfMinutes(secondHalfMinutes, "Second half");
    if (secondHalfDuration == null) return null;

    return {
      playedAt,
      firstHalfDuration,
      secondHalfDuration,
    };
  };

  const handlePreview = () => {
    const draft = getValidatedDraft();
    if (!draft) return;
    setStep("preview");
  };

  const handleSubmit = async () => {
    const draft = getValidatedDraft();
    if (!draft || homeTeamId == null || awayTeamId == null) return;

    const venueFields = venuePayloadFromSelection(venueSelection);

    try {
      await createMutation.mutateAsync({
        leagueId,
        seasonId,
        homeTeamId,
        awayTeamId,
        playedAt: draft.playedAt,
        ...(venueFields.venueId != null
          ? { venueId: venueFields.venueId }
          : venueFields.venueName
            ? { venueName: venueFields.venueName }
            : {}),
        status: "scheduled",
        firstHalfDuration: draft.firstHalfDuration,
        secondHalfDuration: draft.secondHalfDuration,
      });
      posthog?.capture("game_scheduled", {
        league_id: leagueId,
        season_id: seasonId,
        has_venue: venueSelection.kind !== "none",
        first_half_minutes: draft.firstHalfDuration,
        second_half_minutes: draft.secondHalfDuration,
      });
      showInfoToast("Game scheduled", "The fixture was added to upcoming.");
      resetAndClose();
    } catch (err) {
      showThrownAsToast(err, "Could not schedule game");
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={resetAndClose}
      title="Schedule game"
      subtitle={
        step === "details"
          ? "Step 1 of 2: enter the fixture details."
          : "Step 2 of 2: review before publishing."
      }
      variant={isDark ? "dark" : "light"}
    >
      {teamsQuery.isLoading ? (
        <ActivityIndicator className="py-6" color={theme.accent} />
      ) : teams.length < 2 ? (
        <View
          className="items-center gap-3 rounded-[20px] border px-4 py-6"
          style={{ backgroundColor: theme.cardMuted, borderColor: theme.cardBorder }}
        >
          <Ionicons name="people-outline" size={28} color={theme.accent} />
          <Text
            className="text-center text-sm leading-6"
            style={{ color: theme.textSubtle }}
          >
            Add at least two teams to this league before scheduling games.
          </Text>
        </View>
      ) : (
        <View className="gap-4">
          <ScheduleStepIndicator step={step} theme={theme} />

          {step === "details" ? (
            <>
              <GameSheetBlock title="Teams" theme={theme}>
                <TeamPicker
                  label="Home team"
                  teams={teams}
                  selectedId={homeTeamId}
                  onSelect={setHomeTeamId}
                  excludeId={awayTeamId}
                  theme={theme}
                />
                <TeamPicker
                  label="Away team"
                  teams={teams}
                  selectedId={awayTeamId}
                  onSelect={setAwayTeamId}
                  excludeId={homeTeamId}
                  theme={theme}
                />
              </GameSheetBlock>
              <GameSheetBlock title="Kick-off" theme={theme}>
                <NativeDatePickerField
                  label="Date"
                  value={dateStr}
                  onChange={(value) => setDateStr(value ?? "")}
                  placeholder="Pick fixture date"
                  variant={isDark ? "dark" : "light"}
                  required
                />
                <NativeDatePickerField
                  label="Kick-off time"
                  value={timeStr}
                  onChange={(value) => setTimeStr(value ?? "")}
                  mode="time"
                  placeholder="Pick kick-off time"
                  variant={isDark ? "dark" : "light"}
                  required
                />
              </GameSheetBlock>
              <GameSheetBlock title="Venue" theme={theme}>
                <GameVenuePicker
                  leagueId={leagueId}
                  enabled={visible}
                  selection={venueSelection}
                  onChange={setVenueSelection}
                  variant={isDark ? "dark" : "light"}
                />
              </GameSheetBlock>
              <GameSheetBlock title="Match length" theme={theme}>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <AuthTextField
                      label="First half (min)"
                      value={firstHalfMinutes}
                      onChangeText={setFirstHalfMinutes}
                      keyboardType="number-pad"
                      placeholder="45"
                    />
                  </View>
                  <View className="flex-1">
                    <AuthTextField
                      label="Second half (min)"
                      value={secondHalfMinutes}
                      onChangeText={setSecondHalfMinutes}
                      keyboardType="number-pad"
                      placeholder="45"
                    />
                  </View>
                </View>
              </GameSheetBlock>
              <Button
                variant="authPurple"
                label="Continue to preview"
                disabled={!canSubmit}
                onPress={handlePreview}
              />
            </>
          ) : (
            <SchedulePreviewStep
              teams={teams}
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              playedAt={buildPlayedAtIso(dateStr, timeStr)}
              venueLabel={venueSelectionLabel(venueSelection)}
              firstHalfMinutes={firstHalfMinutes}
              secondHalfMinutes={secondHalfMinutes}
              theme={theme}
              onBack={() => setStep("details")}
              onSubmit={() => void handleSubmit()}
              submitting={createMutation.isPending}
              canSubmit={canSubmit}
            />
          )}
        </View>
      )}
    </BottomSheetModal>
  );
}

function ScheduleStepIndicator({
  step,
  theme,
}: {
  step: ScheduleStep;
  theme: ReturnType<typeof useTheme>;
}) {
  const activeIndex = step === "details" ? 0 : 1;

  return (
    <View
      className="flex-row rounded-[18px] border p-1"
      style={{ backgroundColor: theme.cardMuted, borderColor: theme.cardBorder }}
    >
      {["Details", "Preview"].map((label, index) => {
        const active = index === activeIndex;
        return (
          <View
            key={label}
            className="flex-1 rounded-[14px] px-3 py-2"
            style={{ backgroundColor: active ? theme.accentMuted : "transparent" }}
          >
            <Text
              className="text-center text-xs"
              style={{ color: active ? theme.accent : theme.textSubtle }}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function SchedulePreviewStep({
  teams,
  homeTeamId,
  awayTeamId,
  playedAt,
  venueLabel,
  firstHalfMinutes,
  secondHalfMinutes,
  theme,
  onBack,
  onSubmit,
  submitting,
  canSubmit,
}: {
  teams: ApiTeam[];
  homeTeamId: number | null;
  awayTeamId: number | null;
  playedAt: string | null;
  venueLabel: string;
  firstHalfMinutes: string;
  secondHalfMinutes: string;
  theme: ReturnType<typeof useTheme>;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  canSubmit: boolean;
}) {
  const homeTeam = teams.find((team) => team.id === homeTeamId) ?? null;
  const awayTeam = teams.find((team) => team.id === awayTeamId) ?? null;

  return (
    <View className="gap-4">
      <SchedulePreviewCard
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        playedAt={playedAt}
        venueLabel={venueLabel}
        firstHalfMinutes={firstHalfMinutes}
        secondHalfMinutes={secondHalfMinutes}
        theme={theme}
      />
      <MatchDayReadinessTooltip theme={theme} />
      <View className="flex-row gap-3">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          className="h-14 flex-1 items-center justify-center rounded-[13px] border active:opacity-85"
          style={{ backgroundColor: theme.cardMuted, borderColor: theme.cardBorder }}
        >
          <Text className="text-base" style={{ color: theme.text }}>
            Back
          </Text>
        </Pressable>
        <View className="flex-[1.45]">
          <Button
            variant="authPurple"
            label={submitting ? "Scheduling..." : "Schedule game"}
            loading={submitting}
            disabled={!canSubmit}
            onPress={onSubmit}
          />
        </View>
      </View>
    </View>
  );
}

function SchedulePreviewCard({
  homeTeam,
  awayTeam,
  playedAt,
  venueLabel,
  firstHalfMinutes,
  secondHalfMinutes,
  theme,
}: {
  homeTeam: ApiTeam | null;
  awayTeam: ApiTeam | null;
  playedAt: string | null;
  venueLabel: string;
  firstHalfMinutes: string;
  secondHalfMinutes: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View
      className="overflow-hidden rounded-[22px] border"
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
    >
      <View
        className="flex-row items-center justify-between gap-3 border-b px-4 py-3"
        style={{ borderColor: theme.cardBorder }}
      >
        <View>
          <Text className="text-xs uppercase tracking-wide" style={{ color: theme.textSubtle }}>
            Home feed preview
          </Text>
          <Text className="pt-0.5 text-sm" style={{ color: theme.text }}>
            Scheduled fixture
          </Text>
        </View>
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: theme.accentMuted }}
        >
          <Text className="text-xs" style={{ color: theme.accent }}>
            Upcoming
          </Text>
        </View>
      </View>

      <View className="flex-row items-start gap-3 px-4 py-4">
        <View style={styles.previewMetaColumn}>
          <Text className="text-[11px] tabular-nums" style={{ color: theme.text }}>
            {playedAt ? formatPlayedAtTime(playedAt) : "--:--"}
          </Text>
          <Text
            className="text-center text-[10px] leading-4"
            style={{ color: theme.textSubtle }}
            numberOfLines={2}
          >
            {playedAt ? formatPlayedAtDate(playedAt) : "Pick date"}
          </Text>
        </View>

        <View className="min-w-0 flex-1 gap-2.5">
          <PreviewTeamRow team={homeTeam} fallback="Home team" theme={theme} />
          <PreviewTeamRow team={awayTeam} fallback="Away team" theme={theme} />
        </View>
      </View>

      <View
        className="gap-2 border-t px-4 py-3"
        style={{ borderColor: theme.cardBorder }}
      >
        <PreviewMetaRow
          icon="location-outline"
          label={venueLabel}
          theme={theme}
        />
        <PreviewMetaRow
          icon="timer-outline"
          label={`${firstHalfMinutes || "45"} + ${secondHalfMinutes || "45"} minutes`}
          theme={theme}
        />
      </View>
    </View>
  );
}

function PreviewTeamRow({
  team,
  fallback,
  theme,
}: {
  team: ApiTeam | null;
  fallback: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <EntityLogo
        logoUrl={team?.logoUrl}
        variant="team"
        size="xs"
        tone="light"
      />
      <Text
        className="min-w-0 flex-1 text-[14px]"
        style={{ color: team ? theme.text : theme.textSubtle }}
        numberOfLines={1}
      >
        {team?.name ?? fallback}
      </Text>
    </View>
  );
}

function PreviewMetaRow({
  icon,
  label,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons name={icon} size={15} color={theme.textSubtle} />
      <Text
        className="min-w-0 flex-1 text-xs"
        style={{ color: theme.textSubtle }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function MatchDayReadinessTooltip({
  theme,
}: {
  theme: ReturnType<typeof useTheme>;
}) {
  const [open, setOpen] = useState(true);

  return (
    <View
      className="overflow-hidden rounded-[20px] border"
      style={{ backgroundColor: theme.dangerMuted, borderColor: theme.danger }}
    >
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? "Hide match day checklist" : "Show match day checklist"}
        className="flex-row items-center gap-3 px-4 py-3 active:opacity-85"
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-2xl"
          style={{ backgroundColor: theme.card }}
        >
          <Ionicons name="alert-circle-outline" size={19} color={theme.danger} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-sm" style={{ color: theme.danger }}>
            Match day checklist
          </Text>
          <Text
            className="pt-0.5 text-xs leading-5"
            style={{ color: theme.textMuted }}
            numberOfLines={open ? 2 : 1}
          >
            Set lineups before kick-off so match center features work properly.
          </Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={theme.danger}
        />
      </Pressable>

      {open ? (
        <View
          className="gap-2 border-t px-4 pb-4 pt-3"
          style={{ borderColor: theme.danger }}
        >
          <ReadinessRow
            icon="people-outline"
            title="Lineups unlock match center"
            body="Teams must set their lineups for substitutions and man of the match to use the correct player list."
            theme={theme}
          />
          <ReadinessRow
            icon="ribbon-outline"
            title="Man of the match uses active players"
            body="Only players available in the match lineup should be picked for the award after the game."
            theme={theme}
          />
          <ReadinessRow
            icon="swap-horizontal-outline"
            title="Substitutions need prepared squads"
            body="If a team has no lineup, admins may not be able to record substitutions cleanly during the match."
            theme={theme}
          />
          <ReadinessRow
            icon="shield-checkmark-outline"
            title="Assign team admins"
            body="Give each team an admin so they can manage their own roster and set lineups before match day."
            theme={theme}
          />
          <ReadinessRow
            icon="timer-outline"
            title="Confirm match length"
            body="The half durations control the match-center clock, extra time checks, and live timing shown to viewers."
            theme={theme}
          />
          <ReadinessRow
            icon="location-outline"
            title="Check venue and kick-off"
            body="These details appear on the public match feed, so confirm them now to avoid confusing players and fans."
            theme={theme}
          />
        </View>
      ) : null}
    </View>
  );
}

function ReadinessRow({
  icon,
  title,
  body,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View className="flex-row gap-3 rounded-2xl px-3 py-3" style={{ backgroundColor: theme.card }}>
      <View className="pt-0.5">
        <Ionicons name={icon} size={16} color={theme.danger} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-sm" style={{ color: theme.text }}>
          {title}
        </Text>
        <Text className="pt-0.5 text-xs leading-5" style={{ color: theme.textMuted }}>
          {body}
        </Text>
      </View>
    </View>
  );
}

function GameSheetBlock({
  title,
  children,
  theme,
}: {
  title: string;
  children: ReactNode;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View
      className="gap-3 rounded-[18px] border px-3 py-3"
      style={{ backgroundColor: theme.cardMuted, borderColor: theme.cardBorder }}
    >
      <Text
        className="text-xs uppercase tracking-wide"
        style={{ color: theme.textMuted }}
      >
        {title}
      </Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  previewMetaColumn: {
    width: 58,
    alignItems: "center",
    gap: 3,
    paddingTop: 1,
  },
});
