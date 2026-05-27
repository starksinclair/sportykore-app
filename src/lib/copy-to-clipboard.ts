import { Alert, Platform, Share } from "react-native";

export type CopyToClipboardResult = "clipboard" | "share" | "alert";

/**
 * Copies to the system clipboard when available. If `expo-clipboard` native code
 * is not linked (e.g. dev client built before installing the module), falls back to
 * the share sheet or an alert.
 */
export async function copyToClipboard(
  text: string,
): Promise<CopyToClipboardResult> {
  if (Platform.OS === "web") {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return "clipboard";
      }
    } catch {
      /* fall through */
    }
    try {
      await Share.share({ message: text });
      return "share";
    } catch {
      Alert.alert("League access code", text);
      return "alert";
    }
  }

  try {
    const Clipboard = await import("expo-clipboard");
    await Clipboard.setStringAsync(text);
    return "clipboard";
  } catch {
    try {
      await Share.share({
        message: `League access code:\n${text}`,
      });
      return "share";
    } catch {
      Alert.alert("League access code", text);
      return "alert";
    }
  }
}
