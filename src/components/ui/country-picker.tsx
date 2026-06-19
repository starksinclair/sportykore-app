import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";

import { colors } from "@/constants";
import { useCountries } from "@/country";
import { fonts } from "@/theme/fonts";

import { CountryFlag, CountryLabel } from "./CountryFlag";

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
};

export function CountryPicker({
  value,
  onChange,
  label = "Country",
  placeholder = "Select country",
}: Props) {
  const [open, setOpen] = useState(false);
  const { data: countries, isLoading } = useCountries();
  const options = countries ?? [];

  const close = () => setOpen(false);

  const handleSelect = (country: CountryPickerOption) => {
    onChange(country);
    close();
  };

  return (
    <View className="gap-1.5">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-[11px] uppercase tracking-wider text-slate-500"
      >
        {label}
      </Text>

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={value ? `Country: ${value.name}` : placeholder}
        className="flex-row items-center justify-between rounded-2xl border border-neutral-200 bg-[#F5F5F5] px-3.5 py-3.5 active:opacity-80"
      >
        {value ? (
          <CountryLabel
            code={value.code}
            name={value.name}
            flagWidth={20}
            textClassName="text-base text-neutral-950"
            textStyle={{ fontFamily: fonts.bodySemibold }}
          />
        ) : (
          <Text
            style={{ fontFamily: fonts.bodySemibold }}
            className="text-base text-[#9CA3AF]"
          >
            {placeholder}
          </Text>
        )}
        <Ionicons name="chevron-down" size={18} color="#6B7280" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={close}>
          <Pressable
            className="max-h-[70%] rounded-t-3xl bg-white px-4 pb-8 pt-4"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="mb-3 h-1 w-12 self-center rounded-full bg-neutral-300" />
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="mb-3 text-lg text-neutral-950"
            >
              {label}
            </Text>

            {isLoading && options.length === 0 ? (
              <View className="items-center py-8">
                <ActivityIndicator color={colors.brand} />
                <Text
                  style={{ fontFamily: fonts.body }}
                  className="mt-3 text-sm text-slate-500"
                >
                  Loading countries…
                </Text>
              </View>
            ) : (
              <FlatList
                style={{ maxHeight: 440 }}
                data={options}
                keyExtractor={(item) => item.code}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleSelect(item)}
                    className="flex-row items-center gap-3 border-b border-neutral-100 py-4 active:bg-neutral-50"
                  >
                    <CountryFlag code={item.code} width={24} />
                    <Text
                      style={{ fontFamily: fonts.bodySemibold }}
                      className="flex-1 text-base text-neutral-950"
                    >
                      {item.name}
                    </Text>
                    {item.code === value?.code ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.brand} />
                    ) : null}
                  </Pressable>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
