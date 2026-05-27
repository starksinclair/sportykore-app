import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { colors, scoreboardPattern } from "@/constants";
import { fonts } from "@/theme/fonts";

function TabBarPattern() {
  const pattern = scoreboardPattern("strong");
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlackPatternBackground
        baseColor={pattern.baseColor}
        stripeColor={pattern.stripeColor}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontFamily: fonts.bodyBold,
          fontSize: 11,
          marginBottom: 4,
        },
        tabBarItemStyle: {
          marginHorizontal: 6,
          marginVertical: 8,
          borderRadius: 18,
        },
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          height: 78,
          paddingTop: 8,
          paddingBottom: 10,
          position: "absolute",
        },
        tabBarBackground: () => <TabBarPattern />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "add-circle" : "add-circle-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: "Manage",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
