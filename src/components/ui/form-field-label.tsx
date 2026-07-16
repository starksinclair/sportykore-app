import { Text, View } from "react-native";

import { fonts } from "@/theme/fonts";

type Props = {
  label: string;
  required?: boolean;
  /** Extra NativeWind classes for the label text (e.g. dark variant). */
  className?: string;
};

export function FormFieldLabel({
  label,
  required = false,
  className = "text-slate-500",
}: Props) {
  return (
    <View className="flex-row items-center gap-0.5">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className={`text-[11px] uppercase tracking-wider ${className}`}
      >
        {label}
      </Text>
      {required ? (
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-[11px] text-red-500"
          accessibilityLabel="required"
        >
          *
        </Text>
      ) : null}
    </View>
  );
}
