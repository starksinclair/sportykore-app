import { Pressable, Text, View } from "react-native";

import type { SeasonStatus } from "@/api/entities";
import { fonts } from "@/theme/fonts";

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
  return (
    <View className="gap-2">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-xs uppercase tracking-wide text-white/45"
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
              className={`rounded-xl border px-3 py-2 capitalize ${
                active ? "border-accent-400 bg-accent-500/20" : "border-white/15 bg-white/5"
              }`}
            >
              <Text
                style={{ fontFamily: fonts.bodySemibold }}
                className={active ? "text-accent-300" : "text-white/70"}
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
