import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth";
import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
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
  const { isDark } = useAppearance();
  const theme = useTheme();
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
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <BlackPatternBackground
        baseColor={isDark ? scoreboardPattern().baseColor : theme.patternBase}
        stripeColor={isDark ? scoreboardPattern().stripeColor : theme.patternStripe}
      />
      <View
        className="absolute inset-0"
        pointerEvents="none"
        style={{ backgroundColor: isDark ? theme.overlay : "rgba(255,255,255,0.74)" }}
      />

      <SafeAreaView className="relative flex-1" edges={["top", "bottom"]}>
        <View className="px-5 pt-1">
          <View
            className="flex-row items-center justify-between pb-2"
            style={tabletFrameStyle}
          >
            <Pressable
              onPress={() => router.replace("/profile")}
              accessibilityLabel="Back"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full active:opacity-80"
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : theme.brandMuted }}
            >
              <Ionicons name="chevron-back" size={22} color={theme.text} />
            </Pressable>
            <Text
              className="text-center text-base uppercase tracking-[2px]"
              style={{ color: theme.text }}
            >
              Join a league
            </Text>
            <View className="h-11 w-11" />
          </View>
        </View>

        {!hydrated || loadingPrefill ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : !user ? (
          <JoinLeagueLoginPrompt />
        ) : (
          <KeyboardAwareScrollView
            bottomOffset={24}
            style={{ flex: 1 }}
            contentContainerStyle={[
              { gap: 20, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 },
              isTablet ? { alignItems: "center" } : undefined,
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
              <View className="w-full gap-5" style={tabletFrameStyle}>
                <View className="items-center gap-3">
                  <View
                    className="h-16 w-16 items-center justify-center rounded-[22px]"
                    style={{ backgroundColor: theme.accentMuted }}
                  >
                    <Ionicons name="ticket-outline" size={28} color={theme.accent} />
                  </View>
                  <View className="gap-2">
                    <Text
                      className="text-center text-2xl"
                      style={{ color: theme.text }}
                    >
                      Join your league
                    </Text>
                    <Text
                      className="text-center text-sm leading-6"
                      style={{ color: theme.textMuted }}
                    >
                      Paste the invite code or full link from your league admin.
                    </Text>
                  </View>
                </View>

                <View
                  className="gap-3 rounded-[22px] border px-4 py-4"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  }}
                >
                  <View className="flex-row items-center gap-2">
                    <View
                      className="h-8 w-8 items-center justify-center rounded-xl"
                      style={{ backgroundColor: theme.accentMuted }}
                    >
                      <Ionicons name="information-circle-outline" size={18} color={theme.accent} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="text-base" style={{ color: theme.text }}>
                        What happens when you join
                      </Text>
                    </View>
                  </View>
                  <View className="gap-2">
                    <JoinExpectationRow text="You are added to the league or team connected to this invite." />
                    <JoinExpectationRow text="You can check out the league page for fixtures, standings, teams, and updates." />
                    <JoinExpectationRow text="If a player profile is needed first, we will guide you through it before joining." />
                  </View>
                </View>

                {leagueName || teamName ? (
                  <View
                    className="gap-3 rounded-[22px] border px-4 py-4"
                    style={{
                      backgroundColor: theme.card,
                      borderColor: theme.cardBorder,
                    }}
                  >
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="shield-checkmark-outline" size={16} color={theme.accent} />
                      <Text
                        className="text-xs uppercase tracking-wide"
                        style={{ color: theme.textSubtle }}
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

                <View
                  className="gap-4 rounded-[22px] border px-4 py-4"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  }}
                >
                  <View className="gap-1">
                    <Text
                      className="text-base"
                      style={{ color: theme.text }}
                    >
                      Enter invite
                    </Text>
                    <Text
                      className="text-sm leading-5"
                      style={{ color: theme.textSubtle }}
                    >
                      Codes and shared links both work here.
                    </Text>
                  </View>

                  <AuthTextField
                    label="Invite code or link"
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
          </KeyboardAwareScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

function JoinExpectationRow({ text }: { text: string }) {
  const theme = useTheme();

  return (
    <View className="flex-row gap-2">
      <Ionicons name="checkmark-circle" size={17} color={theme.accent} />
      <Text className="flex-1 text-sm leading-5" style={{ color: theme.textMuted }}>
        {text}
      </Text>
    </View>
  );
}

function InviteContextRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View className="gap-1">
      <Text
        className="text-[11px] uppercase tracking-wider"
        style={{ color: theme.textSubtle }}
      >
        {label}
      </Text>
      <Text className="text-base" style={{ color: theme.text }}>
        {value}
      </Text>
    </View>
  );
}
