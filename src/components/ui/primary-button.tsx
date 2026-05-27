import { Pressable, Text, type PressableProps } from 'react-native';

type Variant = 'primary' | 'ghost';

export type PrimaryButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
};

const containerByVariant: Record<Variant, string> = {
  primary: 'bg-black active:bg-brand-600',
  ghost: 'bg-transparent active:bg-surface-mutedLight dark:active:bg-surface-mutedDark',
};

const labelByVariant: Record<Variant, string> = {
  primary: 'text-white',
  ghost: 'text-brand-500',
};

export function PrimaryButton({
  label,
  variant = 'primary',
  className,
  ...rest
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={[
        'rounded-2xl px-6 py-4 items-center justify-center',
        'bg-black active:bg-brand-600',
        className ?? '',
      ].join(' ')}
      {...rest}>
      <Text className={['text-base font-semibold', labelByVariant[variant]].join(' ')}>
        {label}
      </Text>
    </Pressable>
  );
}
