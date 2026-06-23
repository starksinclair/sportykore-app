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
import { EntityLogo } from "@/components/ui";
import { useGamePhaseLabel } from "@/hooks/useGamePhaseLabel";
import { formatPlayedAtTime } from "@/lib/datetime";
import {
  isActivePlayStatus,
  isLiveGameStatus,
} from "@/lib/general-utils";
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
 * clock from across the room. Opens locked to landscape; live matches poll
 * every 5 seconds while the modal is visible.
 */
export function TvScoreboardModal({ game, visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      supportedOrientations={["landscape", "landscape-left", "landscape-right"]}
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

  useEffect(() => {
    void ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE,
    );
    return () => {
      void ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, []);

  const detailQuery = useMatchDetail(game.id, {
    refetchInterval: isActivePlayStatus(game.status) ? 5_000 : undefined,
    staleTime: isActivePlayStatus(game.status) ? 0 : undefined,
  });
  const fresh = detailQuery.data;
  const merged = useMemo<ApiGame>(
    () => ({ ...game, ...(fresh ?? {}) }),
    [game, fresh],
  );

  const showScore =
    isActivePlayStatus(merged.status) ||
    merged.status === "half_time" ||
    merged.status === "break" ||
    merged.status === "full_time" ||
    merged.status === "completed";
  const phase = useGamePhaseLabel(merged);
  const phaseColor = isLiveGameStatus(merged.status) ? colors.liveRed : colors.accent;

  const metrics = useMemo(
    () => scaleMetrics(width, height),
    [width, height],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" hidden />
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom", "left", "right"]}
      >
        <View style={styles.header}>
          {isActivePlayStatus(merged.status) ? (
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

        <View style={styles.body}>
          <TeamColumn
            name={merged.homeTeam?.name ?? "Home"}
            logoUrl={merged.homeTeam?.logoUrl}
            score={merged.homeScore}
            showScore={showScore}
            metrics={metrics}
            align="start"
          />
          <View style={styles.phaseColumn}>
            <Text
              style={[
                styles.phaseText,
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
          <TeamColumn
            name={merged.awayTeam?.name ?? "Away"}
            logoUrl={merged.awayTeam?.logoUrl}
            score={merged.awayScore}
            showScore={showScore}
            metrics={metrics}
            align="end"
          />
        </View>

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

function scaleMetrics(width: number, height: number): LayoutMetrics {
  const short = Math.min(width, height);
  const long = Math.max(width, height);

  return {
    teamNameSize: Math.min(40, long * 0.055),
    scoreSize: Math.min(140, short * 0.42),
    phaseSize: Math.min(72, short * 0.2),
  };
}

function TeamColumn({
  name,
  logoUrl,
  score,
  showScore,
  metrics,
  align,
}: {
  name: string;
  logoUrl?: string | null;
  score: number | null;
  showScore: boolean;
  metrics: LayoutMetrics;
  align: "start" | "end";
}) {
  return (
    <View
      style={[
        styles.teamColumn,
        align === "end" ? styles.teamColumnEnd : styles.teamColumnStart,
      ]}
    >
      <EntityLogo
        logoUrl={logoUrl}
        variant="team"
        size="lg"
        tone="dark"
      />
      <Text
        style={[
          styles.teamName,
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
      {showScore ? (
        <Text
          style={[
            styles.teamScore,
            {
              fontFamily: fonts.bodyBold,
              fontSize: metrics.scoreSize,
              lineHeight: metrics.scoreSize * 1.05,
              textAlign: align === "end" ? "right" : "left",
            },
          ]}
          numberOfLines={1}
        >
          {score ?? 0}
        </Text>
      ) : null}
    </View>
  );
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
  body: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 8,
  },
  teamColumn: {
    flex: 1,
    justifyContent: "center",
    gap: 8,
  },
  teamColumnStart: {
    alignItems: "flex-start",
  },
  teamColumnEnd: {
    alignItems: "flex-end",
  },
  teamName: {
    color: "#FFFFFF",
    width: "100%",
  },
  teamScore: {
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
  phaseText: {
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
