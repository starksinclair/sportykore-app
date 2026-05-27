import "../global.css";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
// App.tsx
import { AuthGateProvider, AuthProvider, useAuth } from "@/auth";
import { persister, queryClient } from "@/lib/query-client";
import {
  OpenSans_400Regular,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
} from "@expo-google-fonts/open-sans";
import { Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { user, hasOnboarded, hydrated } = useAuth();
  const [fontsLoaded] = useFonts({
    Pacifico_400Regular,
    OpenSans_400Regular,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (hydrated && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [hydrated, fontsLoaded]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!hasOnboarded}>
        <Stack.Screen name="(intro)" />
      </Stack.Protected>
      <Stack.Protected guard={hasOnboarded && !user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={hasOnboarded}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
export default function RootLayout() {
  const scheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider persistOptions={{ persister }} client={queryClient}>
        <SafeAreaProvider>
          <AuthProvider>
            <AuthGateProvider>
              <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
                <StatusBar style="auto" />
                <RootStack />
                <Toast />
              </ThemeProvider>
            </AuthGateProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}