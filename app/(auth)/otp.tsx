import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OtpScreen } from "@/auth/components";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { Logo } from "@/components/ui/logo";
import { colors } from "@/constants";

function readParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export default function OtpPage() {
  const params = useLocalSearchParams<{
    email?: string | string[];
    recoveryMode?: string | string[];
  }>();

  const email = readParam(params.email) ?? "";
  const recoveryMode = readParam(params.recoveryMode) === "1";

  const back = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/login");
    }
  };

  const onSuccess = async () => {
    router.replace("/(app)/(tabs)");
  };

  return (
    <View className="flex-1 bg-[#0B0B0C]">
      <BlackPatternBackground />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <StatusBar style="light" />
        <View className="relative mb-2 flex-row items-center justify-between px-6 pt-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            className="-ml-1 h-11 w-11 items-center justify-center rounded-2xl bg-white/15 active:bg-white/25"
            onPress={back}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </Pressable>
          <View pointerEvents="none" className="absolute left-0 right-0 items-center pt-1">
            <Logo variant="full" color={colors.accent} fontSize={26} lineHeight={38} />
          </View>
          <View className="w-11" />
        </View>

        <OtpScreen
          email={email}
          recoveryMode={recoveryMode}
          onSuccess={onSuccess}
        />
      </SafeAreaView>
    </View>
  );
}
