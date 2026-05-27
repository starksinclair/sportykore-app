import type { ReactNode } from "react";
import type { PressableProps } from "react-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "authPurple" | "signInYellow";
type Size = "default" | "icon";

const containerByVariant: Record<Variant, string> = {
  primary: "bg-brand-500 active:bg-brand-600",
  secondary: "bg-white border border-slate-200 active:bg-slate-100",
  ghost: "bg-transparent active:bg-slate-100",
  accent: "bg-[#f9b923] active:opacity-90",
  authPurple: "bg-[#5D2A8E] active:bg-[#4f2478]",
  signInYellow: "bg-[#F2A900] active:opacity-90",
};

const labelByVariant: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-slate-900",
  ghost: "text-slate-900",
  accent: "text-neutral-900",
  authPurple: "text-white",
  signInYellow: "text-neutral-950",
};

const sizeClasses: Record<Size, string> = {
  default: "h-14 px-7 rounded-[13px]",
  icon: "w-14 h-14 rounded-[13px]",
};

export type ButtonProps = Omit<PressableProps, "children"> & {
  label?: string;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  className?: string;
};

export function Button({
  label,
  variant = "primary",
  size = "default",
  icon,
  iconPosition = "right",
  loading = false,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const indicatorColor =
    variant === "primary" || variant === "authPurple"
      ? "#fff"
      : variant === "accent" || variant === "signInYellow"
        ? "#171717"
        : "#0f172a";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={[
        "items-center justify-center flex-row",
        sizeClasses[size],
        containerByVariant[variant],
        isDisabled ? "opacity-50" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={indicatorColor} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon && iconPosition === "left" ? icon : null}
          {label ? (
            <Text
              className={[
                "text-base font-semibold",
                labelByVariant[variant],
              ].join(" ")}
            >
              {label}
            </Text>
          ) : null}
          {icon && iconPosition === "right" ? icon : null}
        </View>
      )}
    </Pressable>
  );
}
