import { Pressable, Text, type PressableProps } from 'react-native';

import { useTheme } from "@/color/use-theme";
import { colors } from "@/constants";

type Variant = 'primary' | 'ghost';

export type PrimaryButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
};

export function PrimaryButton({
  label,
  variant = 'primary',
  className,
  ...rest
}: PrimaryButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      className={[
        'rounded-2xl px-6 py-4 items-center justify-center',
        className ?? '',
      ].join(' ')}
      {...rest}
      style={(state) => [
        {
          backgroundColor: isPrimary
            ? state.pressed
              ? theme.brand
              : colors.darkLabel
            : state.pressed
              ? theme.cardMuted
              : "transparent",
        },
        typeof rest.style === "function" ? rest.style(state) : rest.style,
      ]}
    >
      <Text
        className="text-base font-semibold"
        style={{ color: isPrimary ? colors.white : theme.brand }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
