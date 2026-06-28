import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import type { ApiSeason, SeasonStatus } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

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
          placeholder="2026 — Spring"
          containerClassName="[&_input]:text-neutral-900"
        />

        <SeasonStatusPicker label="Status" value={status} onChange={setStatus} />

        <Button
          variant="authPurple"
          label={updateMutation.isPending ? "Saving…" : "Save season"}
          loading={updateMutation.isPending}
          disabled={updateMutation.isPending}
          onPress={() => void handleSave()}
          className="h-11"
        />

        <Text style={{ fontFamily: fonts.body }} className="text-center text-xs text-white/45">
          Use the season picker at the top of Manage to switch which season you are viewing.
        </Text>
      </View>
    </BottomSheetModal>
  );
}
