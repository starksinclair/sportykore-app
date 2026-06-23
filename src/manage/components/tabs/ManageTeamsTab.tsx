import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import type { ApiTeam } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { EntityLogo } from "@/components/ui";
import { showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

import { useDeleteTeam } from "../../hooks";
import { TeamFormSheet } from "../teams/TeamFormSheet";

type Props = {
  leagueId: number;
  seasonId: number;
  teams: ApiTeam[];
  isLoading: boolean;
};

export function ManageTeamsTab({ leagueId, seasonId, teams, isLoading }: Props) {
  const deleteMutation = useDeleteTeam(leagueId, seasonId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<ApiTeam | null>(null);

  const openAdd = () => {
    setEditingTeam(null);
    setFormOpen(true);
  };

  const openEdit = (team: ApiTeam) => {
    setEditingTeam(team);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingTeam(null);
  };

  const handleDelete = (team: ApiTeam) => {
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
      <View className="flex-row items-center justify-between gap-3">
        <Text style={{ fontFamily: fonts.body }} className="flex-1 text-sm text-white/55">
          Teams belong to the whole league — use them for fixtures, standings, and player
          invites.
        </Text>
        <Button
          variant="authPurple"
          label="Add team"
          onPress={openAdd}
          className="h-11 px-4"
        />
      </View>

      {isLoading ? (
        <View className="items-center py-12">
          <ActivityIndicator color="#E6A817" />
        </View>
      ) : teams.length === 0 ? (
        <View className="rounded-[22px] border border-dashed border-white/15 bg-white/5 px-5 py-8">
          <Text style={{ fontFamily: fonts.bodyBold }} className="text-base text-white">
            No teams yet
          </Text>
          <Text
            style={{ fontFamily: fonts.body }}
            className="pt-2 text-sm leading-6 text-white/55"
          >
            Add at least two teams before you can schedule games or invite players.
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {teams.map((team) => (
            <View
              key={team.id}
              className="flex-row items-center gap-3 rounded-[20px] bg-white/6 px-4 py-3"
            >
              <EntityLogo
                logoUrl={team.logoUrl}
                variant="team"
                size="sm"
                tone="dark"
                accessibilityLabel={`${team.name} logo`}
              />
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="flex-1 text-white"
                numberOfLines={1}
              >
                {team.name}
              </Text>
              <Pressable
                onPress={() => openEdit(team)}
                accessibilityLabel={`Edit ${team.name}`}
                className="h-10 w-10 items-center justify-center rounded-xl bg-white/10 active:bg-white/15"
              >
                <Ionicons name="create-outline" size={18} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={() => handleDelete(team)}
                disabled={deleteMutation.isPending}
                accessibilityLabel={`Delete ${team.name}`}
                className="h-10 w-10 items-center justify-center rounded-xl bg-white/10 active:bg-white/15"
              >
                <Ionicons name="trash-outline" size={18} color="#fca5a5" />
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
