import { Text, View } from "react-native";

import type { ApiGame, ApiTie } from "@/api/entities";
import { useTheme } from "@/color/use-theme";
import { roundLabel, seriesScoreLabel } from "@/knockout";

type Props = {
  game: ApiGame;
  /** Optional enclosing tie when loaded from bracket. */
  tie?: ApiTie | null;
};

export function MatchSeriesHeader({ game, tie }: Props) {
  const theme = useTheme();

  if (game.tieId == null && !tie) return null;

  const format = tie?.tieFormat ?? "single";
  const leg = game.leg;
  const bestOf = tie?.bestOf;
  const targetWins = tie?.targetWins;
  const agg =
    tie != null
      ? seriesScoreLabel(tie)
      : game.homeScore != null && game.awayScore != null
        ? `${game.homeScore}–${game.awayScore}`
        : null;

  let stakes = "Knockout tie";
  if (format === "two_legged" && leg != null) {
    stakes = `Leg ${leg} of 2`;
  } else if (format === "best_of" && bestOf != null && leg != null) {
    stakes = `Game ${leg} of ${bestOf}`;
    if (targetWins != null) stakes += ` · first to ${targetWins}`;
  } else if (format === "single") {
    stakes = "Single-leg knockout";
  }

  const round = game.round ? roundLabel(game.round) : null;

  return (
    <View
      className="gap-1 rounded-[20px] border px-4 py-3"
      style={{
        backgroundColor: theme.accentMuted,
        borderColor: theme.accent,
      }}
    >
      <Text
        className="text-xs uppercase tracking-[2px]"
        style={{ color: theme.accent }}
      >
        Series
      </Text>
      <Text className="text-sm" style={{ color: theme.text }}>
        {stakes}
        {round ? ` · ${round}` : ""}
      </Text>
      {agg && format !== "single" ? (
        <Text className="text-sm" style={{ color: theme.textMuted }}>
          Series {agg}
        </Text>
      ) : null}
    </View>
  );
}
