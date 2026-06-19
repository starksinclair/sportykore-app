import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import type { ApiGame, GameStatus } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

import { useGameTimeActions } from "../hooks";

type Props = {
  game: ApiGame;
  leagueId: number;
  seasonId: number;
  onFullTime?: () => void;
};

export function GameControls({ game, leagueId, seasonId, onFullTime }: Props) {
  const actions = useGameTimeActions(game.id, leagueId, seasonId);
  const [fullTimeOpen, setFullTimeOpen] = useState(false);
  const [homeScore, setHomeScore] = useState(String(game.homeScore ?? 0));
  const [awayScore, setAwayScore] = useState(String(game.awayScore ?? 0));

  useEffect(() => {
    setHomeScore(String(game.homeScore ?? 0));
    setAwayScore(String(game.awayScore ?? 0));
  }, [game.homeScore, game.awayScore, fullTimeOpen]);

  const run = async (fn: () => Promise<unknown>, errorTitle: string) => {
    try {
      await fn();
    } catch (err) {
      showThrownAsToast(err, errorTitle);
    }
  };

  const handleFullTime = async () => {
    const home = Number(homeScore);
    const away = Number(awayScore);
    if (!Number.isFinite(home) || !Number.isFinite(away)) {
      showInfoToast("Invalid score", "Enter numbers for both sides.");
      return;
    }
    try {
      await actions.endFullTime.mutateAsync({ homeScore: home, awayScore: away });
      setFullTimeOpen(false);
      onFullTime?.();
    } catch (err) {
      showThrownAsToast(err, "Could not end match");
    }
  };

  const buttons = controlsForStatus(game.status);
  if (!buttons.length) return null;

  return (
    <>
      <View className="gap-3 rounded-[24px] border border-brand-400/30 bg-brand-500/10 px-4 py-4">
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-xs uppercase tracking-[2px] text-white/55"
        >
          Match clock
        </Text>
        <View className="gap-2">
          {buttons.includes("startFirstHalf") ? (
            <Button
              variant="authPurple"
              label="Start first half"
              loading={actions.startFirstHalf.isPending}
              disabled={actions.isPending}
              onPress={() =>
                void run(() => actions.startFirstHalf.mutateAsync(), "Could not start first half")
              }
            />
          ) : null}
          {buttons.includes("halfTime") ? (
            <Button
              variant="accent"
              label="Half time"
              loading={actions.startHalfTime.isPending}
              disabled={actions.isPending}
              onPress={() =>
                void run(() => actions.startHalfTime.mutateAsync(), "Could not start half time")
              }
            />
          ) : null}
          {buttons.includes("startSecondHalf") ? (
            <Button
              variant="authPurple"
              label="Start second half"
              loading={actions.startSecondHalf.isPending}
              disabled={actions.isPending}
              onPress={() =>
                void run(
                  () => actions.startSecondHalf.mutateAsync(),
                  "Could not start second half",
                )
              }
            />
          ) : null}
          {buttons.includes("extraTime") ? (
            <Button
              variant="secondary"
              label="Extra time"
              loading={actions.startExtraTime.isPending}
              disabled={actions.isPending}
              onPress={() =>
                void run(() => actions.startExtraTime.mutateAsync(), "Could not start extra time")
              }
            />
          ) : null}
          {buttons.includes("pause") ? (
            <Button
              variant="secondary"
              label="Pause"
              loading={actions.pause.isPending}
              disabled={actions.isPending}
              onPress={() =>
                void run(() => actions.pause.mutateAsync(), "Could not pause match")
              }
            />
          ) : null}
          {buttons.includes("resume") ? (
            <Button
              variant="authPurple"
              label="Resume"
              loading={actions.resume.isPending}
              disabled={actions.isPending}
              onPress={() =>
                void run(() => actions.resume.mutateAsync(), "Could not resume match")
              }
            />
          ) : null}
          {buttons.includes("fullTime") ? (
            <Button
              variant="accent"
              label="Full time"
              disabled={actions.isPending}
              onPress={() => setFullTimeOpen(true)}
            />
          ) : null}
        </View>
      </View>

      <BottomSheetModal
        visible={fullTimeOpen}
        onClose={() => setFullTimeOpen(false)}
        title="Full time"
        subtitle="Confirm the final score before ending the match."
      >
        <View className="gap-4">
          <AuthTextField
            label="Home score"
            value={homeScore}
            onChangeText={setHomeScore}
            keyboardType="number-pad"
          />
          <AuthTextField
            label="Away score"
            value={awayScore}
            onChangeText={setAwayScore}
            keyboardType="number-pad"
          />
          <Button
            variant="authPurple"
            label="Confirm full time"
            loading={actions.endFullTime.isPending}
            onPress={() => void handleFullTime()}
          />
        </View>
      </BottomSheetModal>
    </>
  );
}

type ControlKey =
  | "startFirstHalf"
  | "halfTime"
  | "startSecondHalf"
  | "extraTime"
  | "fullTime"
  | "pause"
  | "resume";

function controlsForStatus(status: GameStatus): ControlKey[] {
  switch (status) {
    case "scheduled":
    case "postponed":
      return ["startFirstHalf"];
    case "first_half":
    case "live":
      return ["halfTime", "pause"];
    case "half_time":
    case "break":
      return ["startSecondHalf"];
    case "second_half":
      return ["fullTime", "extraTime", "pause"];
    case "extra_time":
      return ["fullTime", "pause"];
    case "paused":
      return ["resume"];
    default:
      return [];
  }
}
