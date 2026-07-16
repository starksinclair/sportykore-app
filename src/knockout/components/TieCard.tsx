import type { ApiTie } from "@/api/entities";
import { fonts } from "@/theme/fonts";
import { Pressable, Text, View } from "react-native";

import { seriesScoreLabel } from "../utils";

type Props = {
  tie: ApiTie;
  tone?: "light" | "dark";
  onPress?: (tie: ApiTie) => void;
};

export function TieCard({ tie, tone = "dark", onPress }: Props) {
  const isDark = tone === "dark";
  const homeName = tie.homeTeam?.name ?? (tie.isBye ? "BYE" : "TBD");
  const awayName = tie.awayTeam?.name ?? (tie.isBye ? "—" : "TBD");
  const score = seriesScoreLabel(tie);
  const homeWon = tie.winnerTeam?.id != null && tie.winnerTeam.id === tie.homeTeam?.id;
  const awayWon = tie.winnerTeam?.id != null && tie.winnerTeam.id === tie.awayTeam?.id;

  const content = (
    <View
      className={`min-w-[140px] rounded-xl border px-3 py-2.5 ${
        isDark
          ? "border-white/12 bg-white/6"
          : "border-slate-200 bg-white"
      }`}
    >
      {tie.isBye ? (
        <Text
          style={{ fontFamily: fonts.bodySemibold }}
          className={`text-xs ${isDark ? "text-accent-300" : "text-brand-700"}`}
        >
          Bye
        </Text>
      ) : null}
      <View className="flex-row items-center justify-between gap-2">
        <Text
          style={{ fontFamily: homeWon ? fonts.bodyBold : fonts.body }}
          className={`flex-1 text-sm ${isDark ? "text-white" : "text-slate-900"}`}
          numberOfLines={1}
        >
          {homeName}
        </Text>
      </View>
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className={`py-1 text-center text-sm ${
          isDark ? "text-accent-300" : "text-brand-700"
        }`}
      >
        {score}
      </Text>
      <Text
        style={{ fontFamily: awayWon ? fonts.bodyBold : fonts.body }}
        className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`}
        numberOfLines={1}
      >
        {awayName}
      </Text>
      {tie.tieFormat === "best_of" && tie.bestOf != null ? (
        <Text
          style={{ fontFamily: fonts.body }}
          className={`pt-1 text-[10px] ${isDark ? "text-white/45" : "text-slate-500"}`}
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
