import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { useTheme } from "@/color/use-theme";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import type { FormationSlot, RosterPickerPlayer } from "@/lineup/types";
import { sortPlayersForSlot } from "@/lineup/utils";

export type PickerMode = "starter" | "substitute";

type Props = {
  visible: boolean;
  onClose: () => void;
  mode: PickerMode;
  slot?: FormationSlot | null;
  players: RosterPickerPlayer[];
  onSelect: (player: RosterPickerPlayer) => void;
  variant?: "light" | "dark";
};

export function LineupPlayerPickerSheet({
  visible,
  onClose,
  mode,
  slot = null,
  players,
  onSelect,
  variant = "dark",
}: Props) {
  const theme = useTheme();
  const [query, setQuery] = useState("");

  const title =
    mode === "substitute"
      ? "Add substitute"
      : slot
        ? `Pick ${slot.label}`
        : "Pick player";

  const subtitle =
    mode === "starter" && slot
      ? "Players matching this position appear first."
      : "Choose from your squad.";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = slot ? sortPlayersForSlot(players, slot) : [...players].sort((a, b) =>
      a.playerName.localeCompare(b.playerName),
    );
    if (!q) return sorted;
    return sorted.filter((p) => p.playerName.toLowerCase().includes(q));
  }, [players, query, slot]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      variant={variant}
    >
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search players"
        placeholderTextColor={theme.textSubtle}
        className="mb-3 rounded-xl px-4 py-3 text-sm"
        style={{
          backgroundColor: theme.inputBackground,
          color: theme.text,
        }}
      />
      {filtered.length === 0 ? (
        <Text
          style={{ color: theme.textSubtle }}
        >
          No players available.
        </Text>
      ) : (
        filtered.map((player) => (
          <Pressable
            key={player.playerId}
            onPress={() => {
              onSelect(player);
              handleClose();
            }}
            className="mb-2 flex-row items-center justify-between rounded-xl px-4 py-3 active:opacity-80"
            style={{ backgroundColor: theme.cardMuted }}
          >
            <View className="flex-1">
              <Text
                style={{ color: theme.text }}
              >
                {player.playerName}
              </Text>
              {player.position ? (
                <Text
                  className="text-xs"
                  style={{ color: theme.textSubtle }}
                >
                  {player.position}
                </Text>
              ) : null}
            </View>
            {player.jerseyNumber != null ? (
              <Text
                style={{ color: theme.accent }}
              >
                #{player.jerseyNumber}
              </Text>
            ) : null}
          </Pressable>
        ))
      )}
    </BottomSheetModal>
  );
}
