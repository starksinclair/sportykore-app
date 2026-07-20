import { Text, View } from "react-native";

import type { ApiStage, KnockoutStageConfig } from "@/api/entities";
import { BracketView, useStageBracket } from "@/knockout";
import { fonts } from "@/theme/fonts";

type Props = {
  stage: ApiStage;
};

export function LeagueBracketTab({ stage }: Props) {
  const bracketQuery = useStageBracket(stage.id);

  return (
    <View className="gap-4 pb-8">
      <View className="gap-1">
        <Text style={{ fontFamily: fonts.bodyBold }} className="text-lg text-white">
          {stage.name}
        </Text>
        <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
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
