import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "@/api/errors";
import { useAuth } from "@/auth";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { ErrorState } from "@/components/ui/error-state";
import { Logo } from "@/components/ui/logo";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { PulsingDot } from "@/components/ui/pulsing-dot";
import { calendar, colors, scoreboardPattern } from "@/constants";
import { fetchLeagues, resolveLeaguesParams } from "@/home/api/leagues";
import {
  CountryAccordion,
  EmptyState,
  FavoriteLeagueCard,
  LeagueDirectoryRow,
} from "@/home/components";
import { SegmentButton } from "@/home/components/SegmentButton";
import { homeKeys, useLeaguesByCountry } from "@/home/hooks";
import {
  partitionMatchesFeed,
  type FavoriteLeagueEntry,
} from "@/home/partitionMatchesFeed";
import type { ApiCountryWithLeagues } from "@/home/types";
import {
  addDays,
  addMonths,
  buildCalendarCells,
  dayOffset,
  getDateMeta,
  sameDay,
  startOfDay,
  startOfMonth,
} from "@/home/utils";
import { acceptInvite } from "@/invite/api";
import {
  clearPendingInviteToken,
  getPendingInviteContext,
  getPendingInviteToken,
} from "@/invite/storage";
import { posthog } from "@/lib/posthog";
import { messageFromThrown } from "@/lib/show-error-toast";
import { useOwnPlayerProfile } from "@/player";
import { StatusBar } from "expo-status-bar";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { useNetworkStatus } from "hooks/useNetworkStatus";
import useRefresh from "hooks/useRefresh";

type FeedTab = "matches" | "leagues";
type CountryOption = { id: number; name: string; code: string };

type MatchFeedSection = {
  key: "favourites" | "others";
  title: string;
  data: MatchFeedItem[];
};

type MatchFeedItem = FavoriteLeagueEntry | ApiCountryWithLeagues;

