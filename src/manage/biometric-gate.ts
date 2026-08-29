import * as LocalAuthentication from "expo-local-authentication";
import { Alert, Platform } from "react-native";

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

    const confirmed = await confirmManageUnlock();
    if (!confirmed) {
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock SportyKore manage tools",
      cancelLabel: "Cancel",
      fallbackLabel: "Use device passcode",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    // Native module missing (dev client not rebuilt) - allow through so manage
    // remains usable until a fresh build includes expo-local-authentication.
    return true;
  }
}

function confirmManageUnlock(): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    Alert.alert(
      "Protect league management",
      "SportyKore asks for your device unlock before opening admin tools so league changes stay protected on shared phones.",
      [
        { text: "Not now", style: "cancel", onPress: () => finish(false) },
        { text: "Continue", onPress: () => finish(true) },
      ],
      { cancelable: true, onDismiss: () => finish(false) },
    );
  });
}
