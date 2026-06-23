import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import type { ApiTeam } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { EntityLogo } from "@/components/ui";
import { LogoImageUpload } from "@/components/ui/logo-image-upload";
import type { PickedImageFile } from "@/lib/picked-image";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

import { useCreateTeam, useUpdateTeam } from "../../hooks";

type Props = {
  visible: boolean;
  onClose: () => void;
  leagueId: number;
  seasonId: number;
  team?: ApiTeam | null;
};

export function TeamFormSheet({
  visible,
  onClose,
  leagueId,
  seasonId,
  team = null,
}: Props) {
  const isEdit = team != null;
  const createMutation = useCreateTeam(leagueId, seasonId);
  const updateMutation = useUpdateTeam(leagueId, seasonId);

  const [name, setName] = useState("");
  const [logo, setLogo] = useState<PickedImageFile | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(team?.name ?? "");
    setLogo(null);
  }, [visible, team]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showInfoToast("Name required", "Enter a team name.");
      return;
    }

    try {
      if (isEdit && team) {
        const payload: { name: string; logo?: PickedImageFile } = { name: trimmed };
        if (logo) payload.logo = logo;
        await updateMutation.mutateAsync({ teamId: team.id, payload });
        showInfoToast("Team updated", `${trimmed} was saved.`);
      } else {
        await createMutation.mutateAsync({
          name: trimmed,
          logo: logo ?? undefined,
        });
        showInfoToast("Team added", `${trimmed} is now in your league.`);
      }
      onClose();
    } catch (err) {
      showThrownAsToast(err, isEdit ? "Could not update team" : "Could not add team");
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={handleClose}
      title={isEdit ? "Edit team" : "Add team"}
      subtitle={
        isEdit
          ? "Update the team name or replace its logo."
          : "Teams are shared across all seasons in this league."
      }
      variant="dark"
    >
      <View className="gap-5">
        {isEdit && team?.logoUrl && !logo ? (
          <View className="flex-row items-center gap-3">
            <EntityLogo
              logoUrl={team.logoUrl}
              variant="team"
              size="md"
              tone="dark"
            />
            <Text style={{ fontFamily: fonts.body }} className="flex-1 text-sm text-white/55">
              Current logo — pick a new image below to replace.
            </Text>
          </View>
        ) : null}

        <LogoImageUpload
          label={isEdit ? "New logo (optional)" : "Team logo (optional)"}
          value={logo}
          onChange={setLogo}
          size="md"
        />

        <AuthTextField
          label="Team name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Riverside United"
          autoCapitalize="words"
          containerClassName="[&_input]:text-neutral-900"
        />

        <Button
          variant="authPurple"
          label={isEdit ? "Save changes" : "Add team"}
          onPress={() => void handleSave()}
          loading={isPending}
          disabled={isPending}
          className="h-11"
        />
      </View>
    </BottomSheetModal>
  );
}
