import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import type { ApiTeam } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { SeasonPicker } from "@/components/ui/season-picker";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { InviteLinkSheet } from "@/invite/components/InviteLinkSheet";
import { showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

import {
  useRemoveLeaguePlayer,
  useSeasonRoster,
  useUpdateLeaguePlayer,
} from "../../hooks";
import type { LeagueRosterRow } from "../../types";
import { RosterPosition } from "../../types";

type Props = {
  leagueId: number;
  leagueName: string;
  seasonId: number;
  teams: ApiTeam[];
};

export function ManagePlayersTab({ leagueId, leagueName, seasonId, teams }: Props) {
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
      <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
        Invite players to your season roster. They will create their own profile
        when accepting the link.
      </Text>

      <Button
        variant="authPurple"
        label="Invite to team"
        onPress={() => setInviteOpen(true)}
        className="h-11"
      />

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
        <ActivityIndicator color="#E6A817" />
      ) : null}

      {!rosterQuery.isLoading && (rosterQuery.data ?? []).length === 0 ? (
        <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
          No players on the roster yet. Share an invite link to get started.
        </Text>
      ) : null}

      {!rosterQuery.isLoading &&
      (rosterQuery.data ?? []).length > 0 &&
      filteredRoster.length === 0 ? (
        <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
          {activeRosterTeam
            ? `No players on ${activeRosterTeam.name} yet.`
            : "No players for this team yet."}
        </Text>
      ) : null}

      {filteredRoster.map((row) => (
        <RosterRow
          key={row.id}
          row={row}
          leagueId={leagueId}
          seasonId={seasonId}
        />
      ))}

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
  const [editOpen, setEditOpen] = useState(false);
  const updateMutation = useUpdateLeaguePlayer(leagueId, seasonId);
  const removeMutation = useRemoveLeaguePlayer(leagueId, seasonId);
  const [jersey, setJersey] = useState(row.jerseyNumber ?? "");
  const [position, setPosition] = useState(row.position);
  const [isCaptain, setIsCaptain] = useState(row.isCaptain);

  const handleRemove = () => {
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
        className="flex-row items-center gap-3 rounded-xl bg-white/6 px-4 py-3"
      >
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text style={{ fontFamily: fonts.bodyBold }} className="text-white">
              {row.player.name}
            </Text>
            {row.isCaptain ? (
              <Text style={{ fontFamily: fonts.body }} className="text-xs text-accent-400">
                Captain
              </Text>
            ) : null}
          </View>
          <Text style={{ fontFamily: fonts.body }} className="text-xs text-white/55">
            {[
              row.jerseyNumber ? `#${row.jerseyNumber}` : null,
              row.position ?? null,
              row.status,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.45)" />
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
              style={{ fontFamily: fonts.bodyBold }}
              className="text-xs uppercase tracking-wide text-slate-500"
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
                      active
                        ? "border-brand-500 bg-brand-50"
                        : "border-neutral-200",
                    ].join(" ")}
                  >
                    <Text style={{ fontFamily: fonts.bodySemibold }}>{pos}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Pressable
            onPress={() => setIsCaptain((value) => !value)}
            className="flex-row items-center justify-between rounded-xl border border-neutral-200 px-4 py-3"
          >
            <Text style={{ fontFamily: fonts.bodyBold }}>Team captain</Text>
            <Ionicons
              name={isCaptain ? "checkbox" : "square-outline"}
              size={22}
              color="#4A148C"
            />
          </Pressable>
          <Button
            variant="authPurple"
            label="Save"
            onPress={() => void handleSave()}
            loading={updateMutation.isPending}
          />
          <Button
            variant="secondary"
            label="Remove from roster"
            onPress={handleRemove}
          />
        </View>
      </BottomSheetModal>
    </>
  );
}
