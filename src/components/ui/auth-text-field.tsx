import { forwardRef, type ReactNode } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { fonts } from "@/theme/fonts";

export type AuthTextFieldProps = TextInputProps & {
  label: string;
  /** Renders aligned with the label row (e.g. “Forgot?”). */
  labelAccessory?: ReactNode;
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
      labelAccessory,
      leftIcon,
      rightAccessory,
      containerClassName,
      inputRowStyle,
      editable = true,
      className,
      ...rest
    },
    ref,
  ) {
    return (
      <View className={`gap-1.5 ${containerClassName ?? ""}`}>
        <View className="flex-row items-center justify-between gap-2">
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className="text-[11px] uppercase tracking-wider text-slate-500"
          >
            {label}
          </Text>
          {labelAccessory}
        </View>
        <View
          style={[{ backgroundColor: "#F5F5F5" }, inputRowStyle]}
          className={[
            "flex-row items-center rounded-2xl border border-transparent px-3.5 py-3",
            !editable ? "opacity-55" : "",
          ].join(" ")}
        >
          {leftIcon ? <View className="mr-2.5 opacity-55">{leftIcon}</View> : null}
          <TextInput
            ref={ref}
            placeholderTextColor="#9CA3AF"
            className={`min-h-[22px] flex-1 px-0 py-0 text-base text-neutral-950 ${className ?? ""}`}
            style={{ fontFamily: fonts.body }}
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
        style={{ fontFamily: fonts.bodyBold }}
        className="text-xs font-semibold text-[#5D2A8E]"
      >
        {label}
      </Text>
    </Pressable>
  );
}
