import { forwardRef } from "react";
import type { TextInputProps } from "react-native";
import { Text, TextInput, View } from "react-native";

import { useTheme } from "@/color/use-theme";

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerClassName?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, containerClassName, className, ...rest },
  ref
) {
  const theme = useTheme();

  return (
    <View className={`gap-1.5 ${containerClassName ?? ""}`}>
      {label ? (
        <Text className="text-sm font-medium" style={{ color: theme.textMuted }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={theme.textSubtle}
        className={[
          "h-12 rounded-xl border px-4 text-base",
          error ? "border-red-500" : "",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
        style={[
          {
            backgroundColor: theme.inputBackground,
            borderColor: error ? theme.danger : theme.inputBorder,
            color: theme.text,
          },
          rest.style,
        ]}
      />
      {error ? (
        <Text className="text-xs" style={{ color: theme.danger }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});
