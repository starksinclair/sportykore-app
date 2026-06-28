import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import type { ApiGame } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { toCalendarDateParam } from "@/lib/datetime";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

import { useUpdateGame } from "../../hooks";

type Props = {
  visible: boolean;
  game: ApiGame | null;
  leagueId: number;
  seasonId: number;
  onClose: () => void;
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

function kickoffFormValues(playedAt: string): { dateStr: string; timeStr: string } {
  const kickoff = new Date(playedAt);
  const dateStr = toCalendarDateParam(kickoff);
  const timeStr = `${String(kickoff.getHours()).padStart(2, "0")}:${String(kickoff.getMinutes()).padStart(2, "0")}`;
  return { dateStr, timeStr };
}

export function EditGameSheet({
  visible,
  game,
  leagueId,
  seasonId,
  onClose,
}: Props) {
  const updateMutation = useUpdateGame(leagueId, seasonId);
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [venueName, setVenueName] = useState("");

  useEffect(() => {
    if (game && visible) {
      const { dateStr: date, timeStr: time } = kickoffFormValues(game.playedAt);
      setDateStr(date);
      setTimeStr(time);
      setVenueName(game.venueName ?? "");
    }
  }, [game, visible]);

  const handleSave = async () => {
    if (!game) return;
    const playedAt = buildPlayedAtIso(dateStr, timeStr);
    if (!playedAt) {
      showInfoToast("Invalid date", "Enter a valid date and kick-off time.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        gameId: game.id,
        payload: {
          playedAt,
          venueName: venueName.trim() || null,
        },
      });
      showInfoToast("Fixture updated", "Kick-off details were saved.");
      onClose();
    } catch (err) {
      showThrownAsToast(err, "Could not update fixture");
    }
  };

  if (!game) return null;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Edit fixture"
      subtitle={`${game.homeTeam?.name ?? "Home"} vs ${game.awayTeam?.name ?? "Away"}`}
    >
      <View className="gap-4">
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
        <Button
          variant="authPurple"
          label={updateMutation.isPending ? "Saving…" : "Save changes"}
          loading={updateMutation.isPending}
          onPress={() => void handleSave()}
        />
        <Text style={{ fontFamily: fonts.body }} className="text-center text-xs text-slate-500">
          Teams cannot be changed here — delete and reschedule if needed.
        </Text>
      </View>
    </BottomSheetModal>
  );
}
