import "../global.css";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { type ReactNode, useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
// App.tsx
import { AuthGateProvider, AuthProvider, useAuth } from "@/auth";
import { sportyToastConfig } from "@/components/ui/toast-config";
import { InviteLinkCapture } from "@/invite/components/InviteLinkCapture";
import { persister, queryClient } from "@/lib/query-client";
import { TransmitProvider } from "@/lib/transmit";
import { posthog } from "@/lib/posthog";
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
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { PostHogErrorBoundary, PostHogProvider } from "posthog-react-native";
import Toast from "react-native-toast-message";

SplashScreen.preventAutoHideAsync();

function AnalyticsProvider({ children }: { children: ReactNode }) {
  if (!posthog) return children;

  return (
    <PostHogProvider
      client={posthog}
      autocapture={{ captureScreens: false, captureTouches: true }}
    >
      <PostHogErrorBoundary>{children}</PostHogErrorBoundary>
    </PostHogProvider>
  );
}

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

  useEffect(() => {
    if (Platform.OS !== "android") return;

    // void NavigationBar.setPositionAsync("absolute");
    // void NavigationBar.setBackgroundColorAsync("#00000000");
    // void NavigationBar.setButtonStyleAsync("light");
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!hasOnboarded}>
        <Stack.Screen name="(intro)" />
      </Stack.Protected>
      <Stack.Protected guard={hasOnboarded}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={hasOnboarded}>
        <Stack.Screen name="join" />
      </Stack.Protected>
      <Stack.Protected guard={hasOnboarded && !user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
export default function RootLayout() {
  const scheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <PersistQueryClientProvider persistOptions={{ persister }} client={queryClient}>
          <TransmitProvider>
            <SafeAreaProvider>
              <AnalyticsProvider>
                <AuthProvider>
                  <AuthGateProvider>
                    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
                      <StatusBar style="auto" />
                      <RootStack />
                      <InviteLinkCapture />
                      <View pointerEvents="box-none" style={styles.toastOverlay}>
                        <Toast config={sportyToastConfig} topOffset={58} />
                      </View>
                    </ThemeProvider>
                  </AuthGateProvider>
                </AuthProvider>
              </AnalyticsProvider>
            </SafeAreaProvider>
          </TransmitProvider>
        </PersistQueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  toastOverlay: {
    ...StyleSheet.absoluteFillObject,
    elevation: 999,
    zIndex: 999,
  },
});
