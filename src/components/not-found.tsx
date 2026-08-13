
import { Text, View } from "react-native";

import { useTheme } from "@/color/use-theme";

export function NotFound({ message }: { message: string }) {
    const theme = useTheme();

    return (
      <View
        className="rounded-[22px] border px-5 py-8"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
        }}
      >
        <Text className="text-lg" style={{ color: theme.text }}>
          {message}
        </Text>
      </View>
    );
  }
