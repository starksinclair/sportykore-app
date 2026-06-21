import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { useRequestOtp, useVerifyOtp } from "@/auth/hooks";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

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
    <View className="flex-1 gap-8 px-6 pt-12">
      <View className="gap-2">
        <Text
          style={{ fontFamily: fonts.displayBold }}
          className="text-2xl text-neutral-950"
        >
          Check your email
        </Text>
        {recoveryMode ? (
          <Text style={{ fontFamily: fonts.body }} className="text-slate-500">
            We sent a code to your primary email. Enter that address and the 6-digit code
            below.
          </Text>
        ) : (
          <Text style={{ fontFamily: fonts.body }} className="text-slate-500">
            We sent a 6-digit code to{" "}
            <Text style={{ fontFamily: fonts.bodySemibold }} className="text-neutral-950">
              {email}
            </Text>
          </Text>
        )}
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

      <OtpInputField
        key={otpKeyRef.current}
        onComplete={handleComplete}
        disabled={verifyMutation.isPending || (recoveryMode && !email)}
      />

      {verifyMutation.isError ? (
        <Text
          style={{ fontFamily: fonts.body }}
          className="text-center text-sm text-red-500"
        >
          Invalid or expired code. Please try again.
        </Text>
      ) : null}

      <View className="items-center">
        {resendCooldown > 0 ? (
          <Text style={{ fontFamily: fonts.body }} className="text-sm text-slate-400">
            Resend code in {resendCooldown}s
          </Text>
        ) : (
          <TouchableOpacity
            onPress={handleResend}
            disabled={requestMutation.isPending || !email}
          >
            <Text
              style={{ fontFamily: fonts.bodySemibold }}
              className="text-sm text-brand-600"
            >
              {requestMutation.isPending ? "Sending..." : "Resend code"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
