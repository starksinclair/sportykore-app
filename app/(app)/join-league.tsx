import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { colors, scoreboardPattern } from "@/constants";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import {
  getPendingInviteContext,
  getPendingInviteToken,
  parseInviteToken,
  runAcceptInviteFlow,
  setPendingInviteToken,
} from "@/invite";
import { JoinLeagueLoginPrompt } from "@/invite/components/JoinLeagueLoginPrompt";
import { posthog } from "@/lib/posthog";
import {
  showErrorToast,
  showSuccessToast,
} from "@/lib/show-error-toast";

function readParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export default function JoinLeagueScreen() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const { isTablet, isWideTablet } = useAdaptiveLayout();
  const tabletMaxWidth = isWideTablet ? 760 : 660;
  const tabletFrameStyle = isTablet
    ? { alignSelf: "center" as const, width: "100%" as const, maxWidth: tabletMaxWidth }
    : undefined;
  const params = useLocalSearchParams<{
    token?: string | string[];
    leagueName?: string | string[];
    teamName?: string | string[];
  }>();
  const [input, setInput] = useState("");
  const [leagueName, setLeagueName] = useState<string | undefined>();
  const [teamName, setTeamName] = useState<string | undefined>();
  const [loadingPrefill, setLoadingPrefill] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const paramToken = readParam(params.token);
      const paramLeagueName = readParam(params.leagueName);
      const paramTeamName = readParam(params.teamName);

      if (paramToken) {
        await setPendingInviteToken(paramToken, {
          leagueName: paramLeagueName,
          teamName: paramTeamName,
        });
        setInput(paramToken);
        setLeagueName(paramLeagueName);
        setTeamName(paramTeamName);
        setLoadingPrefill(false);
        return;
      }

      const [storedToken, context] = await Promise.all([
        getPendingInviteToken(),
        getPendingInviteContext(),
      ]);

      if (storedToken) {
        setInput(storedToken);
      }
      setLeagueName(context.leagueName);
      setTeamName(context.teamName);
      setLoadingPrefill(false);
    })();
  }, [params.token, params.leagueName, params.teamName]);

  const handleJoin = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    const token = parseInviteToken(input);
    if (!token) {
      showErrorToast(
        "Invalid invite",
        "Paste an invite code or the full link from your league admin.",
      );
      return;
    }

    setLoading(true);
    try {
      const result = await runAcceptInviteFlow(token);

      if (result.kind === "requires_profile") {
        router.push("/join/create-profile");
        return;
      }

      if (result.kind === "joined") {
        posthog?.capture("league_joined", {
          has_prefilled_invite: Boolean(params.token),
        });
        showSuccessToast("You're in!", "Welcome to the league.");
        router.replace("/profile");
        return;
      }

      showErrorToast("Could not join league", result.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.scoreboardBlack }}>
      <StatusBar style="light" />
      <BlackPatternBackground
        baseColor={scoreboardPattern().baseColor}
        stripeColor={scoreboardPattern().stripeColor}
      />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="px-5 pt-1">
          <View
            className="flex-row items-center justify-between pb-2"
            style={tabletFrameStyle}
          >
            <Pressable
              onPress={() => router.replace("/profile")}
              accessibilityLabel="Back"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
            >
              <Ionicons name="chevron-back" size={22} color={colors.white} />
            </Pressable>
            <Text
              className="text-center text-base uppercase tracking-[2px] text-white/85"
            >
              Join a league
            </Text>
            <View className="h-11 w-11" />
          </View>
        </View>

        {!hydrated || loadingPrefill ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : !user ? (
          <JoinLeagueLoginPrompt />
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1"
          >
            <ScrollView
              className="flex-1"
              contentContainerClassName="gap-5 px-5 pb-10 pt-5"
              contentContainerStyle={isTablet ? { alignItems: "center" } : undefined}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="w-full gap-5" style={tabletFrameStyle}>
                <View className="items-center gap-3">
                  <View className="h-16 w-16 items-center justify-center rounded-[22px] bg-accent-500/15">
                    <Ionicons name="ticket-outline" size={28} color={colors.accent} />
                  </View>
                  <View className="gap-2">
                    <Text
                      className="text-center text-2xl text-white"
                    >
                      Join your league
                    </Text>
                    <Text
                      className="text-center text-sm leading-6 text-white/65"
                    >
                      Paste the invite code or full link from your league admin.
                    </Text>
                  </View>
                </View>

                {leagueName || teamName ? (
                  <View className="gap-3 rounded-[22px] border border-white/10 bg-white/6 px-4 py-4">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
                      <Text
                        className="text-xs uppercase tracking-wide text-white/50"
                      >
                        Invite details
                      </Text>
                    </View>
                    {leagueName ? (
                      <InviteContextRow label="League" value={leagueName} />
                    ) : null}
                    {teamName ? (
                      <InviteContextRow label="Team" value={teamName} />
                    ) : null}
                  </View>
                ) : null}

                <View className="gap-4 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
                  <View className="gap-1">
                    <Text
                      className="text-base text-white"
                    >
                      Enter invite
                    </Text>
                    <Text
                      className="text-sm leading-5 text-white/55"
                    >
                      Codes and shared links both work here.
                    </Text>
                  </View>

                  <AuthTextField
                    label="Invite code or link"
                    labelClassName="text-white/60"
                    value={input}
                    onChangeText={setInput}
                    placeholder="550e8400-e29b-41d4-a716-446655440000"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>

                <Pressable
                  onPress={() => void handleJoin()}
                  disabled={!input.trim() || loading}
                  accessibilityRole="button"
                  className={`h-12 flex-row items-center justify-center gap-2 rounded-full border border-accent-400 bg-accent-500 px-4 active:opacity-90 ${
                    !input.trim() || loading ? "opacity-50" : ""
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.darkLabel} size="small" />
                  ) : (
                    <Ionicons name="enter-outline" size={17} color={colors.darkLabel} />
                  )}
                  <Text
                    className="text-sm text-neutral-950"
                    numberOfLines={1}
                  >
                    {loading ? "Joining..." : "Join league"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
}

function InviteContextRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <Text
        className="text-[11px] uppercase tracking-wider text-white/45"
      >
        {label}
      </Text>
      <Text className="text-base text-white">
        {value}
      </Text>
    </View>
  );
}
