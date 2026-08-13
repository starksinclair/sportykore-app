import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

import type { AppColorScheme, ThemePreference } from "./theme";

const STORAGE_KEY = "sportykore:theme-preference";

type AppearanceContextValue = {
  preference: ThemePreference;
  colorScheme: AppColorScheme;
  systemColorScheme: AppColorScheme;
  hydrated: boolean;
  isDark: boolean;
  setPreference: (preference: ThemePreference) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function normalizePreference(value: string | null): ThemePreference {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "dark";
}

function resolveColorScheme(
  preference: ThemePreference,
  systemColorScheme: AppColorScheme,
): AppColorScheme {
  return preference === "system" ? systemColorScheme : preference;
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const systemColorScheme: AppColorScheme = systemScheme === "dark" ? "dark" : "light";
  const [preference, setPreferenceState] = useState<ThemePreference>("dark");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!active) return;
        setPreferenceState(normalizePreference(value));
      })
      .finally(() => {
        if (active) setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const colorScheme = resolveColorScheme(preference, systemColorScheme);

  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleDarkMode = useCallback(async () => {
    await setPreference(colorScheme === "dark" ? "light" : "dark");
  }, [colorScheme, setPreference]);

  const value = useMemo(
    () => ({
      preference,
      colorScheme,
      systemColorScheme,
      hydrated,
      isDark: colorScheme === "dark",
      setPreference,
      toggleDarkMode,
    }),
    [
      colorScheme,
      hydrated,
      preference,
      setPreference,
      systemColorScheme,
      toggleDarkMode,
    ],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) {
    throw new Error("useAppearance must be used inside AppearanceProvider");
  }
  return value;
}
