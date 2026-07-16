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
import { fonts } from "@/theme/fonts";

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
};

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
}: Props) {
  const venuesQuery = useLeagueVenues(leagueId, enabled);
  const venues = venuesQuery.data ?? [];
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
        style={{ fontFamily: fonts.bodyBold }}
        className="text-xs uppercase tracking-wide text-slate-500"
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
                style={{ fontFamily: fonts.bodySemibold }}
                className="text-sm text-brand-700"
              >
                Pick from league venues
              </Text>
            </Pressable>
            <Pressable onPress={clearSelection} hitSlop={8}>
              <Text
                style={{ fontFamily: fonts.body }}
                className="text-sm text-slate-500"
              >
                Clear
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <Pressable
            onPress={() => setPickerOpen((open) => !open)}
            className="flex-row items-center gap-3 px-3.5 py-3"
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
              <Ionicons
                name={hasSelection ? "location" : "location-outline"}
                size={18}
                color="#4A148C"
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text
                style={{ fontFamily: fonts.bodySemibold }}
                className="text-sm text-slate-900"
                numberOfLines={1}
              >
                {selection.kind === "none"
                  ? "Choose a venue"
                  : selectionLabel(selection)}
              </Text>
              <Text
                style={{ fontFamily: fonts.body }}
                className="pt-0.5 text-xs text-slate-500"
                numberOfLines={1}
              >
                {selection.kind === "venue"
                  ? venues.find((v) => v.id === selection.venueId)?.city ||
                    "League venue"
                  : venues.length === 0
                    ? "No venues yet — add one or use a one-off name"
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
                  style={{ fontFamily: fonts.bodySemibold }}
                  className="text-xs text-slate-500"
                >
                  Clear
                </Text>
              </Pressable>
            ) : null}
            <Ionicons
              name={pickerOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#94a3b8"
            />
          </Pressable>

          {pickerOpen ? (
            <View className="border-t border-slate-200 bg-white">
              {venues.length > 5 ? (
                <View className="flex-row items-center gap-2 border-b border-slate-100 px-3 py-2">
                  <Ionicons name="search" size={16} color="#94a3b8" />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search venues"
                    placeholderTextColor="#94a3b8"
                    autoCorrect={false}
                    style={{
                      flex: 1,
                      fontFamily: fonts.body,
                      fontSize: 14,
                      color: "#0f172a",
                      paddingVertical: 6,
                    }}
                  />
                  {query ? (
                    <Pressable onPress={() => setQuery("")} hitSlop={8}>
                      <Ionicons name="close-circle" size={16} color="#94a3b8" />
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
                      showPin={
                        venue.latitude != null && venue.longitude != null
                      }
                      onPress={() => selectVenue(venue)}
                    />
                  );
                })}
                {filtered.length === 0 ? (
                  <Text
                    style={{ fontFamily: fonts.body }}
                    className="px-4 py-4 text-sm text-slate-500"
                  >
                    No venues match “{query.trim()}”.
                  </Text>
                ) : null}
              </ScrollView>

              <View className="flex-row border-t border-slate-100">
                <Pressable
                  onPress={() => setFormOpen(true)}
                  className="flex-1 items-center py-3"
                >
                  <Text
                    style={{ fontFamily: fonts.bodySemibold }}
                    className="text-sm text-brand-700"
                  >
                    Add venue
                  </Text>
                </Pressable>
                <View className="w-px bg-slate-100" />
                <Pressable
                  onPress={enableOneOff}
                  className="flex-1 items-center py-3"
                >
                  <Text
                    style={{ fontFamily: fonts.bodySemibold }}
                    className="text-sm text-slate-600"
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
  showPin,
  onPress,
}: {
  label: string;
  subtitle?: string;
  selected: boolean;
  showPin?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 border-b border-slate-50 px-3.5 py-3 ${
        selected ? "bg-brand-50" : "bg-white"
      }`}
    >
      <View className="min-w-0 flex-1">
        <Text
          style={{ fontFamily: fonts.bodySemibold }}
          className={selected ? "text-sm text-brand-800" : "text-sm text-slate-900"}
          numberOfLines={1}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            style={{ fontFamily: fonts.body }}
            className="pt-0.5 text-xs text-slate-500"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showPin ? (
        <Ionicons name="navigate-outline" size={14} color="#94a3b8" />
      ) : null}
      {selected ? (
        <Ionicons name="checkmark-circle" size={20} color="#4A148C" />
      ) : (
        <View className="h-5 w-5 rounded-full border border-slate-200" />
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
