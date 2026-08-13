import { Ionicons } from "@expo/vector-icons";
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import type { ApiTeam } from "@/api/entities";
import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { NativeDatePickerField } from "@/components/ui/native-date-picker-field";
import { toCalendarDateParam } from "@/lib/datetime";
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

function buildPlayedAtIso(dateStr: string, timeStr: string): string | null {
  const date = dateStr.trim();
  const time = timeStr.trim();
  if (!date) return null;
  if (!time) return date;
  const parsed = new Date(`${date}T${time}:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
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

  const teams = teamsQuery.data ?? [];
  const canSubmit =
    homeTeamId != null &&
    awayTeamId != null &&
    homeTeamId !== awayTeamId &&
    dateStr.trim().length > 0 &&
    !createMutation.isPending;

  const resetAndClose = () => {
    setHomeTeamId(null);
    setAwayTeamId(null);
    setDateStr(toCalendarDateParam(new Date()));
    setTimeStr("15:00");
    setVenueSelection({ kind: "none" });
    setFirstHalfMinutes("45");
    setSecondHalfMinutes("45");
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

  const handleSubmit = async () => {
    const playedAt = buildPlayedAtIso(dateStr, timeStr);
    if (!playedAt || homeTeamId == null || awayTeamId == null) {
      showInfoToast("Missing fields", "Pick both teams and a valid date.");
      return;
    }
    const firstHalfDuration = parseHalfMinutes(firstHalfMinutes, "First half");
    if (firstHalfDuration == null) return;
    const secondHalfDuration = parseHalfMinutes(secondHalfMinutes, "Second half");
    if (secondHalfDuration == null) return;

    const venueFields = venuePayloadFromSelection(venueSelection);

    try {
      await createMutation.mutateAsync({
        leagueId,
        seasonId,
        homeTeamId,
        awayTeamId,
        playedAt,
        ...(venueFields.venueId != null
          ? { venueId: venueFields.venueId }
          : venueFields.venueName
            ? { venueName: venueFields.venueName }
            : {}),
        status: "scheduled",
        firstHalfDuration,
        secondHalfDuration,
      });
      posthog?.capture("game_scheduled", {
        league_id: leagueId,
        season_id: seasonId,
        has_venue: venueSelection.kind !== "none",
        first_half_minutes: firstHalfDuration,
        second_half_minutes: secondHalfDuration,
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
      subtitle="Pick teams, kick-off details, and the match venue."
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
            <AuthTextField
              label="Kick-off time (HH:mm) uses 24-hour format"
              value={timeStr}
              onChangeText={setTimeStr}
              placeholder="15:00"
              autoCapitalize="none"
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
            label={createMutation.isPending ? "Scheduling…" : "Schedule game"}
            loading={createMutation.isPending}
            disabled={!canSubmit}
            onPress={() => void handleSubmit()}
          />
        </View>
      )}
    </BottomSheetModal>
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
