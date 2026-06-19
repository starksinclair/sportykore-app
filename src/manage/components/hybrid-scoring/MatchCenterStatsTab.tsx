import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, Text, View } from "react-native";
import { useMemo, useState } from "react";

import type { ApiGameDetail, ApiStat } from "@/api/entities";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { DetailTabs } from "@/components/ui/detail-tabs";
import { colors } from "@/constants";
import { iconForStatType } from "@/lib/stat-types";
import { fonts } from "@/theme/fonts";

import type { LeagueRosterRow, MatchEventKey } from "../../types";
import { RosterPosition } from "../../types";
import { isGoalStat } from "../../utils/stats";
import { PlayerActionRow } from "./PlayerPickRow";
import { TeamTabs, type TeamSide } from "./TeamTabs";

type EventTab = "cards" | "saves";

type RecordingKey = {
  eventKey: MatchEventKey;
  playerId: number;
} | null;

const EVENT_TABS = [
  { key: "cards" as const, label: "Cards" },
  { key: "saves" as const, label: "Saves" },
];

type Props = {
  game: ApiGameDetail;
  homeTeamId: number;
  awayTeamId: number;
  roster: LeagueRosterRow[];
  statMinute: string;
  onStatMinuteChange: (value: string) => void;
  recording: RecordingKey;
  onRecordStat: (eventKey: MatchEventKey, row: LeagueRosterRow) => void;
  onDeleteStat: (statId: number) => void;
};

export function MatchCenterStatsTab({
  game,
  homeTeamId,
  awayTeamId,
  roster,
  recording,
  statMinute,
  onStatMinuteChange,
  onRecordStat,
  onDeleteStat,
}: Props) {
  const [eventTab, setEventTab] = useState<EventTab>("cards");
  const [activeSide, setActiveSide] = useState<TeamSide>("home");

  const nonGoalStats = [...(game.stats ?? [])]
    .filter((s) => !isGoalStat(s))
    .sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

  const activeTeamId = activeSide === "home" ? homeTeamId : awayTeamId;

  const players = useMemo(() => {
    return roster.filter((row) => {
      if (row.team.id !== activeTeamId || row.status !== "active") return false;
      if (eventTab === "saves") {
        return row.position === RosterPosition.Goalkeeper;
      }
      return true;
    });
  }, [roster, activeTeamId, eventTab]);

  return (
    <View className="gap-6">
      <View className="w-28">
        <AuthTextField
          label="Event minute"
          value={statMinute}
          onChangeText={onStatMinuteChange}
          keyboardType="number-pad"
          placeholder="0"
        />
      </View>

      <View className="gap-4 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
        <DetailTabs
          tabs={EVENT_TABS}
          activeTab={eventTab}
          onTabChange={setEventTab}
        />

        <TeamTabs
          homeLabel={game.homeTeam?.name ?? "Home"}
          awayLabel={game.awayTeam?.name ?? "Away"}
          activeSide={activeSide}
          onSideChange={setActiveSide}
        />

        <Text style={{ fontFamily: fonts.body }} className="text-xs text-white/40">
          {eventTab === "cards"
            ? "Tap yellow or red beside a player to record a card."
            : "Tap the save icon beside a goalkeeper."}
        </Text>

        {players.length === 0 ? (
          <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
            {eventTab === "saves"
              ? "No goalkeepers on this team."
              : "No active players on this team."}
          </Text>
        ) : (
          players.map((row) => {
            const playerId = row.player.id;

            if (eventTab === "saves") {
              const isRecording =
                recording?.eventKey === "Save" && recording.playerId === playerId;
              return (
                <PlayerActionRow
                  key={row.id}
                  name={row.player.name}
                  jersey={row.jerseyNumber}
                  actions={[
                    {
                      key: "save",
                      icon: "hand-left-outline",
                      color: colors.accent,
                      loading: isRecording,
                      onPress: () => onRecordStat("Save", row),
                      accessibilityLabel: `Record save for ${row.player.name}`,
                    },
                  ]}
                />
              );
            }

            return (
              <PlayerActionRow
                key={row.id}
                name={row.player.name}
                jersey={row.jerseyNumber}
                actions={[
                  {
                    key: "yellow",
                    icon: "warning",
                    color: colors.accent,
                    loading:
                      recording?.eventKey === "Yellow" &&
                      recording.playerId === playerId,
                    onPress: () => onRecordStat("Yellow", row),
                    accessibilityLabel: `Yellow card for ${row.player.name}`,
                  },
                  {
                    key: "red",
                    icon: "close-circle",
                    color: colors.liveRed,
                    loading:
                      recording?.eventKey === "Red" &&
                      recording.playerId === playerId,
                    onPress: () => onRecordStat("Red", row),
                    accessibilityLabel: `Red card for ${row.player.name}`,
                  },
                ]}
              />
            );
          })
        )}
      </View>

      <View className="gap-3">
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-xs uppercase tracking-wide text-white/45"
        >
          Recorded events
        </Text>
        {nonGoalStats.length === 0 ? (
          <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
            No cards, saves, or other events yet.
          </Text>
        ) : (
          nonGoalStats.map((stat) => (
            <StatRow
              key={stat.id}
              stat={stat}
              onDelete={() => {
                Alert.alert("Delete event", "Remove this stat?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => onDeleteStat(stat.id),
                  },
                ]);
              }}
            />
          ))
        )}
      </View>
    </View>
  );
}

function StatRow({ stat, onDelete }: { stat: ApiStat; onDelete: () => void }) {
  const icon = stat.type ? iconForStatType(stat.type) : "stats-chart-outline";
  const minute =
    stat.minute != null
      ? `${stat.minute}${stat.isStoppageTime ? "+" : ""}'`
      : "";

  return (
    <Pressable
      onLongPress={onDelete}
      className="flex-row items-center gap-3 rounded-2xl bg-white/6 px-3 py-3"
    >
      <Ionicons name={icon} size={20} color={colors.accent} />
      <View className="flex-1">
        <Text style={{ fontFamily: fonts.bodySemibold }} className="text-sm text-white">
          {stat.type?.displayName ?? "Event"} — {stat.player?.name ?? "Player"}
        </Text>
        <Text style={{ fontFamily: fonts.body }} className="text-xs text-white/45">
          {stat.team?.name}
          {stat.relatedPlayer ? ` · Assist: ${stat.relatedPlayer.name}` : ""}
          {minute ? ` · ${minute}` : ""}
        </Text>
      </View>
    </Pressable>
  );
}
