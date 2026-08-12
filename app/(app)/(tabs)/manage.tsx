import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  Text,
  View,
  type SectionListData,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import type { ApiTeam } from "@/api/entities";
import { useAuth } from "@/auth";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { colors, scoreboardPattern } from "@/constants";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { InviteLinkSheet } from "@/invite/components/InviteLinkSheet";
import { messageFromThrown, showInfoToast } from "@/lib/show-error-toast";
import {
  ManageAdminTeamRow,
  ManageLeagueRow,
  ManageLoginPrompt,
  promptBiometricGate,
  useLeagueTeams,
  useManagedHub,
  type AdminTeamManaged,
  type OwnedLeague,
} from "@/manage";
import useRefresh from "hooks/useRefresh";

type ManageListItem =
  | { kind: "owned"; league: OwnedLeague }
  | { kind: "admin"; team: AdminTeamManaged };

type ManageSection = {
  key: "owned" | "admin";
  title: string;
  data: ManageListItem[];
};

type InviteTarget = {
  leagueId: number;
  leagueName: string;
  seasonId: number;
  initialTeamId: number | null;
  fallbackTeams: ApiTeam[];
  needsTeamFetch: boolean;
};

export default function ManageScreen() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const query = useManagedHub(Boolean(user));
  const [refreshing, onRefresh] = useRefresh([() => query.refetch()]);
  const [inviteTarget, setInviteTarget] = useState<InviteTarget | null>(null);
  const insets = useSafeAreaInsets();
  const { isTablet, isWideTablet } = useAdaptiveLayout();
  const tabletMaxWidth = isWideTablet ? 1120 : 920;
  const tabletFrameStyle = isTablet
    ? { alignSelf: "center" as const, width: "100%" as const, maxWidth: tabletMaxWidth }
    : undefined;
  const inviteTeamsQuery = useLeagueTeams(
    inviteTarget?.leagueId ?? 0,
    Boolean(inviteTarget?.needsTeamFetch),
  );
  const inviteTeams = inviteTarget?.needsTeamFetch
    ? (inviteTeamsQuery.data ?? [])
    : (inviteTarget?.fallbackTeams ?? []);
  const initialInviteTeamId =
    inviteTarget?.initialTeamId ?? inviteTeams[0]?.id ?? null;
  const sections = useMemo((): ManageSection[] => {
    const owned = query.data?.ownedLeagues ?? [];
    const admin = query.data?.adminTeams ?? [];
    const next: ManageSection[] = [];
    if (owned.length > 0) {
      next.push({
        key: "owned",
        title: "Leagues you run",
        data: owned.map((league) => ({ kind: "owned" as const, league })),
      });
    }
    if (admin.length > 0) {
      next.push({
        key: "admin",
        title: "Teams you manage",
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

  const handleShareOwnedLeague = async (league: OwnedLeague) => {
    const seasonId = league.activeSeason?.id;
    if (seasonId == null) {
      showInfoToast(
        "No active season",
        "Activate a season before creating player invites.",
      );
      return;
    }

    const allowed = await promptBiometricGate();
    if (!allowed) return;

    setInviteTarget({
      leagueId: league.id,
      leagueName: league.name,
      seasonId,
      initialTeamId: null,
      fallbackTeams: [],
      needsTeamFetch: true,
    });
  };

  const bothEmpty =
    (query.data?.ownedLeagues.length ?? 0) === 0 &&
    (query.data?.adminTeams.length ?? 0) === 0;
  const ownedLeagues = query.data?.ownedLeagues ?? [];
  const adminTeams = query.data?.adminTeams ?? [];
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
            <View style={tabletFrameStyle}>
              <Text
                className="text-[28px] text-white"
              >
                Manage
              </Text>
              <Text
                className="pt-1 text-sm leading-6 text-white/60"
              >
                Leagues you run and teams you manage, all in one place.
              </Text>
            </View>
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
          <View className="flex-1 px-5" style={tabletFrameStyle}>
            <ManageErrorState
              message={messageFromThrown(query.error)}
              onRetry={() => query.refetch()}
            />
          </View>
        ) : isTablet ? (
          <ScrollView
            className="flex-1 px-5"
            contentContainerClassName="grow pb-[10rem]"
            contentContainerStyle={{
              paddingBottom: insets.bottom + 90,
              alignItems: "center",
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <View className="w-full gap-5" style={tabletFrameStyle}>
              {!bothEmpty ? (
                <ManageOverview
                  ownedCount={ownedCount}
                  adminCount={adminCount}
                />
              ) : null}

              {bothEmpty ? (
                <ManageEmptyLeagues />
              ) : (
                <View className="flex-row items-start gap-5">
                  <ManageTabletColumn
                    title="Leagues you run"
                    count={ownedLeagues.length}
                  >
                    {ownedLeagues.length > 0 ? (
                      ownedLeagues.map((league) => (
                        <ManageLeagueRow
                          key={league.id}
                          league={league}
                          onPress={() => handleOpenLeague(league.id)}
                          onShare={() => void handleShareOwnedLeague(league)}
                        />
                      ))
                    ) : (
                      <ManageColumnEmptyState
                        icon="trophy-outline"
                        title="No leagues yet"
                        body="Create a league when you are ready to run a competition."
                      />
                    )}
                  </ManageTabletColumn>

                  <ManageTabletColumn
                    title="Teams you manage"
                    count={adminTeams.length}
                  >
                    {adminTeams.length > 0 ? (
                      adminTeams.map((team) => (
                        <ManageAdminTeamRow
                          key={team.id}
                          team={team}
                          onPress={() => handleOpenAdminTeam(team)}
                        />
                      ))
                    ) : (
                      <ManageColumnEmptyState
                        icon="shield-checkmark-outline"
                        title="No teams yet"
                        body="Teams will appear here when a league admin adds you as manager."
                      />
                    )}
                  </ManageTabletColumn>
                </View>
              )}
            </View>
          </ScrollView>
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
              <View className="w-full" style={tabletFrameStyle}>
                <ManageSectionHeader title={section.title} count={section.data.length} />
              </View>
            )}
            renderItem={({ item }) =>
              item.kind === "owned" ? (
                <View className="w-full" style={tabletFrameStyle}>
                  <ManageLeagueRow
                    league={item.league}
                    onPress={() => handleOpenLeague(item.league.id)}
                    onShare={() => void handleShareOwnedLeague(item.league)}
                  />
                </View>
              ) : (
                <View className="w-full" style={tabletFrameStyle}>
                  <ManageAdminTeamRow
                    team={item.team}
                    onPress={() => handleOpenAdminTeam(item.team)}
                  />
                </View>
              )
            }
            ItemSeparatorComponent={() => <View className="h-3" />}
            SectionSeparatorComponent={() => <View className="h-4" />}
            ListEmptyComponent={
              bothEmpty
                ? () => (
                    <View className="w-full" style={tabletFrameStyle}>
                      <ManageEmptyLeagues />
                    </View>
                  )
                : null
            }
            ListHeaderComponent={
              !bothEmpty ? (
                <View className="w-full" style={tabletFrameStyle}>
                  <ManageOverview ownedCount={ownedCount} adminCount={adminCount} />
                </View>
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
            contentContainerStyle={{
              paddingBottom: insets.bottom + 90,
              ...(isTablet ? { alignItems: "center" as const } : null),
            }}
          />
        )}
        {inviteTarget ? (
          inviteTarget.needsTeamFetch && inviteTeamsQuery.isLoading ? (
            <InviteTeamsLoadingSheet
              visible
              onClose={() => setInviteTarget(null)}
            />
          ) : inviteTarget.needsTeamFetch && inviteTeamsQuery.isError ? (
            <InviteTeamsErrorSheet
              visible
              onClose={() => setInviteTarget(null)}
              onRetry={() => void inviteTeamsQuery.refetch()}
              message={messageFromThrown(inviteTeamsQuery.error)}
            />
          ) : (
            <InviteLinkSheet
              visible
              onClose={() => setInviteTarget(null)}
              leagueId={inviteTarget.leagueId}
              leagueName={inviteTarget.leagueName}
              seasonId={inviteTarget.seasonId}
              teams={inviteTeams}
              initialTeamId={initialInviteTeamId}
            />
          )
        ) : null}
      </SafeAreaView>
    </View>
  );
}

function InviteTeamsErrorSheet({
  visible,
  onClose,
  onRetry,
  message,
}: {
  visible: boolean;
  onClose: () => void;
  onRetry: () => void;
  message: string;
}) {
  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Invite to team"
      subtitle="Teams could not be loaded for this league."
      variant="dark"
    >
      <View className="gap-4 py-2">
        <View className="flex-row items-start gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <Ionicons name="warning-outline" size={18} color={colors.accent} />
          <Text className="min-w-0 flex-1 text-sm leading-6 text-white/60">
            {message}
          </Text>
        </View>
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry loading teams"
          className="h-12 flex-row items-center justify-center gap-2 rounded-full border border-accent-400 bg-accent-500 px-4 active:opacity-90"
        >
          <Ionicons name="refresh-outline" size={17} color={colors.darkLabel} />
          <Text className="text-sm text-neutral-950">
            Retry
          </Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

function InviteTeamsLoadingSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Invite to team"
      subtitle="Loading teams for this league."
      variant="dark"
    >
      <View className="items-center gap-3 py-6">
        <ActivityIndicator color={colors.accent} />
        <Text className="text-sm text-white/55">
          Getting teams ready...
        </Text>
      </View>
    </BottomSheetModal>
  );
}

function ManageOverview({
  ownedCount,
  adminCount,
}: {
  ownedCount: number;
  adminCount: number;
}) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <View className="gap-3 pb-5">
      <View className="flex-row gap-3">
        <ManageCountCard
          icon="trophy-outline"
          label="League admin"
          value={ownedCount}
        />
        <ManageCountCard
          icon="shield-checkmark-outline"
          label="Team manager"
          value={adminCount}
        />
      </View>
      <ManageHelpDropdown
        expanded={helpOpen}
        onToggle={() => setHelpOpen((prev) => !prev)}
      />
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
          className="text-2xl text-white"
        >
          {value}
        </Text>
      </View>
      <Text
        className="pt-3 text-[11px] uppercase tracking-wide text-white/50"
      >
        {label}
      </Text>
    </View>
  );
}

