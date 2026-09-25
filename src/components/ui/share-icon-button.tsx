import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { useTheme } from "@/color/use-theme";

type Props = {
  accessibilityLabel: string;
  onPress: () => void;
};

export function ShareIconButton({ accessibilityLabel, onPress }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-full border active:opacity-80"
      style={{
        backgroundColor: theme.accentMuted,
        borderColor: theme.accent,
      }}
    >
      <Ionicons name="share-social-outline" size={20} color={theme.accent} />
    </Pressable>
  );
}
