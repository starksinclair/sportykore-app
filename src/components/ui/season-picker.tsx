import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

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
        className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 active:opacity-80"
        style={{ opacity: interactive ? 1 : 0.85 }}
      >
        <View className="h-9 w-9 items-center justify-center rounded-2xl bg-accent-500/15">
          <Ionicons name="calendar-outline" size={17} color={colors.accent} />
        </View>
        <View className="min-w-0 flex-1">
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className="text-[11px] uppercase tracking-wide text-white/45"
            numberOfLines={1}
          >
            {label}
          </Text>
          <Text
            style={{ fontFamily: fonts.bodySemibold }}
            className="pt-0.5 text-[15px] text-white"
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
            color="rgba(255,255,255,0.7)"
          />
        ) : null}
      </Pressable>

      {open && interactive ? (
        <View className="mt-2 overflow-hidden rounded-[18px] border border-white/10 bg-neutral-950/95">
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
                  className={`flex-row items-center gap-3 border-b border-white/10 px-3.5 py-3 ${
                    selected ? "bg-accent-500/10" : "bg-transparent"
                  }`}
                >
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-white/8">
                    <Ionicons
                      name={selected ? "checkmark" : "ellipse-outline"}
                      size={16}
                      color={selected ? colors.accent : "rgba(255,255,255,0.4)"}
                    />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text
                      style={{ fontFamily: fonts.bodySemibold }}
                      className={selected ? "text-sm text-accent-100" : "text-sm text-white"}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {season.name}
                    </Text>
                    {season.status ? (
                      <Text
                        style={{ fontFamily: fonts.body }}
                        className="pt-0.5 text-xs capitalize text-white/45"
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
