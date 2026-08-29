import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/color/use-theme";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";

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

export function TiebreakerPicker({
  value,
  onChange,
  variant = "light",
  label = "Standings tiebreaker",
}: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const handleSelect = (rule: TiebreakerRule) => {
    onChange(rule);
    close();
  };

  return (
    <View className="gap-1.5">
      <Text
        className="text-[11px] uppercase tracking-wider"
        style={{ color: theme.textMuted }}
      >
        {label}
      </Text>

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${tiebreakerLabel(value)}`}
        className="flex-row items-center justify-between rounded-2xl border px-3.5 py-3.5 active:opacity-80"
        style={{
          backgroundColor: theme.inputBackground,
          borderColor: theme.inputBorder,
        }}
      >
        <Text
          className="flex-1 pr-2 text-base"
          style={{ color: theme.text }}
          numberOfLines={2}
        >
          {tiebreakerLabel(value)}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.textMuted} />
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
                className="flex-row items-start gap-3 border-b py-4 active:opacity-85"
                style={{ borderColor: theme.cardBorder }}
              >
                <View className="flex-1 gap-0.5">
                  <Text
                    className="text-sm"
                    style={{ color: theme.text }}
                  >
                    {option.label}
                  </Text>
                  <Text
                    className="text-xs leading-4"
                    style={{ color: theme.textSubtle }}
                  >
                    {option.description}
                  </Text>
                </View>
                {selected ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={theme.brand}
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
