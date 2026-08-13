import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { openBrowserAsync } from "expo-web-browser";
import type { ReactNode } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/auth";
import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import { Button } from "@/components/ui/Button";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { colors, scoreboardPattern } from "@/constants";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { posthog } from "@/lib/posthog";
import { useOwnPlayerProfile } from "@/player";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isDark, toggleDarkMode } = useAppearance();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isTablet, isWideTablet } = useAdaptiveLayout();
  const deleteAccountUrl = "https://www.sportykore.com/delete-account";
  const tabletMaxWidth = isWideTablet ? 1040 : 880;
  const tabletFrameStyle = isTablet
    ? { alignSelf: "center" as const, width: "100%" as const, maxWidth: tabletMaxWidth }
    : undefined;

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

  const handlePlayerProfile = async () => {
    if (playerProfileQuery.isLoading) return;

    router.push("/player/me");
  };

  const handleAppearanceToggle = () => {
    const nextTheme = isDark ? "light" : "dark";
    posthog?.capture("appearance_theme_toggled", {
      theme: nextTheme,
      source: "profile",
    });
    void toggleDarkMode();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <BlackPatternBackground
        baseColor={isDark ? scoreboardPattern().baseColor : theme.patternBase}
        stripeColor={theme.patternStripe}
      />
      <View
        className="absolute inset-0"
        pointerEvents="none"
        style={{ backgroundColor: isDark ? theme.overlay : "rgba(255,255,255,0.72)" }}
      />

      <View className="relative overflow-hidden px-5 pt-0">
        <SafeAreaView edges={["top", "bottom"]}>
          <View
            className="flex-row items-center justify-between"
            style={tabletFrameStyle}
          >
            <Pressable
              onPress={() => router.replace("/(app)/(tabs)")}
              accessibilityLabel="Back"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full active:opacity-80"
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : theme.brandMuted }}
            >
              <Ionicons name="chevron-back" size={22} color={theme.text} />
            </Pressable>
            <Text
              className="text-base text-center uppercase tracking-[2px]"
              style={{ color: theme.text }}
            >
              Profile
            </Text>
            <View className="h-11 w-11" />
          </View>

          <View className="mt-5 gap-5" style={tabletFrameStyle}>
            <View
              className="rounded-[22px] border px-4 py-4"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              }}
            >
              {user ? (
                <View className="flex-row items-center gap-4">
                  <View
                    className="h-16 w-16 items-center justify-center rounded-[20px]"
                    style={{ backgroundColor: colors.brand }}
                  >
                    <Text className="text-xl" style={{ color: colors.white }}>
                      {displayName?.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1 gap-1">
                    <Text
                      className="text-lg leading-6"
                      style={{ color: theme.text }}
                      numberOfLines={2}
                    >
                      {displayName}
                    </Text>
                    <Text className="text-sm" style={{ color: theme.textMuted }}>
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
                  <Text className="text-base" style={{ color: colors.darkLabel }}>
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
          ...(isTablet ? { alignItems: "center" as const } : null),
        }}
      >
        <View
          className={isTablet ? "w-full gap-6" : "gap-6"}
          style={tabletFrameStyle}
        >
          {isTablet ? (
            <View className="flex-row items-start gap-5">
              <View className="flex-1 gap-6">
                {user ? (
                  <>
                    <PlayerProfileSection
                      hasPlayerProfile={hasPlayerProfile}
                      loading={playerProfileQuery.isLoading}
                      onPress={handlePlayerProfile}
                    />
                    <AccountSection
                      onJoinLeague={() => router.push("/join-league")}
                      onDeleteAccount={() => openBrowserAsync(deleteAccountUrl)}
                    />
                  </>
                ) : null}
                <AppearanceSection
                  isDark={isDark}
                  onToggle={handleAppearanceToggle}
                />
              </View>
              <View className="flex-1 gap-6">
                <SupportSection
                  onTerms={() => openBrowserAsync("https://waitlist.sportykore.com/terms")}
                  onPrivacy={() => openBrowserAsync("https://waitlist.sportykore.com/privacy")}
                  onHelpCenter={() => router.push("/help-center")}
                />
                {user ? <LogoutButton onPress={handleSignOut} /> : null}
              </View>
            </View>
          ) : (
            <>
              {user ? (
                <>
                  <PlayerProfileSection
                    hasPlayerProfile={hasPlayerProfile}
                    loading={playerProfileQuery.isLoading}
                    onPress={handlePlayerProfile}
                  />
                  <AccountSection
                    onJoinLeague={() => router.push("/join-league")}
                    onDeleteAccount={() => openBrowserAsync(deleteAccountUrl)}
                  />
                </>
              ) : null}

              <AppearanceSection
                isDark={isDark}
                onToggle={handleAppearanceToggle}
              />

              <SupportSection
                onTerms={() => openBrowserAsync("https://waitlist.sportykore.com/terms")}
                onPrivacy={() => openBrowserAsync("https://waitlist.sportykore.com/privacy")}
                onHelpCenter={() => router.push("/help-center")}
              />

              {user ? <LogoutButton onPress={handleSignOut} /> : null}
            </>
          )}
        </View>

        {/* <Text
          className="pb-8 text-center text-xs leading-5 text-slate-500"
        >
          SportyKore v{APP_VERSION}
        </Text> */}
      </ScrollView>
    </View>
  );
}

