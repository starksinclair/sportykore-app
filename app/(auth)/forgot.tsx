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

import { useRecoverAccount } from "@/auth";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { colors } from "@/constants";
import { showErrorToast, showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

export default function RecoverAccountScreen() {
  const recoverMutation = useRecoverAccount();
  const [recoveryEmail, setRecoveryEmail] = useState("");

  const onSubmit = async () => {
    const trimmed = recoveryEmail.trim();
    if (!trimmed) {
      showErrorToast("Recovery email required", "Enter the recovery email on your account.");
      return;
    }
    try {
      await recoverMutation.mutateAsync(trimmed);
      showInfoToast(
        "Check your primary email",
        "We sent a sign-in code to your account's primary email address.",
      );
      router.push({ pathname: "/otp", params: { recoveryMode: "1" } });
    } catch (e) {
      showThrownAsToast(e, "Could not recover account");
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
              Recover account
            </Text>
            <Text style={{ fontFamily: fonts.body }} className="text-sm leading-6 text-slate-600">
              Enter the recovery email you set on your account. We will send a sign-in code to your
              primary email address.
            </Text>
          </View>

          <AuthTextField
            label="Recovery email"
            placeholder="recovery@pitch.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={recoveryEmail}
            onChangeText={setRecoveryEmail}
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.authPurple} />}
          />

          <Button
            variant="primary"
            label="Send recovery code"
            loading={recoverMutation.isPending}
            onPress={onSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
