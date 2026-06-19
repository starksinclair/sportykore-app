import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Logo } from "@/components/ui";
import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

export default function LandingScreen() {
  return (
    <View className="flex-1 bg-[#3C096C]">
      <StatusBar style="light" />

        <SafeAreaView style={styles.flexFill} edges={["top", "bottom"]}>
          <ScrollView
            className="flex-1 px-6"
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.imageCard} className="border border-brand-500">
              <Image
                source={require("../../assets/static/ChildrenPlayingWithWater.jpeg")}
                style={styles.heroImage}
                className=""
                contentFit="cover"
              />

              {/* Purple monochrome wash + bottom vignette (matches Figma + photo readability) */}
              <View style={styles.purpleWash} pointerEvents="none" />

              <View style={styles.badge}>
                <Text
                  style={{ fontFamily: fonts.bodyBold }}
                  className="text-[11px] uppercase tracking-wider text-neutral-950"
                >
                  LOCAL BALL
                </Text>
              </View>
            </View>

            <View style={styles.copyBlock}>
              <Logo
                variant="full"
                color={colors.accentBright}
                fontSize={35}
                lineHeight={50}
                className="relative top-6"
              />
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-[26px] leading-[32px] text-white"
              >
               The Gathering.{"\n"} Where Leagues Gathers.
              </Text>
              <Text
                style={{ fontFamily: fonts.body, color: "rgba(255,255,255,0.88)" }}
                className="text-[15px] leading-[22px]"
              >
                Connect with local leagues, track live matches, and dive into
                broadcast-level stats.
              </Text>
            </View>

            <View className="flex-row gap-2 items-center pt-1">
              <View className="h-2 w-8 rounded-full bg-[#f9b923]" />
              <View className="h-2 w-2 rounded-full bg-white opacity-35" />
              <View className="h-2 w-2 rounded-full bg-white opacity-35" />
            </View>

          <View className="flex-col justify-end flex-1">
          <Button
              variant="accent"
              label="Get Started"
              icon={
                <Ionicons name="arrow-forward" size={20} color="#171717" />
              }
              iconPosition="right"
              onPress={() => router.push("/(intro)/onboarding")}
              className="rounded-2xl h-[52px]"
            />

            <Pressable
              onPress={() => router.push("/login")}
              className="items-center pt-3 pb-2 active:opacity-80"
              accessibilityRole="link"
              accessibilityLabel="Sign in"
              accessibilityHint="Opens the sign-in screen"
            >
              <Text
                className="text-center text-[15px]"
              >
                <Text style={{ color: "rgba(255,255,255,0.92)" }}>
                  Already have an account?{" "}
                </Text>
                <Text
                  style={{ fontFamily: fonts.bodySemibold, color: "#FFFFFF" }}
                >
                  Sign In
                </Text>
              </Text>
            </Pressable>
          </View>
          </ScrollView>
        </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flexFill: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
    gap: 20,
    flexGrow: 1,
  },
  imageCard: {
    marginTop: 38,
    borderRadius: 32,
    overflow: "hidden",
    position: "relative",
    borderWidth: 4,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 1 / 1.05,
  },
  purpleWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(74, 20, 140, 0.36)",
  },
  badge: {
    position: "absolute",
    left: 16,
    bottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.accentBright,
  },
  copyBlock: {
    gap: 12,
    marginTop: 4,
  },
});
