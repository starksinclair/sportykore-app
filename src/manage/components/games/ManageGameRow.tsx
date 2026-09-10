import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import type { ApiGame } from "@/api/entities";
import { useTheme } from "@/color/use-theme";
import { EntityLogo, GamePhaseLabel } from "@/components/ui";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { formatPlayedAt } from "@/lib/datetime";
import { posthog } from "@/lib/posthog";
import { showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

import { useDeleteGame, useGameTimeActions, useUpdateGame } from "../../hooks";
import { EditGameSheet } from "./EditGameSheet";
import { EditScoreSheet } from "./EditScoreSheet";

type RowVariant = "live" | "upcoming" | "results";
type ActionsMenu = "upcoming" | "results" | null;

type Props = {
  game: ApiGame;
  leagueId: number;
  seasonId: number;
  variant: RowVariant;
};

export function ManageGameRow({ game, leagueId, seasonId, variant }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const updateMutation = useUpdateGame(leagueId, seasonId);
  const deleteMutation = useDeleteGame(leagueId, seasonId);
  const gameTimeActions = useGameTimeActions(game.id, leagueId, seasonId);
  const [editScoreOpen, setEditScoreOpen] = useState(false);
  const [editGameOpen, setEditGameOpen] = useState(false);
  const [actionsMenu, setActionsMenu] = useState<ActionsMenu>(null);

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
      await gameTimeActions.startFirstHalf.mutateAsync();
      posthog?.capture("match_started", {
        league_id: leagueId,
        season_id: seasonId,
        game_id: game.id,
        start_source: "upcoming_fixture",
      });
      openMatchCenter();
    } catch (err) {
      showThrownAsToast(err, "Could not start match");
    }
  };

  const handleEditScore = () => setEditScoreOpen(true);

  const handleReopen = () => {
    Alert.alert("Reopen match", "Start first half again or reset to scheduled?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Start first half",
        onPress: async () => {
          try {
            await gameTimeActions.startFirstHalf.mutateAsync();
            posthog?.capture("match_started", {
              league_id: leagueId,
              season_id: seasonId,
              game_id: game.id,
              start_source: "reopened_match",
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

  const closeActionsMenu = () => setActionsMenu(null);

  const runAction = (action: () => void) => {
    closeActionsMenu();
    // Let the sheet dismiss before opening the next alert/sheet.
    requestAnimationFrame(action);
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
      <EditGameSheet
        visible={editGameOpen}
        game={game}
        leagueId={leagueId}
        seasonId={seasonId}
        onClose={() => setEditGameOpen(false)}
      />
      <BottomSheetModal
        visible={actionsMenu != null}
        onClose={closeActionsMenu}
        title="Game actions"
        subtitle="Select an action"
        scrollEnabled={false}
      >
        <View className="gap-2 pb-2">
          {actionsMenu === "results" ? (
            <>
              <ActionMenuRow
                label="Edit score"
                icon="create-outline"
                onPress={() => runAction(handleEditScore)}
              />
              <ActionMenuRow
                label="Reopen match"
                icon="refresh-outline"
                onPress={() => runAction(handleReopen)}
              />
              <ActionMenuRow
                label="Delete"
                icon="trash-outline"
                destructive
                onPress={() => runAction(handleDelete)}
              />
            </>
          ) : null}
          {actionsMenu === "upcoming" ? (
            <>
              <ActionMenuRow
                label="Edit fixture"
                icon="calendar-outline"
                onPress={() =>
                  runAction(() => setEditGameOpen(true))
                }
              />
              <ActionMenuRow
                label="Delete"
                icon="trash-outline"
                destructive
                onPress={() => runAction(handleDelete)}
              />
            </>
          ) : null}
          <ActionMenuRow
            label="Cancel"
            icon="close-outline"
            onPress={closeActionsMenu}
          />
        </View>
      </BottomSheetModal>
      <Pressable
        onPress={variant === "live" ? openMatchCenter : undefined}
        className="rounded-[22px] border px-4 py-4 active:opacity-85"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-2">
          <View className="flex-row items-center gap-2">
            <EntityLogo
              logoUrl={game.homeTeam?.logoUrl}
              variant="team"
              size="xs"
              tone="dark"
            />
            <Text style={{ color: theme.text }}>
              {game.homeTeam?.name ?? "TBD"}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <EntityLogo
              logoUrl={game.awayTeam?.logoUrl}
              variant="team"
              size="xs"
              tone="dark"
            />
            <Text style={{ color: theme.text }}>
              {game.awayTeam?.name ?? "TBD"}
            </Text>
          </View>
        </View>
        {showScore ? (
          <View className="items-end gap-1">
            <Text
              style={{ color: theme.accent }}
            >
              {game.homeScore ?? "-"}
            </Text>
            <Text
              style={{ color: theme.accent }}
            >
              {game.awayScore ?? "-"}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row flex-wrap items-center pt-3">
        <Text
          className="text-xs uppercase tracking-[1.5px]"
          style={{ color: theme.textSubtle }}
        >
          {formatPlayedAt(game.playedAt)} ·{" "}
        </Text>
        <GamePhaseLabel
          game={game}
          textClassName="text-xs uppercase tracking-[1.5px]"
          style={{ color: theme.textSubtle }}
        />
      </View>

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
          <>
            <ActionChip
              label="Kick off"
              icon="play"
              onPress={() => void handleStart()}
              accent
              loading={gameTimeActions.startFirstHalf.isPending}
            />
            <ActionChip
              label="Actions"
              icon="ellipsis-horizontal"
              onPress={() => setActionsMenu("upcoming")}
            />
          </>
        ) : null}
        {variant === "results" ? (
          <>
            <ActionChip
              label="Actions"
              icon="ellipsis-horizontal"
              onPress={() => setActionsMenu("results")}
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
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 active:opacity-85"
      style={{ backgroundColor: accent ? theme.accent : theme.cardMuted }}
    >
      <Ionicons
        name={icon}
        size={14}
        color={accent ? theme.textInverse : theme.textMuted}
      />
      <Text
        className="text-xs"
        style={{ color: accent ? theme.textInverse : theme.text }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ActionMenuRow({
  label,
  icon,
  onPress,
  destructive,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl px-4 py-3.5 active:opacity-85"
      style={{ backgroundColor: theme.cardMuted }}
    >
      <Ionicons
        name={icon}
        size={18}
        color={destructive ? theme.danger : theme.textMuted}
      />
      <Text
        className="text-base"
        style={{
          fontFamily: fonts.bodySemibold,
          color: destructive ? theme.danger : theme.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
