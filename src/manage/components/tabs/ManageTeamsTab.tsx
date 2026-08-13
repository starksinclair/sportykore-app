import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import { useTheme } from "@/color/use-theme";
import { EntityLogo } from "@/components/ui";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { showThrownAsToast } from "@/lib/show-error-toast";

import { useDeleteTeam } from "../../hooks";
import type { ManagedTeam } from "../../types";
import { TeamFormSheet } from "../teams/TeamFormSheet";

type Props = {
  leagueId: number;
  seasonId: number;
  teams: ManagedTeam[];
  isLoading: boolean;
};

export function ManageTeamsTab({ leagueId, seasonId, teams, isLoading }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useAdaptiveLayout();
  const deleteMutation = useDeleteTeam(leagueId, seasonId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<ManagedTeam | null>(null);

  const openAdd = () => {
    setEditingTeam(null);
    setFormOpen(true);
  };

  const openEdit = (team: ManagedTeam) => {
    setEditingTeam(team);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingTeam(null);
  };

  const handleDelete = (team: ManagedTeam) => {
    if (deleteMutation.isPending) return;
    const fewTeamsWarning =
      teams.length <= 2
        ? "\n\nYou need at least two teams to schedule new games."
        : "";

    Alert.alert(
      "Delete team",
      `Remove "${team.name}" from this league? This also deletes related games, standings, roster entries, stats, and invites.${fewTeamsWarning}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(team.id);
            } catch (err) {
              showThrownAsToast(err, "Could not delete team");
            }
          },
        },
      ],
    );
  };

  return (
    <View className="gap-6 pb-8">
      <View
        className="rounded-[24px] border px-4 py-4"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        <View className="flex-row items-center gap-3">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: theme.accentMuted }}
          >
            <Ionicons name="shirt-outline" size={22} color={theme.accent} />
          </View>
          <View className="min-w-0 flex-1">
            <Text style={{ color: theme.text }}>
              League teams
            </Text>
            <Text
              className="text-xs leading-5"
              style={{ color: theme.textSubtle }}
              numberOfLines={2}
            >
              Teams power fixtures, standings, and player invites.
            </Text>
          </View>
          <Pressable
            onPress={openAdd}
            accessibilityRole="button"
            accessibilityLabel="Add team"
            className="h-10 flex-row items-center gap-1.5 rounded-full px-3 active:opacity-90"
            style={{ backgroundColor: theme.accent }}
          >
            <Ionicons name="add" size={16} color={theme.textInverse} />
            <Text
              className="text-xs"
              style={{ color: theme.textInverse }}
              numberOfLines={1}
            >
              Add
            </Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View className="items-center py-12">
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : teams.length === 0 ? (
        <View
          className="rounded-[22px] border border-dashed px-5 py-8"
          style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
        >
          <Text className="text-base" style={{ color: theme.text }}>
            No teams yet
          </Text>
          <Text
            className="pt-2 text-sm leading-6"
            style={{ color: theme.textSubtle }}
          >
            Add at least two teams before you can schedule games or invite players.
          </Text>
        </View>
      ) : (
        <View className={isTablet ? "flex-row flex-wrap gap-3" : "gap-2"}>
          {teams.map((team) => (
            <View
              key={team.id}
              className="flex-row items-center gap-3 rounded-[20px] border px-4 py-3"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                ...(isTablet ? { width: "48%" } : null),
              }}
            >
              <EntityLogo
                logoUrl={team.logoUrl}
                variant="team"
                size="sm"
                tone="dark"
                accessibilityLabel={`${team.name} logo`}
              />
              <Text
                className="flex-1"
                style={{ color: theme.text }}
                numberOfLines={1}
              >
                {team.name}
              </Text>
              <Pressable
                onPress={() =>
                  router.push(
                    `/manage/${leagueId}/team/${team.id}?seasonId=${seasonId}`,
                  )
                }
                accessibilityLabel={`Lineups for ${team.name}`}
                className="h-10 w-10 items-center justify-center rounded-xl active:opacity-85"
                style={{ backgroundColor: theme.cardMuted }}
              >
                <Ionicons name="grid-outline" size={18} color={theme.accent} />
              </Pressable>
              <Pressable
                onPress={() => openEdit(team)}
                accessibilityLabel={`Edit ${team.name}`}
                className="h-10 w-10 items-center justify-center rounded-xl active:opacity-85"
                style={{ backgroundColor: theme.cardMuted }}
              >
                <Ionicons name="create-outline" size={18} color={theme.textMuted} />
              </Pressable>
              <Pressable
                onPress={() => handleDelete(team)}
                disabled={deleteMutation.isPending}
                accessibilityLabel={`Delete ${team.name}`}
                className={`h-10 w-10 items-center justify-center rounded-xl active:opacity-85 ${
                  deleteMutation.isPending ? "opacity-45" : ""
                }`}
                style={{ backgroundColor: theme.cardMuted }}
              >
                <Ionicons name="trash-outline" size={18} color={theme.danger} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <TeamFormSheet
        visible={formOpen}
        onClose={closeForm}
        leagueId={leagueId}
        seasonId={seasonId}
        team={editingTeam}
      />
    </View>
  );
}
