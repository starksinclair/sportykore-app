import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { fonts } from "@/theme/fonts";
import { ThemedView } from "./themed-view";

type DetailScreenShellProps = {
  title: string;
  subtitle?: ReactNode;
  rightAccessory?: ReactNode;
  /** Sticky content rendered between the header bar and the scrollable body (e.g. tabs, season picker). */
  headerContent?: ReactNode;
  children: ReactNode;
};

export function DetailScreenShell({
  title,
  subtitle,
  rightAccessory,
  headerContent,
  children,
}: DetailScreenShellProps) {
  const router = useRouter();

  return (
    <ThemedView type="background" className="flex-1">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <BlackPatternBackground
          baseColor="#0F0F10"
          stripeColor="rgba(230, 168, 23, 0.06)"
        />

        <View className="flex-row items-center justify-between px-5 pb-3 pt-1">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="h-11 w-11 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>

          <View className="flex-1 px-3">
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              numberOfLines={1}
              className="text-center text-[18px] text-white"
            >
              {title}
            </Text>
            {subtitle ? (
              <View className="items-center pt-1">
                {typeof subtitle === "string" ? (
                  <Text
                    style={{ fontFamily: fonts.body }}
                    numberOfLines={1}
                    className="text-center text-xs text-white/55"
                  >
                    {subtitle}
                  </Text>
                ) : (
                  subtitle
                )}
              </View>
            ) : null}
          </View>

          <View className="min-w-[44px] items-end">
            {rightAccessory ?? <View className="h-11 w-11" />}
          </View>
        </View>

        {headerContent ? (
          <View className="gap-3 px-5 pb-2 pt-1">{headerContent}</View>
        ) : null}

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-6 px-5 pb-12 pt-3"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
