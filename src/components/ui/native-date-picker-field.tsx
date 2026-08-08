import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { colors } from "@/constants";

import { BottomSheetModal } from "./bottom-sheet-modal";
import { FormFieldLabel } from "./form-field-label";

type Props = {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  helperText?: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  required?: boolean;
  labelClassName?: string;
};

export function NativeDatePickerField({
  label,
  value,
  onChange,
  helperText,
  placeholder = "Select date",
  minimumDate,
  maximumDate,
  required = false,
  labelClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const selectedDate = clampDate(
    parseDateValue(value) ?? maximumDate ?? minimumDate ?? new Date(),
    minimumDate,
    maximumDate,
  );
  const [draftDate, setDraftDate] = useState<Date>(selectedDate);

  const openPicker = () => {
    setDraftDate(selectedDate);
    setOpen(true);
  };

  const handleAndroidChange = (
    event: DateTimePickerEvent,
    date?: Date,
  ) => {
    setOpen(false);
    if (event.type === "set" && date) {
      onChange(formatDateValue(clampDate(date, minimumDate, maximumDate)));
    }
  };

  return (
    <View className="gap-1.5">
      <FormFieldLabel
        label={label}
        required={required}
        className={labelClassName}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? `${label}: ${value}` : placeholder}
        onPress={openPicker}
        className="flex-row items-center justify-between rounded-2xl border border-transparent bg-[#F5F5F5] px-3.5 py-3.5 active:opacity-80"
      >
        <Text
          className={value ? "text-base text-neutral-950" : "text-base text-[#9CA3AF]"}
        >
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.tabInactive} />
      </Pressable>
      {helperText ? (
        <Text
          className="text-xs leading-5 text-slate-500"
        >
          {helperText}
        </Text>
      ) : null}

      {open && Platform.OS === "android" ? (
        <DateTimePicker
          value={draftDate}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleAndroidChange}
        />
      ) : null}

      {Platform.OS !== "android" ? (
        <BottomSheetModal
          visible={open}
          onClose={() => setOpen(false)}
          title={label}
          subtitle={helperText}
        >
          <View className="gap-4">
            <DateTimePicker
              value={draftDate}
              mode="date"
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={(_event, date) => {
                if (date) setDraftDate(clampDate(date, minimumDate, maximumDate));
              }}
            />
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="h-12 flex-1 items-center justify-center rounded-[13px] border border-slate-200 bg-white"
              >
                <Text
                  className="text-sm text-slate-700"
                >
                  Clear
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onChange(formatDateValue(draftDate));
                  setOpen(false);
                }}
                className="h-12 flex-1 items-center justify-center rounded-[13px] bg-brand"
              >
                <Text
                  className="text-sm text-white"
                >
                  Set date
                </Text>
              </Pressable>
            </View>
          </View>
        </BottomSheetModal>
      ) : null}
    </View>
  );
}

function parseDateValue(value: string | null): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function clampDate(date: Date, minimumDate?: Date, maximumDate?: Date): Date {
  if (minimumDate && date < minimumDate) {
    return minimumDate;
  }
  if (maximumDate && date > maximumDate) {
    return maximumDate;
  }
  return date;
}

function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string): string {
  const date = parseDateValue(value);
  if (!date) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
