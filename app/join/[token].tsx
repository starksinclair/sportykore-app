import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

import { useAuth } from "@/auth";
import { Button } from "@/components/ui/Button";
import { InviteScreenShell } from "@/invite/components/InviteScreenShell";
import { setPendingInviteToken } from "@/invite";

function readParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export default function JoinInvitePage() {
  const params = useLocalSearchParams<{
    token: string;
    leagueName?: string | string[];
    teamName?: string | string[];
  }>();
  const token = params.token ?? "";
  const leagueName = readParam(params.leagueName);
  const teamName = readParam(params.teamName);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!token.trim()) {
      router.replace("/(app)/(tabs)");
      return;
    }

    void setPendingInviteToken(token.trim(), { leagueName, teamName }).then(() => {
      if (user) {
        router.replace("/join/invite-handler");
      }
    });
  }, [token, leagueName, teamName, user, router]);

  if (user) {
    return null;
  }

  return (
    <InviteScreenShell
      title="You've been invited"
      subtitle="Sign in or create an account to accept your invite and set up your player profile."
      leagueName={leagueName}
      teamName={teamName}
    >
      <View className="w-full gap-3">
        <Button
          variant="signInYellow"
          label="Continue with email"
          onPress={() => router.push("/login")}
        />
      </View>
    </InviteScreenShell>
  );
}
