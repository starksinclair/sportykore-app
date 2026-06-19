import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

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
  LeagueDirectoryRow
} from "@/home/components";
import { SegmentButton } from "@/home/components/SegmentButton";
import { homeKeys, useLeaguesByCountry } from "@/home/hooks";
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
import { fonts } from "@/theme/fonts";
import { StatusBar } from "expo-status-bar";
import { useNetworkStatus } from "hooks/useNetworkStatus";
import useRefresh from "hooks/useRefresh";

type FeedTab = "matches" | "leagues";
type CountryOption = { id: number; name: string; code: string };

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const today = useMemo(() => startOfDay(new Date()), []);

  const [activeTab, setActiveTab] = useState<FeedTab>("matches");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(today));
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  const [selectedDateOffset, setSelectedDateOffset] = useState(0);
  const [liveOnly, setLiveOnly] = useState(false);

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

  const { data: leagueResponse, isLoading: leagueResponseLoading, isError: leagueResponseError, refetch: refetchLeagueResponse } = useLeaguesByCountry(leagueParams);
  const matches = leagueResponse?.matches ?? [];
  const leagues = leagueResponse?.leagues ?? [];

  const [refreshing, onRefresh] = useRefresh([
    refetchLeagueResponse,
  ]);
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

          <Animated.View entering={FadeInDown.duration(350)} className="gap-6  px-5 pb-8 pt-4">
            <View className="flex-row items-center gap-3">
              <View className="shrink-0">
                <Logo variant="full" color={colors.accent} fontSize={18} lineHeight={25} />
              </View>

              <Pressable
                onPress={() => router.push("/search")}
                accessibilityRole="search"
                accessibilityLabel="Search players, countries, leagues, teams"
                className="flex-1 flex-row items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 active:opacity-80"
              >
                <Ionicons name="search-outline" size={14} color="#FFFFFF" />
                <Text style={{ fontFamily: fonts.body }} className="flex-1 text-sm text-white/55">
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
                  style={{ fontFamily: fonts.bodySemibold }}
                  className="text-xs uppercase tracking-[2px] text-white/45"
                >
                  {selectedDate.shortDate}
                </Text> */}
              </View>
            </View>
          </Animated.View>
        {/*</View>*/}

        <ScrollView
          className="flex-1 bg-white"
          contentContainerClassName="gap-5 px-5 pb-32 pt-5"
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
          <Animated.View entering={FadeInDown.delay(80).duration(350)}>
            <View className="rounded-[13px] bg-[#F5F1FA] p-1.5">
              <View className="flex-row gap-2">
                <SegmentButton
                  label="Matches"
                  active={activeTab === "matches"}
                  onPress={() => setActiveTab("matches")}
                />
                <SegmentButton
                  label="Leagues"
                  active={activeTab === "leagues"}
                  onPress={() => setActiveTab("leagues")}
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
                    style={{ fontFamily: fonts.bodySemibold }}
                    className="text-sm text-neutral-900"
                  >
                    {selectedCountry ? selectedCountry.name : "Filters"}
                  </Text>
                </Pressable>

                {activeTab === "matches" ? (
                  <Pressable
                    onPress={() => setLiveOnly((v) => !v)}
                    className={[
                      "h-12 flex-row items-center gap-1.5 rounded-[13px] px-3",
                      liveOnly ? "border border-[#ba0c2f]" : "bg-neutral-100",
                    ].join(" ")}
                  >
                    <PulsingDot size={6} color="#ba0c2f" />
                    <Text
                      style={{ fontFamily: fonts.bodyBold }}
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
                        style={{ fontFamily: fonts.bodyBold }}
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

          {activeTab === "matches" ? (
            <Animated.View entering={FadeInDown.delay(200).duration(350)} className="gap-4">
              {leagueResponseError ? (
                <ErrorState onRetry={() => refetchLeagueResponse()} />
              ) : leagueResponseLoading && (matches ?? []).length === 0 ? (
                <View className="items-center py-10">
                  <ActivityIndicator color={colors.brand} />
                </View>
              ) : (matches ?? []).length > 0? (
                (matches ?? []).map((entry, index) => (
                  <CountryAccordion key={entry.id} entry={entry} defaultOpen={index === 0} params={leagueParams} />
                ))
              ) : (
                <EmptyState
                  title="No fixtures match this filter"
                  body="Try another country, move the date, or switch off live-only."
                />
              )}
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(200).duration(350)} className="gap-4">
              {leagueResponseError ? (
                <ErrorState onRetry={() => refetchLeagueResponse()} />
              ) : leagueResponseLoading && (leagues ?? []).length === 0 ? (
                <View className="items-center py-10">
                  <ActivityIndicator color={colors.brand} />
                </View>
              ) : (leagues ?? []).length ? (
                (leagues ?? []).map((entry, index) => (
                  <LeagueDirectoryRow key={entry.id} entry={entry} defaultOpen={index === 0} />
                ))
              ) : (
                <EmptyState
                  title="No leagues yet"
                  body="Try clearing the country filter to see the full directory."
                />
              )}
            </Animated.View>
          )}
        </ScrollView>
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
              style={{
                fontFamily: selectedCountry === null ? fonts.bodyBold : fonts.bodySemibold,
              }}
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
                  style={{ fontFamily: selected ? fonts.bodyBold : fonts.bodySemibold }}
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
            <Text style={{ fontFamily: fonts.bodyBold }} className="text-base text-neutral-950">
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
                style={{ fontFamily: fonts.bodyBold }}
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
                      style={{ fontFamily: selected ? fonts.bodyBold : fonts.bodySemibold }}
                      className={selected ? "text-sm text-white" : "text-sm text-neutral-900"}
                    >
                      {cell.getDate()}
                    </Text>
                    <Text
                      style={{ fontFamily: fonts.body }}
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



const styles = StyleSheet.create({
  calendarCell: { width: "14.2857%" },
  dateControl: { flex: 1.35 },
});
