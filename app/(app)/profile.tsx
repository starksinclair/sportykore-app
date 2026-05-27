import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { colors, scoreboardPattern } from "@/constants";
import { fonts } from "@/theme/fonts";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, deleteOnboardingCompleted } = useAuth();
  const [matchAlerts, setMatchAlerts] = useState(true);

  const displayName = user?.name?.trim() || "Gbako supporter";
  const email = user?.email ?? "";

  const handleComingSoon = (label: string) => {
    Alert.alert(label, "This will be wired up in a future release.");
  };

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

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      <View className="relative overflow-hidden bg-[#121212] px-5 pb-6 pt-0">
        <BlackPatternBackground
          baseColor={scoreboardPattern().baseColor}
          stripeColor={scoreboardPattern().stripeColor}
        />
        <SafeAreaView edges={["top"]}>
          <View className="flex-row items-center justify-between pb-4 pt-1">
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Back"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-base uppercase tracking-[2px] text-white/85"
            >
              Profile
            </Text>
            <View className="h-11 w-11" />
          </View>

          <View className="gap-5">
            <View className="bg-white/8 px-4 py-4">
              <View className="flex-row items-center gap-4">
                <View className="h-16 w-16 items-center justify-center rounded-[20px] bg-[#4A148C]">
                  <Text style={{ fontFamily: fonts.bodyBold }} className="text-xl text-white">
                    {displayName.slice(0, 1).toUpperCase()}
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
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-5 pb-10 pt-5"
        showsVerticalScrollIndicator={false}
      >
        <Section title="Notifications">
          <SettingsRowSwitch
            icon="notifications-outline"
            title="Match & score alerts"
            subtitle="Kickoff reminders and live scores"
            value={matchAlerts}
            onValueChange={setMatchAlerts}
          />
        </Section>

        <Section title="Preferences">
          <SettingsRowChevron
            icon="moon-outline"
            title="Appearance"
            subtitle="Theme follows device for now"
            onPress={() => handleComingSoon("Appearance")}
          />
          <Divider />
          <SettingsRowChevron
            icon="language-outline"
            title="Language & region"
            subtitle="English • device region"
            onPress={() => handleComingSoon("Language")}
          />
        </Section>

        <Section title="Support">
          <SettingsRowChevron
            icon="document-text-outline"
            title="Terms & privacy"
            subtitle="Policies and how we use data"
            onPress={() => handleComingSoon("Terms & privacy")}
          />
          <Divider />
          <SettingsRowChevron
            icon="help-circle-outline"
            title="Help centre"
            subtitle="FAQs and contact"
            onPress={() => handleComingSoon("Help")}
          />
        </Section>

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
        <Pressable onPress={() => deleteOnboardingCompleted()}>
          <Text style={{ fontFamily: fonts.bodyBold }} className="text-base text-red-700">
            Delete onboarding completed
          </Text>
        </Pressable>

        <Text
          style={{ fontFamily: fonts.body }}
          className="pb-8 text-center text-xs leading-5 text-slate-500"
        >
          Gbako — local football, clearer for everyone on the continent.
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

function SettingsRowSwitch({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#F3E8FF]">
        <Ionicons name={icon} size={20} color={colors.brand} />
      </View>
      <View className="flex-1 gap-0.5 pr-2">
        <Text style={{ fontFamily: fonts.bodyBold }} className="text-[15px] text-neutral-950">
          {title}
        </Text>
        <Text style={{ fontFamily: fonts.body }} className="text-xs text-slate-500">
          {subtitle}
        </Text>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#e7e7e7", true: "#d8b4fe" }}
        thumbColor={value ? colors.brand : "#f4f4f5"}
      />
    </View>
  );
}

function SettingsRowChevron({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
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
        <Text style={{ fontFamily: fonts.body }} className="text-xs text-slate-500">
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </Pressable>
  );
}