function ManageHelpDropdown({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04]">
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={
          expanded
            ? "Hide league setup guide"
            : "Show league setup guide"
        }
        className="flex-row items-center gap-3 px-4 py-4 active:bg-white/5"
      >
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-accent-500/15">
          <Ionicons name="help-buoy-outline" size={19} color={colors.accent} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-white">
            How to run your league
          </Text>
          <Text
            className="pt-1 text-xs leading-5 text-white/50"
            numberOfLines={2}
          >
            Setup steps and role permissions, tucked away when you do not need them.
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="rgba(255,255,255,0.65)"
        />
      </Pressable>

      {expanded ? (
        <View className="gap-3 border-t border-white/10 px-3 pb-3 pt-3">
          <LeagueRunbookCard />
          <RoleGuideCard />
        </View>
      ) : null}
    </View>
  );
}

const runbookSteps: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
}[] = [
  {
    icon: "people-outline",
    title: "Add teams",
    detail: "Create teams first so fixtures, standings, and invites have a home.",
  },
  {
    icon: "person-add-outline",
    title: "Invite players",
    detail: "Share a team invite code. Codes expire after 7 days.",
  },
  {
    icon: "location-outline",
    title: "Add venues",
    detail: "Save common pitches before scheduling games.",
  },
  {
    icon: "calendar-outline",
    title: "Schedule games",
    detail: "Add fixtures, then use Match Center on game day.",
  },
  {
    icon: "star-outline",
    title: "Choose MOTM",
    detail: "After lineups are in, pick man of the match from Match Center.",
  },
  {
    icon: "podium-outline",
    title: "Review standings",
    detail: "Check tables, zones, and tied cohorts after results are saved.",
  },
];

