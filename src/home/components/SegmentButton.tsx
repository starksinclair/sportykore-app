import { Pressable, Text } from "react-native";

import { useTheme } from "@/color/use-theme";

export function SegmentButton({
    active,
    label,
    onPress,
  }: {
    active: boolean;
    label: string;
    onPress: () => void;
  }) {
    const theme = useTheme();

    return (
      <Pressable
        onPress={onPress}
        className={[
          "flex-1 rounded-[13px] px-4 py-3",
        ].join(" ")}
        style={{ backgroundColor: active ? theme.brand : "transparent" }}
      >
        <Text
          className="text-center text-sm"
          style={{ color: active ? theme.textInverse : theme.textMuted }}
        >
          {label}
        </Text>
      </Pressable>
    );
  }
  
