import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";

import { AuthTextField } from "@/components/ui/auth-text-field";
import { colors } from "@/constants";
import { useSearchLeagueUsers } from "@/invite/hooks";

import {
  useAssignTeamAdmin,
  useLeagueTeams,
  useRemoveTeamAdmin,
} from "../../hooks";
import type { TeamAdmin } from "../../types";

type Props = {
  leagueId: number;
  teamId: number;
};

const EMPTY_ADMINS: TeamAdmin[] = [];

export function TeamAdminsSection({ leagueId, teamId }: Props) {
  const teamsQuery = useLeagueTeams(leagueId);
  const assignMutation = useAssignTeamAdmin(leagueId);
  const removeMutation = useRemoveTeamAdmin(leagueId);
  const [searchQuery, setSearchQuery] = useState("");

  const team = useMemo(
    () => teamsQuery.data?.find((entry) => entry.id === teamId),
    [teamsQuery.data, teamId],
  );

  const admins = team?.admins ?? EMPTY_ADMINS;
  const assignedUserIds = useMemo(
    () => new Set(admins.map((admin) => admin.userId)),
    [admins],
  );

  const trimmedQuery = searchQuery.trim();
  const searchEnabled = trimmedQuery.length >= 2;
  const searchQueryResult = useSearchLeagueUsers(
    leagueId,
    trimmedQuery,
    searchEnabled,
  );

  const searchResults = useMemo(() => {
    const hits = searchQueryResult.data ?? [];
    return hits.filter((user) => !assignedUserIds.has(user.id));
  }, [searchQueryResult.data, assignedUserIds]);

  const handleAssign = async (userId: number) => {
    try {
      await assignMutation.mutateAsync({ teamId, userId });
      setSearchQuery("");
    } catch {
      // Toast handled in mutation onError.
    }
  };

  const handleRemove = (userId: number, label: string) => {
    Alert.alert(
      "Remove team admin",
      `Remove ${label} as admin for this team?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMutation.mutateAsync({ teamId, userId });
            } catch {
              // Toast handled in mutation onError.
            }
          },
        },
      ],
    );
  };

  const isBusy = assignMutation.isPending || removeMutation.isPending;

  return (
    <View className="gap-4 rounded-[18px] border border-white/10 bg-white/[0.03] px-3 py-3">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-accent-500/15">
          <Ionicons name="people-outline" size={20} color={colors.accent} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-base text-white">
            Team admins
          </Text>
          <Text className="text-sm leading-5 text-white/55">
            Admins can manage lineups and match day for this team.
          </Text>
        </View>
      </View>

      {teamsQuery.isLoading && !team ? (
        <View className="items-center rounded-2xl border border-white/10 bg-white/5 py-4">
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : admins.length === 0 ? (
        <View className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <Text className="text-sm text-white/50">
            No team admins assigned yet.
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {admins.map((admin) => {
            const label = admin?.user?.fullName?.trim() || admin?.user?.email;
            return (
              <View
                key={admin.id}
                className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
              >
                <View className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <Ionicons name="person-outline" size={16} color={colors.white} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm text-white"
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                  {admin?.user?.fullName ? (
                    <Text
                      className="text-xs text-white/45"
                      numberOfLines={1}
                    >
                      {admin?.user?.email}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => handleRemove(admin.userId, label)}
                  disabled={isBusy}
                  accessibilityLabel={`Remove ${label}`}
                  className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:bg-white/15"
                >
                  <Ionicons name="trash-outline" size={17} color={colors.white} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <View className="gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
        <View className="flex-row items-center gap-2">
          <Ionicons name="person-add-outline" size={16} color={colors.accent} />
          <Text
            className="text-xs uppercase tracking-wide text-white/50"
          >
            Assign team admin
          </Text>
        </View>

        <AuthTextField
          label="Search users"
          labelClassName="text-white/60"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Email or name (min 2 characters)"
          autoCapitalize="none"
          autoCorrect={false}
          containerClassName="[&_input]:text-neutral-900"
        />

        {searchEnabled && searchQueryResult.isLoading ? (
          <View className="items-center py-3">
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : null}

        {searchEnabled && !searchQueryResult.isLoading && searchResults.length === 0 ? (
          <View className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
            <Text className="text-sm text-white/50">
              No users found. Try another search.
            </Text>
          </View>
        ) : null}

        {searchResults.map((user) => {
          const label = user?.fullName?.trim() || user?.email;
          return (
            <Pressable
              key={user.id}
              onPress={() => void handleAssign(user.id)}
              disabled={isBusy}
              className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 active:bg-white/10"
            >
              <View className="flex-1 flex-row items-center gap-3 pr-3">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <Ionicons name="person-outline" size={16} color={colors.white} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm text-white"
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                  {user?.fullName ? (
                    <Text
                      className="text-xs text-white/45"
                      numberOfLines={1}
                    >
                      {user?.email}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View className="flex-row items-center gap-1.5 rounded-full bg-accent-500 px-3 py-1.5">
                <Text className="text-xs text-neutral-950">
                  Assign
                </Text>
                <Ionicons name="add" size={15} color={colors.darkLabel} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