function LeagueRunbookCard() {
  return (
    <View className="gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-accent-500/15">
          <Ionicons name="clipboard-outline" size={19} color={colors.accent} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-white">
            League setup runbook
          </Text>
          <Text className="pt-1 text-xs leading-5 text-white/50">
            The fastest path from setup to match day.
          </Text>
        </View>
      </View>

      <View className="gap-2">
        {runbookSteps.map((step, index) => (
          <View
            key={step.title}
            className="flex-row items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3"
          >
            <View className="h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <Ionicons name={step.icon} size={16} color={colors.accent} />
            </View>
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-white/35">
                  {index + 1}
                </Text>
                <Text className="min-w-0 flex-1 text-sm text-white" numberOfLines={1}>
                  {step.title}
                </Text>
              </View>
              <Text className="pt-1 text-xs leading-5 text-white/50">
                {step.detail}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function RoleGuideCard() {
  return (
    <View className="gap-3 rounded-[24px] border border-accent-400/20 bg-accent-500/10 px-4 py-4">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-accent-500">
          <Ionicons name="key-outline" size={19} color={colors.darkLabel} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-accent-100">
            Who can do what
          </Text>
          <Text className="pt-1 text-xs leading-5 text-accent-100/70">
            SportyKore shows controls based on your role.
          </Text>
        </View>
      </View>
      <RoleGuideRow
        icon="trophy-outline"
        title="League admin"
        detail="Can manage teams, players, games, venues, standings, invites, and match-day controls."
      />
      <RoleGuideRow
        icon="shield-checkmark-outline"
        title="Team manager"
        detail="Can set lineups for their team. League controls stay hidden."
      />
    </View>
  );
}

function RoleGuideRow({
  icon,
  title,
  detail,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
}) {
  return (
    <View className="flex-row items-start gap-3 rounded-2xl border border-accent-400/20 bg-black/15 px-3 py-3">
      <Ionicons name={icon} size={17} color={colors.accent} />
      <View className="min-w-0 flex-1">
        <Text className="text-sm text-accent-100">
          {title}
        </Text>
        <Text className="pt-1 text-xs leading-5 text-accent-100/65">
          {detail}
        </Text>
      </View>
    </View>
  );
}

function ManageSectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View className="flex-row items-center justify-between pb-3 pt-2">
      <Text
        className="text-xs uppercase tracking-[2px] text-white/45"
      >
        {title}
      </Text>
      <View className="rounded-full bg-white/8 px-2.5 py-1">
        <Text
          className="text-[11px] text-white/60"
        >
          {count}
        </Text>
      </View>
    </View>
  );
}

function ManageTabletColumn({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <View className="min-w-0 flex-1 gap-3">
      <ManageSectionHeader title={title} count={count} />
      <View className="gap-3">
        {children}
      </View>
    </View>
  );
}

function ManageColumnEmptyState({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View className="rounded-[22px] border border-dashed border-white/15 bg-white/[0.04] px-4 py-6">
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-accent-500/15">
        <Ionicons name={icon} size={20} color={colors.accent} />
      </View>
      <Text className="pt-4 text-sm text-white">
        {title}
      </Text>
      <Text className="pt-2 text-xs leading-5 text-white/50">
        {body}
      </Text>
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
        className="pt-5 text-center text-lg text-white"
      >
        Nothing to manage yet
      </Text>
      <Text
        className="pt-2 text-center text-sm leading-6 text-white/55"
      >
        Create a league from the Create tab, or wait for a league admin to add
        you as a team manager.
      </Text>
      <Pressable
        onPress={() => router.push("/create")}
        accessibilityRole="button"
        accessibilityLabel="Create league"
        className="mt-6 flex-row items-center justify-center gap-2 rounded-full border border-accent-400 bg-accent-500 px-5 py-3 active:opacity-90"
      >
        <Ionicons name="add" size={17} color={colors.darkLabel} />
        <Text
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
          className="text-sm text-neutral-950"
        >
          Retry
        </Text>
      </Pressable>
    </View>
  );
}
