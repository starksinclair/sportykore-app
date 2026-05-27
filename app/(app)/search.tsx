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
import { SafeAreaView } from "react-native-safe-area-context";

import { CountryFlag } from "@/components/ui/CountryFlag";
import { colors } from "@/constants";
import { useSearch } from "@/home/hooks";
import {
  getRecentSearches,
  pushRecentSearch,
  removeRecentSearch,
} from "@/home/recent-searches";
import type { SearchEntityType, SearchResult } from "@/home/types";
import { fonts } from "@/theme/fonts";
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
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<string[]>([]);

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
    const route = searchResultRoute(result);
    if (route) router.push(route as Href);
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="flex-row items-center gap-3 px-5 pb-3 pt-2">
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Close search"
            className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100 active:bg-neutral-200"
          >
            <Ionicons name="chevron-back" size={20} color="#111827" />
          </Pressable>

          <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-3">
            <Ionicons name="search-outline" size={18} color="#6B7280" />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSubmit}
              placeholder="Players, countries, leagues, teams"
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
              className="flex-1 p-0 text-sm text-neutral-900"
              style={{ fontFamily: fonts.body }}
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => setQuery("")}
                accessibilityLabel="Clear search"
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-6 px-5 pb-12 pt-2"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {trimmed.length === 0 ? (
            <RecentsBlock
              recents={recents}
              onPick={handlePickRecent}
              onRemove={handleRemoveRecent}
            />
          ) : searchQuery.isError ? (
            <SearchErrorState onRetry={() => searchQuery.refetch()} />
          ) : searchQuery.isLoading && !searchQuery.data ? (
            <View className="items-center pt-12">
              <ActivityIndicator color={colors.brand} />
            </View>
          ) : (searchQuery.data?.results ?? []).length === 0 ? (
            <EmptyResults query={trimmed} />
          ) : (
            <ResultsBlock grouped={grouped} onPick={handleResult} />
          )}
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

function SearchErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="rounded-[20px] border border-red-200 bg-red-50 px-5 py-8">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-base text-neutral-950"
      >
        Search unavailable
      </Text>
      <Text
        style={{ fontFamily: fonts.body }}
        className="pt-2 text-sm leading-6 text-slate-600"
      >
        Check your connection and try again.
      </Text>
      <Pressable
        onPress={onRetry}
        className="mt-4 self-start rounded-xl bg-[#4A148C] px-4 py-2.5 active:opacity-80"
      >
        <Text style={{ fontFamily: fonts.bodyBold }} className="text-sm text-white">
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
      <View className="rounded-[20px] border border-dashed border-neutral-200 bg-neutral-50 px-5 py-8">
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-base text-neutral-950"
        >
          Nothing here yet
        </Text>
        <Text
          style={{ fontFamily: fonts.body }}
          className="pt-2 text-sm leading-6 text-slate-600"
        >
          Search by player, country, league, or team. Recent searches will show up here.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-[11px] uppercase tracking-[2px] text-slate-500"
      >
        Recent
      </Text>
      <View className="gap-1">
        {recents.map((term) => (
          <View
            key={term}
            className="flex-row items-center gap-2 rounded-[14px] bg-neutral-50 px-3 py-2"
          >
            <Pressable
              onPress={() => onPick(term)}
              className="flex-1 flex-row items-center gap-3 py-1"
            >
              <Ionicons name="time-outline" size={18} color="#6B7280" />
              <Text
                style={{ fontFamily: fonts.bodySemibold }}
                className="text-sm text-neutral-900"
              >
                {term}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onRemove(term)}
              accessibilityLabel={`Remove ${term} from recents`}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full active:bg-neutral-200"
            >
              <Ionicons name="close" size={16} color="#6B7280" />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

function EmptyResults({ query }: { query: string }) {
  return (
    <View className="rounded-[20px] border border-dashed border-neutral-200 bg-neutral-50 px-5 py-8">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-base text-neutral-950"
      >
        No matches for &ldquo;{query}&rdquo;
      </Text>
      <Text
        style={{ fontFamily: fonts.body }}
        className="pt-2 text-sm leading-6 text-slate-600"
      >
        Try a different spelling, or search by country or league instead.
      </Text>
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
  return (
    <View className="gap-6">
      {ENTITY_ORDER.map((type) => {
        const items = grouped[type];
        if (items.length === 0) return null;

        return (
          <View key={type} className="gap-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name={ENTITY_ICONS[type]} size={14} color={colors.brand} />
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-[11px] uppercase tracking-[2px] text-[#4A148C]"
              >
                {ENTITY_LABELS[type]}
              </Text>
            </View>

            <View className="overflow-hidden rounded-[16px] border border-neutral-200 bg-white">
              {items.map((result, index) => (
                <Pressable
                  key={index}
                  onPress={() => onPick(result)}
                  className={[
                    "flex-row items-center gap-3 px-4 py-3 active:bg-neutral-50",
                    index !== items.length - 1 ? "border-b border-neutral-100" : "",
                  ].join(" ")}
                >
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-[#F3E8FF]">
                    {result.countryCode ? (
                      <CountryFlag code={result.countryCode} width={20} />
                    ) : (
                      <Ionicons name={ENTITY_ICONS[type]} size={16} color={colors.brand} />
                    )}
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text
                      style={{ fontFamily: fonts.bodyBold }}
                      className="text-sm text-neutral-950"
                    >
                      {result.label}
                    </Text>
                    {result.sublabel ? (
                      <View className="flex-row items-center gap-1.5">
                        {result.type === "league" && result.countryCode ? (
                          <CountryFlag code={result.countryCode} width={14} />
                        ) : null}
                        <Text
                          style={{ fontFamily: fonts.body }}
                          className="text-xs text-slate-500"
                        >
                          {result.sublabel}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}
