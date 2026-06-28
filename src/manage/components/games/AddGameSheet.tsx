import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import type { ApiTeam } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { toCalendarDateParam } from "@/lib/datetime";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

import { useCreateGame, useLeagueTeams } from "../../hooks";

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
  onSelect: (id: number) => void;
  excludeId?: number | null;
}) {
  const options = teams.filter((t) => t.id !== excludeId);

  return (
    <View className="gap-2">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-xs uppercase tracking-wide text-slate-500"
      >
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((team) => {
          const active = selectedId === team.id;
          return (
            <Pressable
              key={team.id}
              onPress={() => onSelect(team.id)}
              className={`rounded-xl border px-3 py-2 ${
                active
                  ? "border-brand-500 bg-brand-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <Text
                style={{ fontFamily: fonts.bodySemibold }}
                className={active ? "text-brand-700" : "text-slate-800"}
              >
                {team.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
  const [venueName, setVenueName] = useState("");
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
    setVenueName("");
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

    try {
      await createMutation.mutateAsync({
        leagueId,
        seasonId,
        homeTeamId,
        awayTeamId,
        playedAt,
        venueName: venueName.trim() || undefined,
        status: "scheduled",
        firstHalfDuration,
        secondHalfDuration,
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
      subtitle="Add a fixture for the selected season"
    >
      {teamsQuery.isLoading ? (
        <ActivityIndicator className="py-6" color="#4A148C" />
      ) : teams.length < 2 ? (
        <Text style={{ fontFamily: fonts.body }} className="text-sm text-slate-600">
          Add at least two teams to this league before scheduling games.
        </Text>
      ) : (
        <View className="gap-4">
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
          <AuthTextField
            label="Date (YYYY-MM-DD)"
            value={dateStr}
            onChangeText={setDateStr}
            placeholder="2026-05-23"
            autoCapitalize="none"
          />
          <AuthTextField
            label="Kick-off time (HH:mm) uses 24-hour format"
            value={timeStr}
            onChangeText={setTimeStr}
            placeholder="15:00"
            autoCapitalize="none"
          />
          <AuthTextField
            label="Venue (optional)"
            value={venueName}
            onChangeText={setVenueName}
            placeholder="Riverside Pitch 2"
          />
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
