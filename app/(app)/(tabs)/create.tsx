import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CreateLeagueWizard } from "@/league/components/CreateLeagueWizard";

export default function CreateScreen() {
  return (
    <View className="flex-1 bg-[#121212]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <CreateLeagueWizard />
      </SafeAreaView>
    </View>
  );
}
