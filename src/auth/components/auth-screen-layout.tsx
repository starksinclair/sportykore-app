import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/themed-text';

export type AuthScreenLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthScreenLayout({ title, subtitle, children, footer }: AuthScreenLayoutProps) {
  return (
    <Screen>
      <View className="gap-2">
        <ThemedText type="title">{title}</ThemedText>
        <Subtitle subtitle={subtitle} />
      </View>

      <View className="gap-4">{children}</View>

      <View className="mt-auto gap-3">{footer}</View>
    </Screen>
  );
}

function Subtitle({ subtitle }: { subtitle: string | undefined }) {
  return (
    <ThemedText type="default" themeColor="textSecondary">
      {subtitle ?? ' '}
    </ThemedText>
  );
}
