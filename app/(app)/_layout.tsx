import { Stack } from "expo-router";

export default function AppGroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="search"
        options={{
          presentation: "card",
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          presentation: "card",
          animation: "slide_from_right",
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="join-league"
        options={{
          presentation: "card",
          animation: "slide_from_right",
          title: "Join a league",
        }}
      />
      <Stack.Screen name="country/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="league/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="team/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="player/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="match/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="manage/[leagueId]" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}
