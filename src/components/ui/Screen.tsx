import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/ui/themed-view';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow px-6 py-8"
          keyboardShouldPersistTaps="handled">
          <View className="mx-auto w-full max-w-[480px] flex-1 gap-6">{children}</View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
