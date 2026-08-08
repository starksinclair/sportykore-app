import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useRequestOtp, useVerifyOtp } from "@/auth/hooks";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { colors } from "@/constants";

import { OtpInputField } from "./OtpInputField";

type Props = {
  email: string;
  recoveryMode?: boolean;
  onSuccess: () => void | Promise<void>;
};

export function OtpScreen({ email: initialEmail, recoveryMode, onSuccess }: Props) {
  const [primaryEmail, setPrimaryEmail] = useState(initialEmail);
  const [resendCooldown, setResendCooldown] = useState(60);
  const otpKeyRef = useRef(0);
  const verifyMutation = useVerifyOtp();
  const requestMutation = useRequestOtp();

  const email = recoveryMode ? primaryEmail.trim() : initialEmail.trim();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleComplete = async (otpCode: string) => {
    if (!email) return;
    try {
      await verifyMutation.mutateAsync({
        email,
        code: otpCode,
      });
      await onSuccess();
    } catch {
      otpKeyRef.current += 1;
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      await requestMutation.mutateAsync({ email });
      setResendCooldown(60);
      otpKeyRef.current += 1;
      verifyMutation.reset();
    } catch {
      /* toast handled by caller or global error */
    }
  };

  return (
    <View className="flex-1 justify-center px-6 pb-10">
      <View className="gap-6 rounded-[28px] bg-white px-5 py-7 shadow-md">
        <View className="items-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-[22px] bg-accent-500/15">
            <Ionicons name="mail-unread-outline" size={26} color={colors.accent} />
          </View>
          <View className="gap-2">
            <Text
              className="text-center text-2xl text-neutral-950"
            >
              Check your email
            </Text>
            {recoveryMode ? (
              <Text
                className="text-center text-sm leading-6 text-slate-500"
              >
                Enter your primary email and the 6 digit code we sent.
              </Text>
            ) : (
              <Text
                className="text-center text-sm leading-6 text-slate-500"
              >
                We sent a 6 digit code to{" "}
                <Text
                  className="text-neutral-950"
                >
                  {email}
                </Text>
              </Text>
            )}
          </View>
        </View>

        {recoveryMode ? (
          <AuthTextField
            label="Primary email address"
            placeholder="you@pitch.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={primaryEmail}
            onChangeText={setPrimaryEmail}
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.authPurple} />}
          />
        ) : null}

        <View className="gap-3">
          <OtpInputField
            key={otpKeyRef.current}
            onComplete={handleComplete}
            disabled={verifyMutation.isPending || (recoveryMode && !email)}
          />

          {verifyMutation.isPending ? (
            <View className="flex-row items-center justify-center gap-2">
              <ActivityIndicator color={colors.accent} size="small" />
              <Text className="text-sm text-slate-500">
                Verifying code...
              </Text>
            </View>
          ) : null}

          {verifyMutation.isError ? (
            <View className="rounded-2xl border border-red-100 bg-red-50 px-3 py-3">
              <Text
                className="text-center text-sm text-red-600"
              >
                Invalid or expired code. Please try again.
              </Text>
            </View>
          ) : null}
        </View>

        <View className="items-center">
          {resendCooldown > 0 ? (
            <Text className="text-sm text-slate-400">
              Resend code in {resendCooldown}s
            </Text>
          ) : (
            <Pressable
              onPress={handleResend}
              disabled={requestMutation.isPending || !email}
              className={`h-11 flex-row items-center justify-center gap-2 rounded-full border border-accent-400 bg-accent-500 px-5 active:opacity-90 ${
                requestMutation.isPending || !email ? "opacity-50" : ""
              }`}
            >
              {requestMutation.isPending ? (
                <ActivityIndicator color={colors.darkLabel} size="small" />
              ) : (
                <Ionicons name="refresh" size={16} color={colors.darkLabel} />
              )}
              <Text
                className="text-sm text-neutral-950"
              >
                {requestMutation.isPending ? "Sending..." : "Resend code"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
