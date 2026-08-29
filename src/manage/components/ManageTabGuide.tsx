import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/color/use-theme";

export type ManageTabGuideItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

type Props = {
  summary: string;
  items: ManageTabGuideItem[];
  title?: string;
};

export function ManageTabGuide({
  summary,
  items,
  title = "What you can do here",
}: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View
      className="overflow-hidden rounded-[22px] border"
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
    >
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? `Hide ${title}` : `Show ${title}`}
        className="flex-row items-center gap-3 px-4 py-3 active:opacity-85"
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-2xl"
          style={{ backgroundColor: theme.accentMuted }}
        >
          <Ionicons name="help-circle-outline" size={18} color={theme.accent} />
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-sm" style={{ color: theme.text }}>
            {title}
          </Text>
          <Text
            className="text-xs leading-5"
            style={{ color: theme.textSubtle }}
            numberOfLines={open ? 2 : 1}
          >
            {summary}
          </Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={theme.textSubtle}
        />
      </Pressable>

      {open ? (
        <View
          className="gap-2 border-t px-4 pb-4 pt-3"
          style={{ borderColor: theme.cardBorder }}
        >
          {items.map((item) => (
            <View
              key={item.title}
              className="flex-row gap-3 rounded-2xl px-3 py-3"
              style={{ backgroundColor: theme.cardMuted }}
            >
              <View className="pt-0.5">
                <Ionicons name={item.icon} size={16} color={theme.accent} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-sm" style={{ color: theme.text }}>
                  {item.title}
                </Text>
                <Text
                  className="pt-0.5 text-xs leading-5"
                  style={{ color: theme.textSubtle }}
                >
                  {item.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
