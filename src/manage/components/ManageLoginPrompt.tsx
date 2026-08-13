import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/color/use-theme";

export function ManageLoginPrompt() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="h-16 w-16 items-center justify-center rounded-[22px]" style={{ backgroundColor: theme.accentMuted }}>
        <Ionicons name="shield-outline" size={28} color={theme.accent} />
      </View>
      <Text
        className="pt-6 text-center text-[22px]"
        style={{ color: theme.text }}
      >
        Log in to manage leagues
      </Text>
      <Text
        className="pt-3 text-center text-sm leading-6"
        style={{ color: theme.textMuted }}
      >
        League admins can schedule games, run live match centers, and manage
        rosters from here once you sign in.
      </Text>
      <Pressable
        onPress={() => router.push("/login")}
        accessibilityRole="button"
        accessibilityLabel="Log in"
        className="mt-8 w-full max-w-[280px] flex-row items-center justify-center gap-2 rounded-full border py-3.5 active:opacity-90"
        style={{ backgroundColor: theme.accent, borderColor: theme.accent }}
      >
        <Ionicons name="log-in-outline" size={17} color={theme.textInverse} />
        <Text
          className="text-sm"
          style={{ color: theme.textInverse }}
        >
          Log in
        </Text>
      </Pressable>
    </View>
  );
}
