import { Text, View } from "react-native";

import { useTheme } from "@/color/use-theme";

type Props = {
  label: string;
  required?: boolean;
  /** Extra NativeWind classes for the label text (e.g. dark variant). */
  className?: string;
};

export function FormFieldLabel({
  label,
  required = false,
  className,
}: Props) {
  const theme = useTheme();

  return (
    <View className="flex-row items-center gap-0.5">
      <Text
        className={`text-[11px] uppercase tracking-wider ${className ?? ""}`}
        style={className ? undefined : { color: theme.textSubtle }}
      >
        {label}
      </Text>
      {required ? (
        <Text
          className="text-[11px] text-red-500"
          accessibilityLabel="required"
        >
          *
        </Text>
      ) : null}
    </View>
  );
}