function PlayerProfileSection({
  hasPlayerProfile,
  loading,
  onPress,
}: {
  hasPlayerProfile: boolean;
  loading: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Section title="Player profile">
      {hasPlayerProfile ? (
        <SettingsRowChevron
          icon="person-outline"
          title={loading ? "Loading profile…" : "View profile"}
          subtitle="Your player card, stats, and highlights"
          onPress={onPress}
        />
      ) : (
        <View className="gap-3 px-4 py-4">
          <View className="flex-row gap-3">
            <View
              className="h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: theme.accentMuted }}
            >
              <Ionicons name="person-add-outline" size={20} color={theme.accent} />
            </View>
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-[15px]" style={{ color: theme.text }}>
                Create player profile
              </Text>
              <Text className="text-xs leading-5" style={{ color: theme.textMuted }}>
                A permanent profile that follows you across leagues,
                with your stats and highlights in one place.
              </Text>
            </View>
          </View>
          <Button
            variant="signInYellow"
            label="Create profile"
            className="h-11 rounded-full"
            onPress={onPress}
          />
        </View>
      )}
    </Section>
  );
}

function AccountSection({
  onJoinLeague,
  onDeleteAccount,
}: {
  onJoinLeague: () => void;
  onDeleteAccount: () => void;
}) {
  return (
    <Section title="Account">
      <SettingsRowChevron
        icon="people-outline"
        title="Join a league"
        subtitle="Paste an invite code from your league admin"
        onPress={onJoinLeague}
      />
      <Divider />
      <SettingsRowChevron
        icon="trash-outline"
        title="Delete account"
        subtitle="Open the account deletion page"
        onPress={onDeleteAccount}
      />
    </Section>
  );
}

function SupportSection({
  onTerms,
  onPrivacy,
  onHelpCenter,
}: {
  onTerms: () => void;
  onPrivacy: () => void;
  onHelpCenter: () => void;
}) {
  return (
    <Section title="Support">
      <SettingsRowChevron
        icon="document-text-outline"
        title="Terms of service"
        onPress={onTerms}
      />
      <Divider />
      <SettingsRowChevron
        icon="shield-checkmark-outline"
        title="Privacy policy"
        onPress={onPrivacy}
      />
      <Divider />
      <SettingsRowChevron
        icon="help-circle-outline"
        title="Help center"
        subtitle="FAQs for leagues, roles, invites, and Match Center"
        onPress={onHelpCenter}
      />
    </Section>
  );
}

function AppearanceSection({
  isDark,
  onToggle,
}: {
  isDark: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();

  return (
    <Section title="Appearance">
      <View className="flex-row items-center gap-3 px-4 py-4">
        <View
          className="h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: theme.accentMuted }}
        >
          <Ionicons
            name={isDark ? "moon-outline" : "sunny-outline"}
            size={20}
            color={theme.accent}
          />
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-[15px]" style={{ color: theme.text }}>
            Dark mode
          </Text>
          <Text className="text-xs leading-5" style={{ color: theme.textSubtle }}>
            Turn it off for better visibility in direct sun.
          </Text>
        </View>
        <Switch
          value={isDark}
          onValueChange={onToggle}
          trackColor={{
            false: theme.inputBorder,
            true: "rgba(230,168,23,0.5)",
          }}
          thumbColor={isDark ? theme.accent : colors.white}
          ios_backgroundColor={theme.inputBorder}
        />
      </View>
    </Section>
  );
}

function LogoutButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-center gap-2 rounded-[14px] border py-4 active:opacity-80"
      style={{
        backgroundColor: theme.dangerMuted,
        borderColor: theme.danger,
      }}
      accessibilityRole="button"
      accessibilityLabel="Log out"
    >
      <Ionicons name="log-out-outline" size={22} color={theme.danger} />
      <Text className="text-base" style={{ color: theme.danger }}>
        Log out
      </Text>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();

  return (
    <View className="gap-2">
      <Text
        className="px-1 text-[11px] uppercase tracking-[2px]"
        style={{ color: theme.textSubtle }}
      >
        {title}
      </Text>
      <View
        className="overflow-hidden rounded-[18px] border"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Divider() {
  const theme = useTheme();

  return <View className="ml-14 h-px" style={{ backgroundColor: theme.cardBorder }} />;
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
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3 active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: theme.accentMuted }}
      >
        <Ionicons name={icon} size={20} color={theme.accent} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-[15px]" style={{ color: theme.text }}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-xs" style={{ color: theme.textSubtle }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} />
    </Pressable>
  );
}
