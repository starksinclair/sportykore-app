import { Pressable, Text, View } from "react-native";

import { colors } from "@/constants";

import { DEMO_AWAY_TEAM, DEMO_HOME_TEAM } from "../demo/demoData";
import { matchResult } from "../matchReducer";
import type { MatchState } from "../types";

interface MatchOverlayProps {
  matchState: MatchState;
  onContinue: () => void;
  onRematch: () => void;
}

export function MatchOverlay({ matchState, onContinue, onRematch }: MatchOverlayProps) {
  if (matchState.phase !== "half_time" && matchState.phase !== "full_time") return null;

  const isFullTime = matchState.phase === "full_time";
  const result = matchResult(matchState);

  let headline = "Half-time";
  if (isFullTime) {
    if (matchState.voided) {
      headline = "Owner don collect him ball";
    } else {
      headline =
        result === "draw"
          ? "Full-time — it's a draw"
          : `Full-time — ${result === "home" ? DEMO_HOME_TEAM.name : DEMO_AWAY_TEAM.name} win`;
    }
  }

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(18,18,18,0.88)",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 340,
          backgroundColor: colors.scoreboardBlack,
          borderRadius: 20,
          padding: 24,
          gap: 16,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "700", textAlign: "center", letterSpacing: 1 }}>
          {headline.toUpperCase()}
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 16 }}>
          <Text style={{ color: colors.white, fontSize: 14, fontWeight: "600" }}>
            {DEMO_HOME_TEAM.shortName}
          </Text>
          <Text style={{ color: colors.white, fontSize: 40, fontWeight: "800" }}>
            {matchState.scoreHome} — {matchState.scoreAway}
          </Text>
          <Text style={{ color: colors.white, fontSize: 14, fontWeight: "600" }}>
            {DEMO_AWAY_TEAM.shortName}
          </Text>
        </View>

        {matchState.voided ? (
          <Text style={{ color: colors.tabInactive, fontSize: 12, textAlign: "center", lineHeight: 18 }}>
            The captain got vexed one too many times and walked off with the ball. No
            winner this one — just vibes.
          </Text>
        ) : null}

        <StatsRow label="Touches" home={matchState.statsHome.touches} away={matchState.statsAway.touches} />
        <StatsRow label="Passes" home={matchState.statsHome.passes} away={matchState.statsAway.passes} />
        <StatsRow label="Shots" home={matchState.statsHome.shots} away={matchState.statsAway.shots} />

        <Pressable
          onPress={isFullTime ? onRematch : onContinue}
          style={{
            backgroundColor: colors.accent,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <Text style={{ color: colors.darkLabel, fontWeight: "700", fontSize: 15 }}>
            {isFullTime ? "Rematch" : "Start second half"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function StatsRow({ label, home, away }: { label: string; home: number; away: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text style={{ color: colors.white, fontSize: 14, width: 32, textAlign: "left" }}>{home}</Text>
      <Text style={{ color: colors.tabInactive, fontSize: 12, flex: 1, textAlign: "center" }}>{label}</Text>
      <Text style={{ color: colors.white, fontSize: 14, width: 32, textAlign: "right" }}>{away}</Text>
    </View>
  );
}
