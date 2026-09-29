import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants";

import { MatchCanvas } from "../components/MatchCanvas";
import { MatchOverlay } from "../components/MatchOverlay";
import { OwnerToast } from "../components/OwnerToast";
import { Scoreboard } from "../components/Scoreboard";
import { useCanterMatch } from "../useCanterMatch";

interface CanterMatchScreenProps {
  onExit: () => void;
}

export function CanterMatchScreen({ onExit }: CanterMatchScreenProps) {
  const insets = useSafeAreaInsets();
  const match = useCanterMatch();

  return (
    <View style={{ flex: 1, backgroundColor: colors.darkLabel, paddingTop: insets.top + 8 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          marginBottom: 10,
        }}
      >
        <Pressable onPress={onExit} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </Pressable>
        <Text style={{ color: colors.white, fontSize: 15, fontWeight: "700" }}>
          Canter Ball
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <Scoreboard matchState={match.matchState} isResolving={match.isResolving} />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <MatchCanvas match={match} />
        <OwnerToast toast={match.matchState.toast} />
        <Text
          style={{
            color: colors.tabInactive,
            fontSize: 12,
            textAlign: "center",
            marginTop: 10,
          }}
        >
          Press a canter on your side, drag back to aim, release to flick.
        </Text>
      </View>

      <MatchOverlay
        matchState={match.matchState}
        onContinue={match.proceedFromHalfTime}
        onRematch={match.resetMatch}
      />
    </View>
  );
}
