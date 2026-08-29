import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { registerPushToken } from "./api";

type PushPlatform = "ios" | "android" | "web" | "unknown";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensurePushTokenRegistered(): Promise<void> {
  await ensureAndroidChannel();

  const permission = await ensureNotificationPermission();
  if (!permission) {
    throw new Error("Notifications are turned off for SportyKore.");
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    throw new Error("Push notifications need an Expo project id.");
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  await registerPushToken({
    provider: "expo",
    token: token.data,
    platform: resolvePlatform(),
    deviceId: Constants.sessionId ?? null,
  });
}

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("league-alerts", {
    name: "League alerts",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: "default",
  });
}

async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function resolveProjectId(): string | null {
  const extraProjectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof extraProjectId === "string" && extraProjectId.trim()) {
    return extraProjectId;
  }

  const easProjectId = Constants.easConfig?.projectId;
  if (typeof easProjectId === "string" && easProjectId.trim()) {
    return easProjectId;
  }

  return null;
}

function resolvePlatform(): PushPlatform {
  if (Platform.OS === "ios" || Platform.OS === "android" || Platform.OS === "web") {
    return Platform.OS;
  }
  return "unknown";
}
