import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import type { ApiGame } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { colors } from "@/constants";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";

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
      variant="dark"
    >
      <View className="gap-4">
        <View className="gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-3 py-3">
          <Text className="text-xs uppercase tracking-wide text-white/50">
            Scoreline
          </Text>
          <View className="flex-row gap-3">
            <View className="min-w-0 flex-1 gap-2">
              <Text className="text-xs text-white/45" numberOfLines={1}>
                {game.homeTeam?.name ?? "Home"}
              </Text>
              <AuthTextField
                label="Home score"
                labelClassName="text-white/60"
                value={home}
                onChangeText={setHome}
                keyboardType="number-pad"
              />
            </View>
            <View className="min-w-0 flex-1 gap-2">
              <Text className="text-xs text-white/45" numberOfLines={1}>
                {game.awayTeam?.name ?? "Away"}
              </Text>
              <AuthTextField
                label="Away score"
                labelClassName="text-white/60"
                value={away}
                onChangeText={setAway}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>
        <Button
          variant="authPurple"
          label={updateMutation.isPending ? "Saving…" : "Save score"}
          loading={updateMutation.isPending}
          onPress={() => void handleSave()}
        />
        <View className="flex-row items-start gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <Ionicons
            name="information-circle-outline"
            size={17}
            color={colors.accent}
          />
          <Text className="min-w-0 flex-1 text-xs leading-5 text-white/50">
            Scores are not updated automatically when deleting stats. Adjust manually if needed.
          </Text>
        </View>
      </View>
    </BottomSheetModal>
  );
}
