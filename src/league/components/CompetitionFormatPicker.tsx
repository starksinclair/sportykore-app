import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { CompetitionFormat } from "@/api/entities";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { FormFieldLabel } from "@/components/ui/form-field-label";
import { colors } from "@/constants";
import {
  COMPETITION_FORMAT_COPY,
  competitionFormatLabel,
} from "../competition-format-copy";

const FORMAT_OPTIONS: {
  id: CompetitionFormat;
  label: string;
  description: string;
}[] = [
  {
    id: "league",
    label: COMPETITION_FORMAT_COPY.league.label,
    description:
      "Best for a table season. Fixtures create standings, and the table decides the winner.",
  },
  {
    id: "knockout",
    label: COMPETITION_FORMAT_COPY.knockout.label,
    description:
      "Best for a cup. Teams are seeded into a bracket and losers are eliminated.",
  },
  {
    id: "group",
    label: COMPETITION_FORMAT_COPY.group.label,
    description:
      "Best when teams play in smaller groups before qualifiers advance.",
  },
];

function formatLabel(format: CompetitionFormat): string {
  return competitionFormatLabel(format);
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
          className="flex-1 pr-2 text-base text-neutral-950"
          numberOfLines={2}
        >
          {formatLabel(value)}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#6B7280" />
      </Pressable>
      <Text className="text-xs leading-5 text-slate-500">
        This format is locked after the season is created. You can create a new
        season later if you need a different structure.
      </Text>

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
                    }}
                    className="text-sm text-neutral-950"
                  >
                    {option.label}
                  </Text>
                  <Text
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
