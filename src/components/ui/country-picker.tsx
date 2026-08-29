import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { useTheme } from "@/color/use-theme";
import { useCountries } from "@/country";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";

import { BottomSheetModal } from "./bottom-sheet-modal";
import { CountryFlag, CountryLabel } from "./CountryFlag";
import { FormFieldLabel } from "./form-field-label";

export type CountryPickerOption = {
  id: number;
  code: string;
  name: string;
};

type Props = {
  value: CountryPickerOption | null;
  onChange: (country: CountryPickerOption) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
};

export function CountryPicker({
  value,
  onChange,
  label = "Country",
  placeholder = "Select country",
  required = false,
}: Props) {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const { isTablet } = useAdaptiveLayout();
  const [open, setOpen] = useState(false);
  const { data: countries, isLoading } = useCountries();
  const options = countries ?? [];
  const sheetBodyHeight = height * (isTablet ? 0.72 : 0.84);
  const reservedSheetSpace = isTablet ? 164 : 148;
  const listHeight = Math.min(
    isTablet ? 460 : 420,
    Math.max(isTablet ? 300 : 240, sheetBodyHeight - reservedSheetSpace),
  );
  const columnCount = isTablet ? 2 : 1;

  const close = () => setOpen(false);

  const handleSelect = (country: CountryPickerOption) => {
    onChange(country);
    close();
  };

  return (
    <View className="gap-1.5">
      <FormFieldLabel label={label} required={required} />

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={value ? `Country: ${value.name}` : placeholder}
        className="flex-row items-center justify-between rounded-2xl border px-3.5 py-3.5 active:opacity-80"
        style={{
          backgroundColor: theme.inputBackground,
          borderColor: theme.inputBorder,
        }}
      >
        {value ? (
          <CountryLabel
            code={value.code}
            name={value.name}
            flagWidth={20}
            textClassName="text-base"
            textStyle={{ color: theme.text }}
          />
        ) : (
          <Text
            className="text-base"
            style={{ color: theme.textSubtle }}
          >
            {placeholder}
          </Text>
        )}
        <Ionicons name="chevron-down" size={18} color={theme.textMuted} />
      </Pressable>

      <BottomSheetModal
        visible={open}
        onClose={close}
        title={label}
        subtitle="Choose where this competition is based."
        scrollEnabled={false}
      >
        {isLoading && options.length === 0 ? (
          <View className="items-center py-8">
            <ActivityIndicator color={theme.brand} />
            <Text
              className="mt-3 text-sm"
              style={{ color: theme.textSubtle }}
            >
              Loading countries…
            </Text>
          </View>
        ) : (
          <View
            className="overflow-hidden rounded-2xl border"
            style={{
              height: listHeight,
              maxHeight: '80%',
              backgroundColor: theme.cardMuted,
              borderColor: theme.cardBorder,
            }}
          >
            <FlatList
              key={`country-list-${columnCount}`}
              style={{ flex: 1 }}
              data={options}
              numColumns={columnCount}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                gap: isTablet ? 8 : 0,
                padding: isTablet ? 8 : 0,
                paddingBottom: isTablet ? 16 : 12,
              }}
              columnWrapperStyle={isTablet ? { gap: 8 } : undefined}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item)}
                  className="flex-row items-center gap-3 border-b px-3 py-4 active:opacity-85"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    borderColor: theme.cardBorder,
                    borderRadius: isTablet ? 14 : 0,
                    backgroundColor:
                      isTablet && item.code === value?.code
                        ? theme.accentMuted
                        : "transparent",
                  }}
                >
                  <CountryFlag code={item.code} width={24} />
                  <Text
                    className="flex-1 text-base"
                    style={{ color: theme.text }}
                  >
                    {item.name}
                  </Text>
                  {item.code === value?.code ? (
                    <Ionicons name="checkmark-circle" size={22} color={theme.brand} />
                  ) : (
                    <View className="w-[22px]" />
                  )}
                </Pressable>
              )}
            />
          </View>
        )}
      </BottomSheetModal>
    </View>
  );
}
