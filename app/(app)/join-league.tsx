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
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { colors, scoreboardPattern } from "@/constants";
import {
  getPendingInviteContext,
  getPendingInviteToken,
  parseInviteToken,
  runAcceptInviteFlow,
  setPendingInviteToken,
} from "@/invite";
import { JoinLeagueLoginPrompt } from "@/invite/components/JoinLeagueLoginPrompt";
import {
  showErrorToast,
  showSuccessToast,
} from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

function readParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export default function JoinLeagueScreen() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
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
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      <View className="relative overflow-hidden bg-[#121212] px-5 pt-0">
        <BlackPatternBackground
          baseColor={scoreboardPattern().baseColor}
          stripeColor={scoreboardPattern().stripeColor}
        />
        <SafeAreaView edges={["top", "bottom"]}>
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.replace("/profile")}
              accessibilityLabel="Back"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <Text
              style={{ fontFamily: fonts.displayBold }}
              className="text-center text-base uppercase tracking-[2px] text-white/85"
            >
              Join a league
            </Text>
            <View className="h-11 w-11" />
          </View>
        </SafeAreaView>
      </View>

      {!hydrated || loadingPrefill ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand} />
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
            contentContainerClassName="gap-6 px-5 pb-10 pt-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-2">
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-lg text-neutral-950"
              >
                Enter your invite
              </Text>
              <Text
                style={{ fontFamily: fonts.body }}
                className="text-sm leading-5 text-slate-500"
              >
                Paste the invite code or full link from your league admin.
              </Text>
            </View>

            {leagueName || teamName ? (
              <View className="gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                {leagueName ? (
                  <InviteContextRow label="League" value={leagueName} />
                ) : null}
                {teamName ? (
                  <InviteContextRow label="Team" value={teamName} />
                ) : null}
              </View>
            ) : null}

            <AuthTextField
              label="Invite code or link"
              value={input}
              onChangeText={setInput}
              placeholder="550e8400-e29b-41d4-a716-446655440000"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <Button
              variant="primary"
              label="Join league"
              onPress={() => void handleJoin()}
              loading={loading}
              disabled={!input.trim() || loading}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

function InviteContextRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-[11px] uppercase tracking-wider text-slate-500"
      >
        {label}
      </Text>
      <Text style={{ fontFamily: fonts.bodyBold }} className="text-base text-neutral-950">
        {value}
      </Text>
    </View>
  );
}
