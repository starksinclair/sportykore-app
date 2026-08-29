import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/color/use-theme";
import { colors } from "@/constants";

export function JoinLeagueLoginPrompt() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View
        className="h-16 w-16 items-center justify-center rounded-[22px]"
        style={{ backgroundColor: theme.accentMuted }}
      >
        <Ionicons name="people-outline" size={28} color={theme.accent} />
      </View>
      <Text
        className="pt-6 text-center text-[22px]"
        style={{ color: theme.text }}
      >
        Log in to join a league
      </Text>
      <Text
        className="pt-3 text-center text-sm leading-6"
        style={{ color: theme.textMuted }}
      >
        Sign in to accept your invite and join your team roster.
      </Text>
      <Pressable
        onPress={() => router.push("/login")}
        accessibilityRole="button"
        accessibilityLabel="Log in"
        className="mt-8 w-full max-w-[280px] flex-row items-center justify-center gap-2 rounded-full border border-accent-400 bg-accent-500 py-3.5 active:opacity-90"
      >
        <Ionicons name="log-in-outline" size={17} color={colors.darkLabel} />
        <Text
          className="text-sm text-neutral-950"
        >
          Log in
        </Text>
      </Pressable>
    </View>
  );
}
