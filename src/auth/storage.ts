import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "auth.token";
const ONBOARDED_KEY = "auth.onboarded";
const USER_PROFILE_KEY = "auth.profile.v1";

const isWeb = Platform.OS === "web";

/** Serialized profile from last successful `/auth/login` | `/auth/signup` | Google success. */
export type PersistedUserProfile = {
  id: string;
  email: string;
  /** Maps API `fullName` */
  name: string | null;
};

const tokenBackend = {
  async get(key: string) {
    if (isWeb) return AsyncStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (isWeb) return AsyncStorage.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  async remove(key: string) {
    if (isWeb) return AsyncStorage.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};

export async function getToken(): Promise<string | null> {
  return tokenBackend.get(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await tokenBackend.set(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await tokenBackend.remove(TOKEN_KEY);
}

export async function getPersistedProfile(): Promise<PersistedUserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedUserProfile;
    if (!parsed?.id || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setPersistedProfile(profile: PersistedUserProfile | null): Promise<void> {
  if (!profile) {
    await AsyncStorage.removeItem(USER_PROFILE_KEY);
    return;
  }
  await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

export async function clearSessionCredentials(): Promise<void> {
  await Promise.all([
    clearToken(),
    AsyncStorage.removeItem(USER_PROFILE_KEY),
  ]);
}

export async function getOnboarded(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDED_KEY);
  return value === "1";
}

export async function setOnboarded(value: boolean): Promise<void> {
  if (value) {
    await AsyncStorage.setItem(ONBOARDED_KEY, "1");
  } else {
    await AsyncStorage.removeItem(ONBOARDED_KEY);
  }
}
