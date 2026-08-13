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
import { useTheme } from "@/color/use-theme";
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
  const theme = useTheme();
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
        className="text-xs uppercase tracking-wide"
        style={{ color: theme.textSubtle }}
      >
        Venue (optional)
      </Text>

      {venuesQuery.isLoading ? (
        <ActivityIndicator color={theme.brand} className="py-2" />
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
            inputRowStyle={{
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
            }}
            placeholderTextColor={theme.textSubtle}
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
                className="text-sm"
                style={{ color: theme.accent }}
              >
                Pick from league venues
              </Text>
            </Pressable>
            <Pressable onPress={clearSelection} hitSlop={8}>
              <Text
                className="text-sm"
                style={{ color: theme.textSubtle }}
              >
                Clear
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View
          className="overflow-hidden rounded-[18px] border"
          style={{
            backgroundColor: theme.cardMuted,
            borderColor: theme.cardBorder,
          }}
        >
          <Pressable
            onPress={() => setPickerOpen((open) => !open)}
            className="flex-row items-center gap-3 px-3.5 py-3"
          >
            <View
              className="h-9 w-9 items-center justify-center rounded-2xl"
              style={{ backgroundColor: theme.accentMuted }}
            >
              <Ionicons
                name={hasSelection ? "location" : "location-outline"}
                size={18}
                color={theme.accent}
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text
                className="text-sm"
                style={{ color: theme.text }}
                numberOfLines={1}
              >
                {selection.kind === "none"
                  ? "Choose a venue"
                  : selectionLabel(selection)}
              </Text>
              <Text
                className="pt-0.5 text-xs"
                style={{ color: theme.textSubtle }}
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
                  className="text-xs"
                  style={{ color: theme.textSubtle }}
                >
                  Clear
                </Text>
              </Pressable>
            ) : null}
            <Ionicons
              name={pickerOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={theme.textSubtle}
            />
          </Pressable>

          {pickerOpen ? (
            <View
              className="border-t"
              style={{
                backgroundColor: theme.surfaceRaised,
                borderColor: theme.cardBorder,
              }}
            >
              {venues.length > 5 ? (
                <View
                  className="flex-row items-center gap-2 border-b px-3 py-2"
                  style={{ borderColor: theme.cardBorder }}
                >
                  <Ionicons
                    name="search"
                    size={16}
                    color={theme.textSubtle}
                  />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search venues"
                    placeholderTextColor={theme.textSubtle}
                    autoCorrect={false}
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: theme.text,
                      paddingVertical: 6,
                    }}
                  />
                  {query ? (
                    <Pressable onPress={() => setQuery("")} hitSlop={8}>
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={theme.textSubtle}
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
                    className="px-4 py-4 text-sm"
                    style={{ color: theme.textSubtle }}
                  >
                    No venues match “{query.trim()}”.
                  </Text>
                ) : null}
              </ScrollView>

              <View
                className="flex-row border-t"
                style={{ borderColor: theme.cardBorder }}
              >
                <Pressable
                  onPress={() => setFormOpen(true)}
                  className="flex-1 items-center py-3"
                >
                  <Text
                    className="text-sm"
                    style={{ color: theme.accent }}
                  >
                    Add venue
                  </Text>
                </Pressable>
                <View
                  className="w-px"
                  style={{ backgroundColor: theme.cardBorder }}
                />
                <Pressable
                  onPress={enableOneOff}
                  className="flex-1 items-center py-3"
                >
                  <Text
                    className="text-sm"
                    style={{ color: theme.textMuted }}
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
  showPin,
  onPress,
}: {
  label: string;
  subtitle?: string;
  selected: boolean;
  showPin?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b px-3.5 py-3"
      style={{
        backgroundColor: selected ? theme.accentMuted : "transparent",
        borderColor: theme.cardBorder,
      }}
    >
      <View className="min-w-0 flex-1">
        <Text
          className="text-sm"
          style={{ color: selected ? theme.accent : theme.text }}
          numberOfLines={1}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            className="pt-0.5 text-xs"
            style={{ color: theme.textSubtle }}
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
          color={theme.textSubtle}
        />
      ) : null}
      {selected ? (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={theme.accent}
        />
      ) : (
        <View
          className="h-5 w-5 rounded-full border"
          style={{ borderColor: theme.inputBorder }}
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
