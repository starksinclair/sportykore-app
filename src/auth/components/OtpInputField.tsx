import { useWindowDimensions } from "react-native";
import { OtpInput } from "react-native-otp-entry";

import { useTheme } from "@/color/use-theme";
import { colors } from "@/constants";

type Props = {
  onComplete: (code: string) => void;
  disabled?: boolean;
};

export function OtpInputField({ onComplete, disabled }: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const gap = width < 360 ? 4 : 8;
  const availableWidth = Math.max(220, width - 88);
  const boxSize = Math.max(
    34,
    Math.min(48, Math.floor((availableWidth - gap * 5) / 6)),
  );
  const boxHeight = Math.max(46, Math.min(56, boxSize + 8));
  const fontSize = boxSize < 40 ? 18 : 24;

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
          gap,
        },
        pinCodeContainerStyle: {
          width: boxSize,
          height: boxHeight,
          borderRadius: 12,
          borderColor: theme.inputBorder,
          backgroundColor: theme.inputBackground,
        },
        focusedPinCodeContainerStyle: {
          borderColor: colors.brand,
        },
        pinCodeTextStyle: {
          fontSize,
          color: theme.text,
        },
      }}
    />
  );
}
