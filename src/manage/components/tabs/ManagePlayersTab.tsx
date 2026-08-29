import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import type { ApiTeam } from "@/api/entities";
import { useTheme } from "@/color/use-theme";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { SeasonPicker } from "@/components/ui/season-picker";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { InviteLinkSheet } from "@/invite/components/InviteLinkSheet";
import { showThrownAsToast } from "@/lib/show-error-toast";

import {
  useRemoveLeaguePlayer,
  useSeasonRoster,
  useUpdateLeaguePlayer,
} from "../../hooks";
import type { LeagueRosterRow } from "../../types";
import { RosterPosition } from "../../types";
import { ManageTabGuide } from "../ManageTabGuide";

type Props = {
  leagueId: number;
  leagueName: string;
  seasonId: number;
  teams: ApiTeam[];
};

export function ManagePlayersTab({ leagueId, leagueName, seasonId, teams }: Props) {
  const theme = useTheme();
  const { isTablet } = useAdaptiveLayout();
  const rosterQuery = useSeasonRoster(leagueId, seasonId);
  const [rosterTeamId, setRosterTeamId] = useState<number | null>(
    teams[0]?.id ?? null,
  );
  const [inviteOpen, setInviteOpen] = useState(false);

  const teamOptions = useMemo(
    () => teams.map((team) => ({ id: team.id, name: team.name })),
    [teams],
  );

  const filteredRoster = useMemo(() => {
    const rows = rosterQuery.data ?? [];
    if (rosterTeamId == null) return rows;
    return rows.filter((row) => row.team.id === rosterTeamId);
  }, [rosterQuery.data, rosterTeamId]);

  const activeRosterTeam = teams.find((team) => team.id === rosterTeamId) ?? null;

  useEffect(() => {
    if (teams.length === 0) {
      setRosterTeamId(null);
      return;
    }
    const stillValid =
      rosterTeamId != null && teams.some((team) => team.id === rosterTeamId);
    if (!stillValid) {
      setRosterTeamId(teams[0].id);
    }
  }, [teams, rosterTeamId]);

  return (
    <View className="gap-6 pb-8">
      <ManageTabGuide
        summary="Invite players, filter by team, and keep the season roster tidy."
        items={[
          {
            icon: "person-add-outline",
            title: "Invite players",
            body: "Create an invite for a league or team and copy the code for easy sharing.",
          },
          {
            icon: "people-outline",
            title: "Assign teams",
            body: "Move accepted players onto the right team roster for this season.",
          },
          {
            icon: "create-outline",
            title: "Update roster details",
            body: "Tap a player to set jersey number, position, or captain status.",
          },
        ]}
      />

      <View
        className="rounded-[24px] border px-4 py-4"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        <View className="flex-row items-center gap-3">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: theme.accentMuted }}
          >
            <Ionicons name="people-outline" size={22} color={theme.accent} />
          </View>
          <View className="min-w-0 flex-1">
            <Text style={{ color: theme.text }}>
              Season roster
            </Text>
            <Text
              className="text-xs leading-5"
              style={{ color: theme.textSubtle }}
              numberOfLines={2}
            >
              Invite players to a team and let them finish their own profile.
            </Text>
          </View>
          <Pressable
            onPress={() => setInviteOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Invite to team"
            className="h-10 flex-row items-center gap-1.5 rounded-full px-3 active:opacity-90"
            style={{ backgroundColor: theme.accent }}
          >
            <Ionicons name="person-add-outline" size={15} color={theme.textInverse} />
            <Text
              className="text-xs"
              style={{ color: theme.textInverse }}
              numberOfLines={1}
            >
              Invite
            </Text>
          </Pressable>
        </View>
      </View>

      {teams.length > 0 ? (
        <SeasonPicker
          label="Team"
          seasons={teamOptions}
          activeSeasonId={rosterTeamId}
          onSelect={setRosterTeamId}
          disabled={teams.length <= 1}
        />
      ) : null}

      {rosterQuery.isLoading ? (
        <ActivityIndicator color={theme.accent} />
      ) : null}

      {!rosterQuery.isLoading && (rosterQuery.data ?? []).length === 0 ? (
        <Text className="text-sm" style={{ color: theme.textSubtle }}>
          No players on the roster yet. Share an invite link to get started.
        </Text>
      ) : null}

      {!rosterQuery.isLoading &&
      (rosterQuery.data ?? []).length > 0 &&
      filteredRoster.length === 0 ? (
        <Text className="text-sm" style={{ color: theme.textSubtle }}>
          {activeRosterTeam
            ? `No players on ${activeRosterTeam.name} yet.`
            : "No players for this team yet."}
        </Text>
      ) : null}

      {filteredRoster.length > 0 ? (
        <View className={isTablet ? "flex-row flex-wrap gap-3" : "gap-6"}>
          {filteredRoster.map((row) => (
            <View
              key={row.id}
              style={isTablet ? { width: "48%" } : undefined}
            >
              <RosterRow
                row={row}
                leagueId={leagueId}
                seasonId={seasonId}
              />
            </View>
          ))}
        </View>
      ) : null}

      <InviteLinkSheet
        visible={inviteOpen}
        onClose={() => setInviteOpen(false)}
        leagueId={leagueId}
        leagueName={leagueName}
        seasonId={seasonId}
        teams={teams}
        initialTeamId={rosterTeamId}
      />
    </View>
  );
}

