import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useRequestOtp, useVerifyOtp } from "@/auth/hooks";
import {
  clearPendingOtpAttempt,
  getPendingOtpAttempt,
  setPendingOtpAttempt,
} from "@/auth/storage";
import { useTheme } from "@/color/use-theme";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { colors } from "@/constants";

import { OtpInputField } from "./OtpInputField";

type Props = {
  email: string;
  recoveryMode?: boolean;
  onSuccess: () => void | Promise<void>;
};

export function OtpScreen({ email: initialEmail, recoveryMode, onSuccess }: Props) {
  const theme = useTheme();
  const [primaryEmail, setPrimaryEmail] = useState(initialEmail);
  const [resendCooldown, setResendCooldown] = useState(60);
  const otpKeyRef = useRef(0);
  const verifyMutation = useVerifyOtp();
  const requestMutation = useRequestOtp();

  const email = primaryEmail.trim();
  const showEmailField = recoveryMode || !initialEmail.trim();

  useEffect(() => {
    setPrimaryEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (recoveryMode || initialEmail.trim()) return;
    let cancelled = false;
    getPendingOtpAttempt().then((attempt) => {
      if (!cancelled && attempt?.email) {
        setPrimaryEmail(attempt.email);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initialEmail, recoveryMode]);

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
      await clearPendingOtpAttempt();
      await onSuccess();
    } catch {
      otpKeyRef.current += 1;
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      await requestMutation.mutateAsync({ email });
      await setPendingOtpAttempt(email);
      setResendCooldown(60);
      otpKeyRef.current += 1;
      verifyMutation.reset();
    } catch {
      /* toast handled by caller or global error */
    }
  };

  return (
    <View className="flex-1 justify-center px-6 pb-10">
      <View
        className="gap-6 rounded-[28px] border px-5 py-7 shadow-md"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
        }}
      >
        <View className="items-center gap-3">
          <View
            className="h-14 w-14 items-center justify-center rounded-[22px]"
            style={{ backgroundColor: theme.accentMuted }}
          >
            <Ionicons name="mail-unread-outline" size={26} color={theme.accent} />
          </View>
          <View className="gap-2">
            <Text
              className="text-center text-2xl"
              style={{ color: theme.text }}
            >
              Check your email
            </Text>
            {recoveryMode ? (
              <Text
                className="text-center text-sm leading-6"
                style={{ color: theme.textMuted }}
              >
                Enter your primary email and the 6 digit code we sent.
              </Text>
            ) : (
              <Text
                className="text-center text-sm leading-6"
                style={{ color: theme.textMuted }}
              >
                We sent a 6 digit code to{" "}
                <Text
                  style={{ color: theme.text }}
                >
                  {email || "your email"}
                </Text>
              </Text>
            )}
          </View>
        </View>

        {showEmailField ? (
          <AuthTextField
            label={recoveryMode ? "Primary email address" : "Email address"}
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
              <Text className="text-sm" style={{ color: theme.textSubtle }}>
                Verifying code...
              </Text>
            </View>
          ) : null}

          {verifyMutation.isError ? (
            <View
              className="rounded-2xl border px-3 py-3"
              style={{
                backgroundColor: theme.dangerMuted,
                borderColor: theme.danger,
              }}
            >
              <Text
                className="text-center text-sm"
                style={{ color: theme.danger }}
              >
                Invalid or expired code. Please try again.
              </Text>
            </View>
          ) : null}
        </View>

        <View className="items-center">
          {resendCooldown > 0 ? (
            <Text className="text-sm" style={{ color: theme.textSubtle }}>
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
                className="text-sm"
                style={{ color: colors.darkLabel }}
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
