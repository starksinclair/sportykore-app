import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import type { ApiTie } from "@/api/entities";
import { fonts } from "@/theme/fonts";

import {
  groupTiesByRound,
  roundLabel,
  splitTiesSides,
} from "../utils";
import { TieCard } from "./TieCard";

type Props = {
  ties: ApiTie[];
  isLoading?: boolean;
  tone?: "light" | "dark";
  onTiePress?: (tie: ApiTie) => void;
};

export function BracketView({
  ties,
  isLoading,
  tone = "dark",
  onTiePress,
}: Props) {
  const isDark = tone === "dark";

  if (isLoading) {
    return (
      <View className="items-center py-12">
        <ActivityIndicator color={isDark ? "#E6A817" : "#4A148C"} />
      </View>
    );
  }

  if (ties.length === 0) {
    return (
      <View
        className={`rounded-[22px] border border-dashed px-5 py-8 ${
          isDark
            ? "border-white/15 bg-white/5"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className={`text-base ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Bracket not ready
        </Text>
        <Text
          style={{ fontFamily: fonts.body }}
          className={`pt-2 text-sm leading-6 ${
            isDark ? "text-white/55" : "text-slate-600"
          }`}
        >
          Seed the stage to generate ties and fixtures.
        </Text>
      </View>
    );
  }

  const { rounds, thirdPlace } = groupTiesByRound(ties);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 16, paddingVertical: 4 }}
    >
      {rounds.map(({ round, ties: roundTies }) => {
        const { left, right } = splitTiesSides(roundTies);
        const showSplit = right.length > 0 && round !== "final";

        return (
          <View key={round} className="min-w-[160px] gap-3">
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className={`text-center text-xs uppercase tracking-wide ${
                isDark ? "text-white/45" : "text-slate-500"
              }`}
            >
              {roundLabel(round)}
            </Text>
            {showSplit ? (
              <View className="gap-6">
                <View className="gap-3">
                  {left.map((tie) => (
                    <TieCard
                      key={tie.id}
                      tie={tie}
                      tone={tone}
                      onPress={onTiePress}
                    />
                  ))}
                </View>
                <View className="gap-3">
                  {right.map((tie) => (
                    <TieCard
                      key={tie.id}
                      tie={tie}
                      tone={tone}
                      onPress={onTiePress}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <View className="items-center gap-3">
                {roundTies.map((tie) => (
                  <TieCard
                    key={tie.id}
                    tie={tie}
                    tone={tone}
                    onPress={onTiePress}
                  />
                ))}
              </View>
            )}
          </View>
        );
      })}
      {thirdPlace ? (
        <View className="min-w-[160px] gap-3">
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className={`text-center text-xs uppercase tracking-wide ${
              isDark ? "text-white/45" : "text-slate-500"
            }`}
          >
            {roundLabel("third_place")}
          </Text>
          <TieCard tie={thirdPlace} tone={tone} onPress={onTiePress} />
        </View>
      ) : null}
    </ScrollView>
  );
}
