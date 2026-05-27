import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
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
import { AuthTextField } from "@/components/ui/auth-text-field";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/logo";
import { showThrownAsToast } from "@/lib/show-error-toast";
import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

function OrDivider() {
  return (
    <View className="my-6 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-neutral-300" />
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-[10px] uppercase tracking-widest text-slate-500"
      >
        Or continue with
      </Text>
      <View className="h-px flex-1 bg-neutral-300" />
    </View>
  );
}

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidden, setHidden] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
      });
    } catch (e) {
      showThrownAsToast(e, "Could not create account");
    } finally {
      setSubmitting(false);
    }
  };

  const onSocial = (provider: "google" | "apple") => {
    void provider;
    // TODO: OAuth
  };

  const back = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/login");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-6 pb-10 pt-4"
          showsVerticalScrollIndicator={false}
        >
          <View className="relative mb-8 flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              className="-ml-1 h-10 w-10 items-center justify-center active:opacity-70"
              onPress={back}
              hitSlop={12}
            >
              <Ionicons name="chevron-back" size={26} color="#111827" />
            </Pressable>
            <View pointerEvents="none" className="absolute left-0 right-0 items-center pt-1">
              <Logo variant="full" color={colors.authPurple} fontSize={26} lineHeight={38} />
            </View>
            <View className="w-10" />
          </View>

          <View className="gap-10">
            <View className="gap-3">
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-3xl text-neutral-950"
              >
                Join The Gathering
              </Text>
              <Text
                style={{ fontFamily: fonts.body }}
                className="text-base leading-6 text-slate-600"
              >
                Create an account to track your leagues and analyze stats.
              </Text>
            </View>

            <View className="gap-5">
              <AuthTextField
                label="Full name"
                placeholder="Jay Jay Okocha"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                value={name}
                onChangeText={setName}
                leftIcon={<Ionicons name="person-outline" size={22} color={colors.authPurple} />}
              />
              <AuthTextField
                label="Email address"
                placeholder="baller@gmail.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
                leftIcon={<Ionicons name="mail-outline" size={22} color={colors.authPurple} />}
              />
              <AuthTextField
                label="Password"
                placeholder="Enter password"
                secureTextEntry={hidden}
                autoComplete="new-password"
                textContentType="newPassword"
                value={password}
                onChangeText={setPassword}
                leftIcon={
                  <Ionicons name="lock-closed-outline" size={22} color={colors.authPurple} />
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
            </View>

            <View className="-mt-1">
              <Button
                variant="authPurple"
                label="Create Account"
                loading={submitting}
                onPress={onSubmit}
                className="h-[54px] rounded-2xl"
                style={styles.shadowCTA}
              />
            </View>

            <OrDivider />

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => onSocial("google")}
                className="h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-neutral-300 bg-white active:bg-neutral-50"
                accessibilityRole="button"
              >
                <Ionicons name="logo-google" size={22} color={colors.authPurple} />
                <Text
                  style={{ fontFamily: fonts.bodyBold }}
                  className="text-sm text-neutral-900"
                >
                  Google
                </Text>
              </Pressable>
              <Pressable
                onPress={() => onSocial("apple")}
                className="h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-neutral-950 active:bg-neutral-900"
                accessibilityRole="button"
              >
                <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
                <Text
                  style={{ fontFamily: fonts.bodyBold }}
                  className="text-sm text-white"
                >
                  Apple
                </Text>
              </Pressable>
            </View>

            <View className="mt-4 flex-row flex-wrap items-center justify-center gap-1 pt-4">
              <Text
                style={{ fontFamily: fonts.body }}
                className="text-[15px] text-slate-600"
              >
                Already part of the gathering?{" "}
              </Text>
              <Link href="/login" replace accessibilityRole="link" asChild>
                <Pressable hitSlop={8}>
                  <Text
                    style={{ fontFamily: fonts.bodyBold }}
                    className="text-[15px] text-[#5D2A8E]"
                  >
                    Sign In
                  </Text>
                </Pressable>
              </Link>
            </View>
            <Link href="/" replace accessibilityRole="link" asChild>
            <Pressable className="flex-row items-center justify-center gap-2">
              <Ionicons name="person-outline" size={22} color={colors.authPurple} />
              <Text style={{ fontFamily: fonts.bodyBold }} className="text-[15px] text-[#5D2A8E]">Continue as guest</Text>
            </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shadowCTA: {
    shadowColor: colors.authPurple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});
