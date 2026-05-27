import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth/use-auth";
import {
  AuthAccessoryLink,
  AuthTextField,
} from "@/components/ui/auth-text-field";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/logo";
import { showThrownAsToast } from "@/lib/show-error-toast";
import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

const { width, height } = Dimensions.get("window");
const heroHeight = Math.min(height * 0.5, width * 1.05);

function OrDivider() {
  return (
    <View className="my-1 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-neutral-200" />
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-[10px] uppercase tracking-[2px] text-slate-500"
      >
        Or continue with
      </Text>
      <View className="h-px flex-1 bg-neutral-200" />
    </View>
  );
}

function LoginCard() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidden, setHidden] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await signIn({ email: email.trim(), password });
    } catch (e) {
      showThrownAsToast(e, "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onContinueGoogle = () => {
    // TODO: OAuth
  };

  const onContinueApple = () => {
    // TODO: OAuth
  };

  return (
    <View style={styles.card}>
      <View className="gap-5 px-5 pb-8 pt-5">
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
        />
        <AuthTextField
          label="Password"
          labelAccessory={
            <Link href="/forgot" asChild>
              <AuthAccessoryLink label="Forgot?" />
            </Link>
          }
          placeholder="••••••••"
          secureTextEntry={hidden}
          autoComplete="current-password"
          textContentType="password"
          value={password}
          onChangeText={setPassword}
          leftIcon={
            <Ionicons name="lock-closed-outline" size={20} color={colors.authPurple} />
          }
          rightAccessory={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={hidden ? "Show password" : "Hide password"}
              hitSlop={12}
              onPress={() => setHidden((x) => !x)}
            >
              <Ionicons
                name={hidden ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#6B7280"
              />
            </Pressable>
          }
        />
        <Button
          variant="signInYellow"
          label="Sign In"
          loading={submitting}
          onPress={onSubmit}
          icon={<Ionicons name="arrow-forward-outline" size={22} color="#171717" />}
          iconPosition="right"
          className="mt-1 h-[52px] rounded-2xl shadow-md"
        />
        <OrDivider />
        <View className="w-full flex-row items-center justify-center gap-3">
          <Pressable
            onPress={onContinueGoogle}
            className="h-[54px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white active:bg-neutral-50"
            style={styles.socialButton}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-sm text-neutral-950"
            >
              Google
            </Text>
          </Pressable>
          <Pressable
            onPress={onContinueApple}
            className="h-[54px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-neutral-950 active:bg-neutral-900"
            style={styles.socialButton}
            accessibilityRole="button"
            accessibilityLabel="Continue with Apple"
          >
            <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-sm text-white"
            >
              Apple
            </Text>
          </Pressable>
        </View>
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
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={{ width, height: heroHeight }} className="relative">
            <Image
              source={require("../../assets/static/standingOnBall.jpeg")}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
              <View className="absolute inset-0 bg-black/85" />
            <SafeAreaView
              edges={["top"]}
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
                Welcome Back
              </Text>
              <Text
                style={{ fontFamily: fonts.body }}
                className="text-center text-base text-slate-400"
              >
                Ready to check the latest stats?
              </Text>
            </View>
          </View>

          <View className="-mt-15">
            <LoginCard />
          </View>

          <View className="relative flex-row flex-wrap items-center justify-center gap-1 overflow-hidden px-6 pb-12 pt-8">
            <BlackPatternBackground />
            <Text
              style={{ fontFamily: fonts.body }}
              className="text-[15px] text-slate-400"
            >
              New to the patch?{" "}
            </Text>
            <Link href="/register" replace accessibilityRole="link" asChild>
              <Pressable hitSlop={8}>
                <Text
                  style={{ fontFamily: fonts.bodyBold }}
                  className="text-[15px] text-[#F2A900]"
                >
                  Create Account
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  cardGradientBar: {
    height: 4,
    width: "100%",
  },
  logoGlow: {
    shadowColor: "#9B6DD6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 20,
  },
  socialButton: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
});
