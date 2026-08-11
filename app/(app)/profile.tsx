import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { openBrowserAsync } from "expo-web-browser";
import type { ReactNode } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/auth";
import { Button } from "@/components/ui/Button";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { colors, scoreboardPattern } from "@/constants";
import { showThrownAsToast } from "@/lib/show-error-toast";
import { useOwnPlayerProfile } from "@/player";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, deleteAccount } = useAuth();
  const insets = useSafeAreaInsets();

  const displayName = user?.name?.trim();
  const email = user?.email ?? "";

  const playerProfileQuery = useOwnPlayerProfile(Boolean(user));
  const playerProfile = playerProfileQuery.data;
  const hasPlayerProfile = playerProfile?.kind === "profile";

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

    router.push("/player/me");
  };

  return (
    <View className="flex-1 bg-neutral-950">
      <StatusBar style="light" />
      <BlackPatternBackground
        baseColor={scoreboardPattern().baseColor}
        stripeColor="rgba(230, 168, 23, 0.045)"
      />
      <View className="absolute inset-0 bg-black/35" pointerEvents="none" />

      <View className="relative overflow-hidden px-5 pt-0">
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
              className="text-base text-center uppercase tracking-[2px] text-white/85"
            >
              Profile
            </Text>
            <View className="h-11 w-11" />
          </View>

          <View className="gap-5 mt-5">
            <View className="rounded-[22px] border border-white/10 bg-white/[0.06] px-4 py-4">
              {user ? (
                <View className="flex-row items-center gap-4">
                  <View className="h-16 w-16 items-center justify-center rounded-[20px] bg-[#4A148C]">
                    <Text className="text-xl text-white">
                      {displayName?.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1 gap-1">
                    <Text
                      className="text-lg leading-6 text-white"
                      numberOfLines={2}
                    >
                      {displayName}
                    </Text>
                    <Text className="text-sm text-white/65">
                      {email}
                    </Text>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => router.push("/login")}
                  className="flex-row items-center justify-center gap-2 rounded-[14px] border border-accent-400 bg-accent-500 py-4 active:opacity-90"
                  accessibilityRole="button"
                  accessibilityLabel="Sign in"
                >
                  <Ionicons name="log-in-outline" size={22} color={colors.darkLabel} />
                  <Text className="text-base text-neutral-950">
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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 16,
        }}
      >
        {user ? (
          <>
            <Section title="Player profile">
              {hasPlayerProfile ? (
                <SettingsRowChevron
                  icon="person-outline"
                  title={
                    playerProfileQuery.isLoading
                      ? "Loading profile…"
                      : "View profile"
                  }
                  subtitle={"Your player card, stats, and highlights"}
                  onPress={handlePlayerProfile}
                />
              ) : (
                <View className="gap-3 px-4 py-4">
                  <View className="flex-row gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent-500/15">
                      <Ionicons name="person-add-outline" size={20} color={colors.accent} />
                    </View>
                    <View className="min-w-0 flex-1 gap-1">
                      <Text className="text-[15px] text-white">
                        Create player profile
                      </Text>
                      <Text className="text-xs leading-5 text-white/60">
                        A permanent profile that follows you across leagues,
                        with your stats and highlights in one place.
                      </Text>
                    </View>
                  </View>
                  <Button
                    variant="signInYellow"
                    label="Create profile"
                    className="h-11 rounded-full"
                    onPress={handlePlayerProfile}
                  />
                </View>
              )}
            </Section>

            <Section title="Account">
              <SettingsRowChevron
                icon="people-outline"
                title="Join a league"
                subtitle="Paste an invite code from your league admin"
                onPress={() => router.push("/join-league")}
              />
              <Divider />
              {/* <SettingsRowChevron
                icon="trash-outline"
                title="Delete account"
                subtitle="Permanently delete your account"
                onPress={handleDeleteAccount}
              /> */}
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
            title="Help center"
            subtitle="FAQs for leagues, roles, invites, and Match Center"
            onPress={() => router.push("/help-center")}
          />
        </Section>

        {user ? (
          <Pressable
            onPress={handleSignOut}
            className="flex-row items-center justify-center gap-2 rounded-[14px] border border-red-300/30 bg-red-500/10 py-4 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <Ionicons name="log-out-outline" size={22} color="#FCA5A5" />
            <Text className="text-base text-red-200">
              Log out
            </Text>
          </Pressable>
        ) : null}

        {/* <Text
          className="pb-8 text-center text-xs leading-5 text-slate-500"
        >
          SportyKore v{APP_VERSION}
        </Text> */}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text
        className="px-1 text-[11px] uppercase tracking-[2px] text-white/50"
      >
        {title}
      </Text>
      <View className="overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.06]">
        {children}
      </View>
    </View>
  );
}

function Divider() {
  return <View className="ml-14 h-px bg-white/10" />;
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
      className="flex-row items-center gap-3 px-4 py-3 active:bg-white/5"
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/10">
        <Ionicons name={icon} size={20} color={colors.accent} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-[15px] text-white">
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-xs text-white/55">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
    </Pressable>
  );
}
