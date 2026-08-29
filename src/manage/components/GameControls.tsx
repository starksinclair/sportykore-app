import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
} from "react-native";

import type { ApiGame, GameStatus } from "@/api/entities";
import { useTheme } from "@/color/use-theme";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { colors } from "@/constants";
import {
  useCompletePenaltyShootout,
  useEnterPenaltyShootout,
} from "@/knockout";
import { posthog } from "@/lib/posthog";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";

import { useGameTimeActions } from "../hooks";

type Props = {
  game: ApiGame;
  leagueId: number;
  seasonId: number;
  onFullTime?: () => void;
};

type ClockActionKey = "extraTime" | "penalties" | "pause";

export function GameControls({ game, leagueId, seasonId, onFullTime }: Props) {
  const theme = useTheme();
  const actions = useGameTimeActions(game.id, leagueId, seasonId);
  const enterPens = useEnterPenaltyShootout(game.id, leagueId);
  const completePens = useCompletePenaltyShootout(game.id, leagueId);

  const [fullTimeOpen, setFullTimeOpen] = useState(false);
  const [pensOpen, setPensOpen] = useState(false);
  const [clockAction, setClockAction] = useState<ClockActionKey | null>(null);
  const [homeScore, setHomeScore] = useState(String(game.homeScore ?? 0));
  const [awayScore, setAwayScore] = useState(String(game.awayScore ?? 0));
  const [homePens, setHomePens] = useState("0");
  const [awayPens, setAwayPens] = useState("0");

  useEffect(() => {
    setHomeScore(String(game.homeScore ?? 0));
    setAwayScore(String(game.awayScore ?? 0));
  }, [game.homeScore, game.awayScore, fullTimeOpen]);

  const pending =
    actions.isPending || enterPens.isPending || completePens.isPending;

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
      posthog?.capture("match_completed", {
        league_id: leagueId,
        season_id: seasonId,
        game_id: game.id,
        completion_method: "full_time",
        score_difference: Math.abs(home - away),
        is_draw: home === away,
      });
      setFullTimeOpen(false);
      onFullTime?.();
    } catch (err) {
      showThrownAsToast(err, "Could not end match");
    }
  };

  const handleClockAction = async () => {
    if (!clockAction) return;
    const action = clockAction;
    setClockAction(null);

    if (action === "extraTime") {
      await run(
        () => actions.startExtraTime.mutateAsync(),
        "Could not start extra time",
      );
      return;
    }

    if (action === "penalties") {
      await run(async () => {
        await enterPens.mutateAsync();
        setPensOpen(true);
      }, "Could not start penalties");
      return;
    }

    await run(() => actions.pause.mutateAsync(), "Could not pause match");
  };

  const handleCompletePens = async () => {
    const home = Number(homePens);
    const away = Number(awayPens);
    if (!Number.isInteger(home) || !Number.isInteger(away) || home === away) {
      showInfoToast(
        "Invalid penalties",
        "Enter unequal whole numbers for both sides.",
      );
      return;
    }
    try {
      await completePens.mutateAsync({
        homePenaltyScore: home,
        awayPenaltyScore: away,
      });
      posthog?.capture("penalty_shootout_completed", {
        league_id: leagueId,
        game_id: game.id,
        score_difference: Math.abs(home - away),
      });
      setPensOpen(false);
      onFullTime?.();
    } catch (err) {
      showThrownAsToast(err, "Could not complete penalties");
    }
  };

  const buttons = controlsForStatus(game.status);
  if (!buttons.length) return null;

  return (
    <>
      <View
        className="gap-4 rounded-[24px] border px-4 py-4"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        <View className="flex-row items-center gap-3">
          <View
            className="h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: theme.accentMuted }}
          >
            <Ionicons name="timer-outline" size={20} color={theme.accent} />
          </View>
          <View className="min-w-0 flex-1">
            <Text style={{ color: theme.text }}>
              Match clock
            </Text>
            <Text
              className="text-xs leading-5"
              style={{ color: theme.textSubtle }}
              numberOfLines={2}
            >
              Move the game through live periods and final decisions.
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {buttons.includes("startFirstHalf") ? (
            <MatchControlButton
              icon="play"
              label="Start first half"
              tone="primary"
              loading={actions.startFirstHalf.isPending}
              disabled={pending}
              wide={buttons.length === 1}
              onPress={() =>
                void run(() => actions.startFirstHalf.mutateAsync(), "Could not start first half")
              }
            />
          ) : null}
          {buttons.includes("halfTime") ? (
            <MatchControlButton
              icon="pause-circle-outline"
              label="Half time"
              tone="accent"
              loading={actions.startHalfTime.isPending}
              disabled={pending}
              onPress={() =>
                void run(() => actions.startHalfTime.mutateAsync(), "Could not start half time")
              }
            />
          ) : null}
          {buttons.includes("startSecondHalf") ? (
            <MatchControlButton
              icon="play"
              label="Start second half"
              tone="primary"
              loading={actions.startSecondHalf.isPending}
              disabled={pending}
              wide={buttons.length === 1}
              onPress={() =>
                void run(
                  () => actions.startSecondHalf.mutateAsync(),
                  "Could not start second half",
                )
              }
            />
          ) : null}
          {buttons.includes("extraTime") ? (
            <MatchControlButton
              icon="add-circle-outline"
              label="Extra time"
              tone="subtle"
              loading={actions.startExtraTime.isPending}
              disabled={pending}
              onPress={() => setClockAction("extraTime")}
            />
          ) : null}
          {buttons.includes("penalties") ? (
            <MatchControlButton
              icon="football-outline"
              label="Penalties"
              tone="subtle"
              loading={enterPens.isPending}
              disabled={pending}
              onPress={() => setClockAction("penalties")}
            />
          ) : null}
          {buttons.includes("completePens") ? (
            <MatchControlButton
              icon="football"
              label="Enter penalty scores"
              tone="accent"
              disabled={pending}
              wide={buttons.length === 1}
              onPress={() => setPensOpen(true)}
            />
          ) : null}
          {buttons.includes("pause") ? (
            <MatchControlButton
              icon="pause"
              label="Pause"
              tone="danger"
              loading={actions.pause.isPending}
              disabled={pending}
              onPress={() => setClockAction("pause")}
            />
          ) : null}
          {buttons.includes("resume") ? (
            <MatchControlButton
              icon="play"
              label="Resume"
              tone="primary"
              loading={actions.resume.isPending}
              disabled={pending}
              wide={buttons.length === 1}
              onPress={() =>
                void run(() => actions.resume.mutateAsync(), "Could not resume match")
              }
            />
          ) : null}
          {buttons.includes("fullTime") ? (
            <MatchControlButton
              icon="flag"
              label="End game"
              tone="finish"
              disabled={pending}
              onPress={() => setFullTimeOpen(true)}
            />
          ) : null}
        </View>
      </View>

      <BottomSheetModal
        visible={fullTimeOpen}
        onClose={() => setFullTimeOpen(false)}
        title="End game"
        subtitle="Confirm the final score before closing the match."
      >
        <View className="gap-4">
          <ActionDetailCard
            icon="flag"
            title="What ending the game does"
            theme={theme}
            details={[
              "Saves the final home and away score.",
              "Marks the match as finished on the server.",
              "Clears any pause state and resolves the winner when the score is decisive.",
              "If this match belongs to a knockout tie, the tie can advance after the result is saved.",
            ]}
          />
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
            label="End game"
            loading={actions.endFullTime.isPending}
            onPress={() => void handleFullTime()}
          />
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        visible={clockAction != null}
        onClose={() => setClockAction(null)}
        title={clockAction ? clockActionDetails[clockAction].title : "Match action"}
        subtitle={clockAction ? clockActionDetails[clockAction].subtitle : undefined}
      >
        {clockAction ? (
          <View className="gap-4">
            <ActionDetailCard
              icon={clockActionDetails[clockAction].icon}
              title={clockActionDetails[clockAction].detailTitle}
              details={clockActionDetails[clockAction].details}
              theme={theme}
            />
            <Button
              variant="authPurple"
              label={clockActionDetails[clockAction].confirmLabel}
              loading={
                clockAction === "extraTime"
                  ? actions.startExtraTime.isPending
                  : clockAction === "penalties"
                    ? enterPens.isPending
                    : actions.pause.isPending
              }
              disabled={pending}
              onPress={() => void handleClockAction()}
              className={
                clockAction === "pause"
                  ? "border-red-300/20 bg-red-500/15"
                  : undefined
              }
            />
          </View>
        ) : (
          <View />
        )}
      </BottomSheetModal>

      <BottomSheetModal
        visible={pensOpen}
        onClose={() => setPensOpen(false)}
        title="Penalty shootout"
        subtitle="Scores must differ to confirm a winner."
      >
        <View className="gap-4">
          <ActionDetailCard
            icon="football"
            title="What confirming penalties does"
            theme={theme}
            details={[
              "Saves the home and away penalty scores.",
              "The scores must be different so the match has a winner.",
              "Marks the match as finished after the winner is set.",
              "If this match belongs to a knockout tie, the tie can advance after penalties are saved.",
            ]}
          />
          <AuthTextField
            label="Home penalties"
            value={homePens}
            onChangeText={setHomePens}
            keyboardType="number-pad"
          />
          <AuthTextField
            label="Away penalties"
            value={awayPens}
            onChangeText={setAwayPens}
            keyboardType="number-pad"
          />
          <Button
            variant="authPurple"
            label="Confirm penalties"
            loading={completePens.isPending}
            onPress={() => void handleCompletePens()}
          />
        </View>
      </BottomSheetModal>
    </>
  );
}

