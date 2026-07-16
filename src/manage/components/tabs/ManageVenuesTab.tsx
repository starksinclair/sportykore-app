import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import type { ApiVenue } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

import { useDeleteVenue, useLeagueVenues } from "../../hooks";
import { VenueFormSheet } from "../venues/VenueFormSheet";

type Props = {
  leagueId: number;
};

export function ManageVenuesTab({ leagueId }: Props) {
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
      <View className="flex-row items-center justify-between gap-3">
        <Text
          style={{ fontFamily: fonts.body }}
          className="flex-1 text-sm text-white/55"
        >
          Reusable pitches for fixtures. Add map pins so fans can get directions.
        </Text>
        <Button
          variant="authPurple"
          label="Add venue"
          onPress={openAdd}
          className="h-11 px-4"
        />
      </View>

      {venuesQuery.isLoading ? (
        <View className="items-center py-12">
          <ActivityIndicator color="#E6A817" />
        </View>
      ) : venues.length === 0 ? (
        <View className="rounded-[22px] border border-dashed border-white/15 bg-white/5 px-5 py-8">
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className="text-base text-white"
          >
            No venues yet
          </Text>
          <Text
            style={{ fontFamily: fonts.body }}
            className="pt-2 text-sm leading-6 text-white/55"
          >
            Add stadiums, community pitches, or name-only grounds for scheduling.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {venues.map((venue) => {
            const hasPin =
              venue.latitude != null && venue.longitude != null;
            return (
              <View
                key={venue.id}
                className="flex-row items-center gap-3 rounded-[22px] bg-white/6 px-4 py-4"
              >
                <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
                  <Ionicons
                    name={hasPin ? "location" : "location-outline"}
                    size={22}
                    color={hasPin ? "#E6A817" : "rgba(255,255,255,0.45)"}
                  />
                </View>
                <View className="min-w-0 flex-1">
                  <Text
                    style={{ fontFamily: fonts.bodyBold }}
                    className="text-base text-white"
                    numberOfLines={1}
                  >
                    {venue.name}
                  </Text>
                  <Text
                    style={{ fontFamily: fonts.body }}
                    className="pt-0.5 text-sm text-white/50"
                    numberOfLines={1}
                  >
                    {[venue.city, venue.address].filter(Boolean).join(" · ") ||
                      (hasPin ? "Mapped location" : "Name only")}
                  </Text>
                </View>
                <Pressable
                  onPress={() => openEdit(venue)}
                  hitSlop={8}
                  className="rounded-lg bg-white/10 px-3 py-2"
                >
                  <Text
                    style={{ fontFamily: fonts.bodySemibold }}
                    className="text-xs text-white"
                  >
                    Edit
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(venue)}
                  hitSlop={8}
                  className="p-2"
                >
                  <Ionicons name="trash-outline" size={18} color="#f87171" />
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
      />
    </View>
  );
}
