import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import type {
  ApiCoachLeagueHistory,
  ApiCoachProfile,
  CoachAvailability,
} from "@/api/entities";
import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import {
  BottomSheetModal,
  Button,
  CountryPicker,
  EntityLogo,
  FormFieldLabel,
  Input,
  RemoteImage,
  ShareIconButton,
  type CountryPickerOption,
} from "@/components/ui";
import { colors } from "@/constants";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { pickProfileImage } from "@/lib/pick-profile-image";
import type { PickedImageFile } from "@/lib/picked-image";
import { posthog } from "@/lib/posthog";
import { shareCoachProfile } from "@/lib/profile-share";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import {
  SOCIAL_PLATFORM_OPTIONS,
  compactSocialLinks,
  socialPlatformIcon,
  socialPlatformLabel,
  socialPlatformPlaceholder,
  toEditableSocialLinks,
  type EditableSocialLink,
  type SocialPlatform,
} from "@/player/social-links";

import { useCoachProfileMutations } from "../hooks";
import type { CoachProfilePayload } from "../api";

type CoachProfileViewProps = {
  coach: ApiCoachProfile;
  isOwner?: boolean;
  viewerName?: string;
};

const AVAILABILITY_OPTIONS: {
  value: CoachAvailability;
  label: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: "open",
    label: "Open",
    detail: "Available for coaching roles",
    icon: "checkmark-circle-outline",
  },
  {
    value: "consulting",
    label: "Consulting",
    detail: "Available for advisory work",
    icon: "chatbubbles-outline",
  },
  {
    value: "not_open",
    label: "Not open",
    detail: "Not currently looking",
    icon: "lock-closed-outline",
  },
];

