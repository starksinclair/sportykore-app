import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/color/use-theme";

export function ErrorState({
  onRetry,
  message,
}: {
  onRetry?: () => void;
  message?: string;
}) {
  const theme = useTheme();

  return (
    <View className="items-center gap-4 py-10">
      <Text className="text-sm" style={{ color: theme.textMuted }}>
        {message || "Something went wrong. Check your connection and try again."}
      </Text>
      <Pressable
        onPress={onRetry}
        className="rounded-2xl px-6 py-3 active:opacity-85"
        style={{ backgroundColor: theme.brand }}
      >
        <Text className="text-sm" style={{ color: theme.textInverse }}>
          Retry
        </Text>
      </Pressable>
    </View>
  );
}
