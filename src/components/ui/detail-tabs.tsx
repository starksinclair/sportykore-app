import { Pressable, ScrollView, Text, View } from "react-native";

import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

export type DetailTab<T extends string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  tabs: readonly DetailTab<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  /** When true, renders tabs in a horizontal ScrollView so many tabs fit on small screens. */
  scrollable?: boolean;
};

/**
 * Underline-style tab bar used by entity detail screens (league, team, player, match).
 * Generic over the tab key so callers get type-safe `onTabChange` payloads.
 */
export function DetailTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  scrollable = false,
}: Props<T>) {
  const row = (
    <View className="flex-row gap-6 border-b border-white/10 px-1">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className="pb-3 pt-1"
            style={{
              borderBottomWidth: 2,
              borderBottomColor: isActive ? colors.accent : "transparent",
              marginBottom: -1,
            }}
          >
            <Text
              style={{
                fontFamily: isActive ? fonts.bodyBold : fonts.bodySemibold,
                color: isActive ? colors.accent : "rgba(255,255,255,0.55)",
              }}
              className="text-[14px]"
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (!scrollable) return row;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-1"
    >
      {row}
    </ScrollView>
  );
}
