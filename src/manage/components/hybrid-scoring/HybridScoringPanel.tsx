import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiGameDetail } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

import type { LeagueRosterRow } from "../../types";
import { PlayerActionRow } from "./PlayerPickRow";
import { TeamTabs, type TeamSide } from "./TeamTabs";

type Props = {
  game: ApiGameDetail;
  homeTeamId: number;
  awayTeamId: number;
  roster: LeagueRosterRow[];
  pendingTeam: "home" | "away" | null;
  scorerId: number | null;
  assistId: number | null;
  isOwnGoal: boolean;
  minute: string;
  scorePending: boolean;
  accreditPending: boolean;
  onIncrement: (team: "home" | "away") => void;
  onDecrement: (team: "home" | "away") => void;
  onSelectScorer: (playerId: number) => void;
  onSelectAssist: (playerId: number) => void;
  onToggleOwnGoal: () => void;
  onMinuteChange: (value: string) => void;
  onLogGoal: () => void;
  onSkip: () => void;
};

export function HybridScoringPanel({
  game,
  homeTeamId,
  awayTeamId,
  roster,
  pendingTeam,
  scorerId,
  assistId,
  isOwnGoal,
  minute,
  scorePending,
  accreditPending,
  onIncrement,
  onDecrement,
  onSelectScorer,
  onSelectAssist,
  onToggleOwnGoal,
  onMinuteChange,
  onLogGoal,
  onSkip,
}: Props) {
  const [activeSide, setActiveSide] = useState<TeamSide>("home");
  const accreditActive = pendingTeam != null;

  useEffect(() => {
    if (pendingTeam) setActiveSide(pendingTeam);
  }, [pendingTeam]);

  const activeTeamId = activeSide === "home" ? homeTeamId : awayTeamId;
  const players = useMemo(
    () =>
      roster.filter(
        (row) => row.team.id === activeTeamId && row.status === "active",
      ),
    [roster, activeTeamId],
  );

  return (
    <View className="gap-5">
      <View className="flex-row justify-between gap-4 rounded-[24px] bg-white/6 px-4 py-4">
        <ScoreSide
          label="Home"
          onMinus={() => onDecrement("home")}
          onPlus={() => onIncrement("home")}
          disabled={scorePending}
        />
        <ScoreSide
          label="Away"
          onMinus={() => onDecrement("away")}
          onPlus={() => onIncrement("away")}
          disabled={scorePending}
        />
      </View>

      <View
        className={`gap-4 rounded-[24px] border px-4 py-4 ${
          accreditActive
            ? "border-brand-400/40 bg-brand-500/10"
            : "border-white/10 bg-white/4 opacity-60"
        }`}
        pointerEvents={accreditActive ? "auto" : "none"}
      >
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-xs uppercase tracking-[2px] text-white/55"
        >
          Select scorer and assist
        </Text>
        <Text style={{ fontFamily: fonts.body }} className="text-xs text-white/40">
          Tap the goal or assist icon beside a player.
        </Text>

        <TeamTabs
          homeLabel={game.homeTeam?.name ?? "Home"}
          awayLabel={game.awayTeam?.name ?? "Away"}
          activeSide={activeSide}
          onSideChange={setActiveSide}
        />

        {players.length === 0 ? (
          <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
            No active players on this team.
          </Text>
        ) : (
          players.map((row) => {
            const playerId = row.player.id;
            const assistDisabled =
              !scorerId || isOwnGoal || playerId === scorerId;

            return (
              <PlayerActionRow
                key={row.id}
                name={row.player.name}
                jersey={row.jerseyNumber}
                actions={[
                  {
                    key: "goal",
                    icon: "football-outline",
                    color: colors.accent,
                    selected: scorerId === playerId,
                    onPress: () => onSelectScorer(playerId),
                    accessibilityLabel: `Select ${row.player.name} as scorer`,
                  },
                  {
                    key: "assist",
                    icon: "git-merge-outline",
                    color: colors.accent,
                    selected: assistId === playerId,
                    disabled: assistDisabled,
                    onPress: () => onSelectAssist(playerId),
                    accessibilityLabel: `Select ${row.player.name} as assist`,
                  },
                ]}
              />
            );
          })
        )}

        <View className="flex-row flex-wrap items-center justify-between gap-3 pt-2">
          <Pressable
            onPress={onToggleOwnGoal}
            className="flex-row items-center gap-2 rounded-full bg-white/10 px-3 py-2"
          >
            <Ionicons
              name={isOwnGoal ? "checkbox" : "square-outline"}
              size={18}
              color={isOwnGoal ? colors.accent : "rgba(255,255,255,0.55)"}
            />
            <Text style={{ fontFamily: fonts.bodySemibold }} className="text-sm text-white">
              Own goal
            </Text>
          </Pressable>

          <View className="w-24">
            <AuthTextField
              label="Min"
              value={minute}
              onChangeText={onMinuteChange}
              keyboardType="number-pad"
              editable={accreditActive}
            />
          </View>
        </View>

        <View className="gap-2 pt-2">
          <Button
            variant="authPurple"
            label="Log goal"
            disabled={!accreditActive || scorerId == null}
            loading={accreditPending}
            onPress={onLogGoal}
          />
          <Button
            variant="ghost"
            label="Skip — score only"
            disabled={!accreditActive}
            onPress={onSkip}
          />
        </View>
      </View>
    </View>
  );
}

function ScoreSide({
  label,
  onMinus,
  onPlus,
  disabled,
}: {
  label: string;
  onMinus: () => void;
  onPlus: () => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-1 items-center gap-2">
      <Text
        style={{ fontFamily: fonts.bodySemibold }}
        className="text-xs uppercase tracking-wide text-white/55"
      >
        {label}
      </Text>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={onMinus}
          disabled={disabled}
          className="h-12 w-12 items-center justify-center rounded-full bg-white/10"
        >
          <Ionicons name="remove" size={24} color="#fff" />
        </Pressable>
        <Pressable
          onPress={onPlus}
          disabled={disabled}
          className="h-12 w-12 items-center justify-center rounded-full bg-[#E6A817]"
        >
          <Ionicons name="add" size={24} color="#1a1a1a" />
        </Pressable>
      </View>
    </View>
  );
}
