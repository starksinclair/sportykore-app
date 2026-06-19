import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "@/api/errors";
import { Button } from "@/components/ui/Button";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { colors, scoreboardPattern } from "@/constants";
import {
    InviteScreenShell,
    clearPendingInviteToken,
    getPendingInviteContext,
    getPendingInviteToken,
    useAcceptInvite
} from "@/invite";
import { fonts } from "@/theme/fonts";

export default function InviteHandlerPage() {
  const router = useRouter();
  const [error, setError] = useState<{ message: string; code: number } | null>(null);
  const [leagueName, setLeagueName] = useState<string | undefined>();
  const [teamName, setTeamName] = useState<string | undefined>();
  const [loadingContext, setLoadingContext] = useState(true);
  const acceptInvite = useAcceptInvite();

  useEffect(() => {
    void (async () => {
      const context = await getPendingInviteContext();
      setLeagueName(context.leagueName);
      setTeamName(context.teamName);
      setLoadingContext(false);
    })();
  }, []);

  const processInvite = async () => {
    const token = await getPendingInviteToken();
    if (!token) {
      router.replace("/(app)/(tabs)");
      return;
    }

    setError(null);

    try {
      const result = await acceptInvite.mutateAsync(token);

      if (result.requiresProfile) {
        router.replace("/join/create-profile");
        return;
      }

      await clearPendingInviteToken();
      router.replace(`/`);
    } catch (err) {
      console.log("error", err);
      const status = err instanceof ApiError ? err.status : 0;
      if (status === 404) await clearPendingInviteToken();
      setError({ message: getErrorMessage(status), code: status });
    }
  };

  if (loadingContext) {
    return (
      <View className="flex-1 items-center justify-center bg-[#121212]">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-[#121212]">
        <StatusBar style="light" />
        <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
          <BlackPatternBackground
            baseColor={scoreboardPattern().baseColor}
            stripeColor={scoreboardPattern().stripeColor}
          />
          <View className="flex-1 justify-center gap-6 px-6">
            <View className="rounded-[24px] border border-red-400/30 bg-red-950/40 px-5 py-5">
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-center text-base text-red-100"
              >
                {error.message}
              </Text>
            </View>
            {error.code === 403 ? (
              <Button
                variant="authPurple"
                label="Log in with different account"
                onPress={() => router.replace("/login")}
              />
            ) : (
              <Button
                variant="signInYellow"
                label="Try again"
                onPress={() => void processInvite()}
                loading={acceptInvite.isPending}
              />
            )}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <InviteScreenShell
      title="Join your team"
      subtitle="Accept the invite to join the league roster and appear on the team sheet."
      leagueName={leagueName}
      teamName={teamName}
    >
      <View className="gap-3">
        <Button
          variant="signInYellow"
          label="Join league"
          onPress={() => void processInvite()}
          loading={acceptInvite.isPending}
          disabled={acceptInvite.isPending}
        />
        <View className="flex-row items-center justify-center gap-2">
          <Ionicons name="shield-checkmark-outline" size={16} color="rgba(255,255,255,0.45)" />
          <Text
            style={{ fontFamily: fonts.body }}
            className="text-center text-xs text-white/45"
          >
            You can set up your player profile after joining if needed.
          </Text>
        </View>
      </View>
    </InviteScreenShell>
  );
}

function getErrorMessage(status: number): string {
  if (status === 403) return "This invite was sent to a different account.";
  if (status === 404) return "This invite has expired or is no longer valid.";
  if (status === 409) return "You are already on this roster.";
  return "Something went wrong. Please try again.";
}
