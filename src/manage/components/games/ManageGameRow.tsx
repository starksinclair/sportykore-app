import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import type { ApiGame } from "@/api/entities";
import { formatPlayedAt } from "@/lib/datetime";
import { phaseLabel } from "@/lib/general-utils";
import { showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

import { useDeleteGame, useUpdateGame } from "../../hooks";
import { EditScoreSheet } from "./EditScoreSheet";

type RowVariant = "live" | "upcoming" | "results";

type Props = {
  game: ApiGame;
  leagueId: number;
  seasonId: number;
  variant: RowVariant;
};

export function ManageGameRow({ game, leagueId, seasonId, variant }: Props) {
  const router = useRouter();
  const updateMutation = useUpdateGame(leagueId, seasonId);
  const deleteMutation = useDeleteGame(leagueId, seasonId);
  const [editScoreOpen, setEditScoreOpen] = useState(false);

  const showScore =
    variant !== "upcoming" ||
    game.status === "completed" ||
    game.homeScore != null;

  const openMatchCenter = () => {
    router.push({
      pathname: "/manage/[leagueId]/game/[gameId]",
      params: { leagueId: String(leagueId), gameId: String(game.id), seasonId: String(seasonId) },
    });
  };

  const handleStart = async () => {
    try {
      await updateMutation.mutateAsync({
        gameId: game.id,
        payload: { status: "live" },
      });
      openMatchCenter();
    } catch (err) {
      showThrownAsToast(err, "Could not start match");
    }
  };

  const handleEditScore = () => setEditScoreOpen(true);

  const handleReopen = () => {
    Alert.alert("Reopen match", "Set status to live or scheduled?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Live",
        onPress: async () => {
          try {
            await updateMutation.mutateAsync({
              gameId: game.id,
              payload: { status: "live" },
            });
            openMatchCenter();
          } catch (err) {
            showThrownAsToast(err);
          }
        },
      },
      {
        text: "Scheduled",
        onPress: async () => {
          try {
            await updateMutation.mutateAsync({
              gameId: game.id,
              payload: { status: "scheduled" },
            });
          } catch (err) {
            showThrownAsToast(err);
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete game",
      "This removes the fixture and all recorded events.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(game.id);
            } catch (err) {
              showThrownAsToast(err, "Could not delete game");
            }
          },
        },
      ],
    );
  };

  const handleResultsActions = () => {
    Alert.alert("Game actions", undefined, [
      { text: "Edit score", onPress: handleEditScore },
      { text: "Reopen match", onPress: handleReopen },
      { text: "Delete", style: "destructive", onPress: handleDelete },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <>
      <EditScoreSheet
        visible={editScoreOpen}
        game={game}
        leagueId={leagueId}
        seasonId={seasonId}
        onClose={() => setEditScoreOpen(false)}
      />
      <Pressable
      onPress={variant === "live" ? openMatchCenter : undefined}
      className="rounded-[22px] bg-white/6 px-4 py-4 active:bg-white/10"
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text style={{ fontFamily: fonts.bodyBold }} className="text-white">
            {game.homeTeam?.name ?? "TBD"}
          </Text>
          <Text style={{ fontFamily: fonts.bodyBold }} className="pt-1 text-white">
            {game.awayTeam?.name ?? "TBD"}
          </Text>
        </View>
        {showScore ? (
          <View className="items-end gap-1">
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-[#E6A817]"
            >
              {game.homeScore ?? "-"}
            </Text>
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-[#E6A817]"
            >
              {game.awayScore ?? "-"}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        style={{ fontFamily: fonts.body }}
        className="pt-3 text-xs uppercase tracking-[1.5px] text-white/45"
      >
        {formatPlayedAt(game.playedAt)} · {phaseLabel(game.status, game.currentMinute)}
      </Text>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {variant === "live" ? (
          <ActionChip
            label="Match center"
            icon="tv-outline"
            onPress={openMatchCenter}
            accent
          />
        ) : null}
        {variant === "upcoming" ? (
          <ActionChip
            label="Start"
            icon="play"
            onPress={() => void handleStart()}
            accent
            loading={updateMutation.isPending}
          />
        ) : null}
        {variant === "results" ? (
          <>
            <ActionChip
              label="Actions"
              icon="ellipsis-horizontal"
              onPress={handleResultsActions}
            />
            <ActionChip
              label="Match center"
              icon="tv-outline"
              onPress={openMatchCenter}
            />
          </>
        ) : null}
      </View>
    </Pressable>
    </>
  );
}

function ActionChip({
  label,
  icon,
  onPress,
  accent,
  loading,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accent?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
        accent ? "bg-[#E6A817]" : "bg-white/10"
      }`}
    >
      <Ionicons
        name={icon}
        size={14}
        color={accent ? "#1a1a1a" : "rgba(255,255,255,0.85)"}
      />
      <Text
        style={{ fontFamily: fonts.bodySemibold }}
        className={`text-xs ${accent ? "text-neutral-950" : "text-white/85"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
