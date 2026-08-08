import type { ApiTie } from "@/api/entities";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import { seriesScoreLabel } from "../utils";

type Props = {
  tie: ApiTie;
  tone?: "light" | "dark";
  /** "bracket" renders the compact pitch-palette card used inside BracketView. */
  variant?: "default" | "bracket";
  onPress?: (tie: ApiTie) => void;
};

function TieCardBase({ tie, tone = "dark", variant = "default", onPress }: Props) {
  const isDark = tone === "dark";
  const isBracket = variant === "bracket";
  const homeName = tie.homeTeam?.name ?? (tie.isBye ? "BYE" : "TBD");
  const awayName = tie.awayTeam?.name ?? (tie.isBye ? "-" : "TBD");
  const score = seriesScoreLabel(tie);
  const homeWon = tie.winnerTeam?.id != null && tie.winnerTeam.id === tie.homeTeam?.id;
  const awayWon = tie.winnerTeam?.id != null && tie.winnerTeam.id === tie.awayTeam?.id;
  const decided = tie.status === "completed" && !tie.isBye;

  // Bracket cards always sit on the purple pitch, so they ignore `tone`.
  const teamClass = (won: boolean) =>
    isBracket
      ? won
        ? "text-accent-300"
        : decided
          ? "text-white/60"
          : "text-white"
      : isDark
        ? "text-white"
        : "text-slate-900";

  const content = (
    <View
      className={
        isBracket
          ? "w-[132px] rounded-xl border border-accent-400/40 bg-brand-800 px-2.5 py-2"
          : `min-w-[140px] rounded-xl border px-3 py-2.5 ${
              isDark ? "border-white/12 bg-white/6" : "border-slate-200 bg-white"
            }`
      }
    >
      {tie.isBye ? (
        <Text
          className={`text-xs ${
            isBracket || isDark ? "text-accent-300" : "text-brand-700"
          }`}
        >
          Bye
        </Text>
      ) : null}
      <Text
        className={`${isBracket ? "text-xs" : "text-sm"} ${teamClass(homeWon)}`}
        numberOfLines={1}
      >
        {homeName}
      </Text>
      <Text
        className={`py-1 text-center ${isBracket ? "text-xs" : "text-sm"} ${
          isBracket || isDark ? "text-accent-300" : "text-brand-700"
        }`}
      >
        {score}
      </Text>
      <Text
        className={`${isBracket ? "text-xs" : "text-sm"} ${teamClass(awayWon)}`}
        numberOfLines={1}
      >
        {awayName}
      </Text>
      {tie.tieFormat === "best_of" && tie.bestOf != null ? (
        <Text
          className={`pt-1 text-[10px] ${
            isBracket || isDark ? "text-white/45" : "text-slate-500"
          }`}
        >
          Best of {tie.bestOf}
        </Text>
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={() => onPress(tie)} className="active:opacity-80">
      {content}
    </Pressable>
  );
}

export const TieCard = memo(TieCardBase);
