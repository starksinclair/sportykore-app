import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OtpScreen } from "@/auth/components";
import { Logo } from "@/components/ui/logo";
import { colors } from "@/constants";
import { resumeInviteFlow } from "@/invite";

function readParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export default function OtpPage() {
  const params = useLocalSearchParams<{
    email?: string | string[];
    name?: string | string[];
    recoveryEmail?: string | string[];
    recoveryMode?: string | string[];
  }>();

  const email = readParam(params.email) ?? "";
  const name = readParam(params.name);
  const recoveryEmail = readParam(params.recoveryEmail);
  const recoveryMode = readParam(params.recoveryMode) === "1";

  const back = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/login");
    }
  };

  const onSuccess = async () => {
    await resumeInviteFlow(router);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <View className="relative mb-2 flex-row items-center justify-between px-6 pt-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="-ml-1 h-10 w-10 items-center justify-center active:opacity-70"
          onPress={back}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color="#111827" />
        </Pressable>
        <View pointerEvents="none" className="absolute left-0 right-0 items-center pt-1">
          <Logo variant="full" color={colors.authPurple} fontSize={26} lineHeight={38} />
        </View>
        <View className="w-10" />
      </View>

      <OtpScreen
        email={email}
        name={name}
        recoveryEmail={recoveryEmail}
        recoveryMode={recoveryMode}
        onSuccess={onSuccess}
      />
    </SafeAreaView>
  );
}
