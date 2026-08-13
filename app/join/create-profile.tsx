import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth";
import type { ApiPlayer } from "@/api/entities";
import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import { Button } from "@/components/ui/Button";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { scoreboardPattern } from "@/constants";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import {
  getPendingInviteContext,
  getPendingInviteToken,
  runAcceptInviteFlow,
  type PendingInviteContext,
} from "@/invite";
import {
  showErrorToast,
  showSuccessToast,
} from "@/lib/show-error-toast";
import { PlayerProfileCreateState } from "@/player/components/PlayerProfileSurface";

export default function CreatePlayerProfileRoute() {
  const router = useRouter();
  const { user } = useAuth();
  const theme = useTheme();
  const { isTablet } = useAdaptiveLayout();
  const inviteFrameStyle = isTablet
    ? { alignSelf: "center" as const, width: "100%" as const, maxWidth: 680 }
    : undefined;
  const [token, setToken] = useState<string | null>(null);
  const [context, setContext] = useState<PendingInviteContext>({});
  const [loadingToken, setLoadingToken] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    void (async () => {
      const [pendingToken, pendingContext] = await Promise.all([
        getPendingInviteToken(),
        getPendingInviteContext(),
      ]);
      setToken(pendingToken);
      setContext(pendingContext);
      setLoadingToken(false);
    })();
  }, []);

  const handleProfileCreated = async (_player: ApiPlayer) => {
    if (!token) return;

    setJoining(true);
    const result = await runAcceptInviteFlow(token);
    setJoining(false);

    if (result.kind === "joined") {
      showSuccessToast("You're in!", "Your player profile is ready.");
      router.replace("/profile");
      return;
    }

    if (result.kind === "requires_profile") {
      showErrorToast(
        "Could not join league",
        "Your profile was created, but the invite still needs to be accepted.",
      );
      return;
    }

    if (result.status === 401) {
      showErrorToast("Sign in required", result.message);
      router.push("/login");
      return;
    }

    showErrorToast("Could not join league", result.message);
  };

  if (loadingToken) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.background }}
      >
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (!user) {
    return (
      <InviteProfileShell>
        <View
          className="flex-1 items-center justify-center gap-5 px-6"
          style={inviteFrameStyle}
        >
          <Text className="text-center text-xl" style={{ color: theme.text }}>
            Sign in to finish joining
          </Text>
          <Text
            className="text-center text-sm leading-6"
            style={{ color: theme.textMuted }}
          >
            Your invite is saved. Sign in, then create your player profile.
          </Text>
          <Button
            variant="signInYellow"
            label="Sign in"
            onPress={() => router.push("/login")}
          />
        </View>
      </InviteProfileShell>
    );
  }

  if (!token) {
    return (
      <InviteProfileShell>
        <View
          className="flex-1 items-center justify-center gap-6 px-6"
          style={inviteFrameStyle}
        >
          <Text className="text-center text-xl" style={{ color: theme.text }}>
            No invite found
          </Text>
          <Text
            className="text-center text-sm leading-6"
            style={{ color: theme.textMuted }}
          >
            Open your invite link or paste your invite code on the join league screen.
          </Text>
          <Button
            variant="signInYellow"
            label="Go to join league"
            onPress={() => router.replace("/join-league")}
          />
        </View>
      </InviteProfileShell>
    );
  }

  const inviteLabel = [context.teamName, context.leagueName]
    .filter(Boolean)
    .join(" in ");

  return (
    <InviteProfileShell>
      <View
        className="flex-1 justify-center px-5"
        style={inviteFrameStyle}
      >
        <PlayerProfileCreateState
          viewerName={user.name}
          title="Create your player profile"
          description={
            inviteLabel
              ? `Complete your profile to join ${inviteLabel}. Your stats and highlights will follow you across leagues.`
              : "Complete your profile to join this league. Your stats and highlights will follow you across leagues."
          }
          ctaLabel={joining ? "Joining..." : "Create profile and join"}
          onCreated={handleProfileCreated}
        />
      </View>
    </InviteProfileShell>
  );
}

function InviteProfileShell({ children }: { children: ReactNode }) {
  const { isDark } = useAppearance();
  const theme = useTheme();

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top", "bottom"]}
      style={{ backgroundColor: theme.background }}
    >
      <BlackPatternBackground
        baseColor={isDark ? scoreboardPattern().baseColor : theme.patternBase}
        stripeColor={isDark ? scoreboardPattern().stripeColor : theme.patternStripe}
      />
      <View
        className="absolute inset-0"
        pointerEvents="none"
        style={{ backgroundColor: isDark ? theme.overlay : "rgba(255,255,255,0.74)" }}
      />
      {children}
    </SafeAreaView>
  );
}