const clockActionDetails: Record<
  ClockActionKey,
  {
    title: string;
    subtitle: string;
    detailTitle: string;
    confirmLabel: string;
    icon: keyof typeof Ionicons.glyphMap;
    details: string[];
  }
> = {
  extraTime: {
    title: "Start extra time",
    subtitle: "Use this when regular time needs an extra period.",
    detailTitle: "What extra time does",
    confirmLabel: "Start extra time",
    icon: "add-circle-outline",
    details: [
      "Moves the match from second half into extra time.",
      "Starts the extra-time clock from now.",
      "Clears any pause state and broadcasts the new match status.",
    ],
  },
  penalties: {
    title: "Start penalties",
    subtitle: "Use this when the match must be decided by a shootout.",
    detailTitle: "What penalties does",
    confirmLabel: "Start penalties",
    icon: "football-outline",
    details: [
      "Moves the match into penalty shootout.",
      "Keeps the regular match score as it is.",
      "After this, enter unequal penalty scores to pick the winner.",
    ],
  },
  pause: {
    title: "Pause match",
    subtitle: "Use this when play stops and the live clock should freeze.",
    detailTitle: "What pause does",
    confirmLabel: "Pause match",
    icon: "pause",
    details: [
      "Stores the current live period before pausing.",
      "Freezes the clock at the current minute.",
      "When you resume, the server shifts the period start time so the clock stays accurate.",
    ],
  },
};

