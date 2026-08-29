import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OtpScreen } from "@/auth/components";
import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { Logo } from "@/components/ui/logo";
import { colors } from "@/constants";

function readParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export default function OtpPage() {
  const { isDark } = useAppearance();
  const theme = useTheme();
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
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <BlackPatternBackground
        baseColor={theme.patternBase}
        stripeColor={theme.patternStripe}
      />
      <View
        className="absolute inset-0"
        pointerEvents="none"
        style={{ backgroundColor: isDark ? theme.overlay : "rgba(255,255,255,0.74)" }}
      />
      <SafeAreaView className="relative flex-1" edges={["top", "bottom"]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View className="relative mb-2 flex-row items-center justify-between px-6 pt-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            className="-ml-1 h-11 w-11 items-center justify-center rounded-2xl active:opacity-80"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.12)" : theme.brandMuted }}
            onPress={back}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
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
