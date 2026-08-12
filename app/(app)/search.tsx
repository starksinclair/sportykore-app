import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { EntityLogo } from "@/components/ui";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { colors } from "@/constants";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { useSearch } from "@/home/hooks";
import {
  getRecentSearches,
  pushRecentSearch,
  removeRecentSearch,
} from "@/home/recent-searches";
import type { SearchEntityType, SearchResult } from "@/home/types";
import { posthog } from "@/lib/posthog";
import { messageFromThrown } from "@/lib/show-error-toast";
const ENTITY_ORDER: SearchEntityType[] = ["country", "league", "team", "player"];
const ENTITY_LABELS: Record<SearchEntityType, string> = {
  country: "Countries",
  league: "Leagues",
  team: "Teams",
  player: "Players",
};
const ENTITY_ICONS: Record<SearchEntityType, keyof typeof Ionicons.glyphMap> = {
  country: "flag-outline",
  league: "trophy-outline",
  team: "shield-outline",
  player: "person-outline",
};

export default function SearchScreen() {
  const router = useRouter();
  const { isTablet, isWideTablet } = useAdaptiveLayout();
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const insets = useSafeAreaInsets();
  const tabletMaxWidth = isWideTablet ? 1080 : 860;
  const tabletFrameStyle = isTablet
    ? { alignSelf: "center" as const, width: "100%" as const, maxWidth: tabletMaxWidth }
    : undefined;
  useEffect(() => {
    let cancelled = false;
    getRecentSearches().then((value) => {
      if (!cancelled) setRecents(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const searchQuery = useSearch({ q: query });
  const trimmed = query.trim();

  const grouped = useMemo(
    () => groupResults(searchQuery.data?.results ?? []),
    [searchQuery.data],
  );

  useEffect(() => {
    if (
      !trimmed ||
      !searchQuery.isSuccess ||
      searchQuery.isFetching ||
      searchQuery.isPlaceholderData ||
      !searchQuery.data
    ) {
      return;
    }
    const results = searchQuery.data.results ?? [];
    posthog?.capture("search_performed", {
      query_length: trimmed.length,
      result_count: results.length,
      country_count: results.filter((r) => r.type === "country").length,
      league_count: results.filter((r) => r.type === "league").length,
      team_count: results.filter((r) => r.type === "team").length,
      player_count: results.filter((r) => r.type === "player").length,
    });
  }, [
    searchQuery.data,
    searchQuery.dataUpdatedAt,
    searchQuery.isFetching,
    searchQuery.isPlaceholderData,
    searchQuery.isSuccess,
    trimmed,
  ]);

  const handleSubmit = async () => {
    if (!trimmed) return;
    const next = await pushRecentSearch(trimmed);
    setRecents(next);
  };

  const handlePickRecent = (term: string) => {
    setQuery(term);
  };

  const handleRemoveRecent = async (term: string) => {
    const next = await removeRecentSearch(term);
    setRecents(next);
  };

  const handleResult = async (result: SearchResult) => {
    const next = await pushRecentSearch(result.label);
    setRecents(next);
    posthog?.capture("search_result_clicked", {
      result_type: result.type,
      query_length: trimmed.length,
    });
    const route = searchResultRoute(result);
    if (route) router.push(route as Href);
  };

  return (
    <View className="flex-1 bg-neutral-950">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View
          className="flex-row items-center gap-3 px-5 pb-3 pt-2"
          style={tabletFrameStyle}
        >
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Close search"
            className="h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 active:bg-white/15"
          >
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </Pressable>

          <View className="flex-1 flex-row items-center gap-2 rounded-[18px] border border-white/10 bg-white/10 px-4 py-3">
            <Ionicons name="search-outline" size={18} color={colors.accent} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSubmit}
              placeholder="Players, countries, leagues, teams"
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
              className="flex-1 p-0 text-sm text-white"
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => setQuery("")}
                accessibilityLabel="Clear search"
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.45)" />
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-6 px-5 pb-12 pt-2"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 16,
            ...(isTablet ? { alignItems: "center" as const } : null),
          }}
        >
          <View className="w-full" style={tabletFrameStyle}>
            {trimmed.length === 0 ? (
              <RecentsBlock
                recents={recents}
                onPick={handlePickRecent}
                onRemove={handleRemoveRecent}
              />
            ) : searchQuery.isError ? (
              <SearchErrorState
                message={messageFromThrown(searchQuery.error)}
                onRetry={() => searchQuery.refetch()}
              />
            ) : searchQuery.isLoading && !searchQuery.data ? (
              <View className="items-center pt-12">
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : (searchQuery.data?.results ?? []).length === 0 ? (
              <EmptyResults query={trimmed} />
            ) : (
              <ResultsBlock grouped={grouped} onPick={handleResult} />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function searchResultRoute(result: SearchResult): string | null {
  if (result.type === "country" && result.countryCode) {
    return `/country/${result.countryCode}`;
  }

  const colonIndex = result.id.indexOf(":");
  const entityId =
    colonIndex >= 0 ? result.id.slice(colonIndex + 1) : result.id;
  if (!entityId) return null;

  return `/${result.type}/${entityId}`;
}

function groupResults(results: SearchResult[]) {
  const buckets: Record<SearchEntityType, SearchResult[]> = {
    country: [],
    league: [],
    team: [],
    player: [],
  };
  for (const result of results) buckets[result.type].push(result);
  return buckets;
}

function SearchErrorState({
  onRetry,
  message,
}: {
  onRetry: () => void;
  message?: string;
}) {
  return (
    <View className="gap-3 rounded-[24px] border border-red-300/25 bg-red-500/10 px-5 py-6">
      <View className="h-12 w-12 items-center justify-center rounded-[20px] bg-red-500/15">
        <Ionicons name="warning-outline" size={24} color={colors.white} />
      </View>
      <View className="gap-1">
        <Text
          className="text-base text-white"
        >
          Search unavailable
        </Text>
        <Text
          className="text-sm leading-6 text-white/60"
        >
          {message || "Check your connection and try again."}
        </Text>
      </View>
      <Pressable
        onPress={onRetry}
        className="mt-1 h-10 flex-row items-center gap-1.5 self-start rounded-full bg-accent-500 px-4 active:opacity-90"
      >
        <Ionicons name="refresh" size={15} color={colors.darkLabel} />
        <Text
          className="text-sm text-neutral-950"
        >
          Retry
        </Text>
      </Pressable>
    </View>
  );
}

function RecentsBlock({
  recents,
  onPick,
  onRemove,
}: {
  recents: string[];
  onPick: (term: string) => void;
  onRemove: (term: string) => void;
}) {
  if (recents.length === 0) {
    return (
      <View className="items-center gap-3 rounded-[24px] border border-dashed border-white/15 bg-white/5 px-5 py-8">
        <View className="h-14 w-14 items-center justify-center rounded-[22px] bg-accent-500/15">
          <Ionicons name="search-outline" size={26} color={colors.accent} />
        </View>
        <View className="gap-1">
          <Text
            className="text-center text-base text-white"
          >
            Nothing here yet
          </Text>
          <Text
            className="text-center text-sm leading-6 text-white/55"
          >
            Search by player, country, league, or team. Recent searches will show up here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <Text
        className="text-xs uppercase tracking-wide text-white/50"
      >
        Recent
      </Text>
      <View className="gap-2">
        {recents.map((term) => (
          <View
            key={term}
            className="flex-row items-center gap-2 rounded-[18px] border border-white/10 bg-white/5 px-3 py-2.5"
          >
            <Pressable
              onPress={() => onPick(term)}
              className="flex-1 flex-row items-center gap-3 py-1"
            >
              <View className="h-9 w-9 items-center justify-center rounded-2xl bg-accent-500/15">
                <Ionicons name="time-outline" size={18} color={colors.accent} />
              </View>
              <Text
                className="min-w-0 flex-1 text-sm text-white"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {term}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onRemove(term)}
              accessibilityLabel={`Remove ${term} from recents`}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full bg-white/5 active:bg-white/10"
            >
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.55)" />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

function EmptyResults({ query }: { query: string }) {
  return (
    <View className="items-center gap-3 rounded-[24px] border border-dashed border-white/15 bg-white/5 px-5 py-8">
      <View className="h-14 w-14 items-center justify-center rounded-[22px] bg-white/10">
        <Ionicons name="search-outline" size={26} color={colors.accent} />
      </View>
      <View className="gap-1">
        <Text
          className="text-center text-base text-white"
        >
          No matches for &ldquo;{query}&rdquo;
        </Text>
        <Text
          className="text-center text-sm leading-6 text-white/55"
        >
          Try a different spelling, or search by country or league instead.
        </Text>
      </View>
    </View>
  );
}

function ResultsBlock({
  grouped,
  onPick,
}: {
  grouped: Record<SearchEntityType, SearchResult[]>;
  onPick: (result: SearchResult) => void;
}) {
  const { isTablet } = useAdaptiveLayout();

  return (
    <View className={isTablet ? "flex-row flex-wrap gap-5" : "gap-5"}>
      {ENTITY_ORDER.map((type) => {
        const items = grouped[type];
        if (items.length === 0) return null;

        return (
          <View
            key={type}
            className="gap-3"
            style={isTablet ? { width: "48%" } : undefined}
          >
            <View className="flex-row items-center gap-2">
              <View className="h-7 w-7 items-center justify-center rounded-xl bg-accent-500/15">
                <Ionicons name={ENTITY_ICONS[type]} size={14} color={colors.accent} />
              </View>
              <Text
                className="text-xs uppercase tracking-wide text-white/50"
              >
                {ENTITY_LABELS[type]}
              </Text>
            </View>

            <View className="overflow-hidden rounded-[22px] border border-white/10 bg-white/5">
              {items.map((result, index) => (
                <Pressable
                  key={index}
                  onPress={() => onPick(result)}
                  className={[
                    "flex-row items-center gap-3 px-4 py-3.5 active:bg-white/10",
                    index !== items.length - 1 ? "border-b border-white/10" : "",
                  ].join(" ")}
                >
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-accent-500/15">
                    {result.type === "country" && result.countryCode ? (
                      <CountryFlag code={result.countryCode} width={20} />
                    ) : result.type === "league" || result.type === "team" ? (
                      <EntityLogo
                        logoUrl={result.logoUrl}
                        variant={result.type}
                        size="xs"
                        tone="accent"
                      />
                    ) : (
                      <Ionicons name={ENTITY_ICONS[type]} size={18} color={colors.accent} />
                    )}
                  </View>
                  <View className="min-w-0 flex-1 gap-0.5">
                    <Text
                      className="text-sm text-white"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {result.label}
                    </Text>
                    {result.sublabel ? (
                      <View className="flex-row items-center gap-1.5">
                        {result.type === "league" && result.countryCode ? (
                          <CountryFlag code={result.countryCode} width={14} />
                        ) : null}
                        <Text
                            className="min-w-0 flex-1 text-xs text-white/50"
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {result.sublabel}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="rgba(255,255,255,0.45)"
                  />
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}
