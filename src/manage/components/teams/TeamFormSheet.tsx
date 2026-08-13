import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import { EntityLogo } from "@/components/ui";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { LogoImageUpload } from "@/components/ui/logo-image-upload";
import type { PickedImageFile } from "@/lib/picked-image";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";

import { useCreateTeam, useUpdateTeam } from "../../hooks";
import type { ManagedTeam } from "../../types";
import { TeamAdminsSection } from "./TeamAdminsSection";

type Props = {
  visible: boolean;
  onClose: () => void;
  leagueId: number;
  seasonId: number;
  team?: ManagedTeam | null;
};

export function TeamFormSheet({
  visible,
  onClose,
  leagueId,
  seasonId,
  team = null,
}: Props) {
  const { isDark } = useAppearance();
  const theme = useTheme();
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
          ? "Update the team name, logo, or assign team managers."
          : "Teams are shared across all seasons in this league."
      }
    >
      <View className="gap-4">
        <TeamSheetBlock title="Team identity" theme={theme}>
          {isEdit && team?.logoUrl && !logo ? (
            <View
              className="flex-row items-center gap-3 rounded-2xl border px-3 py-3"
              style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
            >
              <EntityLogo
                logoUrl={team.logoUrl}
                variant="team"
                size="md"
                tone={isDark ? "dark" : "light"}
              />
              <View className="flex-1 gap-0.5">
                <Text
                  className="text-sm"
                  style={{ color: theme.text }}
                >
                  Current logo
                </Text>
                <Text
                  className="text-xs leading-5"
                  style={{ color: theme.textSubtle }}
                >
                  Pick a new image below to replace it.
                </Text>
              </View>
            </View>
          ) : null}

          <View className="gap-2">
            <Text
              className="text-[11px] uppercase tracking-wider"
              style={{ color: theme.textMuted }}
            >
              {isEdit ? "New logo (optional)" : "Team logo (optional)"}
            </Text>
            <LogoImageUpload
              hint="Optional. Square images look best."
              value={logo}
              onChange={setLogo}
              size="md"
            />
          </View>

          <AuthTextField
            label="Team name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Riverside United"
            autoCapitalize="words"
          />
        </TeamSheetBlock>

        {isEdit && team ? (
          <TeamAdminsSection leagueId={leagueId} teamId={team.id} />
        ) : null}

        <Pressable
          onPress={() => void handleSave()}
          disabled={isPending}
          accessibilityRole="button"
          className={`h-11 flex-row items-center justify-center gap-2 rounded-full border px-4 active:opacity-90 ${
            isPending ? "opacity-50" : ""
          }`}
          style={{ backgroundColor: theme.accent, borderColor: theme.accent }}
        >
          {isPending ? (
            <ActivityIndicator color={theme.textInverse} size="small" />
          ) : (
            <Ionicons
              name={isEdit ? "save-outline" : "add"}
              size={17}
              color={theme.textInverse}
            />
          )}
          <Text
            className="text-sm"
            style={{ color: theme.textInverse }}
            numberOfLines={1}
          >
            {isPending ? "Saving..." : isEdit ? "Save changes" : "Add team"}
          </Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

function TeamSheetBlock({
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
