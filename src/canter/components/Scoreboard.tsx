import { Text, View } from "react-native";

import { colors } from "@/constants";

import { formatClock } from "../matchReducer";
import { DEMO_AWAY_TEAM, DEMO_HOME_TEAM } from "../demo/demoData";
import type { MatchState } from "../types";

interface ScoreboardProps {
  matchState: MatchState;
  isResolving: boolean;
}

export function Scoreboard({ matchState, isResolving }: ScoreboardProps) {
  const turnLabel = isResolving
    ? "Resolving…"
    : matchState.currentTurn === "home"
      ? `${DEMO_HOME_TEAM.shortName} to flick`
      : `${DEMO_AWAY_TEAM.shortName} to flick`;

  return (
    <View
      style={{
        backgroundColor: colors.scoreboardBlack,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <TeamTag color={DEMO_HOME_TEAM.primaryColor} label={DEMO_HOME_TEAM.shortName} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ color: colors.white, fontSize: 28, fontWeight: "800" }}>
            {matchState.scoreHome}
          </Text>
          <Text style={{ color: colors.tabInactive, fontSize: 16 }}>—</Text>
          <Text style={{ color: colors.white, fontSize: 28, fontWeight: "800" }}>
            {matchState.scoreAway}
          </Text>
        </View>
        <TeamTag color={DEMO_AWAY_TEAM.primaryColor} label={DEMO_AWAY_TEAM.shortName} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: colors.tabInactive, fontSize: 12 }}>
          Half {matchState.half}
        </Text>
        <Text style={{ color: colors.accent, fontSize: 14, fontWeight: "700" }}>
          {formatClock(matchState.clockRemainingMs)}
        </Text>
        <Text
          style={{
            color: isResolving ? colors.tabInactive : colors.white,
            fontSize: 12,
            fontWeight: "600",
          }}
        >
          {turnLabel}
        </Text>
      </View>
    </View>
  );
}

function TeamTag({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
        }}
      />
      <Text style={{ color: colors.white, fontSize: 13, fontWeight: "700" }}>
        {label}
      </Text>
    </View>
  );
}
