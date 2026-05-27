import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import type { ApiGame } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { AuthTextField } from "@/components/ui/auth-text-field";
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

export function EditScoreSheet({
  visible,
  game,
  leagueId,
  seasonId,
  onClose,
}: Props) {
  const updateMutation = useUpdateGame(leagueId, seasonId);
  const [home, setHome] = useState("0");
  const [away, setAway] = useState("0");

  useEffect(() => {
    if (game && visible) {
      setHome(String(game.homeScore ?? 0));
      setAway(String(game.awayScore ?? 0));
    }
  }, [game, visible]);

  const handleSave = async () => {
    if (!game) return;
    const homeScore = Number(home);
    const awayScore = Number(away);
    if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) {
      showInfoToast("Invalid score", "Enter numbers for both sides.");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        gameId: game.id,
        payload: { homeScore, awayScore },
      });
      onClose();
    } catch (err) {
      showThrownAsToast(err, "Could not update score");
    }
  };

  if (!game) return null;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Edit score"
      subtitle={`${game.homeTeam?.name ?? "Home"} vs ${game.awayTeam?.name ?? "Away"}`}
    >
      <View className="gap-4">
        <AuthTextField
          label="Home score"
          value={home}
          onChangeText={setHome}
          keyboardType="number-pad"
        />
        <AuthTextField
          label="Away score"
          value={away}
          onChangeText={setAway}
          keyboardType="number-pad"
        />
        <Button
          variant="authPurple"
          label="Save score"
          loading={updateMutation.isPending}
          onPress={() => void handleSave()}
        />
        <Text style={{ fontFamily: fonts.body }} className="text-center text-xs text-slate-500">
          Scores are not updated automatically when deleting stats — adjust manually if needed.
        </Text>
      </View>
    </BottomSheetModal>
  );
}
