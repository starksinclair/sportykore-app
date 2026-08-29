import { Pressable, Text, View } from "react-native";

import type { SeasonStatus } from "@/api/entities";
import { useTheme } from "@/color/use-theme";

import { SeasonStatusEnum } from "../../types";

const SEASON_STATUS_OPTIONS = [
  SeasonStatusEnum.Inactive,
  SeasonStatusEnum.Active,
  SeasonStatusEnum.Completed,
] as const;

type Props = {
  label: string;
  value: SeasonStatus;
  onChange: (status: SeasonStatus) => void;
};

export function SeasonStatusPicker({ label, value, onChange }: Props) {
  const theme = useTheme();

  return (
    <View className="gap-2">
      <Text
        className="text-xs uppercase tracking-wide"
        style={{ color: theme.textMuted }}
      >
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {SEASON_STATUS_OPTIONS.map((status) => {
          const active = value === status;
          return (
            <Pressable
              key={status}
              onPress={() => onChange(status)}
              className="rounded-xl border px-3 py-2 capitalize active:opacity-85"
              style={{
                backgroundColor: active ? theme.accentMuted : theme.cardMuted,
                borderColor: active ? theme.accent : theme.cardBorder,
              }}
            >
              <Text
                style={{ color: active ? theme.accent : theme.textSubtle }}
              >
                {status}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
