import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { ApiStage } from "@/api/entities";
import { colors } from "@/constants";
import { describeSeasonFormat } from "../competition-format-copy";

type Props = {
  stages?: ApiStage[];
  compact?: boolean;
};

export function SeasonFormatBanner({ stages = [], compact = false }: Props) {
  const copy = describeSeasonFormat(stages);

  return (
    <View
      className={[
        "rounded-[22px] border border-accent-400/20 bg-accent-500/10",
        compact ? "px-3 py-3" : "px-4 py-4",
      ].join(" ")}
    >
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-accent-500">
          <Ionicons name="git-branch-outline" size={18} color={colors.darkLabel} />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-sm uppercase tracking-[1.5px] text-accent-100/65">
            Competition format
          </Text>
          <Text className="text-base text-white">
            {copy.label}
          </Text>
          <Text className="text-xs leading-5 text-white/60">
            {copy.description} {copy.lockedHint}
          </Text>
        </View>
      </View>
    </View>
  );
}
