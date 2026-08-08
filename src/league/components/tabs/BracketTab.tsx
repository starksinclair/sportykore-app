import { Text, View } from "react-native";

import type { ApiStage, KnockoutStageConfig } from "@/api/entities";
import { BracketView, useStageBracket } from "@/knockout";

type Props = {
  stage: ApiStage;
};

export function LeagueBracketTab({ stage }: Props) {
  const bracketQuery = useStageBracket(stage.id);

  return (
    <View className="gap-4 pb-8">
      <View className="gap-1">
        <Text className="text-lg text-white">
          {stage.name}
        </Text>
        <Text className="text-sm text-white/55">
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
        tone="dark"
        hasThirdPlace={Boolean(
          (stage.config as KnockoutStageConfig | undefined)?.format
            ?.has_third_place,
        )}
      />
    </View>
  );
}
