import { useEffect, useState, type ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { ApiGame } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { NativeDatePickerField } from "@/components/ui/native-date-picker-field";
import { toCalendarDateParam } from "@/lib/datetime";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

import { useUpdateGame } from "../../hooks";
import {
  GameVenuePicker,
  venuePayloadFromSelection,
  type GameVenueSelection,
} from "./GameVenuePicker";

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

function selectionFromGame(game: ApiGame): GameVenueSelection {
  if (game.venueId != null) {
    return {
      kind: "venue",
      venueId: game.venueId,
      name: game.venue?.name ?? game.venueName ?? "",
    };
  }
  if (game.venueName?.trim()) {
    return { kind: "one_off", venueName: game.venueName };
  }
  return { kind: "none" };
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
  const [venueSelection, setVenueSelection] = useState<GameVenueSelection>({
    kind: "none",
  });

  useEffect(() => {
    if (game && visible) {
      const { dateStr: date, timeStr: time } = kickoffFormValues(game.playedAt);
      setDateStr(date);
      setTimeStr(time);
      setVenueSelection(selectionFromGame(game));
    }
  }, [game, visible]);

  const handleSave = async () => {
    if (!game) return;
    const playedAt = buildPlayedAtIso(dateStr, timeStr);
    if (!playedAt) {
      showInfoToast("Invalid date", "Enter a valid date and kick-off time.");
      return;
    }

    const venueFields = venuePayloadFromSelection(venueSelection);

    try {
      await updateMutation.mutateAsync({
        gameId: game.id,
        payload: {
          playedAt,
          ...venueFields,
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
      variant="dark"
    >
      <View className="gap-4">
        <GameSheetBlock title="Kick-off">
          <NativeDatePickerField
            label="Date"
            value={dateStr}
            onChange={(value) => setDateStr(value ?? "")}
            placeholder="Pick fixture date"
            labelClassName="text-white/60"
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
        <Button
          variant="authPurple"
          label={updateMutation.isPending ? "Saving…" : "Save changes"}
          loading={updateMutation.isPending}
          onPress={() => void handleSave()}
        />
        <View className="flex-row items-start gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <Ionicons name="information-circle-outline" size={17} color="#E6A817" />
          <Text
            style={{ fontFamily: fonts.body }}
            className="min-w-0 flex-1 text-xs leading-5 text-white/50"
          >
            Teams cannot be changed here. Delete and reschedule if needed.
          </Text>
        </View>
      </View>
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
        style={{ fontFamily: fonts.bodyBold }}
        className="text-xs uppercase tracking-wide text-white/50"
      >
        {title}
      </Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}
