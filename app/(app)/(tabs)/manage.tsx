import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  Text,
  View,
  type SectionListData,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { ErrorState } from "@/components/ui/error-state";
import { colors, scoreboardPattern } from "@/constants";
import { messageFromThrown } from "@/lib/show-error-toast";
import {
  ManageAdminTeamRow,
  ManageLeagueRow,
  ManageLoginPrompt,
  promptBiometricGate,
  useManagedHub,
  type AdminTeamManaged,
  type OwnedLeague,
} from "@/manage";
import { fonts } from "@/theme/fonts";
import useRefresh from "hooks/useRefresh";

type ManageListItem =
  | { kind: "owned"; league: OwnedLeague }
  | { kind: "admin"; team: AdminTeamManaged };

type ManageSection = {
  key: "owned" | "admin";
  title: string;
  data: ManageListItem[];
};

export default function ManageScreen() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const query = useManagedHub(Boolean(user));
  const [refreshing, onRefresh] = useRefresh([() => query.refetch()]);

  const sections = useMemo((): ManageSection[] => {
    const owned = query.data?.ownedLeagues ?? [];
    const admin = query.data?.adminTeams ?? [];
    const next: ManageSection[] = [];
    if (owned.length > 0) {
      next.push({
        key: "owned",
        title: "Leagues you own",
        data: owned.map((league) => ({ kind: "owned" as const, league })),
      });
    }
    if (admin.length > 0) {
      next.push({
        key: "admin",
        title: "Teams you admin",
        data: admin.map((team) => ({ kind: "admin" as const, team })),
      });
    }
    return next;
  }, [query.data]);

  const handleOpenLeague = async (leagueId: number) => {
    const allowed = await promptBiometricGate();
    if (!allowed) return;
    router.push(`/manage/${leagueId}`);
  };

  const handleOpenAdminTeam = async (team: AdminTeamManaged) => {
    const allowed = await promptBiometricGate();
    if (!allowed) return;
    const seasonId = team.activeSeason?.id;
    if (seasonId != null) {
      router.push(
        `/manage/${team.league.id}/team/${team.id}?seasonId=${seasonId}`,
      );
    } else {
      router.push(`/manage/${team.league.id}/team/${team.id}`);
    }
  };

  const bothEmpty =
    (query.data?.ownedLeagues.length ?? 0) === 0 &&
    (query.data?.adminTeams.length ?? 0) === 0;

  return (
    <View className="flex-1 bg-[#121212]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <BlackPatternBackground
          baseColor={scoreboardPattern().baseColor}
          stripeColor={scoreboardPattern().stripeColor}
        />

        <View className="px-5 pb-4 pt-2">
          {/* <Logo variant="full" color={colors.accent} fontSize={28} lineHeight={38} /> */}
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className="pt-3 text-[26px] text-white"
          >
            Manage
          </Text>
          <Text
            style={{ fontFamily: fonts.body }}
            className="pt-1 text-sm text-white/60"
          >
            Leagues you own and teams you admin — run match day and set lineups.
          </Text>
        </View>

        {!hydrated ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : !user ? (
          <ManageLoginPrompt />
        ) : query.isLoading && !query.data ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : query.isError ? (
          <View className="flex-1 px-5">
            <ErrorState
              message={messageFromThrown(query.error)}
              onRetry={() => query.refetch()}
            />
          </View>
        ) : (
          <SectionList
            className="flex-1 px-5"
            sections={sections as SectionListData<ManageListItem, ManageSection>[]}
            keyExtractor={(item) =>
              item.kind === "owned"
                ? `owned-${item.league.id}`
                : `admin-${item.team.id}`
            }
            renderSectionHeader={({ section }) => (
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="pb-3 pt-2 text-xs uppercase tracking-[2px] text-white/45"
              >
                {section.title}
              </Text>
            )}
            renderItem={({ item }) =>
              item.kind === "owned" ? (
                <ManageLeagueRow
                  league={item.league}
                  onPress={() => handleOpenLeague(item.league.id)}
                />
              ) : (
                <ManageAdminTeamRow
                  team={item.team}
                  onPress={() => handleOpenAdminTeam(item.team)}
                />
              )
            }
            ItemSeparatorComponent={() => <View className="h-3" />}
            SectionSeparatorComponent={() => <View className="h-4" />}
            ListEmptyComponent={bothEmpty ? ManageEmptyLeagues : null}
            contentContainerClassName="pb-[10rem] grow"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
              />
            }
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function ManageEmptyLeagues() {
  return (
    <View className="items-center rounded-[24px] border border-white/10 bg-white/5 px-6 py-10">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-center text-lg text-white"
      >
        Nothing to manage yet
      </Text>
      <Text
        style={{ fontFamily: fonts.body }}
        className="pt-2 text-center text-sm leading-6 text-white/55"
      >
        Create a league from the Create tab, or wait for a league owner to assign
        you as a team admin.
      </Text>
    </View>
  );
}
