import { Pressable, ScrollView, Text } from "react-native";

import { useTheme } from "@/color/use-theme";
import { colors } from "@/constants";
import type { Formation } from "@/lineup/types";

type Props = {
  formations: Formation[];
  selectedId: number | null;
  onSelect: (formation: Formation) => void;
  tone?: "light" | "dark";
};

export function FormationChips({
  formations,
  selectedId,
  onSelect,
  tone = "dark",
}: Props) {
  const theme = useTheme();

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
                : "border bg-transparent",
            ].join(" ")}
            style={{
              borderColor: selected ? theme.accent : theme.inputBorder,
            }}
          >
            <Text
              style={{
                color: selected
                  ? colors.darkLabel
                  : tone === "dark"
                    ? theme.text
                    : theme.textMuted,
              }}
            >
              {formation.displayName || formation.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
