import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

/**
 * Client-only gate before league admin screens. Per product rules, skips when
 * the device has no biometrics/passcode enrolled. Returns false if the user
 * cancels the system prompt.
 */
export async function promptBiometricGate(): Promise<boolean> {
  if (Platform.OS === "web") {
    return true;
  }

  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) {
      return true;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock league management",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    // Native module missing (dev client not rebuilt) — allow through so manage
    // remains usable until a fresh build includes expo-local-authentication.
    return true;
  }
}
