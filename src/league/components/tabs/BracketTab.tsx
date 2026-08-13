import { Text, View } from "react-native";

import type { ApiStage, KnockoutStageConfig } from "@/api/entities";
import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import { BracketView, useStageBracket } from "@/knockout";

type Props = {
  stage: ApiStage;
};

export function LeagueBracketTab({ stage }: Props) {
  const { isDark } = useAppearance();
  const theme = useTheme();
  const bracketQuery = useStageBracket(stage.id);

  return (
    <View className="gap-4 pb-8">
      <View className="gap-1">
        <Text className="text-lg" style={{ color: theme.text }}>
          {stage.name}
        </Text>
        <Text className="text-sm" style={{ color: theme.textSubtle }}>
          {stage.status === "upcoming"
            ? "Awaiting seed"
            : stage.status === "completed"
              ? "Completed"
              : "In progress"}
        </Text>
      </View>
      <BracketView
        ties={bracketQuery.data?.ties ?? []}
        isLoading={bracketQuery.isLoading}
        tone={isDark ? "dark" : "light"}
        hasThirdPlace={Boolean(
          (stage.config as KnockoutStageConfig | undefined)?.format
            ?.has_third_place,
        )}
      />
    </View>
  );
}
