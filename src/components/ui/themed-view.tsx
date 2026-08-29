import { View, type ViewProps } from 'react-native';

import { useAppearance } from '@/color/appearance-context';
import { ThemeColor } from '@/color/theme';
import { useTheme } from '@/color/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  const { colorScheme } = useAppearance();
  const overrideColor = colorScheme === "dark" ? darkColor : lightColor;

  return (
    <View
      style={[{ backgroundColor: overrideColor ?? theme[type ?? 'background'] }, style]}
      {...otherProps}
    />
  );
}
