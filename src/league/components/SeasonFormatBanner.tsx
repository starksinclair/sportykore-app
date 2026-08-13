import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { ApiStage } from "@/api/entities";
import { useTheme } from "@/color/use-theme";
import { describeSeasonFormat } from "../competition-format-copy";

type Props = {
  stages?: ApiStage[];
  compact?: boolean;
};

export function SeasonFormatBanner({ stages = [], compact = false }: Props) {
  const theme = useTheme();
  const copy = describeSeasonFormat(stages);

  return (
    <View
      className={[
        "rounded-[22px] border",
        compact ? "px-3 py-3" : "px-4 py-4",
      ].join(" ")}
      style={{ backgroundColor: theme.accentMuted, borderColor: theme.accent }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: theme.accent }}
        >
          <Ionicons name="git-branch-outline" size={18} color={theme.textInverse} />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text
            className="text-sm uppercase tracking-[1.5px]"
            style={{ color: theme.accent }}
          >
            Competition format
          </Text>
          <Text className="text-base" style={{ color: theme.text }}>
            {copy.label}
          </Text>
          <Text className="text-xs leading-5" style={{ color: theme.textMuted }}>
            {copy.description} {copy.lockedHint}
          </Text>
        </View>
      </View>
    </View>
  );
}
