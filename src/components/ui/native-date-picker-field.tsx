import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/color/use-theme";
import { fonts } from "@/theme/fonts";

import { BottomSheetModal } from "./bottom-sheet-modal";
import { FormFieldLabel } from "./form-field-label";

type Props = {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  mode?: "date" | "time";
  helperText?: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  required?: boolean;
  labelClassName?: string;
  variant?: "light" | "dark";
};

export function NativeDatePickerField({
  label,
  value,
  onChange,
  mode = "date",
  helperText,
  placeholder,
  minimumDate,
  maximumDate,
  required = false,
  labelClassName,
  variant = "light",
}: Props) {
  const theme = useTheme();
  const isDark = variant === "dark";
  const [open, setOpen] = useState(false);
  const isTimeMode = mode === "time";
  const resolvedPlaceholder =
    placeholder ?? (isTimeMode ? "Select time" : "Select date");
  const selectedDate = clampDate(
    parsePickerValue(value, mode) ?? maximumDate ?? minimumDate ?? new Date(),
    isTimeMode ? undefined : minimumDate,
    isTimeMode ? undefined : maximumDate,
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
      onChange(
        formatPickerValue(
          clampDate(
            date,
            isTimeMode ? undefined : minimumDate,
            isTimeMode ? undefined : maximumDate,
          ),
          mode,
        ),
      );
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
        accessibilityLabel={value ? `${label}: ${value}` : resolvedPlaceholder}
        onPress={openPicker}
        className="flex-row items-center justify-between rounded-2xl border px-3.5 py-3.5 active:opacity-80"
        style={{
          backgroundColor: theme.inputBackground,
          borderColor: theme.inputBorder,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.bodySemibold,
            color: value ? theme.text : theme.textSubtle,
          }}
          className="text-base"
        >
          {value ? formatDisplayValue(value, mode) : resolvedPlaceholder}
        </Text>
        <Ionicons
          name={isTimeMode ? "time-outline" : "calendar-outline"}
          size={18}
          color={theme.textMuted}
        />
      </Pressable>
      {helperText ? (
        <Text
          style={{ fontFamily: fonts.body, color: theme.textSubtle }}
          className="text-xs leading-5"
        >
          {helperText}
        </Text>
      ) : null}

      {open && Platform.OS === "android" ? (
        <DateTimePicker
          value={draftDate}
          mode={mode}
          display="default"
          minimumDate={isTimeMode ? undefined : minimumDate}
          maximumDate={isTimeMode ? undefined : maximumDate}
          onChange={handleAndroidChange}
        />
      ) : null}

      {Platform.OS !== "android" ? (
        <BottomSheetModal
          visible={open}
          onClose={() => setOpen(false)}
          title={label}
          subtitle={helperText}
          variant={variant}
          scrollEnabled={false}
        >
          <View className="gap-4 pb-6">
            <View
              className="overflow-hidden rounded-[18px] border"
              style={{
                backgroundColor: theme.cardMuted,
                borderColor: theme.cardBorder,
              }}
            >
              <DateTimePicker
                value={draftDate}
                mode={mode}
                display="spinner"
                minimumDate={isTimeMode ? undefined : minimumDate}
                maximumDate={isTimeMode ? undefined : maximumDate}
                accentColor={theme.accent}
                themeVariant={isDark ? "dark" : "light"}
                textColor={theme.text}
                style={styles.iosPicker}
                onChange={(_event, date) => {
                  if (date) {
                    setDraftDate(
                      clampDate(
                        date,
                        isTimeMode ? undefined : minimumDate,
                        isTimeMode ? undefined : maximumDate,
                      ),
                    );
                  }
                }}
              />
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="h-12 flex-1 items-center justify-center rounded-[13px] border"
                style={{
                  backgroundColor: theme.cardMuted,
                  borderColor: theme.cardBorder,
                }}
              >
                <Text
                  style={{ fontFamily: fonts.bodyBold, color: theme.textMuted }}
                  className="text-sm"
                >
                  Clear
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onChange(formatPickerValue(draftDate, mode));
                  setOpen(false);
                }}
                className="h-12 flex-1 items-center justify-center rounded-[13px]"
                style={{ backgroundColor: theme.brand }}
              >
                <Text
                  style={{ fontFamily: fonts.bodyBold, color: theme.textInverse }}
                  className="text-sm"
                >
                  {isTimeMode ? "Set time" : "Set date"}
                </Text>
              </Pressable>
            </View>
          </View>
        </BottomSheetModal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  iosPicker: {
    height: 236,
  },
});

function parsePickerValue(value: string | null, mode: "date" | "time"): Date | null {
  return mode === "time" ? parseTimeValue(value) : parseDateValue(value);
}

function parseDateValue(value: string | null): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function parseTimeValue(value: string | null): Date | null {
  if (!value) return null;
  const [hour, minute] = value.split(":").map(Number);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
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

function formatPickerValue(date: Date, mode: "date" | "time"): string {
  return mode === "time" ? formatTimeValue(date) : formatDateValue(date);
}

function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeValue(date: Date): string {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

function formatDisplayValue(value: string, mode: "date" | "time"): string {
  return mode === "time" ? formatDisplayTime(value) : formatDisplayDate(value);
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

function formatDisplayTime(value: string): string {
  const date = parseTimeValue(value);
  if (!date) return value;
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