function ActionDetailCard({
  icon,
  title,
  details,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  details: string[];
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View
      className="gap-3 rounded-[20px] border px-4 py-4"
      style={{ backgroundColor: theme.cardMuted, borderColor: theme.cardBorder }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: theme.accentMuted }}
        >
          <Ionicons name={icon} size={19} color={theme.accent} />
        </View>
        <Text className="min-w-0 flex-1" style={{ color: theme.text }}>
          {title}
        </Text>
      </View>
      <View className="gap-2">
        {details.map((detail) => (
          <View key={detail} className="flex-row items-start gap-2">
            <View
              className="mt-2 h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: theme.accent }}
            />
            <Text
              className="min-w-0 flex-1 text-sm leading-6"
              style={{ color: theme.textMuted }}
            >
              {detail}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

type ControlButtonTone = "primary" | "accent" | "subtle" | "danger" | "finish";

const controlButtonClass: Record<ControlButtonTone, string> = {
  primary: "border-brand-400/35 bg-brand-500 active:bg-brand-600",
  accent: "border-accent-400/70 bg-accent-500/20 active:bg-accent-500/25",
  subtle: "border-white/15 bg-white/10 active:bg-white/15",
  danger: "border-red-300/30 bg-red-500/15 active:bg-red-500/20",
  finish: "border-accent-300 bg-accent-500 active:opacity-90",
};

const controlLabelClass: Record<ControlButtonTone, string> = {
  primary: "text-white",
  accent: "text-accent-100",
  subtle: "text-white",
  danger: "text-red-100",
  finish: "text-neutral-950",
};

const controlIconColor: Record<ControlButtonTone, string> = {
  primary: colors.white,
  accent: colors.accent,
  subtle: colors.white,
  danger: colors.white,
  finish: colors.darkLabel,
};

function MatchControlButton({
  icon,
  label,
  tone,
  loading,
  disabled,
  wide,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: ControlButtonTone;
  loading?: boolean;
  disabled?: boolean;
  wide?: boolean;
  onPress: PressableProps["onPress"];
}) {
  const inactive = disabled || loading;
  const indicatorColor = tone === "finish" ? colors.darkLabel : colors.white;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={{ flexGrow: 1, minWidth: wide ? "100%" : 132 }}
      className={`h-11 flex-row items-center justify-center gap-2 rounded-full border px-3 ${
        controlButtonClass[tone]
      } ${inactive ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={indicatorColor} />
      ) : (
        <>
          <Ionicons name={icon} size={16} color={controlIconColor[tone]} />
          <Text
            className={`min-w-0 text-center text-xs ${controlLabelClass[tone]}`}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

type ControlKey =
  | "startFirstHalf"
  | "halfTime"
  | "startSecondHalf"
  | "extraTime"
  | "penalties"
  | "completePens"
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
      return ["fullTime", "extraTime", "penalties", "pause"];
    case "extra_time":
      return ["fullTime", "penalties", "pause"];
    case "penalty_shootout":
      return ["completePens", "pause"];
    case "paused":
      return ["resume"];
    default:
      return [];
  }
}
