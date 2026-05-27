import { forwardRef } from "react";
import type { TextInputProps } from "react-native";
import { Text, TextInput, View } from "react-native";

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerClassName?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, containerClassName, className, ...rest },
  ref
) {
  return (
    <View className={`gap-1.5 ${containerClassName ?? ""}`}>
      {label ? (
        <Text className="text-sm font-medium text-slate-700">{label}</Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#94a3b8"
        className={[
          "h-12 px-4 rounded-xl border border-slate-200 bg-white text-base text-slate-900",
          error ? "border-red-500" : "",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
      {error ? <Text className="text-xs text-red-600">{error}</Text> : null}
    </View>
  );
});
