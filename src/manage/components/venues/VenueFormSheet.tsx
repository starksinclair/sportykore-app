import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import MapView, { Marker, type Region } from "react-native-maps";

import type { ApiVenue } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { useCountries } from "@/country";
import {
  resolveCountryMapRegion,
  staticCountryMapRegion,
  type CountryMapRegion,
} from "@/lib/country-map-region";
import { GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";

import {
  useCreateVenue,
  useLeagueVenues,
  useManagedHub,
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
  variant?: "light" | "dark";
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

function showVenueSuccessToast(title: string, message: string) {
  setTimeout(() => showInfoToast(title, message), 280);
}

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
  variant = "light",
}: Props) {
  const isEdit = venue != null;
  const isDark = variant === "dark";
  const createMutation = useCreateVenue(leagueId);
  const updateMutation = useUpdateVenue(leagueId);
  const venuesQuery = useLeagueVenues(leagueId, visible);
  const managedHubQuery = useManagedHub(visible);
  const countriesQuery = useCountries();

  const [mode, setMode] = useState<LocationMode>(isEdit ? "name" : "choose");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pinMapOpen, setPinMapOpen] = useState(false);
  const [sheetSuppressed, setSheetSuppressed] = useState(false);
  const [countryRegion, setCountryRegion] = useState<CountryMapRegion | null>(null);
  const [pinRegion, setPinRegion] = useState<Region | null>(null);
  const [pinTouched, setPinTouched] = useState(false);
  const [pinDraft, setPinDraft] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const leagueCountry = useMemo(() => {
    const ownedLeague = managedHubQuery.data?.ownedLeagues.find(
      (league) => league.id === leagueId,
    );
    if (!ownedLeague) return null;
    return (
      countriesQuery.data?.find((country) => country.id === ownedLeague.countryId) ??
      null
    );
  }, [countriesQuery.data, leagueId, managedHubQuery.data?.ownedLeagues]);
  const fallbackRegion = countryRegion ?? DEFAULT_REGION;

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
    setPinRegion(null);
    setPinTouched(false);
  }, [visible, venue]);

  useEffect(() => {
    if (!visible || !leagueCountry) {
      setCountryRegion(null);
      return;
    }

    let cancelled = false;
    const staticRegion = staticCountryMapRegion(leagueCountry);
    setCountryRegion(staticRegion);

    void resolveCountryMapRegion(leagueCountry, GOOGLE_MAPS_API_KEY).then((region) => {
      if (!cancelled) setCountryRegion(region ?? staticRegion);
    });

    return () => {
      cancelled = true;
    };
  }, [leagueCountry, visible]);

  useEffect(() => {
    if (
      !pinMapOpen ||
      pinTouched ||
      !countryRegion ||
      form.latitude != null ||
      form.longitude != null
    ) {
      return;
    }

    setPinRegion(countryRegion);
    setPinDraft({
      latitude: countryRegion.latitude,
      longitude: countryRegion.longitude,
    });
  }, [countryRegion, form.latitude, form.longitude, pinMapOpen, pinTouched]);

  // iOS cannot present a Modal while another is already presenting - dismiss sheet first, then open map.
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
        onSaved?.({ ...venue, ...payload });
        onClose();
        showVenueSuccessToast("Venue updated", `${payload.name} was saved.`);
        return;
      }

      await createMutation.mutateAsync(payload);
      const created = await resolveCreatedVenue(payload);
      if (created) onSaved?.(created);
      onClose();
      showVenueSuccessToast("Venue added", `${payload.name} is ready to use.`);
    } catch (err) {
      showThrownAsToast(
        err,
        isEdit ? "Could not update venue" : "Could not add venue",
      );
    }
  };

  const openPinMap = () => {
    const hasSavedPin = form.latitude != null && form.longitude != null;
    const nextRegion: Region = hasSavedPin
      ? {
          ...fallbackRegion,
          latitude: form.latitude!,
          longitude: form.longitude!,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }
      : fallbackRegion;
    setPinRegion(nextRegion);
    setPinTouched(false);
    setPinDraft({
      latitude: nextRegion.latitude,
      longitude: nextRegion.longitude,
    });
    setSheetSuppressed(true);
  };

  const closePinMap = () => {
    setPinMapOpen(false);
    setPinRegion(null);
    setPinTouched(false);
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
    setPinRegion(null);
    setPinTouched(false);
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
        subtitle={
          isEdit
            ? "Update fixture location details and notes."
            : "Choose how this fixture location should be saved."
        }
        variant={variant}
        scrollEnabled={mode !== "places"}
      >
        <View className="gap-4">
          {!isEdit && mode === "choose" ? (
            <View className="gap-2">
              <ModeButton
                icon="search"
                label="Search Google Places"
                hint="Known stadiums and listed grounds"
                dark={isDark}
                onPress={() => setMode("places")}
              />
              <ModeButton
                icon="locate"
                label="Drop pin on map"
                hint="Unlisted pitches with a real location"
                dark={isDark}
                onPress={() => {
                  setMode("pin");
                  openPinMap();
                }}
              />
              <ModeButton
                icon="text"
                label="Name only"
                hint="No map - valid for scheduling"
                dark={isDark}
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
                className={isDark ? "text-sm text-accent-200" : "text-sm text-brand-700"}
              >
                ← Change location method
              </Text>
            </Pressable>
          ) : null}

          {mode === "places" ? (
            <View className="gap-2" style={{ zIndex: 10 }}>
              <Text
                className={
                  isDark
                    ? "text-xs uppercase tracking-wide text-white/50"
                    : "text-xs uppercase tracking-wide text-slate-500"
                }
              >
                Search places
              </Text>
              {!GOOGLE_MAPS_API_KEY ? (
                <Text
                  className={isDark ? "text-sm text-accent-200" : "text-sm text-amber-700"}
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
                    ...(leagueCountry?.code
                      ? { components: `country:${leagueCountry.code.toLowerCase()}` }
                      : {}),
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
                    description: { color: "#0f172a" },
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
                className={
                  isDark
                    ? "flex-row items-center gap-3 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3"
                    : "flex-row items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                }
              >
                <Ionicons name="map-outline" size={22} color={isDark ? "#E6A817" : "#4A148C"} />
                <View className="flex-1">
                  <Text
                    className={isDark ? "text-sm text-white" : "text-sm text-slate-900"}
                  >
                    {form.latitude != null && form.longitude != null
                      ? "Pin placed - tap to adjust"
                      : "Open map to drop pin"}
                  </Text>
                  {form.latitude != null && form.longitude != null ? (
                    <Text
                      className={isDark ? "pt-0.5 text-xs text-white/45" : "pt-0.5 text-xs text-slate-500"}
                    >
                      {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                    </Text>
                  ) : null}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={isDark ? "rgba(255,255,255,0.45)" : "#94a3b8"}
                />
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
                  dark={isDark}
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
                  dark={isDark}
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
                className="text-base text-slate-600"
              >
                Cancel
              </Text>
            </Pressable>
            <Text
              className="text-base text-slate-900"
            >
              Drop pin
            </Text>
            <Pressable onPress={confirmPin} hitSlop={12}>
              <Text
                className="text-base text-brand-700"
              >
                Done
              </Text>
            </Pressable>
          </View>
          <Text
            className="px-4 py-2 text-sm text-slate-500"
          >
            Drag the pin to the pitch. You will name it on the next step.
          </Text>
          {pinDraft ? (
            <MapView
              key={
                pinRegion
                  ? `${pinRegion.latitude}:${pinRegion.longitude}`
                  : "default-region"
              }
              style={{ flex: 1 }}
              initialRegion={{
                ...(pinRegion ?? DEFAULT_REGION),
                latitude: pinDraft.latitude,
                longitude: pinDraft.longitude,
              }}
              onPress={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setPinDraft({ latitude, longitude });
                setPinTouched(true);
              }}
            >
              <Marker
                coordinate={pinDraft}
                draggable
                onDragEnd={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setPinDraft({ latitude, longitude });
                  setPinTouched(true);
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
  dark,
  onSave,
}: {
  form: FormState;
  patchForm: (partial: Partial<FormState>) => void;
  isEdit: boolean;
  isPending: boolean;
  dark: boolean;
  onSave: () => void;
}) {
  return (
    <View className="gap-4">
      <VenueSheetBlock title="Venue details" dark={dark}>
      <AuthTextField
        label="Name *"
        labelClassName={dark ? "text-white/60" : undefined}
        value={form.name}
        onChangeText={(name) => patchForm({ name })}
        placeholder="Riverside Pitch 2"
      />
      <AuthTextField
        label="Address (optional)"
        labelClassName={dark ? "text-white/60" : undefined}
        value={form.address}
        onChangeText={(address) => patchForm({ address })}
        placeholder="Street or landmark"
      />
      <AuthTextField
        label="City (optional)"
        labelClassName={dark ? "text-white/60" : undefined}
        value={form.city}
        onChangeText={(city) => patchForm({ city })}
        placeholder="Lagos"
      />
      </VenueSheetBlock>
      <VenueSheetBlock title="Extras" dark={dark}>
      <AuthTextField
        label="Capacity (optional)"
        labelClassName={dark ? "text-white/60" : undefined}
        value={form.capacity}
        onChangeText={(capacity) => patchForm({ capacity })}
        keyboardType="number-pad"
        placeholder="500"
      />
      <AuthTextField
        label="Notes (optional)"
        labelClassName={dark ? "text-white/60" : undefined}
        value={form.notes}
        onChangeText={(notes) => patchForm({ notes })}
        placeholder="Astro turf, gate on Adeola St"
      />
      </VenueSheetBlock>
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
    </View>
  );
}

function VenueSheetBlock({
  title,
  dark,
  children,
}: {
  title: string;
  dark: boolean;
  children: ReactNode;
}) {
  return (
    <View
      className={
        dark
          ? "gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-3 py-3"
          : "gap-3"
      }
    >
      {dark ? (
        <Text 
          className="text-xs uppercase tracking-wide text-white/50"
        >
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

function ModeButton({
  icon,
  label,
  hint,
  dark = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  dark?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={
        dark
          ? "flex-row items-center gap-3 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3.5 active:bg-white/10"
          : "flex-row items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5"
      }
    >
      <View className={dark ? "h-10 w-10 items-center justify-center rounded-2xl bg-accent-500/15" : "h-10 w-10 items-center justify-center rounded-full bg-brand-50"}>
        <Ionicons name={icon} size={20} color={dark ? "#E6A817" : "#4A148C"} />
      </View>
      <View className="flex-1">
        <Text
          className={dark ? "text-sm text-white" : "text-sm text-slate-900"}
        >
          {label}
        </Text>
        <Text
          className={dark ? "pt-0.5 text-xs text-white/45" : "pt-0.5 text-xs text-slate-500"}
        >
          {hint}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={dark ? "rgba(255,255,255,0.45)" : "#94a3b8"}
      />
    </Pressable>
  );
}
