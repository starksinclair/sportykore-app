import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";

import { useTheme } from "@/color/use-theme";
import { AuthTextField } from "@/components/ui/auth-text-field";
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
  const theme = useTheme();
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
      "Remove team manager",
      `Remove ${label} as manager for this team?`,
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
    <View
      className="gap-4 rounded-[18px] border px-3 py-3"
      style={{ backgroundColor: theme.cardMuted, borderColor: theme.cardBorder }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: theme.accentMuted }}
        >
          <Ionicons name="people-outline" size={20} color={theme.accent} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-base" style={{ color: theme.text }}>
            Team managers
          </Text>
          <Text className="text-sm leading-5" style={{ color: theme.textSubtle }}>
            Team managers can set lineups for this team.
          </Text>
        </View>
      </View>

      {teamsQuery.isLoading && !team ? (
        <View
          className="items-center rounded-2xl border py-4"
          style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
        >
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : admins.length === 0 ? (
        <View
          className="rounded-2xl border px-3 py-3"
          style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
        >
          <Text className="text-sm" style={{ color: theme.textSubtle }}>
            No team managers assigned yet.
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {admins.map((admin) => {
            const label = admin?.user?.fullName?.trim() || admin?.user?.email;
            return (
              <View
                key={admin.id}
                className="flex-row items-center gap-3 rounded-2xl border px-3 py-3"
                style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
              >
                <View
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: theme.accentMuted }}
                >
                  <Ionicons name="person-outline" size={16} color={theme.accent} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm"
                    style={{ color: theme.text }}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                  {admin?.user?.fullName ? (
                    <Text
                      className="text-xs"
                      style={{ color: theme.textSubtle }}
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
                  className="h-9 w-9 items-center justify-center rounded-full active:opacity-85"
                  style={{ backgroundColor: theme.cardMuted }}
                >
                  <Ionicons name="trash-outline" size={17} color={theme.textMuted} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <View
        className="gap-3 rounded-2xl border px-3 py-3"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        <View className="flex-row items-center gap-2">
          <Ionicons name="person-add-outline" size={16} color={theme.accent} />
          <Text
            className="text-xs uppercase tracking-wide"
            style={{ color: theme.textMuted }}
          >
            Assign team manager
          </Text>
        </View>

        <AuthTextField
          label="Search users"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Email or name (min 2 characters)"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {searchEnabled && searchQueryResult.isLoading ? (
          <View className="items-center py-3">
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : null}

        {searchEnabled && !searchQueryResult.isLoading && searchResults.length === 0 ? (
          <View
            className="rounded-2xl border px-3 py-3"
            style={{ backgroundColor: theme.cardMuted, borderColor: theme.cardBorder }}
          >
            <Text className="text-sm" style={{ color: theme.textSubtle }}>
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
              className="flex-row items-center justify-between rounded-2xl border px-3 py-3 active:opacity-85"
              style={{ backgroundColor: theme.cardMuted, borderColor: theme.cardBorder }}
            >
              <View className="flex-1 flex-row items-center gap-3 pr-3">
                <View
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: theme.accentMuted }}
                >
                  <Ionicons name="person-outline" size={16} color={theme.accent} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm"
                    style={{ color: theme.text }}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                  {user?.fullName ? (
                    <Text
                      className="text-xs"
                      style={{ color: theme.textSubtle }}
                      numberOfLines={1}
                    >
                      {user?.email}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View
                className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{ backgroundColor: theme.accent }}
              >
                <Text className="text-xs" style={{ color: theme.textInverse }}>
                  Assign
                </Text>
                <Ionicons name="add" size={15} color={theme.textInverse} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
