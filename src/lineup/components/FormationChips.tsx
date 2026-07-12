import { ScrollView, Pressable, Text, View } from "react-native";

import type { Formation } from "@/lineup/types";
import { fonts } from "@/theme/fonts";

type Props = {
  formations: Formation[];
  selectedId: number | null;
  onSelect: (formation: Formation) => void;
};

export function FormationChips({ formations, selectedId, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-1"
    >
      {formations.map((formation) => {
        const selected = formation.id === selectedId;
        return (
          <Pressable
            key={formation.id}
            onPress={() => onSelect(formation)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={[
              "rounded-full px-4 py-2.5",
              selected
                ? "bg-accent-400"
                : "border border-accent-400 bg-transparent",
            ].join(" ")}
          >
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className={selected ? "text-brand-900" : "text-white"}
            >
              {formation.displayName || formation.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
