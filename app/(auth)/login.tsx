import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRequestOtp } from "@/auth";
import { Button } from "@/components/ui/Button";
import {
  AuthAccessoryLink,
  AuthTextField,
} from "@/components/ui/auth-text-field";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { ExternalLink } from "@/components/ui/external-link";
import { Logo } from "@/components/ui/logo";
import { colors } from "@/constants";
import { showErrorToast, showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

const { width, height } = Dimensions.get("window");
const heroHeight = Math.min(height * 0.5, width * 1.05);
const KEYBOARD_TOOLBAR_OFFSET = 62;

function LoginCard() {
  const params = useLocalSearchParams<{ new?: string }>();
  const showNameField = params.new === "1";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const requestMutation = useRequestOtp();

  const onSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showErrorToast("Email required", "Enter your email address to continue.");
      return;
    }
    try {
      await requestMutation.mutateAsync(trimmedEmail);
      router.push({
        pathname: "/otp",
        params: {
          email: trimmedEmail,
          ...(showNameField && name.trim() ? { name: name.trim() } : {}),
          ...(recoveryEmail.trim() ? { recoveryEmail: recoveryEmail.trim() } : {}),
        },
      });
    } catch (e) {
      showThrownAsToast(e, "Could not send code");
    }
  };

  return (
    <View style={styles.card}>
      <View className="gap-5 px-5 pb-8 pt-8">
        {showNameField ? (
          <AuthTextField
            label="Full name"
            placeholder="Jay Jay Okocha"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            value={name}
            onChangeText={setName}
            leftIcon={<Ionicons name="person-outline" size={20} color={colors.authPurple} />}
          />
        ) : null}
        <AuthTextField
          label="Email address"
          placeholder="j.okocha@pitch.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
          leftIcon={<Ionicons name="mail-outline" size={20} color={colors.authPurple} />}
          labelAccessory={
            <Link href="/forgot" asChild>
              <AuthAccessoryLink label="Can't access account?" />
            </Link>
          }
        />
        {showNameField ? (
          <AuthTextField
            label="Recovery email address (optional)"
            placeholder="recovery@sportykore.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={recoveryEmail}
            onChangeText={setRecoveryEmail}
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.authPurple} />}
          />
        ) : null}
        <Button
          variant="signInYellow"
          label="Continue"
          loading={requestMutation.isPending}
          onPress={onSubmit}
          icon={<Ionicons name="arrow-forward-outline" size={22} color="#171717" />}
          iconPosition="right"
          className="mt-1 h-[52px] rounded-2xl shadow-md"
        />
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <View className="flex-1 bg-[#0B0B0C]">
      <BlackPatternBackground />
      <KeyboardAwareScrollView
        bottomOffset={KEYBOARD_TOOLBAR_OFFSET}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={{ width, height: heroHeight }} className="relative">
          <Image
            source={require("../../assets/static/standingOnBall.jpeg")}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View className="absolute inset-0 bg-black/85" />
          <SafeAreaView
            edges={["top", "bottom"]}
            className="absolute left-0 right-0 top-0 z-10 flex-row justify-start px-4 pt-1"
          >
            <Pressable
              onPress={close}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/15 active:bg-white/25"
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </SafeAreaView>
          <View className="absolute bottom-20 left-0 right-0 items-center gap-2 px-6">
            <View
              style={styles.logoGlow}
              className="h-[70px] w-[70px] rotate-12 items-center justify-center rounded-2xl bg-[#4A148C]"
            >
              <Logo
                variant="short"
                color={colors.signInYellow}
                fontSize={30}
                lineHeight={45}
              />
            </View>
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-center text-3xl text-white"
            >
              Get Started
            </Text>
            <Text
              style={{ fontFamily: fonts.body }}
              className="text-center text-base text-slate-400"
            >
              Enter your email and we will send you a code
            </Text>
          </View>
        </View>

        <View className="-mt-15">
          <LoginCard />
        </View>

        <View className="px-6 pb-12 pt-8">
          <Text
            style={{ fontFamily: fonts.body }}
            className="text-center text-base text-slate-400"
          >
            By continuing, you agree to our{" "}
            <ExternalLink href="https://waitlist.sportykore.com/terms">
              <Text style={{ fontFamily: fonts.bodyBold }} className="text-[#F2A900]">
                Terms of Service
              </Text>
            </ExternalLink>{" "}
            and{" "}
            <ExternalLink href="https://waitlist.sportykore.com/privacy">
              <Text style={{ fontFamily: fonts.bodyBold }} className="text-[#F2A900]">
                Privacy Policy
              </Text>
            </ExternalLink>
            .
          </Text>
        </View>

        <LoginFooter />
      </KeyboardAwareScrollView>
      <KeyboardToolbar />
    </View>
  );
}

function LoginFooter() {
  const params = useLocalSearchParams<{ new?: string }>();
  const isNew = params.new === "1";

  return (
    <View className="relative flex-row flex-wrap items-center justify-center gap-1 overflow-hidden px-6 pb-12 pt-8">
      <BlackPatternBackground />
      {isNew ? (
        <>
          <Text
            style={{ fontFamily: fonts.body }}
            className="text-[15px] text-slate-400"
          >
            Already have an account?{" "}
          </Text>
          <Link href="/login" replace accessibilityRole="link" asChild>
            <Pressable hitSlop={8}>
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-[15px] text-[#F2A900]"
              >
                Login
              </Text>
            </Pressable>
          </Link>
        </>
      ) : (
        <>
          <Text
            style={{ fontFamily: fonts.body }}
            className="text-[15px] text-slate-400"
          >
            New to the patch?{" "}
          </Text>
          <Link href="/login?new=1" replace accessibilityRole="link" asChild>
            <Pressable hitSlop={8}>
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-[15px] text-[#F2A900]"
              >
                Create Account
              </Text>
            </Pressable>
          </Link>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
  },
  logoGlow: {
    shadowColor: "#9B6DD6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 20,
  },
});
