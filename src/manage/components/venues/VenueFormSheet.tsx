import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { Ionicons } from "@expo/vector-icons";

import type { ApiVenue } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

import {
  useCreateVenue,
  useLeagueVenues,
  useUpdateVenue,
} from "../../hooks";
import type { CreateVenuePayload } from "../../types";

type LocationMode = "choose" | "places" | "pin" | "name";

type Props = {
  visible: boolean;
  onClose: () => void;
  leagueId: number;
  venue?: ApiVenue | null;
  /** Called after successful create/update. Create may pass the matched venue after refetch. */
  onSaved?: (venue: ApiVenue) => void;
};

type FormState = {
  name: string;
  address: string;
  city: string;
  capacity: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  googlePlaceId: string | null;
};

const EMPTY_FORM: FormState = {
  name: "",
  address: "",
  city: "",
  capacity: "",
  notes: "",
  latitude: null,
  longitude: null,
  googlePlaceId: null,
};

const DEFAULT_REGION: Region = {
  latitude: 6.5244,
  longitude: 3.3792,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

function venueToForm(venue: ApiVenue): FormState {
  return {
    name: venue.name,
    address: venue.address ?? "",
    city: venue.city ?? "",
    capacity: venue.capacity != null ? String(venue.capacity) : "",
    notes: venue.notes ?? "",
    latitude: venue.latitude,
    longitude: venue.longitude,
    googlePlaceId: venue.googlePlaceId,
  };
}

function buildPayload(form: FormState): CreateVenuePayload | null {
  const name = form.name.trim();
  if (!name) {
    showInfoToast("Name required", "Enter a venue name.");
    return null;
  }

  let capacity: number | null = null;
  if (form.capacity.trim()) {
    const n = Number(form.capacity.trim());
    if (!Number.isInteger(n) || n < 0 || n > 999_999) {
      showInfoToast("Invalid capacity", "Capacity must be a whole number 0–999999.");
      return null;
    }
    capacity = n;
  }

  return {
    name,
    address: form.address.trim() || null,
    city: form.city.trim() || null,
    notes: form.notes.trim() || null,
    capacity,
    latitude: form.latitude,
    longitude: form.longitude,
    googlePlaceId: form.googlePlaceId,
  };
}

export function VenueFormSheet({
  visible,
  onClose,
  leagueId,
  venue = null,
  onSaved,
}: Props) {
  const isEdit = venue != null;
  const createMutation = useCreateVenue(leagueId);
  const updateMutation = useUpdateVenue(leagueId);
  const venuesQuery = useLeagueVenues(leagueId, visible);

  const [mode, setMode] = useState<LocationMode>(isEdit ? "name" : "choose");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pinMapOpen, setPinMapOpen] = useState(false);
  const [sheetSuppressed, setSheetSuppressed] = useState(false);
  const [pinDraft, setPinDraft] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (venue) {
      setForm(venueToForm(venue));
      setMode(
        venue.googlePlaceId
          ? "places"
          : venue.latitude != null && venue.longitude != null
            ? "pin"
            : "name",
      );
    } else {
      setForm(EMPTY_FORM);
      setMode("choose");
    }
    setPinMapOpen(false);
    setSheetSuppressed(false);
    setPinDraft(null);
  }, [visible, venue]);

  // iOS cannot present a Modal while another is already presenting — dismiss sheet first, then open map.
  useEffect(() => {
    if (!sheetSuppressed || pinMapOpen || !visible) return;
    const timer = setTimeout(() => setPinMapOpen(true), 320);
    return () => clearTimeout(timer);
  }, [sheetSuppressed, pinMapOpen, visible]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const patchForm = (partial: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const resolveCreatedVenue = async (
    payload: CreateVenuePayload,
  ): Promise<ApiVenue | null> => {
    const refreshed = await venuesQuery.refetch();
    const list = refreshed.data ?? [];
    const name = payload.name.trim().toLowerCase();
    const matches = list.filter((v) => v.name.trim().toLowerCase() === name);
    if (matches.length === 0) return null;
    return matches.reduce((a, b) => (a.id > b.id ? a : b));
  };

  const handleSave = async () => {
    const payload = buildPayload(form);
    if (!payload) return;

    try {
      if (isEdit && venue) {
        await updateMutation.mutateAsync({ venueId: venue.id, payload });
        showInfoToast("Venue updated", `${payload.name} was saved.`);
        onSaved?.({ ...venue, ...payload });
        onClose();
        return;
      }

      await createMutation.mutateAsync(payload);
      const created = await resolveCreatedVenue(payload);
      showInfoToast("Venue added", `${payload.name} is ready to use.`);
      if (created) onSaved?.(created);
      onClose();
    } catch (err) {
      showThrownAsToast(
        err,
        isEdit ? "Could not update venue" : "Could not add venue",
      );
    }
  };

  const openPinMap = () => {
    setPinDraft({
      latitude: form.latitude ?? DEFAULT_REGION.latitude,
      longitude: form.longitude ?? DEFAULT_REGION.longitude,
    });
    setSheetSuppressed(true);
  };

  const closePinMap = () => {
    setPinMapOpen(false);
    setTimeout(() => setSheetSuppressed(false), 320);
  };

  const confirmPin = () => {
    if (!pinDraft) return;
    patchForm({
      latitude: pinDraft.latitude,
      longitude: pinDraft.longitude,
      googlePlaceId: null,
    });
    setMode("pin");
    setPinMapOpen(false);
    setTimeout(() => setSheetSuppressed(false), 320);
    if (!form.name.trim()) {
      showInfoToast("Name the pitch", "Enter a name for this location.");
    }
  };

  const showSharedFields = mode !== "choose";
  const sheetVisible = visible && !sheetSuppressed;
  const mapVisible = visible && pinMapOpen;

  return (
    <>
      <BottomSheetModal
        visible={sheetVisible}
        onClose={handleClose}
        title={isEdit ? "Edit venue" : "Add venue"}
        subtitle="League pitches for fixtures and directions"
        scrollEnabled={mode !== "places"}
      >
        <View className="gap-4">
          {!isEdit && mode === "choose" ? (
            <View className="gap-2">
              <ModeButton
                icon="search"
                label="Search Google Places"
                hint="Known stadiums and listed grounds"
                onPress={() => setMode("places")}
              />
              <ModeButton
                icon="locate"
                label="Drop pin on map"
                hint="Unlisted pitches with a real location"
                onPress={() => {
                  setMode("pin");
                  openPinMap();
                }}
              />
              <ModeButton
                icon="text"
                label="Name only"
                hint="No map — valid for scheduling"
                onPress={() => setMode("name")}
              />
            </View>
          ) : null}

          {!isEdit && mode !== "choose" ? (
            <Pressable
              onPress={() => {
                setMode("choose");
                setForm(EMPTY_FORM);
              }}
              className="self-start"
            >
              <Text
                style={{ fontFamily: fonts.bodySemibold }}
                className="text-sm text-brand-700"
              >
                ← Change location method
              </Text>
            </Pressable>
          ) : null}

          {mode === "places" ? (
            <View className="gap-2" style={{ zIndex: 10 }}>
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-xs uppercase tracking-wide text-slate-500"
              >
                Search places
              </Text>
              {!GOOGLE_MAPS_API_KEY ? (
                <Text
                  style={{ fontFamily: fonts.body }}
                  className="text-sm text-amber-700"
                >
                  Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to enable Places search.
                  You can still use Drop pin or Name only.
                </Text>
              ) : (
                <GooglePlacesAutocomplete
                  placeholder="Search for a pitch or stadium"
                  fetchDetails
                  enablePoweredByContainer={false}
                  debounce={300}
                  keyboardShouldPersistTaps="handled"
                  listViewDisplayed="auto"
                  query={{
                    key: GOOGLE_MAPS_API_KEY,
                    language: "en",
                  }}
                  onPress={(data, details) => {
                    const loc = details?.geometry?.location;
                    const address =
                      details?.formatted_address ?? data.description ?? "";
                    const city =
                      details?.address_components?.find((c) =>
                        c.types.includes("locality"),
                      )?.long_name ??
                      details?.address_components?.find((c) =>
                        c.types.includes("administrative_area_level_2"),
                      )?.long_name ??
                      "";
                    patchForm({
                      name: details?.name ?? data.structured_formatting?.main_text ?? data.description,
                      address,
                      city,
                      latitude: loc?.lat ?? null,
                      longitude: loc?.lng ?? null,
                      googlePlaceId: details?.place_id ?? data.place_id ?? null,
                    });
                  }}
                  styles={{
                    container: { flex: 0, zIndex: 10 },
                    textInput: {
                      height: 48,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      paddingHorizontal: 14,
                      fontSize: 15,
                      fontFamily: fonts.body,
                      color: "#0f172a",
                      backgroundColor: "#f8fafc",
                    },
                    listView: {
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      borderRadius: 12,
                      marginTop: 4,
                      backgroundColor: "#fff",
                      maxHeight: 220,
                    },
                    row: { paddingVertical: 12, paddingHorizontal: 12 },
                    description: { fontFamily: fonts.body, color: "#0f172a" },
                  }}
                  textInputProps={{
                    placeholderTextColor: "#94a3b8",
                  }}
                />
              )}
            </View>
          ) : null}

          {mode === "pin" ? (
            <View className="gap-2">
              <Pressable
                onPress={openPinMap}
                className="flex-row items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <Ionicons name="map-outline" size={22} color="#4A148C" />
                <View className="flex-1">
                  <Text
                    style={{ fontFamily: fonts.bodySemibold }}
                    className="text-sm text-slate-900"
                  >
                    {form.latitude != null && form.longitude != null
                      ? "Pin placed — tap to adjust"
                      : "Open map to drop pin"}
                  </Text>
                  {form.latitude != null && form.longitude != null ? (
                    <Text
                      style={{ fontFamily: fonts.body }}
                      className="pt-0.5 text-xs text-slate-500"
                    >
                      {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </Pressable>
            </View>
          ) : null}

          {showSharedFields ? (
            mode === "places" ? (
              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                style={{ maxHeight: 320 }}
                contentContainerStyle={{ gap: 16 }}
              >
                <SharedVenueFields
                  form={form}
                  patchForm={patchForm}
                  isEdit={isEdit}
                  isPending={isPending}
                  onSave={() => void handleSave()}
                />
              </ScrollView>
            ) : (
              <View className="gap-4">
                <SharedVenueFields
                  form={form}
                  patchForm={patchForm}
                  isEdit={isEdit}
                  isPending={isPending}
                  onSave={() => void handleSave()}
                />
              </View>
            )
          ) : null}
        </View>
      </BottomSheetModal>

      <Modal
        visible={mapVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closePinMap}
      >
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between border-b border-slate-200 px-4 pb-3 pt-14">
            <Pressable onPress={closePinMap} hitSlop={12}>
              <Text
                style={{ fontFamily: fonts.bodySemibold }}
                className="text-base text-slate-600"
              >
                Cancel
              </Text>
            </Pressable>
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-base text-slate-900"
            >
              Drop pin
            </Text>
            <Pressable onPress={confirmPin} hitSlop={12}>
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-base text-brand-700"
              >
                Done
              </Text>
            </Pressable>
          </View>
          <Text
            style={{ fontFamily: fonts.body }}
            className="px-4 py-2 text-sm text-slate-500"
          >
            Drag the pin to the pitch. You will name it on the next step.
          </Text>
          {pinDraft ? (
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                ...DEFAULT_REGION,
                latitude: pinDraft.latitude,
                longitude: pinDraft.longitude,
              }}
              onPress={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setPinDraft({ latitude, longitude });
              }}
            >
              <Marker
                coordinate={pinDraft}
                draggable
                onDragEnd={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setPinDraft({ latitude, longitude });
                }}
              />
            </MapView>
          ) : (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#4A148C" />
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

function SharedVenueFields({
  form,
  patchForm,
  isEdit,
  isPending,
  onSave,
}: {
  form: FormState;
  patchForm: (partial: Partial<FormState>) => void;
  isEdit: boolean;
  isPending: boolean;
  onSave: () => void;
}) {
  return (
    <>
      <AuthTextField
        label="Name *"
        value={form.name}
        onChangeText={(name) => patchForm({ name })}
        placeholder="Riverside Pitch 2"
      />
      <AuthTextField
        label="Address (optional)"
        value={form.address}
        onChangeText={(address) => patchForm({ address })}
        placeholder="Street or landmark"
      />
      <AuthTextField
        label="City (optional)"
        value={form.city}
        onChangeText={(city) => patchForm({ city })}
        placeholder="Lagos"
      />
      <AuthTextField
        label="Capacity (optional)"
        value={form.capacity}
        onChangeText={(capacity) => patchForm({ capacity })}
        keyboardType="number-pad"
        placeholder="500"
      />
      <AuthTextField
        label="Notes (optional)"
        value={form.notes}
        onChangeText={(notes) => patchForm({ notes })}
        placeholder="Astro turf, gate on Adeola St"
      />
      <Button
        variant="authPurple"
        label={
          isPending
            ? isEdit
              ? "Saving…"
              : "Adding…"
            : isEdit
              ? "Save changes"
              : "Add venue"
        }
        loading={isPending}
        disabled={isPending}
        onPress={onSave}
      />
    </>
  );
}

function ModeButton({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-50">
        <Ionicons name={icon} size={20} color="#4A148C" />
      </View>
      <View className="flex-1">
        <Text
          style={{ fontFamily: fonts.bodySemibold }}
          className="text-sm text-slate-900"
        >
          {label}
        </Text>
        <Text
          style={{ fontFamily: fonts.body }}
          className="pt-0.5 text-xs text-slate-500"
        >
          {hint}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
    </Pressable>
  );
}
