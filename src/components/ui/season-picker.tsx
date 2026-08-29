import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useTheme } from "@/color/use-theme";

export type SeasonOption = {
  id: number;
  name: string;
  status?: "inactive" | "active" | "completed";
};

type Props = {
  seasons: SeasonOption[];
  activeSeasonId: number | null;
  onSelect: (seasonId: number) => void;
  label?: string;
  disabled?: boolean;
};

/** Compact dropdown selector for seasons, leagues, and team filters. */
export function SeasonPicker({
  seasons,
  activeSeasonId,
  onSelect,
  label = "Season",
  disabled = false,
}: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const active = seasons.find((season) => season.id === activeSeasonId) ?? null;
  const interactive = !disabled && seasons.length > 1;

  return (
    <View className="relative z-20">
      <Pressable
        onPress={() => {
          if (interactive) setOpen((current) => !current);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${label} picker`}
        className="flex-row items-center gap-3 rounded-2xl border px-4 py-3 active:opacity-80"
        style={{
          opacity: interactive ? 1 : 0.85,
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
        }}
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-2xl"
          style={{ backgroundColor: theme.accentMuted }}
        >
          <Ionicons name="calendar-outline" size={17} color={theme.accent} />
        </View>
        <View className="min-w-0 flex-1">
          <Text
            className="text-[11px] uppercase tracking-wide"
            style={{ color: theme.textSubtle }}
            numberOfLines={1}
          >
            {label}
          </Text>
          <Text
            className="pt-0.5 text-[15px]"
            style={{ color: theme.text }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {active?.name ?? "-"}
          </Text>
        </View>
        {interactive ? (
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color={theme.textMuted}
          />
        ) : null}
      </Pressable>

      {open && interactive ? (
        <View
          className="mt-2 overflow-hidden rounded-[18px] border"
          style={{
            backgroundColor: theme.surfaceRaised,
            borderColor: theme.cardBorder,
          }}
        >
          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 260 }}
          >
            {seasons.map((season) => {
              const selected = season.id === activeSeasonId;
              return (
                <Pressable
                  key={season.id}
                  onPress={() => {
                    onSelect(season.id);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${season.name}`}
                  className="flex-row items-center gap-3 border-b px-3.5 py-3"
                  style={{
                    backgroundColor: selected ? theme.accentMuted : "transparent",
                    borderColor: theme.cardBorder,
                  }}
                >
                  <View
                    className="h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: theme.cardMuted }}
                  >
                    <Ionicons
                      name={selected ? "checkmark" : "ellipse-outline"}
                      size={16}
                      color={selected ? theme.accent : theme.textSubtle}
                    />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text
                      className="text-sm"
                      style={{ color: selected ? theme.accent : theme.text }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {season.name}
                    </Text>
                    {season.status ? (
                      <Text
                        className="pt-0.5 text-xs capitalize"
                        style={{ color: theme.textSubtle }}
                        numberOfLines={1}
                      >
                        {season.status}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
