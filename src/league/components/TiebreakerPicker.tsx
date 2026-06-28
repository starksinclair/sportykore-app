import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

import {
  TIEBREAKER_OPTIONS,
  tiebreakerLabel,
  type TiebreakerRule,
} from "../tiebreaker-options";

type Props = {
  value: TiebreakerRule;
  onChange: (value: TiebreakerRule) => void;
  variant?: "light" | "dark";
  label?: string;
};

const fieldStyles = {
  light: {
    label: "text-slate-500",
    field: "rounded-2xl border border-neutral-200 bg-[#F5F5F5] px-3.5 py-3.5",
    value: "text-base text-neutral-950",
    chevron: "#6B7280",
    rowBorder: "border-neutral-100",
    rowActive: "active:bg-neutral-50",
    optionLabel: "text-neutral-950",
    optionDescription: "text-slate-500",
  },
  dark: {
    label: "text-white/45",
    field: "rounded-xl border border-white/15 bg-white/5 px-3.5 py-3.5",
    value: "text-base text-white",
    chevron: "rgba(255,255,255,0.55)",
    rowBorder: "border-white/10",
    rowActive: "active:bg-white/5",
    optionLabel: "text-white",
    optionDescription: "text-white/50",
  },
} as const;

export function TiebreakerPicker({
  value,
  onChange,
  variant = "light",
  label = "Standings tiebreaker",
}: Props) {
  const [open, setOpen] = useState(false);
  const styles = fieldStyles[variant];
  const isDark = variant === "dark";

  const close = () => setOpen(false);

  const handleSelect = (rule: TiebreakerRule) => {
    onChange(rule);
    close();
  };

  return (
    <View className="gap-1.5">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className={`text-[11px] uppercase tracking-wider ${styles.label}`}
      >
        {label}
      </Text>

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${tiebreakerLabel(value)}`}
        className={`flex-row items-center justify-between ${styles.field} active:opacity-80`}
      >
        <Text
          style={{ fontFamily: fonts.bodySemibold }}
          className={`flex-1 pr-2 ${styles.value}`}
          numberOfLines={2}
        >
          {tiebreakerLabel(value)}
        </Text>
        <Ionicons name="chevron-down" size={18} color={styles.chevron} />
      </Pressable>

      <BottomSheetModal
        visible={open}
        onClose={close}
        title={label}
        subtitle="Choose how tied teams are ranked on the standings table when they have the same points."
        variant={variant}
      >
        <View className="gap-1">
          {TIEBREAKER_OPTIONS.map((option) => {
            const selected = value === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => handleSelect(option.id)}
                className={`flex-row items-start gap-3 border-b py-4 ${styles.rowBorder} ${styles.rowActive}`}
              >
                <View className="flex-1 gap-0.5">
                  <Text
                    style={{ fontFamily: selected ? fonts.bodyBold : fonts.bodySemibold }}
                    className={`text-sm ${styles.optionLabel}`}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={{ fontFamily: fonts.body }}
                    className={`text-xs leading-4 ${styles.optionDescription}`}
                  >
                    {option.description}
                  </Text>
                </View>
                {selected ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={isDark ? colors.accent : colors.brand}
                  />
                ) : (
                  <View className="w-[22px]" />
                )}
              </Pressable>
            );
          })}
        </View>
      </BottomSheetModal>
    </View>
  );
}