function RosterRow({
  row,
  leagueId,
  seasonId,
}: {
  row: LeagueRosterRow;
  leagueId: number;
  seasonId: number;
}) {
  const theme = useTheme();
  const [editOpen, setEditOpen] = useState(false);
  const updateMutation = useUpdateLeaguePlayer(leagueId, seasonId);
  const removeMutation = useRemoveLeaguePlayer(leagueId, seasonId);
  const [jersey, setJersey] = useState(row.jerseyNumber ?? "");
  const [position, setPosition] = useState(row.position);
  const [isCaptain, setIsCaptain] = useState(row.isCaptain);

  const handleRemove = () => {
    if (removeMutation.isPending) return;
    Alert.alert(
      "Remove player",
      `Remove ${row.player.name} from the roster?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void removeMutation.mutateAsync(row.id).catch((error) => {
              showThrownAsToast(error, "Could not remove player");
            });
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    if (updateMutation.isPending) return;
    try {
      await updateMutation.mutateAsync({
        leaguePlayerId: row.id,
        payload: {
          jerseyNumber: jersey.trim() || null,
          position,
          isCaptain,
        },
      });
      setEditOpen(false);
    } catch (error) {
      showThrownAsToast(error, "Could not update player");
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setEditOpen(true)}
        onLongPress={handleRemove}
        className="flex-row items-center gap-3 rounded-xl border px-4 py-3 active:opacity-85"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text style={{ color: theme.text }}>
              {row.player.name}
            </Text>
            {row.isCaptain ? (
              <Text className="text-xs" style={{ color: theme.accent }}>
                Captain
              </Text>
            ) : null}
          </View>
          <Text className="text-xs" style={{ color: theme.textSubtle }}>
            {[
              row.jerseyNumber ? `#${row.jerseyNumber}` : null,
              row.position ?? null,
              row.status,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} />
      </Pressable>

      <BottomSheetModal
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit roster row"
        subtitle={row.player.name}
      >
        <View className="gap-4">
          <AuthTextField
            label="Jersey number"
            value={jersey}
            onChangeText={setJersey}
            keyboardType="number-pad"
          />
          <View className="gap-2">
            <Text
              className="text-xs uppercase tracking-wide"
              style={{ color: theme.textSubtle }}
            >
              Position
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {Object.values(RosterPosition).map((pos) => {
                const active = position === pos;
                return (
                  <Pressable
                    key={pos}
                    onPress={() => setPosition(pos)}
                    className={[
                      "rounded-full border px-3 py-2 capitalize",
                    ].join(" ")}
                    style={{
                      backgroundColor: active ? theme.brandMuted : theme.cardMuted,
                      borderColor: active ? theme.brand : theme.cardBorder,
                    }}
                  >
                    <Text style={{ color: active ? theme.brand : theme.text }}>
                      {pos}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Pressable
            onPress={() => setIsCaptain((value) => !value)}
            className="flex-row items-center justify-between rounded-xl border px-4 py-3"
            style={{ backgroundColor: theme.cardMuted, borderColor: theme.cardBorder }}
          >
            <Text style={{ color: theme.text }}>Team captain</Text>
            <Ionicons
              name={isCaptain ? "checkbox" : "square-outline"}
              size={22}
              color={theme.brand}
            />
          </Pressable>
          <Button
            variant="authPurple"
            label="Save"
            onPress={() => void handleSave()}
            loading={updateMutation.isPending}
            disabled={updateMutation.isPending}
          />
          <Button
            variant="secondary"
            label="Remove from roster"
            onPress={handleRemove}
            loading={removeMutation.isPending}
            disabled={removeMutation.isPending}
          />
        </View>
      </BottomSheetModal>
    </>
  );
}
