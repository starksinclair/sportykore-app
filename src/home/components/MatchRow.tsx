import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { EntityLogo } from "@/components/ui";
import { useLiveMinute } from "@/hooks/useLiveMinute";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import {
  formatPlayedAtTime
} from "@/lib/datetime";
import { formatLiveMinuteLabel } from "@/lib/game-time";
import { isActivePlayStatus, isLiveGameStatus } from "@/lib/general-utils";

import type { ApiGame } from "../types";
import { TvScoreboardModal } from "./TvScoreboardModal";

type Props = {
  game: ApiGame;
};

export function MatchRow({ game }: Props) {
  const router = useRouter();
  const { isTablet } = useAdaptiveLayout();
  const [tvOpen, setTvOpen] = useState(false);
  const isLive = isLiveGameStatus(game.status);
  const showScore = isActivePlayStatus(game.status);

  return (
    <>
      <Pressable
        onPress={() => router.push(`/match/${game.id}`)}
        className={[
          "flex-row items-start active:bg-neutral-50",
          isTablet ? "gap-4 px-5 py-4" : "gap-3 px-3 py-3",
        ].join(" ")}
      >
        <View style={[styles.metaColumn, isTablet ? styles.metaColumnTablet : null]}>
          <Text
            style={[styles.timeLabel]}
            className={isTablet ? "text-[12px] text-neutral-950" : "text-[11px] text-neutral-950"}
          >
            {formatPlayedAtTime(game.playedAt)}
          </Text>
         
          <MatchPhaseBadge game={game} isLive={isLive} />
        </View>

        <View className="flex-1 gap-2">
          <View className="flex-row items-center gap-1.5">
            <EntityLogo
              logoUrl={game.homeTeam?.logoUrl}
              variant="team"
              size={isTablet ? "sm" : "xs"}
              tone="light"
            />
            <Text
              numberOfLines={1}
              className={isTablet ? "flex-1 text-[15px] text-neutral-950" : "flex-1 text-[14px] text-neutral-950"}
            >
              {game.homeTeam?.name ?? "TBD"}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <EntityLogo
              logoUrl={game.awayTeam?.logoUrl}
              variant="team"
              size={isTablet ? "sm" : "xs"}
              tone="light"
            />
            <Text
              numberOfLines={1}
              className={isTablet ? "flex-1 text-[15px] text-neutral-950" : "flex-1 text-[14px] text-neutral-950"}
            >
              {game.awayTeam?.name ?? "TBD"}
            </Text>
          </View>
        </View>

        {showScore ? (
          <View className={isTablet ? "min-w-[34px] items-end gap-3 pt-0.5" : "min-w-[24px] items-end gap-2 pt-0.5"}>
            <Text
              style={[styles.score]}
              className={isTablet ? "text-[17px] text-[#ba0c2f]" : "text-[15px] text-[#ba0c2f]"}
            >
              {game.homeScore ?? "0"}
            </Text>
            <Text
              style={[styles.score]}
              className={isTablet ? "text-[17px] text-[#ba0c2f]" : "text-[15px] text-[#ba0c2f]"}
            >
              {game.awayScore ?? "0"}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => setTvOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open TV scoreboard"
          hitSlop={8}
          className={[
            "ml-1 items-center justify-center rounded-full bg-neutral-100 active:bg-neutral-200",
            isTablet ? "h-11 w-11" : "h-9 w-9",
          ].join(" ")}
        >
          <Ionicons name="tv-outline" size={isTablet ? 18 : 16} color="#111827" />
        </Pressable>
      </Pressable>

      <TvScoreboardModal
        game={game}
        visible={tvOpen}
        onClose={() => setTvOpen(false)}
      />
    </>
  );
}

function MatchPhaseBadge({
  game,
  isLive,
}: {
  game: ApiGame;
  isLive: boolean;
}) {
  const minute = useLiveMinute(game);

  if (game.status === "scheduled") {
    return null;
  }

  if (game.status === "paused") {
    const displayMinute = minute >= 0 ? Math.max(1, minute + 1) : null;
    return (
      <View className="mt-0.5 items-center gap-1">
        {displayMinute ? (
          <Text
            style={[styles.phaseLabel]}
            className="text-[10px] tabular-nums text-neutral-500"
          >
            {`${displayMinute}'`}
          </Text>
        ) : null}
        <View className="rounded-md bg-amber-100 px-1.5 py-0.5">
          <Text
            className="text-[8px] uppercase tracking-wide text-amber-900"
          >
            Paused
          </Text>
        </View>
      </View>
    );
  }

  if (game.status === "cancelled") {
    return (
      <View className="mt-0.5 rounded-md bg-neutral-100 px-1.5 py-0.5">
        <Text
          className="text-[8px] uppercase tracking-wide text-neutral-500"
        >
          Can
        </Text>
      </View>
    );
  }

  if (game.status === "postponed") {
    return (
      <View className="mt-0.5 rounded-md bg-orange-100 px-1.5 py-0.5">
        <Text
          className="text-[8px] uppercase tracking-wide text-orange-900"
        >
          Pst
        </Text>
      </View>
    );
  }

  const label = formatLiveMinuteLabel(game, minute);

  return (
    <Text
      style={[styles.phaseLabel]}
      numberOfLines={1}
      className={`mt-0.5 text-[10px] uppercase tracking-wide ${
        isLive ? "text-[#ba0c2f]" : "text-neutral-500"
      }`}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  metaColumn: {
    width: 54,
    alignItems: "center",
    gap: 3,
    paddingTop: 1,
  },
  metaColumnTablet: {
    width: 72,
  },
  timeLabel: {
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.2,
  },
  phaseLabel: {
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.4,
    textAlign: "center",
  },
  score: {
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.6,
  },
});
