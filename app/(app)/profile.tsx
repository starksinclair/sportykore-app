import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { openBrowserAsync } from "expo-web-browser";
import type { ReactNode } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { colors, scoreboardPattern } from "@/constants";
import { showThrownAsToast } from "@/lib/show-error-toast";
import { useDoesUserHavePlayerProfile } from "@/player";
import { fonts } from "@/theme/fonts";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, deleteAccount } = useAuth();

  const displayName = user?.name?.trim();
  const email = user?.email ?? "";

  const playerProfileQuery = useDoesUserHavePlayerProfile(Boolean(user));
  const hasPlayerProfile = playerProfileQuery.data?.hasPlayerProfile === true;
  const playerId = playerProfileQuery.data?.playerId;

  const handleSignOut = () => {
    Alert.alert(
      "Log out",
      "You will need to sign in again to manage leagues and favourites.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/login");
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account, player profile, and all associated data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace("/login");
            } catch (err) {
              showThrownAsToast(err, "Could not delete account");
            }
          },
        },
      ],
    );
  };

  const handlePlayerProfile = async () => {
    if (playerProfileQuery.isLoading) return;

    if (hasPlayerProfile && user) {
      router.push(`/player/${playerId}`);
      return;
    }

    Alert.alert(
      "Complete your player profile",
      "Player profiles are created when you accept a league invite. Ask your league admin for an invite link, or open one you have already received.",
    );
  };

  const handleRecoveryEmail = () => {
    Alert.alert(
      "Recovery email",
      "Add a recovery email when you create your account. If you lose access to your primary email, use your recovery email to receive a sign-in code.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Recover account", onPress: () => router.push("/forgot") },
      ],
    );
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      <View className="relative overflow-hidden bg-[#121212] px-5  pt-0">
        <BlackPatternBackground
          baseColor={scoreboardPattern().baseColor}
          stripeColor={scoreboardPattern().stripeColor}
        />
        <SafeAreaView edges={["top", "bottom"]}>
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.replace("/(app)/(tabs)")}
              accessibilityLabel="Back"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <Text
              style={{ fontFamily: fonts.displayBold }}
              className="text-base text-center uppercase tracking-[2px] text-white/85"
            >
              Profile
            </Text>
            <View className="h-11 w-11" />
          </View>

          <View className="gap-5">
            <View className="bg-white/8 px-4 py-4">
              {user ? (
                <View className="flex-row items-center gap-4">
                  <View className="h-16 w-16 items-center justify-center rounded-[20px] bg-[#4A148C]">
                    <Text style={{ fontFamily: fonts.bodyBold }} className="text-xl text-white">
                      {displayName?.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1 gap-1">
                    <Text
                      style={{ fontFamily: fonts.bodyBold }}
                      className="text-lg leading-6 text-white"
                      numberOfLines={2}
                    >
                      {displayName}
                    </Text>
                    <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/65">
                      {email}
                    </Text>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => router.push("/login")}
                  className="flex-row items-center justify-center gap-2 rounded-[14px] border-2 border-brand bg-brand-50 py-4 active:opacity-80"
                  accessibilityRole="button"
                  accessibilityLabel="Sign in"
                >
                  <Ionicons name="log-in-outline" size={22} color={colors.brand} />
                  <Text style={{ fontFamily: fonts.bodyBold }} className="text-base text-brand">
                    Sign in
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-5 pb-10 pt-5"
        showsVerticalScrollIndicator={false}
      >
        {user ? (
          <>
              {hasPlayerProfile && (
                 <Section title="Player profile">
                <SettingsRowChevron
                icon="person-outline"
                title={
                  playerProfileQuery.isLoading
                    ? "Loading profile…"
                    : "View profile"
                }
                subtitle={"Your player card and stats"}
                onPress={handlePlayerProfile}
              />
                </Section>
              )}
          
            <Section title="Account">
              <SettingsRowChevron
                icon="people-outline"
                title="Join a league"
                subtitle="Paste an invite code from your admin"
                onPress={() => router.push("/join-league")}
              />
              <Divider />
              <SettingsRowChevron
                icon="trash-outline"
                title="Delete account"
                subtitle="Permanently delete your account"
                onPress={handleDeleteAccount}
              />
            </Section>
          </>
        ) : null}

        <Section title="Support">
          <SettingsRowChevron
            icon="document-text-outline"
            title="Terms of service"
            onPress={() => openBrowserAsync("https://waitlist.sportykore.com/terms")}
          />
          <Divider />
          <SettingsRowChevron
            icon="shield-checkmark-outline"
            title="Privacy policy"
            onPress={() => openBrowserAsync("https://waitlist.sportykore.com/privacy")}
          />
          <Divider />
          <SettingsRowChevron
            icon="help-circle-outline"
            title="Help centre"
            onPress={() => openBrowserAsync("https://waitlist.sportykore.com")}
          />
        </Section>

        {user ? (
          <Pressable
            onPress={handleSignOut}
            className="flex-row items-center justify-center gap-2 rounded-[14px] border border-red-300 bg-red-50 py-4 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <Ionicons name="log-out-outline" size={22} color="#b91c1c" />
            <Text style={{ fontFamily: fonts.bodyBold }} className="text-base text-red-700">
              Log out
            </Text>
          </Pressable>
        ) : null}

        <Text
          style={{ fontFamily: fonts.body }}
          className="pb-8 text-center text-xs leading-5 text-slate-500"
        >
          Sportykore v{APP_VERSION}
        </Text>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="px-1 text-[11px] uppercase tracking-[2px] text-slate-500"
      >
        {title}
      </Text>
      <View className="overflow-hidden rounded-[16px] border border-neutral-200 bg-white">
        {children}
      </View>
    </View>
  );
}

function Divider() {
  return <View className="ml-14 h-px bg-neutral-100" />;
}

function SettingsRowChevron({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3 active:bg-neutral-50"
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
        <Ionicons name={icon} size={20} color="#374151" />
      </View>
      <View className="flex-1 gap-0.5">
        <Text style={{ fontFamily: fonts.bodyBold }} className="text-[15px] text-neutral-950">
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontFamily: fonts.body }} className="text-xs text-slate-500">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </Pressable>
  );
}
