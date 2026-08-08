import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import type { ApiSeason, SeasonStatus } from "@/api/entities";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { colors } from "@/constants";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";

import { useUpdateSeason } from "../../hooks";
import { SeasonStatusEnum } from "../../types";
import { SeasonStatusPicker } from "./SeasonStatusPicker";

type Props = {
  visible: boolean;
  onClose: () => void;
  leagueId: number;
  season: ApiSeason | null;
  onUpdated?: (seasonId: number) => void;
};

export function EditSeasonSheet({
  visible,
  onClose,
  leagueId,
  season,
  onUpdated,
}: Props) {
  const seasonId = season?.id ?? 0;
  const updateMutation = useUpdateSeason(leagueId, seasonId);

  const [name, setName] = useState("");
  const [status, setStatus] = useState<SeasonStatus>(SeasonStatusEnum.Inactive);

  useEffect(() => {
    if (!visible || !season) return;
    setName(season.name);
    setStatus(season.status);
  }, [visible, season]);

  const handleClose = () => {
    if (updateMutation.isPending) return;
    onClose();
  };

  const handleSave = async () => {
    if (!season) return;
    const trimmed = name.trim();
    if (!trimmed) {
      showInfoToast("Season name required", "Enter a season name.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        name: trimmed,
        status,
      });
      showInfoToast("Season updated", "Your changes were saved.");
      if (status === SeasonStatusEnum.Active) {
        onUpdated?.(season.id);
      }
      onClose();
    } catch (err) {
      showThrownAsToast(err, "Could not update season");
    }
  };

  if (!season) return null;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={handleClose}
      title="Edit season"
      subtitle="Marking Active completes any other active season in this league."
      variant="dark"
    >
      <View className="gap-5">
        <AuthTextField
          label="Season name"
          value={name}
          onChangeText={setName}
          placeholder="2026 - Spring"
          containerClassName="[&_input]:text-neutral-900"
        />

        <SeasonStatusPicker label="Status" value={status} onChange={setStatus} />

        <Pressable
          onPress={() => void handleSave()}
          disabled={updateMutation.isPending}
          accessibilityRole="button"
          className={`h-11 flex-row items-center justify-center gap-2 rounded-full border border-accent-400 bg-accent-500 px-4 active:opacity-90 ${
            updateMutation.isPending ? "opacity-50" : ""
          }`}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color={colors.darkLabel} size="small" />
          ) : (
            <Ionicons name="save-outline" size={16} color={colors.darkLabel} />
          )}
          <Text
            className="text-sm text-neutral-950"
            numberOfLines={1}
          >
            {updateMutation.isPending ? "Saving..." : "Save season"}
          </Text>
        </Pressable>

        <Text className="text-center text-xs text-white/45">
          Use the season picker at the top of Manage to switch which season you are viewing.
        </Text>
      </View>
    </BottomSheetModal>
  );
}
