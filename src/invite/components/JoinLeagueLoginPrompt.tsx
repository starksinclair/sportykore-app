import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

export function JoinLeagueLoginPrompt() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="h-16 w-16 items-center justify-center rounded-[22px] bg-accent-500/15">
        <Ionicons name="people-outline" size={28} color={colors.accent} />
      </View>
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="pt-6 text-center text-[22px] text-white"
      >
        Log in to join a league
      </Text>
      <Text
        style={{ fontFamily: fonts.body }}
        className="pt-3 text-center text-sm leading-6 text-white/65"
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
          style={{ fontFamily: fonts.bodyBold }}
          className="text-sm text-neutral-950"
        >
          Log in
        </Text>
      </Pressable>
    </View>
  );
}
