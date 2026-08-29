import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import type { ApiVenue } from "@/api/entities";
import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { showThrownAsToast } from "@/lib/show-error-toast";

import { useDeleteVenue, useLeagueVenues } from "../../hooks";
import { ManageTabGuide } from "../ManageTabGuide";
import { VenueFormSheet } from "../venues/VenueFormSheet";

type Props = {
  leagueId: number;
};

export function ManageVenuesTab({ leagueId }: Props) {
  const { isDark } = useAppearance();
  const theme = useTheme();
  const { isTablet } = useAdaptiveLayout();
  const venuesQuery = useLeagueVenues(leagueId);
  const deleteMutation = useDeleteVenue(leagueId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<ApiVenue | null>(null);

  const venues = venuesQuery.data ?? [];

  const openAdd = () => {
    setEditingVenue(null);
    setFormOpen(true);
  };

  const openEdit = (venue: ApiVenue) => {
    setEditingVenue(venue);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingVenue(null);
  };

  const handleDelete = (venue: ApiVenue) => {
    if (deleteMutation.isPending) return;
    Alert.alert(
      "Delete venue",
      `Remove "${venue.name}" from this league? Past games keep the venue name but lose the map link.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(venue.id);
            } catch (err) {
              showThrownAsToast(err, "Could not delete venue");
            }
          },
        },
      ],
    );
  };

  return (
    <View className="gap-6 pb-8">
      <ManageTabGuide
        summary="Save reusable match locations so fixtures can show the right venue and map pin."
        items={[
          {
            icon: "location-outline",
            title: "Add venues",
            body: "Create stadiums, community pitches, or name-only grounds for scheduling.",
          },
          {
            icon: "map-outline",
            title: "Pin locations",
            body: "Set a map position so players and fans can find the match venue quickly.",
          },
          {
            icon: "create-outline",
            title: "Maintain venue details",
            body: "Edit addresses or remove outdated venue records as the season changes.",
          },
        ]}
      />

      <View
        className="rounded-[24px] border px-4 py-4"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        <View className="flex-row items-center gap-3">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: theme.accentMuted }}
          >
            <Ionicons name="location-outline" size={22} color={theme.accent} />
          </View>
          <View className="min-w-0 flex-1">
            <Text style={{ color: theme.text }}>
              League venues
            </Text>
            <Text
              className="text-xs leading-5"
              style={{ color: theme.textSubtle }}
              numberOfLines={2}
            >
              Reusable pitches for fixtures, maps, and directions.
            </Text>
          </View>
          <Pressable
            onPress={openAdd}
            accessibilityRole="button"
            accessibilityLabel="Add venue"
            className="h-10 flex-row items-center gap-1.5 rounded-full px-3 active:opacity-90"
            style={{ backgroundColor: theme.accent }}
          >
            <Ionicons name="add" size={16} color={theme.textInverse} />
            <Text
              className="text-xs"
              style={{ color: theme.textInverse }}
              numberOfLines={1}
            >
              Add
            </Text>
          </Pressable>
        </View>
      </View>

      {venuesQuery.isLoading ? (
        <View className="items-center py-12">
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : venues.length === 0 ? (
        <View
          className="items-center gap-3 rounded-[24px] border border-dashed px-5 py-8"
          style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
        >
          <View className="h-14 w-14 items-center justify-center rounded-[22px]" style={{ backgroundColor: theme.accentMuted }}>
            <Ionicons name="map-outline" size={26} color={theme.accent} />
          </View>
          <View className="gap-1">
            <Text
              className="text-center text-base"
              style={{ color: theme.text }}
            >
              No venues yet
            </Text>
            <Text
              className="text-center text-sm leading-6"
              style={{ color: theme.textSubtle }}
            >
              Add stadiums, community pitches, or name-only grounds for scheduling.
            </Text>
          </View>
          <Pressable
            onPress={openAdd}
            accessibilityRole="button"
            className="h-11 flex-row items-center gap-2 rounded-full px-4 active:opacity-90"
            style={{ backgroundColor: theme.accent }}
          >
            <Ionicons name="add" size={17} color={theme.textInverse} />
            <Text
              className="text-sm"
              style={{ color: theme.textInverse }}
            >
              Add venue
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className={isTablet ? "flex-row flex-wrap gap-3" : "gap-3"}>
          {venues.map((venue) => {
            const hasPin =
              venue.latitude != null && venue.longitude != null;
            return (
              <View
                key={venue.id}
                className="flex-row items-center gap-3 rounded-[22px] border px-4 py-4"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                  ...(isTablet ? { width: "48%" } : null),
                }}
              >
                <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: theme.cardMuted }}>
                  <Ionicons
                    name={hasPin ? "location" : "location-outline"}
                    size={22}
                    color={hasPin ? theme.accent : theme.textSubtle}
                  />
                </View>
                <View className="min-w-0 flex-1">
                  <Text
                    className="text-base"
                    style={{ color: theme.text }}
                    numberOfLines={1}
                  >
                    {venue.name}
                  </Text>
                  <Text
                    className="pt-0.5 text-sm"
                    style={{ color: theme.textSubtle }}
                    numberOfLines={1}
                  >
                    {[venue.city, venue.address].filter(Boolean).join(" · ") ||
                      (hasPin ? "Mapped location" : "Name only")}
                  </Text>
                </View>
                <Pressable
                  onPress={() => openEdit(venue)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${venue.name}`}
                  className="h-9 w-9 items-center justify-center rounded-xl active:opacity-85"
                  style={{ backgroundColor: theme.cardMuted }}
                >
                  <Ionicons name="create-outline" size={17} color={theme.textMuted} />
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(venue)}
                  disabled={deleteMutation.isPending}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${venue.name}`}
                  className={`h-9 w-9 items-center justify-center rounded-xl active:opacity-85 ${
                    deleteMutation.isPending ? "opacity-45" : ""
                  }`}
                  style={{ backgroundColor: theme.dangerMuted }}
                >
                  <Ionicons name="trash-outline" size={18} color={theme.danger} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <VenueFormSheet
        visible={formOpen}
        onClose={closeForm}
        leagueId={leagueId}
        venue={editingVenue}
        variant={isDark ? "dark" : "light"}
      />
    </View>
  );
}
