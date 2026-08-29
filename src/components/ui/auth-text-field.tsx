import { forwardRef, type ReactNode } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { useTheme } from "@/color/use-theme";
import { FormFieldLabel } from "./form-field-label";

export type AuthTextFieldProps = TextInputProps & {
  label: string;
  /** Shows a red asterisk next to the label. */
  required?: boolean;
  /** Renders aligned with the label row (e.g. “Forgot?”). */
  labelAccessory?: ReactNode;
  labelClassName?: string;
  leftIcon?: ReactNode;
  rightAccessory?: ReactNode;
  containerClassName?: string;
  /** Input row container style (radius, shadow). */
  inputRowStyle?: ViewStyle;
};

export const AuthTextField = forwardRef<TextInput, AuthTextFieldProps>(
  function AuthTextField(
    {
      label,
      required = false,
      labelAccessory,
      labelClassName,
      leftIcon,
      rightAccessory,
      containerClassName,
      inputRowStyle,
      editable = true,
      className,
      placeholderTextColor,
      style,
      ...rest
    },
    ref,
  ) {
    const theme = useTheme();

    return (
      <View className={`gap-1.5 ${containerClassName ?? ""}`}>
        <View className="flex-row items-center justify-between gap-2">
          <FormFieldLabel
            label={label}
            required={required}
            className={labelClassName}
          />
          {labelAccessory}
        </View>
        <View
          style={[
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
            },
            inputRowStyle,
          ]}
          className={[
            "flex-row items-center rounded-2xl border px-3.5 py-3",
            !editable ? "opacity-55" : "",
          ].join(" ")}
        >
          {leftIcon ? <View className="mr-2.5 opacity-55">{leftIcon}</View> : null}
          <TextInput
            ref={ref}
            placeholderTextColor={placeholderTextColor ?? theme.textSubtle}
            className={`min-h-[22px] flex-1 px-0 py-0 text-base ${className ?? ""}`}
            style={[{ color: theme.text }, style]}
            editable={editable}
            {...rest}
          />
          {rightAccessory ? <View className="ml-2">{rightAccessory}</View> : null}
        </View>
      </View>
    );
  },
);

/** Simple text link for accessory rows (Forgot?, etc.). */
export function AuthAccessoryLink({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable hitSlop={8} onPress={onPress} accessibilityRole="link">
      <Text
        className="text-xs font-semibold text-[#5D2A8E]"
      >
        {label}
      </Text>
    </Pressable>
  );
}
