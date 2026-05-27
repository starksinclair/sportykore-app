import { forwardRef } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';

export type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, hint, className, placeholderTextColor, ...rest },
  ref,
) {
  return (
    <View className="gap-2">
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        ref={ref}
        placeholderTextColor={placeholderTextColor ?? '#9aa0a6'}
        className={[
          'rounded-2xl border border-surface-mutedLight bg-surface-mutedLight',
          'px-4 py-3 text-base text-ink-light',
          'dark:border-surface-mutedDark dark:bg-surface-mutedDark dark:text-ink-dark',
          className ?? '',
        ].join(' ')}
        {...rest}
      />
      <HintRow hint={hint} />
    </View>
  );
});

function HintRow({ hint }: { hint: string | undefined }) {
  return (
    <ThemedText type="small" themeColor="textSecondary">
      {hint ?? ' '}
    </ThemedText>
  );
}
