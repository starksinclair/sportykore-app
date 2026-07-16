import { Text, View } from "react-native";

import type { ApiGame, ApiTie } from "@/api/entities";
import { roundLabel, seriesScoreLabel } from "@/knockout";
import { fonts } from "@/theme/fonts";

type Props = {
  game: ApiGame;
  /** Optional enclosing tie when loaded from bracket. */
  tie?: ApiTie | null;
};

export function MatchSeriesHeader({ game, tie }: Props) {
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
    <View className="gap-1 rounded-[20px] border border-accent-400/25 bg-accent-500/10 px-4 py-3">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-xs uppercase tracking-[2px] text-accent-200/80"
      >
        Series
      </Text>
      <Text style={{ fontFamily: fonts.bodySemibold }} className="text-sm text-white">
        {stakes}
        {round ? ` · ${round}` : ""}
      </Text>
      {agg && format !== "single" ? (
        <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/65">
          Series {agg}
        </Text>
      ) : null}
    </View>
  );
}
