import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants";
import { Button } from "@/components/ui/Button";

import { DEMO_AWAY_TEAM, DEMO_HOME_TEAM } from "../demo/demoData";

interface CanterHomeScreenProps {
  onPlay: () => void;
}

export function CanterHomeScreen({ onPlay }: CanterHomeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.darkLabel }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "700", letterSpacing: 1 }}>
            CANTER BALL
          </Text>
          <Text style={{ color: colors.white, fontSize: 28, fontWeight: "800" }}>
            Flick. Aim. Score.
          </Text>
          <Text style={{ color: colors.tabInactive, fontSize: 14, lineHeight: 20 }}>
            The bottle-cap football classic — 7-a-side, one flick per turn,
            pure physics. Playing a local hotseat demo with sample teams.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.scoreboardBlack,
            borderRadius: 20,
            padding: 20,
            gap: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <Text style={{ color: colors.tabInactive, fontSize: 12, fontWeight: "600" }}>
            QUICK MATCH · DEMO TEAMS
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <TeamPreview name={DEMO_HOME_TEAM.name} color={DEMO_HOME_TEAM.primaryColor} />
            <Text style={{ color: colors.white, fontSize: 13, fontWeight: "700" }}>VS</Text>
            <TeamPreview name={DEMO_AWAY_TEAM.name} color={DEMO_AWAY_TEAM.primaryColor} align="right" />
          </View>
          <Button variant="signInYellow" label="Play hotseat match" onPress={onPlay} />
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.white, fontSize: 15, fontWeight: "700" }}>
            How a turn works
          </Text>
          {RULES.map((rule) => (
            <View key={rule} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginTop: 6 }} />
              <Text style={{ color: colors.tabInactive, fontSize: 13, lineHeight: 19, flex: 1 }}>
                {rule}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function TeamPreview({
  name,
  color,
  align = "left",
}: {
  name: string;
  color: string;
  align?: "left" | "right";
}) {
  return (
    <View style={{ alignItems: align === "right" ? "flex-end" : "flex-start", gap: 6 }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color }} />
      <Text style={{ color: colors.white, fontSize: 12, fontWeight: "600" }}>{name}</Text>
    </View>
  );
}

const RULES = [
  "Pick any of your 7 canters — even far from the ball — and drag back to flick it.",
  "Every flick ends your turn, whatever it hits: a pass, a shot, a miss, a tackle.",
  "The ball's last touch is just a record — it never grants an extra turn.",
  "Two halves of 2:30. Most goals when the clock hits zero wins; level scores draw.",
];
