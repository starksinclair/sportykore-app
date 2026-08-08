import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import type { ApiVenue } from "@/api/entities";
import { AuthTextField } from "@/components/ui/auth-text-field";

import { useLeagueVenues } from "../../hooks";
import { VenueFormSheet } from "../venues/VenueFormSheet";

export type GameVenueSelection =
  | { kind: "none" }
  | { kind: "venue"; venueId: number; name: string }
  | { kind: "one_off"; venueName: string };

type Props = {
  leagueId: number;
  enabled?: boolean;
  selection: GameVenueSelection;
  onChange: (selection: GameVenueSelection) => void;
  variant?: "light" | "dark";
};

const EMPTY_VENUES: ApiVenue[] = [];

function selectionLabel(selection: GameVenueSelection): string {
  if (selection.kind === "venue") return selection.name;
  if (selection.kind === "one_off") {
    return selection.venueName.trim() || "One-off name";
  }
  return "No venue";
}

export function GameVenuePicker({
  leagueId,
  enabled = true,
  selection,
  onChange,
  variant = "light",
}: Props) {
  const isDark = variant === "dark";
  const venuesQuery = useLeagueVenues(leagueId, enabled);
  const venues = venuesQuery.data ?? EMPTY_VENUES;
  const [formOpen, setFormOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [oneOffMode, setOneOffMode] = useState(selection.kind === "one_off");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setOneOffMode(selection.kind === "one_off");
  }, [selection.kind]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return venues;
    return venues.filter((v) => {
      const haystack = [v.name, v.city, v.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [venues, query]);

  const selectVenue = (venue: ApiVenue) => {
    setOneOffMode(false);
    setPickerOpen(false);
    setQuery("");
    onChange({ kind: "venue", venueId: venue.id, name: venue.name });
  };

  const selectNone = () => {
    setOneOffMode(false);
    setPickerOpen(false);
    setQuery("");
    onChange({ kind: "none" });
  };

  const enableOneOff = () => {
    setPickerOpen(false);
    setQuery("");
    setOneOffMode(true);
    onChange({
      kind: "one_off",
      venueName: selection.kind === "one_off" ? selection.venueName : "",
    });
  };

  const clearSelection = () => {
    setOneOffMode(false);
    setPickerOpen(false);
    setQuery("");
    onChange({ kind: "none" });
  };

  const hasSelection =
    selection.kind === "venue" ||
    (selection.kind === "one_off" && selection.venueName.trim().length > 0);

  return (
    <View className="gap-3">
      <Text
        className={
          isDark
            ? "text-xs uppercase tracking-wide text-white/50"
            : "text-xs uppercase tracking-wide text-slate-500"
        }
      >
        Venue (optional)
      </Text>

      {venuesQuery.isLoading ? (
        <ActivityIndicator color="#4A148C" className="py-2" />
      ) : oneOffMode ? (
        <View className="gap-3">
          <AuthTextField
            label="One-off venue name"
            value={selection.kind === "one_off" ? selection.venueName : ""}
            onChangeText={(venueName) =>
              onChange({ kind: "one_off", venueName })
            }
            placeholder="Riverside Pitch 2"
            autoFocus
            labelClassName={isDark ? "text-white/60" : undefined}
          />
          <View className="flex-row flex-wrap gap-x-4 gap-y-2">
            <Pressable
              onPress={() => {
                setOneOffMode(false);
                setPickerOpen(true);
              }}
              hitSlop={8}
            >
              <Text
                className={isDark ? "text-sm text-accent-200" : "text-sm text-brand-700"}
              >
                Pick from league venues
              </Text>
            </Pressable>
            <Pressable onPress={clearSelection} hitSlop={8}>
              <Text
                className={isDark ? "text-sm text-white/50" : "text-sm text-slate-500"}
              >
                Clear
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View
          className={
            isDark
              ? "overflow-hidden rounded-[18px] border border-white/10 bg-white/5"
              : "overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
          }
        >
          <Pressable
            onPress={() => setPickerOpen((open) => !open)}
            className="flex-row items-center gap-3 px-3.5 py-3"
          >
            <View
              className={
                isDark
                  ? "h-9 w-9 items-center justify-center rounded-2xl bg-accent-500/15"
                  : "h-9 w-9 items-center justify-center rounded-full bg-white"
              }
            >
              <Ionicons
                name={hasSelection ? "location" : "location-outline"}
                size={18}
                color={isDark ? "#E6A817" : "#4A148C"}
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text
                className={isDark ? "text-sm text-white" : "text-sm text-slate-900"}
                numberOfLines={1}
              >
                {selection.kind === "none"
                  ? "Choose a venue"
                  : selectionLabel(selection)}
              </Text>
              <Text
                className={isDark ? "pt-0.5 text-xs text-white/45" : "pt-0.5 text-xs text-slate-500"}
                numberOfLines={1}
              >
                {selection.kind === "venue"
                  ? venues.find((v) => v.id === selection.venueId)?.city ||
                    "League venue"
                  : venues.length === 0
                    ? "No venues yet - add one or use a one-off name"
                    : `${venues.length} venue${venues.length === 1 ? "" : "s"} available`}
              </Text>
            </View>
            {hasSelection ? (
              <Pressable
                onPress={clearSelection}
                hitSlop={10}
                className="rounded-lg px-2 py-1"
              >
                <Text
                  className={isDark ? "text-xs text-white/55" : "text-xs text-slate-500"}
                >
                  Clear
                </Text>
              </Pressable>
            ) : null}
            <Ionicons
              name={pickerOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={isDark ? "rgba(255,255,255,0.45)" : "#94a3b8"}
            />
          </Pressable>

          {pickerOpen ? (
            <View className={isDark ? "border-t border-white/10 bg-neutral-950/70" : "border-t border-slate-200 bg-white"}>
              {venues.length > 5 ? (
                <View
                  className={
                    isDark
                      ? "flex-row items-center gap-2 border-b border-white/10 px-3 py-2"
                      : "flex-row items-center gap-2 border-b border-slate-100 px-3 py-2"
                  }
                >
                  <Ionicons
                    name="search"
                    size={16}
                    color={isDark ? "rgba(255,255,255,0.45)" : "#94a3b8"}
                  />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search venues"
                    placeholderTextColor="#94a3b8"
                    autoCorrect={false}
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: isDark ? "#FFFFFF" : "#0f172a",
                      paddingVertical: 6,
                    }}
                  />
                  {query ? (
                    <Pressable onPress={() => setQuery("")} hitSlop={8}>
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={isDark ? "rgba(255,255,255,0.45)" : "#94a3b8"}
                      />
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 220 }}
              >
                <VenueOptionRow
                  label="No venue"
                  selected={selection.kind === "none"}
                  dark={isDark}
                  onPress={selectNone}
                />
                {filtered.map((venue) => {
                  const active =
                    selection.kind === "venue" &&
                    selection.venueId === venue.id;
                  const subtitle = [venue.city, venue.address]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <VenueOptionRow
                      key={venue.id}
                      label={venue.name}
                      subtitle={subtitle || undefined}
                      selected={active}
                      dark={isDark}
                      showPin={
                        venue.latitude != null && venue.longitude != null
                      }
                      onPress={() => selectVenue(venue)}
                    />
                  );
                })}
                {filtered.length === 0 ? (
                  <Text
                    className={isDark ? "px-4 py-4 text-sm text-white/45" : "px-4 py-4 text-sm text-slate-500"}
                  >
                    No venues match “{query.trim()}”.
                  </Text>
                ) : null}
              </ScrollView>

              <View className={isDark ? "flex-row border-t border-white/10" : "flex-row border-t border-slate-100"}>
                <Pressable
                  onPress={() => setFormOpen(true)}
                  className="flex-1 items-center py-3"
                >
                  <Text
                    className={isDark ? "text-sm text-accent-200" : "text-sm text-brand-700"}
                  >
                    Add venue
                  </Text>
                </Pressable>
                <View className={isDark ? "w-px bg-white/10" : "w-px bg-slate-100"} />
                <Pressable
                  onPress={enableOneOff}
                  className="flex-1 items-center py-3"
                >
                  <Text
                    className={isDark ? "text-sm text-white/60" : "text-sm text-slate-600"}
                  >
                    One-off name
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      )}

      <VenueFormSheet
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        leagueId={leagueId}
        variant={variant}
        onSaved={(created) => {
          selectVenue(created);
          setFormOpen(false);
        }}
      />
    </View>
  );
}

function VenueOptionRow({
  label,
  subtitle,
  selected,
  dark = false,
  showPin,
  onPress,
}: {
  label: string;
  subtitle?: string;
  selected: boolean;
  dark?: boolean;
  showPin?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 border-b px-3.5 py-3 ${
        dark
          ? selected
            ? "border-white/10 bg-accent-500/10"
            : "border-white/10 bg-transparent"
          : selected
            ? "border-slate-50 bg-brand-50"
            : "border-slate-50 bg-white"
      }`}
    >
      <View className="min-w-0 flex-1">
        <Text
          className={
            dark
              ? selected
                ? "text-sm text-accent-100"
                : "text-sm text-white"
              : selected
                ? "text-sm text-brand-800"
                : "text-sm text-slate-900"
          }
          numberOfLines={1}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            className={dark ? "pt-0.5 text-xs text-white/45" : "pt-0.5 text-xs text-slate-500"}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showPin ? (
        <Ionicons
          name="navigate-outline"
          size={14}
          color={dark ? "rgba(255,255,255,0.45)" : "#94a3b8"}
        />
      ) : null}
      {selected ? (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={dark ? "#E6A817" : "#4A148C"}
        />
      ) : (
        <View
          className={dark ? "h-5 w-5 rounded-full border border-white/20" : "h-5 w-5 rounded-full border border-slate-200"}
        />
      )}
    </Pressable>
  );
}

export function venuePayloadFromSelection(selection: GameVenueSelection): {
  venueId?: number | null;
  venueName?: string | null;
} {
  if (selection.kind === "venue") {
    return { venueId: selection.venueId };
  }
  if (selection.kind === "one_off") {
    const name = selection.venueName.trim();
    return name
      ? { venueId: null, venueName: name }
      : { venueId: null, venueName: null };
  }
  return { venueId: null, venueName: null };
}
