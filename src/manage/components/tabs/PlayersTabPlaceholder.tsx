import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { fonts } from "@/theme/fonts";

export function ManagePlayersTabPlaceholder() {
  return (
    <View className="items-center gap-3 rounded-[24px] border border-white/10 bg-white/5 px-6 py-10">
      <Ionicons name="people-outline" size={32} color="rgba(255,255,255,0.6)" />
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-lg text-white"
      >
        Players coming next
      </Text>
      <Text
        style={{ fontFamily: fonts.body }}
        className="text-center text-sm leading-6 text-white/55"
      >
        Season roster, invite links, and jersey or position edits will land
        here. Invites follow the flows in the player invite documentation.
      </Text>
    </View>
  );
}
