import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { CompetitionFormat } from "@/api/entities";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { FormFieldLabel } from "@/components/ui/form-field-label";
import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

const FORMAT_OPTIONS: {
  id: CompetitionFormat;
  label: string;
  description: string;
}[] = [
  {
    id: "league",
    label: "League (round-robin)",
    description: "Table standings from fixtures — round-robin.",
  },
  {
    id: "knockout",
    label: "Knockouts",
    description: "Cup bracket. Team order on the next step becomes seeding.",
  },
  {
    id: "group",
    label: "Groups",
    description: "Split teams into groups, then advance to a knockout.",
  },
];

function formatLabel(format: CompetitionFormat): string {
  return FORMAT_OPTIONS.find((o) => o.id === format)?.label ?? format;
}

type Props = {
  value: CompetitionFormat;
  onChange: (value: CompetitionFormat) => void;
  label?: string;
  required?: boolean;
};

export function CompetitionFormatPicker({
  value,
  onChange,
  label = "Format",
  required = false,
}: Props) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const handleSelect = (format: CompetitionFormat) => {
    onChange(format);
    close();
  };

  return (
    <View className="gap-1.5">
      <FormFieldLabel label={label} required={required} />

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatLabel(value)}`}
        className="flex-row items-center justify-between rounded-2xl border border-neutral-200 bg-[#F5F5F5] px-3.5 py-3.5 active:opacity-80"
      >
        <Text
          style={{ fontFamily: fonts.bodySemibold }}
          className="flex-1 pr-2 text-base text-neutral-950"
          numberOfLines={2}
        >
          {formatLabel(value)}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#6B7280" />
      </Pressable>

      <BottomSheetModal
        visible={open}
        onClose={close}
        title={label}
        subtitle="Choose how the competition is structured."
      >
        <View className="gap-1">
          {FORMAT_OPTIONS.map((option) => {
            const selected = value === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => handleSelect(option.id)}
                className="flex-row items-start gap-3 border-b border-neutral-100 py-4 active:bg-neutral-50"
              >
                <View className="flex-1 gap-0.5">
                  <Text
                    style={{
                      fontFamily: selected ? fonts.bodyBold : fonts.bodySemibold,
                    }}
                    className="text-sm text-neutral-950"
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={{ fontFamily: fonts.body }}
                    className="text-xs leading-4 text-slate-500"
                  >
                    {option.description}
                  </Text>
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.brand} />
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