function isFavoriteLeagueEntry(item: MatchFeedItem): item is FavoriteLeagueEntry {
  return "league" in item && "country" in item;
}

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const { user } = useAuth();
  const { isTablet, isWideTablet } = useAdaptiveLayout();
  const today = useMemo(() => startOfDay(new Date()), []);
  const insets = useSafeAreaInsets();
  const tabletMaxWidth = isWideTablet ? 1120 : 920;
  const [activeTab, setActiveTab] = useState<FeedTab>("matches");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(today));
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  const [selectedDateOffset, setSelectedDateOffset] = useState(0);
  const [liveOnly, setLiveOnly] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<{
    token: string;
    leagueName?: string;
    teamName?: string;
  } | null>(null);
  const ownProfileQuery = useOwnPlayerProfile(Boolean(user));
  const canSafelyVerifyPendingInvite =
    Boolean(user && pendingInvite?.token) &&
    ownProfileQuery.data?.kind === "missing";
  const pendingInviteQuery = useQuery({
    queryKey: ["invite", "pending", pendingInvite?.token],
    queryFn: () => acceptInvite(pendingInvite!.token),
    enabled: canSafelyVerifyPendingInvite,
    staleTime: 30 * 1000,
    retry: false,
  });
  const showPendingInviteBanner =
    pendingInviteQuery.data?.requiresProfile === true;

  const selectedDate = getDateMeta(today, selectedDateOffset);
  const calendarCells = buildCalendarCells(calendarMonth);

  const leagueParams = useMemo(
    () => ({
      gameDate: selectedDate.date,
      countryId: selectedCountry?.id ?? null,
      gameStatus: liveOnly ? "live" : null,
    }),
    [selectedDate.date, selectedCountry?.id, liveOnly],
  );

  const {
    data: leagueResponse,
    isLoading: leagueResponseLoading,
    isError: leagueResponseError,
    error: leagueResponseErr,
    refetch: refetchLeagueResponse,
  } = useLeaguesByCountry(leagueParams);
  const matches = useMemo(
    () => leagueResponse?.matches ?? [],
    [leagueResponse?.matches],
  );
  const leagues = useMemo(
    () => leagueResponse?.leagues ?? [],
    [leagueResponse?.leagues],
  );
  const feedErrorMessage = leagueResponseError
    ? messageFromThrown(leagueResponseErr)
    : undefined;

  const matchesEmptyCopy = useMemo(() => {
    if (liveOnly) {
      return {
        title: "No live games",
        body: selectedCountry
          ? `Nothing is live in ${selectedCountry.name} right now. Turn off live-only or pick another country.`
          : "Nothing is live right now. Turn off live-only or try another date.",
      };
    }
    if (selectedCountry) {
      return {
        title: `No games in ${selectedCountry.name}`,
        body: `No fixtures for ${selectedDate.displayLabel}. Try another date or clear the country filter.`,
      };
    }
    if (selectedDateOffset === 0) {
      return {
        title: "No games today",
        body: "There are no fixtures scheduled for today. Swipe the date or open the calendar to look ahead.",
      };
    }
    return {
      title: `No games ${selectedDate.displayLabel}`,
      body: "Try another date, or open Filters if you want to narrow by country.",
    };
  }, [liveOnly, selectedCountry, selectedDate.displayLabel, selectedDateOffset]);

  const { favourites, others } = useMemo(
    () => partitionMatchesFeed(matches),
    [matches],
  );

  const matchSections = useMemo<MatchFeedSection[]>(
    () => [
      { key: "favourites", title: "Favourites", data: favourites },
      { key: "others", title: "Others", data: others },
    ],
    [favourites, others],
  );

  const showMatchFeedList =
    !leagueResponseError &&
    !(leagueResponseLoading && matches.length === 0) &&
    matches.length > 0;

  const [refreshing, onRefresh] = useRefresh([
    refetchLeagueResponse,
  ]);

  useEffect(() => {
    void (async () => {
      const token = await getPendingInviteToken();
      if (!token) {
        setPendingInvite(null);
        return;
      }
      const context = await getPendingInviteContext();
      setPendingInvite({ token, ...context });
    })();
  }, []);

  useEffect(() => {
    const error = pendingInviteQuery.error;
    if (!(error instanceof ApiError)) return;
    if (error.status === 403 || error.status === 404 || error.status === 409) {
      void clearPendingInviteToken().then(() => setPendingInvite(null));
    }
  }, [pendingInviteQuery.error]);
  useEffect(() => {
    if (!isOnline) return;
    const prevParams = resolveLeaguesParams({
      ...leagueParams,
      gameDate: addDays(selectedDate.date, -1),
    });
    const nextParams = resolveLeaguesParams({
      ...leagueParams,
      gameDate: addDays(selectedDate.date, 1),
    });
    queryClient.prefetchQuery({
      queryKey: homeKeys.leagues(prevParams),
      queryFn: () => fetchLeagues({ ...leagueParams, gameDate: addDays(selectedDate.date, -1) }),
    }).then();
    queryClient.prefetchQuery({
      queryKey: homeKeys.leagues(nextParams),
      queryFn: () => fetchLeagues({ ...leagueParams, gameDate: addDays(selectedDate.date, 1) }),
    }).catch();
  }, [isOnline, leagueParams, selectedDate.date, queryClient]);

  const cycleDate = (direction: -1 | 1) =>
    setSelectedDateOffset((current) => current + direction);

  const feedControls = (
    <>
      <Animated.View entering={FadeInDown.delay(80).duration(350)}>
        <View className="rounded-[13px] bg-[#F5F1FA] p-1.5">
          <View className="flex-row gap-2">
            <SegmentButton
              label="Matches"
              active={activeTab === "matches"}
              onPress={() => {
                if (activeTab === "matches") return;
                setActiveTab("matches");
                posthog?.capture("home_segment_changed", { segment: "matches" });
              }}
            />
            <SegmentButton
              label="Leagues"
              active={activeTab === "leagues"}
              onPress={() => {
                if (activeTab === "leagues") return;
                setActiveTab("leagues");
                posthog?.capture("home_segment_changed", { segment: "leagues" });
              }}
            />
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(140).duration(350)}>
        <View className="gap-3 rounded-[13px] border border-neutral-200 bg-white p-2">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setFiltersOpen(true)}
              className="h-12 flex-row items-center gap-1.5 rounded-[13px] bg-neutral-100 px-3 active:opacity-85"
            >
              <Ionicons name="options-outline" size={18} color={colors.brand} />
              <Text
                className="text-sm text-neutral-900"
              >
                {selectedCountry ? selectedCountry.name : "Filters"}
              </Text>
            </Pressable>

            {activeTab === "matches" ? (
              <Pressable
                onPress={() => {
                  setLiveOnly((v) => {
                    const next = !v;
                    posthog?.capture("home_live_filter_toggled", {
                      live_only: next,
                    });
                    return next;
                  });
                }}
                className={[
                  "h-12 flex-row items-center gap-1.5 rounded-[13px] px-3",
                  liveOnly ? "border border-[#ba0c2f]" : "bg-neutral-100",
                ].join(" ")}
              >
                <PulsingDot size={6} color="#ba0c2f" />
                <Text
                  className="text-sm text-[#ba0c2f]"
                >
                  Live
                </Text>
              </Pressable>
            ) : null}
            {activeTab === "matches" ? (
              <View
                style={styles.dateControl}
                className="h-12 min-w-0 flex-1 flex-row items-center gap-1 rounded-[13px] bg-neutral-100 px-2"
              >
                <Pressable
                  onPress={() => cycleDate(-1)}
                  className="h-10 w-10 items-center justify-center rounded-full active:bg-white"
                >
                  <Ionicons name="chevron-back" size={18} color={colors.brand} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    setCalendarMonth(startOfMonth(selectedDate.date));
                    setCalendarOpen(true);
                  }}
                  className="flex-1 items-center rounded-[10px] px-1 py-1 active:bg-white"
                >
                  <Text
                    className="text-sm text-neutral-950"
                  >
                    {selectedDate.displayLabel}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => cycleDate(1)}
                  className="h-10 w-10 items-center justify-center rounded-full active:bg-white"
                >
                  <Ionicons name="chevron-forward" size={18} color={colors.brand} />
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>
      {showPendingInviteBanner && pendingInvite ? (
        <PendingInviteBanner
          leagueName={pendingInvite.leagueName}
          teamName={pendingInvite.teamName}
          onPress={() => router.push("/join/create-profile")}
        />
      ) : null}
    </>
  );
  const tabletFrameStyle = isTablet
    ? { alignSelf: "center" as const, width: "100%" as const, maxWidth: tabletMaxWidth }
    : undefined;

  const renderFeedControls = (
    <View className="w-full gap-5" style={tabletFrameStyle}>
      {feedControls}
    </View>
  );

  const matchListEmpty = () => {
    if (leagueResponseError) {
      return (
        <View className="w-full" style={tabletFrameStyle}>
          <ErrorState
            message={feedErrorMessage}
            onRetry={() => refetchLeagueResponse()}
          />
        </View>
      );
    }
    if (leagueResponseLoading && matches.length === 0) {
      return (
        <View className="w-full items-center py-10" style={tabletFrameStyle}>
          <ActivityIndicator color={colors.brand} />
        </View>
      );
    }
    if (matches.length === 0) {
      return (
        <View className="w-full py-5" style={tabletFrameStyle}>
          <EmptyState
            title={matchesEmptyCopy.title}
            body={matchesEmptyCopy.body}
          />
        </View>
      );
    }
    return null;
  };

  return (
    <View className="flex-1 bg-[#121212]">
       <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <OfflineBanner />

        {/*<View className="relative overflow-hidden bg-[#121212] px-5 pb-8 pt-4">*/}
          <BlackPatternBackground
            baseColor={scoreboardPattern().baseColor}
            stripeColor={scoreboardPattern().stripeColor}
          />

          <Animated.View
            entering={FadeInDown.duration(350)}
            className="gap-6 px-5 pb-5 pt-4"
            style={tabletFrameStyle}
          >
            <View className="flex-row items-center gap-3">
              <View className="shrink-0">
                <Logo variant="image" fontSize={18} lineHeight={25} />
              </View>

              <Pressable
                onPress={() => router.push("/search")}
                accessibilityRole="search"
                accessibilityLabel="Search players, countries, leagues, teams"
                className="flex-1 flex-row items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 active:opacity-80"
              >
                <Ionicons name="search-outline" size={14} color="#FFFFFF" />
                <Text className="flex-1 text-sm text-white/55">
                  Players, leagues, teams
                </Text>
              </Pressable>

              <View className="items-end gap-2 pt-1">
                <Pressable
                  onPress={() => router.push("/profile")}
                  className="h-11 w-11 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
                  accessibilityRole="button"
                  accessibilityLabel="Profile and settings"
                >
                  <Ionicons name="person-outline" size={20} color="#FFFFFF" />
                </Pressable>
                {/* <Text
                  className="text-xs uppercase tracking-[2px] text-white/45"
                >
                  {selectedDate.shortDate}
                </Text> */}
              </View>
            </View>
          </Animated.View>
        {/*</View>*/}

        {activeTab === "matches" ? (
          <SectionList<MatchFeedItem, MatchFeedSection>
            className="flex-1 bg-white"
            ListHeaderComponentStyle={
              isTablet ? styles.tabletListCell : undefined
            }
            contentContainerClassName="px-5 pb-32 pt-5"
            contentContainerStyle={{
              paddingBottom: insets.bottom + 90,
            }}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            sections={showMatchFeedList ? matchSections : []}
            keyExtractor={(item, index) =>
              isFavoriteLeagueEntry(item) ? item.key : String(item.id ?? index)
            }
            renderSectionHeader={({ section }) => (
              <View className="w-full pb-2 pt-4" style={tabletFrameStyle}>
                <Text
                  className="text-xs uppercase tracking-[1.5px] text-slate-500"
                >
                  {section.title}
                </Text>
              </View>
            )}
            renderSectionFooter={({ section }) => {
              if (section.key !== "favourites" || section.data.length > 0) {
                return null;
              }
              return (
                <View
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3"
                  style={tabletFrameStyle}
                >
                  <Text
                    className="text-sm leading-5 text-slate-600"
                  >
                    No favourite leagues yet - tap the heart on a league to pin it here.
                  </Text>
                </View>
              );
            }}
            renderItem={({ item, section }) => {
              if (section.key === "favourites" && isFavoriteLeagueEntry(item)) {
                return (
                  <View className="w-full" style={tabletFrameStyle}>
                    <FavoriteLeagueCard entry={item} params={leagueParams} />
                  </View>
                );
              }
              return (
                <View className="w-full" style={tabletFrameStyle}>
                  <CountryAccordion
                    entry={item as ApiCountryWithLeagues}
                    defaultOpen={false}
                    params={leagueParams}
                  />
                </View>
              );
            }}
            ItemSeparatorComponent={() => <View className="h-4" />}
            ListHeaderComponent={renderFeedControls}
            ListEmptyComponent={matchListEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.brand}
                colors={[colors.brand]}
              />
            }
          />
        ) : (
        <ScrollView
          className="flex-1 bg-white"
          contentContainerClassName="gap-5 px-5 pb-32 pt-5"
          contentContainerStyle={isTablet ? { alignItems: "center" } : undefined}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brand}
              colors={[colors.brand]}
            />
          }
        >
          {renderFeedControls}

          <Animated.View
            entering={FadeInDown.delay(200).duration(350)}
            className={isTablet ? "flex-row flex-wrap gap-4" : "gap-4"}
            style={tabletFrameStyle}
          >
              {leagueResponseError ? (
                <ErrorState
                  message={feedErrorMessage}
                  onRetry={() => refetchLeagueResponse()}
                />
              ) : leagueResponseLoading && (leagues ?? []).length === 0 ? (
                <View className="items-center py-10">
                  <ActivityIndicator color={colors.brand} />
                </View>
              ) : (leagues ?? []).length ? (
                (leagues ?? []).map((entry, index) => (
                  <View
                    key={entry.id}
                    style={isTablet ? { width: "48%" } : undefined}
                  >
                    <LeagueDirectoryRow entry={entry} defaultOpen={index === 0} />
                  </View>
                ))
              ) : (
                <EmptyState
                  title={
                    selectedCountry
                      ? `No leagues in ${selectedCountry.name}`
                      : "No leagues yet"
                  }
                  body={
                    selectedCountry
                      ? "Clear the country filter to see the full directory."
                      : "Leagues will show up here once they are available."
                  }
                />
              )}
            </Animated.View>
        </ScrollView>
        )}
      </SafeAreaView>

      <BottomSheetModal
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        subtitle="Country selection lives here for now. More filters can share this same sheet."
      >
        <Pressable
          onPress={() => {
            setSelectedCountry(null);
            setFiltersOpen(false);
          }}
          className={[
            "flex-row items-center justify-between rounded-2xl px-4 py-4",
            selectedCountry === null ? "bg-[#F3E8FF]" : "bg-neutral-50",
          ].join(" ")}
        >
          <View className="flex-row items-center gap-3">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-white">
              <Ionicons name="globe-outline" size={17} color={colors.brand} />
            </View>
            <Text
              className={
                selectedCountry === null ? "text-sm text-[#4A148C]" : "text-sm text-neutral-800"
              }
            >
              All Countries
            </Text>
          </View>
          {selectedCountry === null ? (
            <Ionicons name="checkmark-circle" size={20} color={colors.brand} />
          ) : null}
        </Pressable>

        {(leagueResponse?.leagues ?? []).map((option) => {
          const selected = selectedCountry?.id === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => {
                setSelectedCountry(option);
                setFiltersOpen(false);
              }}
              className={[
                "flex-row items-center justify-between rounded-2xl px-4 py-4",
                selected ? "bg-[#F3E8FF]" : "bg-neutral-50",
              ].join(" ")}
            >
              <View className="flex-row items-center gap-3">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-white">
                  <CountryFlag code={option.code} width={22} />
                </View>
                <Text 
                  className={selected ? "text-sm text-[#4A148C]" : "text-sm text-neutral-800"}
                >
                  {option.name}
                </Text>
              </View>
              {selected ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.brand} />
              ) : null}
            </Pressable>
          );
        })}
      </BottomSheetModal>

      <BottomSheetModal
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        title="Pick a date"
        subtitle="Jump to any day. Relative labels show only for yesterday, today, and tomorrow."
      >
        <Animated.View entering={FadeIn.duration(160)} className="gap-4">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => setCalendarMonth((current) => addMonths(current, -1))}
              className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100 active:bg-neutral-200"
            >
              <Ionicons name="chevron-back" size={18} color={colors.brand} />
            </Pressable>
            <Text className="text-base text-neutral-950">
              {calendar.monthLabelFormat.format(calendarMonth)}
            </Text>
            <Pressable
              onPress={() => setCalendarMonth((current) => addMonths(current, 1))}
              className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100 active:bg-neutral-200"
            >
              <Ionicons name="chevron-forward" size={18} color={colors.brand} />
            </Pressable>
          </View>

          <View className="flex-row justify-between px-1">
            {calendar.weekdayLabels.map((day, index) => (
              <Text
                key={`${day}-${index}`}
                className="w-10 text-center text-xs uppercase tracking-[1.5px] text-slate-400"
              >
                {day}
              </Text>
            ))}
          </View>

          <View className="flex-row flex-wrap gap-y-2">
            {calendarCells.map((cell, index) => {
              if (!cell) {
                return (
                  <View key={`empty-${index}`} className="px-1" style={styles.calendarCell} />
                );
              }

              const selected = sameDay(cell, selectedDate.date);
              const isToday = sameDay(cell, today);

              return (
                <View
                  key={`${cell.toISOString()}-${index}`}
                  className="px-1"
                  style={styles.calendarCell}
                >
                  <Pressable
                    onPress={() => {
                      setSelectedDateOffset(dayOffset(today, cell));
                      setCalendarOpen(false);
                    }}
                    className={[
                      "items-center rounded-2xl py-3",
                      selected ? "bg-[#4A148C]" : "bg-neutral-50",
                    ].join(" ")}
                  >
                    <Text
                      className={selected ? "text-sm text-white" : "text-sm text-neutral-900"}
                    >
                      {cell.getDate()}
                    </Text>
                    <Text
                      className={
                        selected
                          ? "pt-1 text-[10px] text-white/70"
                          : isToday
                            ? "pt-1 text-[10px] text-[#4A148C]"
                            : "pt-1 text-[10px] text-transparent"
                      }
                    >
                      {isToday ? "Today" : " "}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Animated.View>
      </BottomSheetModal>
    </View>
  );
}

function PendingInviteBanner({
  leagueName,
  teamName,
  onPress,
}: {
  leagueName?: string;
  teamName?: string;
  onPress: () => void;
}) {
  const target = [teamName, leagueName].filter(Boolean).join(" · ");
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-[16px] border border-[#E6A817]/40 bg-[#FFF7D6] px-4 py-4 active:opacity-85"
      accessibilityRole="button"
      accessibilityLabel="Complete invite"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-[#4A148C]">
        <Ionicons name="mail-unread-outline" size={19} color="#E6A817" />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text
          className="text-sm text-neutral-950"
        >
          Finish your invite
        </Text>
        <Text
          className="text-xs leading-5 text-neutral-700"
          numberOfLines={2}
        >
          {target
            ? `Create your player profile to join ${target}.`
            : "Create your player profile to join this league."}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#4A148C" />
    </Pressable>
  );
}



const styles = StyleSheet.create({
  calendarCell: { width: "14.2857%" },
  dateControl: { flex: 1.35 },
  tabletListCell: {
    width: "100%",
    alignItems: "center",
  },
});
