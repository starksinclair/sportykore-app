import { OtpInput } from "react-native-otp-entry";

import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

type Props = {
  onComplete: (code: string) => void;
  disabled?: boolean;
};

export function OtpInputField({ onComplete, disabled }: Props) {
  return (
    <OtpInput
      numberOfDigits={6}
      onFilled={onComplete}
      disabled={disabled}
      autoFocus
      textInputProps={{
        textContentType: "oneTimeCode",
        keyboardType: "number-pad",
        accessibilityLabel: "OTP input",
      }}
      theme={{
        containerStyle: {
          gap: 8,
        },
        pinCodeContainerStyle: {
          width: 48,
          height: 56,
          borderRadius: 12,
          borderColor: "#E2E8F0",
          backgroundColor: "#F8FAFC",
        },
        focusedPinCodeContainerStyle: {
          borderColor: colors.brand,
        },
        pinCodeTextStyle: {
          fontFamily: fonts.bodyBold,
          fontSize: 24,
          color: "#0F172A",
        },
      }}
    />
  );
}
