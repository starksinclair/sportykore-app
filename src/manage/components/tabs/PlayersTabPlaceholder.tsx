import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { useTheme } from "@/color/use-theme";

export function ManagePlayersTabPlaceholder() {
  const theme = useTheme();

  return (
    <View
      className="items-center gap-3 rounded-[24px] border px-6 py-10"
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
    >
      <Ionicons name="people-outline" size={32} color={theme.textMuted} />
      <Text
        className="text-lg"
        style={{ color: theme.text }}
      >
        Players coming next
      </Text>
      <Text
        className="text-center text-sm leading-6"
        style={{ color: theme.textSubtle }}
      >
        Season roster, invite links, and jersey or position edits will land
        here. Invites follow the flows in the player invite documentation.
      </Text>
    </View>
  );
}
