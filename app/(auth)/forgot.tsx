import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth/use-auth";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { Button } from "@/components/ui/Button";
import { showErrorToast, showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      showErrorToast("Forgot password", "Enter your email.");
      return;
    }
    setBusy(true);
    try {
      await forgotPassword(trimmed);
      showInfoToast("Check your inbox", "If an account exists, we emailed reset instructions.");
      router.back();
    } catch (e) {
      showThrownAsToast(e, "Could not send reset email");
    } finally {
      setBusy(false);
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
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-6 px-6 pb-12 pt-2"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityLabel="Back"
            hitSlop={12}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/login"))}
            className="h-11 w-11 items-center justify-center self-start rounded-full bg-neutral-100 active:bg-neutral-200"
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </Pressable>

          <View className="gap-2">
            <Text style={{ fontFamily: fonts.bodyBold }} className="text-2xl text-neutral-950">
              Forgot password
            </Text>
            <Text style={{ fontFamily: fonts.body }} className="text-sm leading-6 text-slate-600">
              We will email you a reset link when this account exists with Gbako.
            </Text>
          </View>

          <AuthTextField
            label="Email address"
            placeholder="you@pitch.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.authPurple} />}
          />

          <Button variant="primary" label="Send reset email" loading={busy} onPress={onSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
