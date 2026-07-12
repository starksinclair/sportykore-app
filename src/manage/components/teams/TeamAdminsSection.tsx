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
import { useSearchLeagueUsers } from "@/invite/hooks";
import { fonts } from "@/theme/fonts";

import {
  useAssignTeamAdmin,
  useLeagueTeams,
  useRemoveTeamAdmin,
} from "../../hooks";

type Props = {
  leagueId: number;
  teamId: number;
};

export function TeamAdminsSection({ leagueId, teamId }: Props) {
  const teamsQuery = useLeagueTeams(leagueId);
  const assignMutation = useAssignTeamAdmin(leagueId);
  const removeMutation = useRemoveTeamAdmin(leagueId);
  const [searchQuery, setSearchQuery] = useState("");

  const team = useMemo(
    () => teamsQuery.data?.find((entry) => entry.id === teamId),
    [teamsQuery.data, teamId],
  );

  const admins = team?.admins ?? [];
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
    <View className="gap-4 border-t border-white/10 pt-5">
      <View className="gap-1">
        <Text style={{ fontFamily: fonts.bodyBold }} className="text-base text-white">
          Team admins
        </Text>
        <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
          Admins can manage lineups and match day for this team.
        </Text>
      </View>

      {teamsQuery.isLoading && !team ? (
        <View className="items-center py-4">
          <ActivityIndicator color="#E6A817" />
        </View>
      ) : admins.length === 0 ? (
        <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
          No team admins assigned yet.
        </Text>
      ) : (
        <View className="gap-2">
          {admins.map((admin) => {
            const label = admin?.user?.fullName?.trim() || admin?.user?.email;
            return (
              <View
                key={admin.id}
                className="flex-row items-center gap-3 rounded-xl bg-white/6 px-3 py-3"
              >
                <View className="flex-1">
                  <Text
                    style={{ fontFamily: fonts.bodySemibold }}
                    className="text-sm text-white"
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                  {admin?.user?.fullName ? (
                    <Text
                      style={{ fontFamily: fonts.body }}
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
                  className="h-10 w-10 items-center justify-center rounded-xl bg-white/10 active:bg-white/15"
                >
                  <Ionicons name="trash-outline" size={18} color="#fca5a5" />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <View className="gap-3">
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-[11px] uppercase tracking-wider text-white/45"
        >
          Assign team admin
        </Text>

        <AuthTextField
          label="Search users"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Email or name (min 2 characters)"
          autoCapitalize="none"
          autoCorrect={false}
          containerClassName="[&_input]:text-neutral-900"
        />

        {searchEnabled && searchQueryResult.isLoading ? (
          <View className="items-center py-3">
            <ActivityIndicator color="#E6A817" />
          </View>
        ) : null}

        {searchEnabled && !searchQueryResult.isLoading && searchResults.length === 0 ? (
          <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
            No users found. Try another search.
          </Text>
        ) : null}

        {searchResults.map((user) => {
          const label = user?.fullName?.trim() || user?.email;
          return (
            <Pressable
              key={user.id}
              onPress={() => void handleAssign(user.id)}
              disabled={isBusy}
              className="flex-row items-center justify-between rounded-xl bg-white/8 px-4 py-3 active:bg-white/12"
            >
              <View className="flex-1 pr-3">
                <Text
                  style={{ fontFamily: fonts.bodySemibold }}
                  className="text-sm text-white"
                  numberOfLines={1}
                >
                  {label}
                </Text>
                {user?.fullName ? (
                  <Text
                    style={{ fontFamily: fonts.body }}
                    className="text-xs text-white/45"
                    numberOfLines={1}
                  >
                    {user?.email}
                  </Text>
                ) : null}
              </View>
              <View className="flex-row items-center gap-1">
                <Text style={{ fontFamily: fonts.bodyBold }} className="text-xs text-accent-300">
                  Assign
                </Text>
                <Ionicons name="add-circle" size={20} color="#E6A817" />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
