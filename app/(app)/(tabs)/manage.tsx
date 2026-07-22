import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  View,
  type SectionListData,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
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
  const ownedCount = query.data?.ownedLeagues.length ?? 0;
  const adminCount = query.data?.adminTeams.length ?? 0;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.scoreboardBlack }}>
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <BlackPatternBackground
          baseColor={scoreboardPattern().baseColor}
          stripeColor={scoreboardPattern().stripeColor}
        />

        <View className="px-5 pb-5 pt-2">
          <View className="">
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-[28px] text-white"
            >
              Manage
            </Text>
            <Text
              style={{ fontFamily: fonts.body }}
              className="pt-1 text-sm leading-6 text-white/60"
            >
              Leagues you own and teams you admin, all in one place.
            </Text>
          </View>
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
            <ManageErrorState
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
              <ManageSectionHeader title={section.title} count={section.data.length} />
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
            ListHeaderComponent={
              !bothEmpty ? (
                <ManageOverview ownedCount={ownedCount} adminCount={adminCount} />
              ) : null
            }
            contentContainerClassName="grow pb-[10rem]"
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

function ManageOverview({
  ownedCount,
  adminCount,
}: {
  ownedCount: number;
  adminCount: number;
}) {
  return (
    <View className="gap-3 pb-5">
      <View className="flex-row gap-3">
        <ManageCountCard
          icon="trophy-outline"
          label="Owned"
          value={ownedCount}
        />
        <ManageCountCard
          icon="shield-checkmark-outline"
          label="Admin"
          value={adminCount}
        />
      </View>
    </View>
  );
}

function ManageCountCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
}) {
  return (
    <View className="flex-1 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
      <View className="flex-row items-center justify-between">
        <View className="h-9 w-9 items-center justify-center rounded-2xl bg-accent-500/15">
          <Ionicons name={icon} size={18} color={colors.accent} />
        </View>
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-2xl text-white"
        >
          {value}
        </Text>
      </View>
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="pt-3 text-[11px] uppercase tracking-wide text-white/50"
      >
        {label}
      </Text>
    </View>
  );
}

function ManageSectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View className="flex-row items-center justify-between pb-3 pt-2">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-xs uppercase tracking-[2px] text-white/45"
      >
        {title}
      </Text>
      <View className="rounded-full bg-white/8 px-2.5 py-1">
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-[11px] text-white/60"
        >
          {count}
        </Text>
      </View>
    </View>
  );
}

function ManageEmptyLeagues() {
  const router = useRouter();

  return (
    <View className="items-center rounded-[24px] border border-white/10 bg-white/[0.04] px-6 py-10">
      <View className="h-16 w-16 items-center justify-center rounded-[22px] bg-accent-500/15">
        <Ionicons name="briefcase-outline" size={28} color={colors.accent} />
      </View>
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="pt-5 text-center text-lg text-white"
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
      <Pressable
        onPress={() => router.push("/create")}
        accessibilityRole="button"
        accessibilityLabel="Create league"
        className="mt-6 flex-row items-center justify-center gap-2 rounded-full border border-accent-400 bg-accent-500 px-5 py-3 active:opacity-90"
      >
        <Ionicons name="add" size={17} color={colors.darkLabel} />
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-sm text-neutral-950"
        >
          Create league
        </Text>
      </Pressable>
    </View>
  );
}

function ManageErrorState({
  onRetry,
  message,
}: {
  onRetry: () => void;
  message: string;
}) {
  return (
    <View className="items-center rounded-[24px] border border-white/10 bg-white/[0.04] px-6 py-10">
      <View className="h-16 w-16 items-center justify-center rounded-[22px] bg-accent-500/15">
        <Ionicons name="warning-outline" size={28} color={colors.accent} />
      </View>
      <Text
        style={{ fontFamily: fonts.bodySemibold }}
        className="pt-5 text-center text-sm leading-6 text-white/65"
      >
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry"
        className="mt-6 flex-row items-center justify-center gap-2 rounded-full border border-accent-400 bg-accent-500 px-5 py-3 active:opacity-90"
      >
        <Ionicons name="refresh-outline" size={17} color={colors.darkLabel} />
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-sm text-neutral-950"
        >
          Retry
        </Text>
      </Pressable>
    </View>
  );
}
