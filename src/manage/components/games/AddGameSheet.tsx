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
}: {
  label: string;
  teams: ApiTeam[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  excludeId?: number | null;
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
        className="text-xs uppercase tracking-wide text-white/50"
      >
        {label}
      </Text>
      <View className="overflow-hidden rounded-[18px] border border-white/10 bg-white/5">
        <Pressable
          onPress={() => setOpen((current) => !current)}
          className="flex-row items-center gap-3 px-3.5 py-3"
          accessibilityRole="button"
          accessibilityLabel={`Choose ${label.toLowerCase()}`}
        >
          <View className="h-9 w-9 items-center justify-center rounded-2xl bg-accent-500/15">
            <Ionicons
              name={hasSelection ? "shield-checkmark" : "shield-outline"}
              size={18}
              color="#E6A817"
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text
              className={hasSelection ? "text-sm text-white" : "text-sm text-white/65"}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {selectedTeam?.name ?? `Choose ${label.toLowerCase()}`}
            </Text>
            <Text
              className="pt-0.5 text-xs text-white/45"
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
                className="text-xs text-white/55"
              >
                Clear
              </Text>
            </Pressable>
          ) : null}
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color="rgba(255,255,255,0.45)"
          />
        </Pressable>

        {open ? (
          <View className="border-t border-white/10 bg-neutral-950/70">
            {options.length > 5 ? (
              <View className="flex-row items-center gap-2 border-b border-white/10 px-3 py-2">
                <Ionicons
                  name="search"
                  size={16}
                  color="rgba(255,255,255,0.45)"
                />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search teams"
                  placeholderTextColor="#94a3b8"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: "#FFFFFF",
                    paddingVertical: 6,
                  }}
                />
                {query ? (
                  <Pressable onPress={() => setQuery("")} hitSlop={8}>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color="rgba(255,255,255,0.45)"
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
                />
              ))}
              {filtered.length === 0 ? (
                <Text
                  className="px-4 py-4 text-sm text-white/45"
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
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 border-b border-white/10 px-3.5 py-3 ${
        selected ? "bg-accent-500/10" : "bg-transparent"
      }`}
    >
      <View className="min-w-0 flex-1">
        <Text
          className={selected ? "text-sm text-accent-100" : "text-sm text-white"}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={20} color="#E6A817" />
      ) : (
        <View className="h-5 w-5 rounded-full border border-white/20" />
      )}
    </Pressable>
  );
}

export function AddGameSheet({ visible, onClose, leagueId, seasonId }: Props) {
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
      variant="dark"
    >
      {teamsQuery.isLoading ? (
        <ActivityIndicator className="py-6" color="#E6A817" />
      ) : teams.length < 2 ? (
        <View className="items-center gap-3 rounded-[20px] border border-white/10 bg-white/5 px-4 py-6">
          <Ionicons name="people-outline" size={28} color="#E6A817" />
          <Text
            className="text-center text-sm leading-6 text-white/60"
          >
            Add at least two teams to this league before scheduling games.
          </Text>
        </View>
      ) : (
        <View className="gap-4">
          <GameSheetBlock title="Teams">
            <TeamPicker
              label="Home team"
              teams={teams}
              selectedId={homeTeamId}
              onSelect={setHomeTeamId}
              excludeId={awayTeamId}
            />
            <TeamPicker
              label="Away team"
              teams={teams}
              selectedId={awayTeamId}
              onSelect={setAwayTeamId}
              excludeId={homeTeamId}
            />
          </GameSheetBlock>
          <GameSheetBlock title="Kick-off">
            <NativeDatePickerField
              label="Date"
              value={dateStr}
              onChange={(value) => setDateStr(value ?? "")}
              placeholder="Pick fixture date"
              labelClassName="text-white/60"
              variant="dark"
              required
            />
            <AuthTextField
              label="Kick-off time (HH:mm) uses 24-hour format"
              labelClassName="text-white/60"
              value={timeStr}
              onChangeText={setTimeStr}
              placeholder="15:00"
              autoCapitalize="none"
            />
          </GameSheetBlock>
          <GameSheetBlock title="Venue">
            <GameVenuePicker
              leagueId={leagueId}
              enabled={visible}
              selection={venueSelection}
              onChange={setVenueSelection}
              variant="dark"
            />
          </GameSheetBlock>
          <GameSheetBlock title="Match length">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <AuthTextField
                  label="First half (min)"
                  labelClassName="text-white/60"
                  value={firstHalfMinutes}
                  onChangeText={setFirstHalfMinutes}
                  keyboardType="number-pad"
                  placeholder="45"
                />
              </View>
              <View className="flex-1">
                <AuthTextField
                  label="Second half (min)"
                  labelClassName="text-white/60"
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
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-3 py-3">
      <Text
        className="text-xs uppercase tracking-wide text-white/50"
      >
        {title}
      </Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}