export function CoachProfileView({
  coach,
  isOwner = false,
  viewerName,
}: CoachProfileViewProps) {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useAdaptiveLayout();
  const [editOpen, setEditOpen] = useState(false);

  if (coach.visibility === "private" && !isOwner) {
    return <PrivateCoachProfile coach={coach} />;
  }

  const availability = availabilityCopy(coach.availability);
  const location = [coach.city, coach.state, coach.country?.name]
    .filter(Boolean)
    .join(", ");
  const links = coach.socialLinks ?? [];
  const hasStory = Boolean(coach.philosophy);
  const handleShare = async () => {
    try {
      posthog?.capture("coach_profile_shared", {
        coach_id: coach.id,
        is_owner: isOwner,
        availability: coach.availability ?? null,
        has_experience: Boolean(coach.experience?.trim()),
        has_qualifications: Boolean(coach.qualifications?.trim()),
      });
      await shareCoachProfile({ coach });
    } catch (error) {
      showThrownAsToast(error);
    }
  };

  return (
    <>
      <View className="gap-5">
        <View
          className={isTablet ? "flex-row items-stretch gap-5" : "gap-4"}
        >
          <View
            className="overflow-hidden rounded-[24px] border"
            style={{
              flex: isTablet ? 0.95 : undefined,
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View className="gap-4 p-4">
              <View className="flex-row items-center gap-4">
                <CoachAvatar coach={coach} size={74} />
                <View className="min-w-0 flex-1 gap-1">
                  <Text
                    className="text-xl"
                    style={{ color: theme.text }}
                    numberOfLines={2}
                  >
                    {coach.displayName}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    <Pill icon={availability.icon} label={availability.label} />
                    {location ? <Pill icon="location-outline" label={location} /> : null}
                  </View>
                </View>
                <ShareIconButton
                  accessibilityLabel={`Share ${coach.displayName} coach profile`}
                  onPress={() => void handleShare()}
                />
              </View>

              {coach.bio ? (
                <Text className="text-sm leading-6" style={{ color: theme.textMuted }}>
                  {coach.bio}
                </Text>
              ) : isOwner ? (
                <EmptyCopy text="Add a short coaching bio so clubs and teams understand your profile quickly." />
              ) : null}

              {isOwner ? (
                <Button
                  variant="accent"
                  label="Edit coach profile"
                  icon={<Ionicons name="create-outline" size={18} color={colors.darkLabel} />}
                  iconPosition="left"
                  onPress={() => setEditOpen(true)}
                />
              ) : null}
            </View>
          </View>

          <View className="gap-5" style={{ flex: isTablet ? 1.05 : undefined }}>
            <Section title="Coaching Story">
              {hasStory ? (
                <View className="gap-4">
                  <StoryBlock title="Philosophy" value={coach.philosophy} />
                </View>
              ) : (
                <EmptyCopy
                  text={
                    isOwner
                      ? "Add your coaching philosophy."
                      : "Coaching details have not been added yet."
                  }
                />
              )}
            </Section>
          </View>
        </View>

        <CoachLeagueHistorySection
          leagues={coach.leagues ?? []}
          isOwner={isOwner}
          onOpenLeague={(leagueId) => router.push(`/league/${leagueId}`)}
          onOpenTeam={(teamId) => router.push(`/team/${teamId}`)}
        />

        <View className={isTablet ? "flex-row items-start gap-5" : "gap-5"}>
          <View style={{ flex: isTablet ? 1 : undefined }}>
            <LinksSection links={links} />
          </View>
          <View style={{ flex: isTablet ? 1 : undefined }}>
            <Section title="Details">
              <View className="gap-3">
                <DetailRow label="Availability" value={availability.detail} />
                <DetailRow label="Location" value={location || "Not added"} />
              </View>
            </Section>
          </View>
        </View>
      </View>

      {isOwner ? (
        <CoachProfileFormSheet
          visible={editOpen}
          mode="edit"
          coach={coach}
          viewerName={viewerName}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
    </>
  );
}

export function CoachProfileCreateState({
  viewerName,
}: {
  viewerName?: string;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <View
        className="gap-4 rounded-[24px] border px-5 py-6"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        <View
          className="h-14 w-14 items-center justify-center rounded-[22px]"
          style={{ backgroundColor: theme.accentMuted }}
        >
          <Ionicons name="school-outline" size={26} color={theme.accent} />
        </View>
        <View className="gap-2">
          <Text className="text-xl" style={{ color: theme.text }}>
            Create coach profile
          </Text>
          <Text className="text-sm leading-6" style={{ color: theme.textMuted }}>
            Show your coaching philosophy, availability, and public links in one profile.
          </Text>
        </View>
        <Button
          variant="accent"
          label="Create coach profile"
          icon={<Ionicons name="add" size={18} color={colors.darkLabel} />}
          iconPosition="left"
          onPress={() => setOpen(true)}
        />
      </View>
      <CoachProfileFormSheet
        visible={open}
        mode="create"
        viewerName={viewerName}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function CoachProfileFormSheet({
  visible,
  mode,
  coach,
  viewerName,
  onClose,
}: {
  visible: boolean;
  mode: "create" | "edit";
  coach?: ApiCoachProfile;
  viewerName?: string;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { isDark } = useAppearance();
  const mutations = useCoachProfileMutations();
  const [displayName, setDisplayName] = useState(coach?.displayName ?? viewerName ?? "");
  const [country, setCountry] = useState<CountryPickerOption | null>(coach?.country ?? null);
  const [bio, setBio] = useState(coach?.bio ?? "");
  const [experience, setExperience] = useState(coach?.experience ?? "");
  const [qualifications, setQualifications] = useState(coach?.qualifications ?? "");
  const [philosophy, setPhilosophy] = useState(coach?.philosophy ?? "");
  const [city, setCity] = useState(coach?.city ?? "");
  const [state, setState] = useState(coach?.state ?? "");
  const [availability, setAvailability] = useState<CoachAvailability>(
    coach?.availability ?? "open",
  );
  const [visibility, setVisibility] = useState<"public" | "private">(
    coach?.visibility ?? "public",
  );
  const [socialLinks, setSocialLinks] = useState<EditableSocialLink[]>(
    toEditableSocialLinks(coach?.socialLinks),
  );
  const [photo, setPhoto] = useState<PickedImageFile | null>(null);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const isPending =
    mutations.create.isPending || mutations.update.isPending || mutations.photo.isPending;

  useEffect(() => {
    // Reset only when the sheet opens, not on every background refetch of
    // `coach` while it's already open — otherwise a revalidation mid-edit
    // silently overwrites the user's unsaved changes.
    if (!visible) return;
    setDisplayName(coach?.displayName ?? viewerName ?? "");
    setCountry(coach?.country ?? null);
    setBio(coach?.bio ?? "");
    setExperience(coach?.experience ?? "");
    setQualifications(coach?.qualifications ?? "");
    setPhilosophy(coach?.philosophy ?? "");
    setCity(coach?.city ?? "");
    setState(coach?.state ?? "");
    setAvailability(coach?.availability ?? "open");
    setVisibility(coach?.visibility ?? "public");
    setSocialLinks(toEditableSocialLinks(coach?.socialLinks));
    setPhoto(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handlePickPhoto = async () => {
    setPickingPhoto(true);
    try {
      const picked = await pickProfileImage();
      if (picked) setPhoto(picked);
    } catch (error) {
      showThrownAsToast(error, "Could not pick photo");
    } finally {
      setPickingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      showInfoToast("Add a name", "Your coach profile needs a display name.");
      return;
    }

    const payload: CoachProfilePayload = {
      displayName: displayName.trim(),
      bio: bio.trim() || null,
      experience: experience.trim() || null,
      qualifications: qualifications.trim() || null,
      philosophy: philosophy.trim() || null,
      countryId: country?.id ?? null,
      city: city.trim() || null,
      state: state.trim() || null,
      availability,
      visibility,
      socialLinks: compactSocialLinks(socialLinks),
    };

    try {
      if (mode === "create") {
        await mutations.create.mutateAsync({ ...payload, displayName: displayName.trim() });
      } else {
        await mutations.update.mutateAsync(payload);
      }
      if (photo) {
        await mutations.photo.mutateAsync(photo);
      }
      onClose();
    } catch {
      /* toasted in hooks */
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={mode === "create" ? "Create coach profile" : "Edit coach profile"}
      subtitle="Build a public coaching card scouts, teams, and organizers can understand quickly."
      variant={isDark ? "dark" : "light"}
    >
      <View className="gap-3.5">
        <CoachPhotoPicker
          currentUrl={coach?.photoUrl}
          photo={photo}
          picking={pickingPhoto}
          displayName={displayName || viewerName || "Coach"}
          onPick={() => void handlePickPhoto()}
          onRemove={() => setPhoto(null)}
        />
        <FormGroup>
          <Input
            label="Display name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Coach name"
            autoCapitalize="words"
          />
          <AvailabilityPicker value={availability} onChange={setAvailability} />
        </FormGroup>
        <FormGroup>
          <View className="gap-1">
            <Input
              label="Bio"
              value={bio}
              onChangeText={(text) => setBio(text.slice(0, 300))}
              placeholder="Short profile summary"
              multiline
              className="min-h-[86px] py-3"
              textAlignVertical="top"
            />
            <Text className="text-right text-xs" style={{ color: theme.textSubtle }}>
              {bio.length}/300
            </Text>
          </View>
          <Input
            label="Philosophy"
            value={philosophy}
            onChangeText={setPhilosophy}
            placeholder="How you coach, develop players, and set up teams"
            multiline
            maxLength={1200}
            className="min-h-[82px] py-3"
            textAlignVertical="top"
          />
        </FormGroup>
        <FormGroup>
          <CountryPicker
            value={country}
            onChange={setCountry}
            label="Country"
            placeholder="Select country"
          />
          <View className="flex-row gap-3">
            <Input
              containerClassName="flex-1"
              label="City"
              value={city}
              onChangeText={setCity}
              placeholder="City"
              autoCapitalize="words"
            />
            <Input
              containerClassName="flex-1"
              label="State"
              value={state}
              onChangeText={setState}
              placeholder="State"
              autoCapitalize="words"
            />
          </View>
        </FormGroup>
        <SocialLinksEditor links={socialLinks} onChange={setSocialLinks} />
        <Button
          variant="accent"
          label={mode === "create" ? "Create profile" : "Save profile"}
          loading={isPending}
          disabled={isPending}
          onPress={() => void handleSave()}
        />
      </View>
    </BottomSheetModal>
  );
}

function FormGroup({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return (
    <View
      className="gap-3 rounded-[18px] border p-3"
      style={{ backgroundColor: theme.cardMuted, borderColor: theme.cardBorder }}
    >
      {children}
    </View>
  );
}

function CoachPhotoPicker({
  currentUrl,
  photo,
  picking,
  displayName,
  onPick,
  onRemove,
}: {
  currentUrl?: string | null;
  photo: PickedImageFile | null;
  picking: boolean;
  displayName: string;
  onPick: () => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const previewUri = photo?.uri ?? currentUrl ?? null;

  return (
    <View className="flex-row items-center gap-3 rounded-[18px] border p-3"
      style={{ backgroundColor: theme.cardMuted, borderColor: theme.cardBorder }}
    >
      <Pressable
        onPress={onPick}
        accessibilityRole="button"
        accessibilityLabel="Change coach photo"
        className="overflow-hidden rounded-[20px] active:opacity-85"
        style={{ width: 64, height: 64 }}
      >
        {previewUri ? (
          <RemoteImage
            uri={previewUri}
            previewEnabled={false}
            style={{ width: 64, height: 64, borderRadius: 20 }}
          />
        ) : (
          <InitialsAvatar name={displayName} size={64} />
        )}
      </Pressable>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="text-sm" style={{ color: theme.text }}>
          Coach photo
        </Text>
        <Text className="text-xs leading-5" style={{ color: theme.textSubtle }}>
          Square JPG, PNG, or WebP up to 10 MB.
        </Text>
      </View>
      {picking ? (
        <ActivityIndicator color={theme.accent} />
      ) : (
        <View className="flex-row gap-2">
          {photo ? (
            <Pressable
              onPress={onRemove}
              accessibilityRole="button"
              accessibilityLabel="Remove selected coach photo"
              className="h-10 w-10 items-center justify-center rounded-full active:opacity-80"
              style={{ backgroundColor: theme.dangerMuted }}
            >
              <Ionicons name="trash-outline" size={18} color={theme.danger} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={onPick}
            accessibilityRole="button"
            accessibilityLabel="Choose coach photo"
            className="h-10 w-10 items-center justify-center rounded-full bg-accent-500 active:opacity-80"
          >
            <Ionicons name="camera-outline" size={18} color={colors.darkLabel} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

function AvailabilityPicker({
  value,
  onChange,
}: {
  value: CoachAvailability;
  onChange: (value: CoachAvailability) => void;
}) {
  const theme = useTheme();
  const { isDark } = useAppearance();
  const [open, setOpen] = useState(false);
  const selected = availabilityCopy(value);

  const handleSelect = (nextValue: CoachAvailability) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <View className="gap-2">
      <FormFieldLabel label="Availability" />
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Availability: ${selected.label}`}
        className="flex-row items-center gap-3 rounded-2xl border px-3.5 py-3.5 active:opacity-80"
        style={{
          backgroundColor: theme.inputBackground,
          borderColor: theme.inputBorder,
        }}
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: theme.accentMuted }}
        >
          <Ionicons name={selected.icon} size={18} color={theme.accent} />
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-base" style={{ color: theme.text }} numberOfLines={1}>
            {selected.label}
          </Text>
          <Text
            className="text-xs"
            style={{ color: theme.textSubtle }}
            numberOfLines={1}
          >
            {selected.detail}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={theme.textMuted} />
      </Pressable>

      <BottomSheetModal
        visible={open}
        onClose={() => setOpen(false)}
        title="Availability"
        subtitle="Choose how teams and organizers should read your coach profile."
        variant={isDark ? "dark" : "light"}
      >
        <View className="gap-2">
          {AVAILABILITY_OPTIONS.map((option) => {
            const selectedOption = value === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedOption }}
                className="flex-row items-center gap-3 rounded-[16px] border px-3 py-3.5 active:opacity-80"
                style={{
                  backgroundColor: selectedOption ? theme.accentMuted : theme.inputBackground,
                  borderColor: selectedOption ? theme.accent : theme.inputBorder,
                }}
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: selectedOption ? theme.card : theme.cardMuted }}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={selectedOption ? theme.accent : theme.textSubtle}
                  />
                </View>
                <View className="min-w-0 flex-1 gap-0.5">
                  <Text className="text-sm" style={{ color: theme.text }}>
                    {option.label}
                  </Text>
                  <Text className="text-xs" style={{ color: theme.textSubtle }}>
                    {option.detail}
                  </Text>
                </View>
                {selectedOption ? (
                  <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheetModal>
    </View>
  );
}

function SocialLinksEditor({
  links,
  onChange,
}: {
  links: EditableSocialLink[];
  onChange: (links: EditableSocialLink[]) => void;
}) {
  const theme = useTheme();
  const usedPlatforms = new Set(links.map((link) => link.platform));
  const addablePlatform = SOCIAL_PLATFORM_OPTIONS.find(
    (option) => !usedPlatforms.has(option.value),
  )?.value;

  const updateLink = (index: number, patch: Partial<EditableSocialLink>) => {
    onChange(
      links.map((link, rowIndex) =>
        rowIndex === index ? { ...link, ...patch } : link,
      ),
    );
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, rowIndex) => rowIndex !== index));
  };

  return (
    <View className="gap-3">
      <View className="gap-1">
        <FormFieldLabel label="Profile links" />
        <Text className="text-xs leading-5" style={{ color: theme.textMuted }}>
          Add public coach links. YouTube must be a channel or profile, not a video.
        </Text>
      </View>
      {links.map((link, index) => (
        <View
          key={`${link.platform}-${index}`}
          className="gap-3 rounded-[18px] border p-3"
          style={{ backgroundColor: theme.cardMuted, borderColor: theme.cardBorder }}
        >
          <PlatformPicker
            value={link.platform}
            links={links}
            index={index}
            onChange={(platform) => updateLink(index, { platform })}
          />
          <Input
            label={`${socialPlatformLabel(link.platform)} link or handle`}
            value={link.url}
            onChangeText={(url) => updateLink(index, { url })}
            placeholder={socialPlatformPlaceholder(link.platform)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            maxLength={500}
          />
          <Button
            variant="secondary"
            label="Remove link"
            className="h-11"
            onPress={() => removeLink(index)}
          />
        </View>
      ))}
      {addablePlatform ? (
        <Pressable
          accessibilityRole="button"
          className="h-12 flex-row items-center justify-center gap-2 rounded-[13px] border px-4 active:opacity-80"
          style={{ backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }}
          onPress={() => onChange([...links, { platform: addablePlatform, url: "" }])}
        >
          <Ionicons name="add-circle-outline" size={18} color={theme.text} />
          <Text className="text-base" style={{ color: theme.text }} numberOfLines={1}>
            {links.length ? "Add another link" : "Add profile link"}
          </Text>
        </Pressable>
      ) : (
        <Text className="text-xs" style={{ color: theme.textSubtle }}>
          You have added every supported link type.
        </Text>
      )}
    </View>
  );
}

function PlatformPicker({
  value,
  links,
  index,
  onChange,
}: {
  value: SocialPlatform;
  links: EditableSocialLink[];
  index: number;
  onChange: (platform: SocialPlatform) => void;
}) {
  const theme = useTheme();

  return (
    <View className="flex-row flex-wrap gap-2">
      {SOCIAL_PLATFORM_OPTIONS.map((option) => {
        const selected = value === option.value;
        const usedElsewhere = links.some(
          (row, rowIndex) => rowIndex !== index && row.platform === option.value,
        );

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: usedElsewhere }}
            disabled={usedElsewhere}
            onPress={() => onChange(option.value)}
            className="flex-row items-center gap-1.5 rounded-full border px-3 py-2 active:opacity-80"
            style={{
              backgroundColor: selected ? theme.brandMuted : theme.inputBackground,
              borderColor: selected ? theme.brand : theme.inputBorder,
              opacity: usedElsewhere ? 0.45 : 1,
            }}
          >
            <Ionicons
              name={option.icon}
              size={14}
              color={selected ? theme.brand : theme.textSubtle}
            />
            <Text
              className="text-xs"
              style={{ color: selected ? theme.brand : theme.text }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function CoachLeagueHistorySection({
  leagues,
  isOwner,
  onOpenLeague,
  onOpenTeam,
}: {
  leagues: ApiCoachLeagueHistory[];
  isOwner: boolean;
  onOpenLeague: (leagueId: number) => void;
  onOpenTeam: (teamId: number) => void;
}) {
  const theme = useTheme();
  const { isDark } = useAppearance();
  const { isTablet } = useAdaptiveLayout();
  const { width } = useWindowDimensions();
  const cardWidth = isTablet ? 282 : Math.min(246, Math.max(214, width - 104));
  const activeCount = leagues.filter((item) => item.active).length;

  return (
    <Section title="League history">
      <View
        className="overflow-hidden rounded-[22px] border"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        <View
          className="flex-row items-center gap-3 border-b px-4 py-4"
          style={{ borderColor: theme.cardBorder }}
        >
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: theme.brandMuted }}
          >
            <Ionicons name="clipboard-outline" size={21} color={theme.brand} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm" style={{ color: theme.text }}>
              {activeCount > 0
                ? `${activeCount} current role${activeCount === 1 ? "" : "s"}`
                : `${leagues.length} league role${leagues.length === 1 ? "" : "s"}`}
            </Text>
            <Text
              className="pt-1 text-xs"
              style={{ color: theme.textSubtle }}
              numberOfLines={1}
            >
              Swipe through this coach timeline
            </Text>
          </View>
        </View>

        {leagues.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="max-h-[224px]"
            contentContainerStyle={{
              paddingHorizontal: isTablet ? 18 : 14,
              paddingBottom: 16,
              paddingTop: 12,
            }}
          >
            {leagues.map((item, index) => (
              <View
                key={item.id}
                style={{
                  width: cardWidth,
                  marginRight: index === leagues.length - 1 ? 0 : 14,
                }}
              >
                <Text className="text-lg" style={{ color: theme.accent }} numberOfLines={1}>
                  {formatHistoryYear(item.assignedAt)}
                </Text>

                <View className="h-8 flex-row items-center">
                  <View
                    className="h-[2px] flex-1"
                    style={{ backgroundColor: index === 0 ? "transparent" : theme.cardBorder }}
                  />
                  <View
                    className="h-4 w-4 rounded-full border-2"
                    style={{ backgroundColor: theme.accent, borderColor: theme.card }}
                  />
                  <View
                    className="h-[2px] flex-1"
                    style={{
                      backgroundColor:
                        index === leagues.length - 1 ? "transparent" : theme.cardBorder,
                    }}
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.league.name}`}
                  onPress={() => onOpenLeague(item.league.id)}
                  className="min-h-[138px] rounded-[18px] border p-3 active:opacity-85"
                  style={{ backgroundColor: theme.cardMuted, borderColor: theme.cardBorder }}
                >
                  <View className="flex-row items-start gap-2.5">
                    <EntityLogo
                      logoUrl={item.league.logoUrl ?? null}
                      variant="league"
                      size="sm"
                      tone={isDark ? "dark" : "light"}
                      previewEnabled={false}
                    />
                    <View className="min-w-0 flex-1">
                      <Text
                        className="text-sm leading-5"
                        style={{ color: theme.text }}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {item.league.name}
                      </Text>
                      <Text
                        className="pt-1 text-xs"
                        style={{ color: theme.textSubtle }}
                        numberOfLines={1}
                      >
                        Team admin
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${item.team.name}`}
                    onPress={(event) => {
                      event.stopPropagation();
                      onOpenTeam(item.team.id);
                    }}
                    className="mt-4 flex-row items-center gap-2 rounded-2xl px-3 py-2 active:opacity-85"
                    style={{ backgroundColor: theme.card }}
                  >
                    <EntityLogo
                      logoUrl={item.team.logoUrl}
                      variant="team"
                      size="xs"
                      tone={isDark ? "dark" : "light"}
                      previewEnabled={false}
                    />
                    <Text
                      className="min-w-0 flex-1 text-xs"
                      style={{ color: theme.text }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.team.name}
                    </Text>
                    <View
                      className="rounded-full px-2 py-1"
                      style={{
                        backgroundColor: item.active ? theme.accentMuted : theme.cardMuted,
                      }}
                    >
                      <Text
                        className="text-[10px]"
                        style={{ color: item.active ? theme.accent : theme.textSubtle }}
                      >
                        {item.active ? "Current" : "Past"}
                      </Text>
                    </View>
                  </Pressable>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View className="px-4 py-4">
            <Text className="text-sm leading-6" style={{ color: theme.textSubtle }}>
              {isOwner
                ? "League roles will appear here when you are assigned to manage a team."
                : "No league history has been added yet."}
            </Text>
          </View>
        )}
      </View>
    </Section>
  );
}

function formatHistoryYear(value?: string | null): string {
  if (!value) {
    return "Role";
  }

  const year = new Date(value).getFullYear();
  return Number.isFinite(year) ? String(year) : "Role";
}

function LinksSection({ links }: { links: ApiCoachProfile["socialLinks"] }) {
  const theme = useTheme();
  const rows = links ?? [];

  return (
    <Section title="Links">
      {rows.length ? (
        <View className="gap-2">
          {rows.map((link) => (
            <Pressable
              key={link.id}
              onPress={() => void openBrowserAsync(link.url)}
              accessibilityRole="link"
              accessibilityLabel={`Open ${socialPlatformLabel(link.platform)} profile`}
              className="flex-row items-center gap-3 rounded-[16px] border px-3 py-3 active:opacity-85"
              style={{ backgroundColor: theme.cardMuted, borderColor: theme.cardBorder }}
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.accentMuted }}
              >
                <Ionicons name={socialPlatformIcon(link.platform)} size={18} color={theme.accent} />
              </View>
              <View className="min-w-0 flex-1 gap-0.5">
                <Text className="text-sm" style={{ color: theme.text }}>
                  {socialPlatformLabel(link.platform)}
                </Text>
                <Text
                  className="text-xs"
                  style={{ color: theme.textSubtle }}
                  numberOfLines={1}
                >
                  {link.handle ?? link.url}
                </Text>
              </View>
              <Ionicons name="open-outline" size={18} color={theme.textSubtle} />
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyCopy text="No public links added yet." />
      )}
    </Section>
  );
}

function PrivateCoachProfile({ coach }: { coach: ApiCoachProfile }) {
  const theme = useTheme();

  return (
    <View
      className="items-center gap-4 rounded-[24px] border px-5 py-8"
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
    >
      <CoachAvatar coach={coach} size={74} />
      <View className="gap-2">
        <Text className="text-center text-xl" style={{ color: theme.text }}>
          {coach.displayName}
        </Text>
        <Text className="text-center text-sm leading-6" style={{ color: theme.textMuted }}>
          This coach profile is not public.
        </Text>
      </View>
    </View>
  );
}

function CoachAvatar({
  coach,
  size,
}: {
  coach: Pick<ApiCoachProfile, "displayName" | "photoUrl">;
  size: number;
}) {
  if (coach.photoUrl) {
    return (
      <RemoteImage
        uri={coach.photoUrl}
        previewEnabled
        previewLabel={coach.displayName}
        style={{ width: size, height: size, borderRadius: Math.min(24, size / 3) }}
      />
    );
  }

  return <InitialsAvatar name={coach.displayName} size={size} />;
}

function InitialsAvatar({ name, size }: { name: string; size: number }) {
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
    return (parts[0]?.slice(0, 2) || "SK").toUpperCase();
  }, [name]);

  return (
    <View
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: Math.min(24, size / 3),
        backgroundColor: colors.brand,
      }}
    >
      <Text style={{ color: colors.white, fontSize: size >= 70 ? 24 : 20 }}>
        {initials}
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();

  return (
    <View className="gap-3 rounded-[22px] border p-4"
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
    >
      <Text className="text-xs uppercase tracking-wide" style={{ color: theme.textSubtle }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function StoryBlock({ title, value }: { title: string; value?: string | null }) {
  const theme = useTheme();
  if (!value) return null;

  return (
    <View className="gap-1">
      <Text className="text-sm" style={{ color: theme.text }}>
        {title}
      </Text>
      <Text className="text-sm leading-6" style={{ color: theme.textMuted }}>
        {value}
      </Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="text-xs uppercase tracking-wide" style={{ color: theme.textSubtle }}>
        {label}
      </Text>
      <Text
        className="min-w-0 flex-1 text-right text-sm"
        style={{ color: theme.text }}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function Pill({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  const theme = useTheme();

  return (
    <View
      className="max-w-full flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5"
      style={{ backgroundColor: theme.accentMuted }}
    >
      <Ionicons name={icon} size={13} color={theme.accent} />
      <Text
        className="min-w-0 text-xs"
        style={{ color: theme.text }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
    </View>
  );
}

function EmptyCopy({ text }: { text: string }) {
  const theme = useTheme();

  return (
    <Text className="text-sm leading-6" style={{ color: theme.textSubtle }}>
      {text}
    </Text>
  );
}

function availabilityCopy(value?: CoachAvailability) {
  return (
    AVAILABILITY_OPTIONS.find((option) => option.value === value) ??
    AVAILABILITY_OPTIONS[0]
  );
}
