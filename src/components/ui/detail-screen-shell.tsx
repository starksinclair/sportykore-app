import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { ThemedView } from "./themed-view";

type DetailScreenShellProps = {
  title: string;
  subtitle?: ReactNode;
  rightAccessory?: ReactNode;
  leagueId?: number;
  /** Sticky content rendered between the header bar and the scrollable body (e.g. tabs, season picker). */
  headerContent?: ReactNode;
  /** Keeps phone layouts unchanged while allowing selected detail screens to breathe on tablet. */
  tabletMaxWidth?: number;
  children: ReactNode;
};

export function DetailScreenShell({
  title,
  subtitle,
  rightAccessory,
  leagueId,
  headerContent,
  tabletMaxWidth,
  children,
}: DetailScreenShellProps) {
  const router = useRouter();
  const { isDark } = useAppearance();
  const theme = useTheme();
  const { isTablet } = useAdaptiveLayout();
  const useTabletWidth = isTablet && tabletMaxWidth != null;
  const tabletWidthStyle = useTabletWidth
    ? { alignSelf: "center" as const, width: "100%" as const, maxWidth: tabletMaxWidth }
    : undefined;

  return (
    <ThemedView type="background" className="flex-1">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* <BlackPatternBackground
          baseColor={theme.patternBase}
          stripeColor={theme.patternStripe}
        /> */}
        <View
          className="absolute inset-0"
          pointerEvents="none"
          style={{ backgroundColor: isDark ? theme.overlay : "rgba(255,255,255,0.74)" }}
        />

        <View
          className="relative flex-row items-center justify-between px-5 pb-3 pt-1"
          style={tabletWidthStyle}
        >
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="h-11 w-11 items-center justify-center rounded-full active:opacity-80"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : theme.brandMuted }}
          >
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </Pressable>

          {leagueId ? (
            <Pressable
              onPress={() => router.push(`/league/${leagueId}`)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${title} league`}
              className="flex-1 px-3 active:opacity-80"
            >
              <HeaderTitle title={title} subtitle={subtitle} />
            </Pressable>
          ) : (
            <View className="flex-1 px-3">
              <HeaderTitle title={title} subtitle={subtitle} />
            </View>
          )}

          <View className="min-w-[44px] items-end">
            {rightAccessory ?? <View className="h-11 w-11" />}
          </View>
        </View>

        {headerContent ? (
          <View className="gap-3 px-5 pb-2 pt-1" style={tabletWidthStyle}>
            {headerContent}
          </View>
        ) : null}

        <KeyboardAwareScrollView
          bottomOffset={24}
          style={{ flex: 1 }}
          contentContainerStyle={[
            { gap: 24, paddingHorizontal: 20, paddingBottom: 48, paddingTop: 12 },
            useTabletWidth ? { alignItems: "center" } : undefined,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {useTabletWidth ? (
            <View className="w-full gap-6" style={{ maxWidth: tabletMaxWidth }}>
              {children}
            </View>
          ) : (
            children
          )}
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function HeaderTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: ReactNode;
}) {
  const theme = useTheme();

  return (
    <>
      <Text
        numberOfLines={1}
        className="text-center text-[18px]"
        style={{ color: theme.text }}
      >
        {title}
      </Text>
      {subtitle ? (
        <View className="items-center pt-1">
          {typeof subtitle === "string" ? (
            <Text
              numberOfLines={1}
              className="text-center text-xs"
              style={{ color: theme.textSubtle }}
            >
              {subtitle}
            </Text>
          ) : (
            subtitle
          )}
        </View>
      ) : null}
    </>
  );
}
