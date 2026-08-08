import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

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
        placeholderTextColor={variant === "dark" ? "rgba(255,255,255,0.35)" : "#9CA3AF"}
        className={[
          "mb-3 rounded-xl px-4 py-3 text-sm",
          variant === "dark"
            ? "bg-white/10 text-white"
            : "bg-neutral-100 text-neutral-900",
        ].join(" ")}
      />
      {filtered.length === 0 ? (
        <Text
          className={variant === "dark" ? "text-white/50" : "text-neutral-500"}
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
            className={[
              "mb-2 flex-row items-center justify-between rounded-xl px-4 py-3 active:opacity-80",
              variant === "dark" ? "bg-white/8" : "bg-neutral-50",
            ].join(" ")}
          >
            <View className="flex-1">
              <Text
                className={variant === "dark" ? "text-white" : "text-neutral-900"}
              >
                {player.playerName}
              </Text>
              {player.position ? (
                <Text
                  className={
                    variant === "dark" ? "text-xs text-white/45" : "text-xs text-neutral-500"
                  }
                >
                  {player.position}
                </Text>
              ) : null}
            </View>
            {player.jerseyNumber != null ? (
              <Text
                className={variant === "dark" ? "text-accent-300" : "text-brand-600"}
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
