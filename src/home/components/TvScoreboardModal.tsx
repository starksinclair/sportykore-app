import { Ionicons } from "@expo/vector-icons";
import { useKeepAwake } from "expo-keep-awake";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants";
import { formatPlayedAtTime } from "@/lib/datetime";
import { useMatchDetail } from "@/match";
import { fonts } from "@/theme/fonts";

import type { ApiGame } from "../types";

type Props = {
  game: ApiGame;
  visible: boolean;
  onClose: () => void;
};

/**
 * Full-screen, high-contrast scoreboard intended for indoor facility displays
 * — a phone or tablet mounted on the wall so players can read the score and
 * clock from across the room. While the modal is open the screen is kept
 * awake, orientation is unlocked, and live matches poll every 5 seconds.
 */
export function TvScoreboardModal({ game, visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      supportedOrientations={["portrait", "landscape"]}
    >
      {visible ? <ScoreboardBody game={game} onClose={onClose} /> : null}
    </Modal>
  );
}

function ScoreboardBody({
  game,
  onClose,
}: {
  game: ApiGame;
  onClose: () => void;
}) {
  useKeepAwake("tv-scoreboard");
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // The rest of the app stays portrait-locked; only unlock while the TV board
  // is visible so mounted devices can rotate with the physical orientation.
  useEffect(() => {
    void ScreenOrientation.unlockAsync();
    return () => {
      void ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, []);

  const isLive = game.status === "live" || game.status === "break";
  const detailQuery = useMatchDetail(game.id, {
    refetchInterval: isLive ? 5_000 : undefined,
    staleTime: isLive ? 0 : undefined,
  });
  const fresh = detailQuery.data;
  const merged = useMemo<ApiGame>(
    () => ({ ...game, ...(fresh ?? {}) }),
    [game, fresh],
  );

  const showScore =
    merged.status === "live" ||
    merged.status === "break" ||
    merged.status === "completed";
  const phase = phaseLine(merged.status, merged.currentMinute);
  const phaseColor = isLive ? colors.liveRed : colors.accent;

  const metrics = useMemo(
    () => scaleMetrics(width, height, isLandscape),
    [width, height, isLandscape],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" hidden={isLandscape} />
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom", "left", "right"]}
      >
        <View style={styles.header}>
          {merged.status === "live" ? (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text
                style={[styles.livePillText, { fontFamily: fonts.bodyBold }]}
              >
                LIVE
              </Text>
            </View>
          ) : (
            <Text
              style={[styles.headerLabel, { fontFamily: fonts.bodySemibold }]}
            >
              SCOREBOARD
            </Text>
          )}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close scoreboard"
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {isLandscape ? (
          <View style={styles.bodyLandscape}>
            <LandscapeTeamColumn
              name={merged.homeTeam?.name ?? "Home"}
              score={merged.homeScore}
              showScore={showScore}
              metrics={metrics}
              align="start"
            />
            <View style={styles.phaseColumn}>
              <Text
                style={[
                  styles.phaseTextLandscape,
                  {
                    fontFamily: fonts.bodyBold,
                    color: phaseColor,
                    fontSize: metrics.phaseSize,
                    lineHeight: metrics.phaseSize * 1.1,
                  },
                ]}
              >
                {phase}
              </Text>
            </View>
            <LandscapeTeamColumn
              name={merged.awayTeam?.name ?? "Away"}
              score={merged.awayScore}
              showScore={showScore}
              metrics={metrics}
              align="end"
            />
          </View>
        ) : (
          <View style={styles.bodyPortrait}>
            <TeamLine
              name={merged.homeTeam?.name ?? "Home"}
              score={merged.homeScore}
              showScore={showScore}
              metrics={metrics}
            />
            <View style={styles.divider} />
            <TeamLine
              name={merged.awayTeam?.name ?? "Away"}
              score={merged.awayScore}
              showScore={showScore}
              metrics={metrics}
            />
            <View style={styles.phaseWrap}>
              <Text
                style={[
                  styles.phaseTextPortrait,
                  {
                    fontFamily: fonts.bodyBold,
                    color: phaseColor,
                    fontSize: metrics.phaseSize,
                    lineHeight: metrics.phaseSize * 1.1,
                  },
                ]}
              >
                {phase}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { fontFamily: fonts.body }]}>
            Kickoff {formatPlayedAtTime(merged.playedAt)}
          </Text>
          {merged.venueName ? (
            <Text style={[styles.footerText, { fontFamily: fonts.body }]}>
              {merged.venueName}
            </Text>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

type LayoutMetrics = {
  teamNameSize: number;
  scoreSize: number;
  phaseSize: number;
};

function scaleMetrics(
  width: number,
  height: number,
  isLandscape: boolean,
): LayoutMetrics {
  const short = Math.min(width, height);
  const long = Math.max(width, height);

  if (isLandscape) {
    return {
      teamNameSize: Math.min(40, long * 0.055),
      scoreSize: Math.min(140, short * 0.42),
      phaseSize: Math.min(72, short * 0.2),
    };
  }

  return {
    teamNameSize: Math.min(44, width * 0.1),
    scoreSize: Math.min(120, width * 0.28),
    phaseSize: Math.min(64, width * 0.14),
  };
}

function TeamLine({
  name,
  score,
  showScore,
  metrics,
}: {
  name: string;
  score: number | null;
  showScore: boolean;
  metrics: LayoutMetrics;
}) {
  return (
    <View style={styles.teamRow}>
      <Text
        style={[
          styles.teamName,
          {
            fontFamily: fonts.bodyBold,
            fontSize: metrics.teamNameSize,
            lineHeight: metrics.teamNameSize * 1.15,
          },
        ]}
        numberOfLines={2}
      >
        {name}
      </Text>
      <Text
        style={[
          styles.teamScore,
          {
            fontFamily: fonts.bodyBold,
            fontSize: metrics.scoreSize,
            lineHeight: metrics.scoreSize * 1.05,
            minWidth: metrics.scoreSize * 0.9,
          },
        ]}
        numberOfLines={1}
      >
        {showScore ? (score ?? 0) : "—"}
      </Text>
    </View>
  );
}

function LandscapeTeamColumn({
  name,
  score,
  showScore,
  metrics,
  align,
}: {
  name: string;
  score: number | null;
  showScore: boolean;
  metrics: LayoutMetrics;
  align: "start" | "end";
}) {
  return (
    <View
      style={[
        styles.landscapeColumn,
        align === "end" ? styles.landscapeColumnEnd : styles.landscapeColumnStart,
      ]}
    >
      <Text
        style={[
          styles.landscapeTeamName,
          {
            fontFamily: fonts.bodyBold,
            fontSize: metrics.teamNameSize,
            lineHeight: metrics.teamNameSize * 1.15,
            textAlign: align === "end" ? "right" : "left",
          },
        ]}
        numberOfLines={3}
      >
        {name}
      </Text>
      <Text
        style={[
          styles.landscapeScore,
          {
            fontFamily: fonts.bodyBold,
            fontSize: metrics.scoreSize,
            lineHeight: metrics.scoreSize * 1.05,
            textAlign: align === "end" ? "right" : "left",
          },
        ]}
        numberOfLines={1}
      >
        {showScore ? (score ?? 0) : "—"}
      </Text>
    </View>
  );
}

function phaseLine(
  status: ApiGame["status"],
  currentMinute: number,
): string {
  switch (status) {
    case "live":
      return `${currentMinute}'`;
    case "break":
      return "HALF TIME";
    case "completed":
      return "FULL TIME";
    case "postponed":
      return "POSTPONED";
    case "cancelled":
      return "CANCELLED";
    case "scheduled":
    default:
      return "KICK OFF SOON";
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(186, 12, 47, 0.18)",
    borderColor: "rgba(186, 12, 47, 0.6)",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  liveDot: {
    height: 8,
    width: 8,
    borderRadius: 999,
    backgroundColor: colors.liveRed,
  },
  livePillText: {
    fontSize: 12,
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  headerLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    letterSpacing: 2,
  },
  closeBtn: {
    height: 44,
    width: 44,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  bodyPortrait: {
    flex: 1,
    justifyContent: "center",
    gap: 8,
  },
  bodyLandscape: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 8,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
    paddingVertical: 12,
  },
  teamName: {
    flex: 1,
    color: "#FFFFFF",
  },
  teamScore: {
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  landscapeColumn: {
    flex: 1,
    justifyContent: "center",
    gap: 8,
  },
  landscapeColumnStart: {
    alignItems: "flex-start",
  },
  landscapeColumnEnd: {
    alignItems: "flex-end",
  },
  landscapeTeamName: {
    color: "#FFFFFF",
    width: "100%",
  },
  landscapeScore: {
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
    width: "100%",
  },
  phaseColumn: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    minWidth: 120,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  phaseWrap: {
    alignItems: "center",
    paddingTop: 36,
  },
  phaseTextPortrait: {
    letterSpacing: 4,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  phaseTextLandscape: {
    letterSpacing: 3,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  footerText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    letterSpacing: 1,
  },
});
