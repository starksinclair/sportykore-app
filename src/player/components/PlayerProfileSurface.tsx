import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";

import type {
  ApiPlayer,
  ApiPlayerAward,
  ApiPlayerHighlight,
  ApiPlayerLeague,
  ApiStatType,
  PlayerPosition,
} from "@/api/entities";
import {
  Button,
  CountryPicker,
  NativeDatePickerField,
  type CountryPickerOption,
} from "@/components/ui";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { colors } from "@/constants";
import { pickProfileImage } from "@/lib/pick-profile-image";
import type { PickedImageFile } from "@/lib/picked-image";
import { posthog } from "@/lib/posthog";
import { labelForPosition } from "@/lib/positions";
import {
  messageFromThrown,
  showInfoToast,
  showThrownAsToast,
} from "@/lib/show-error-toast";

import type {
  PlayerMembership,
  PlayerProfileMissingField,
} from "../api";
import {
  useHighlightMutations,
  useOwnHighlights,
  usePlayerProfileMutations,
} from "../hooks";
import { aggregatePlayerStats, collectAllStats, countAllGames } from "../utils";

const POSITIONS: PlayerPosition[] = [
  "goalkeeper",
  "defence",
  "midfield",
  "attack",
];

const FOOT_OPTIONS: {
  value: "left" | "right" | "both";
  label: string;
}[] = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "both", label: "Both" },
];

const MISSING_COPY: Record<PlayerProfileMissingField, string> = {
  photo: "Add photo",
  bio: "Add bio",
  primaryPosition: "Pick position",
  preferredFoot: "Pick foot",
  dateOfBirth: "Add age",
  city: "Add city",
  highlights: "Add highlight",
};

type PlayerProfileViewProps = {
  player: ApiPlayer;
  leagues: ApiPlayerLeague[];
  statTypes: ApiStatType[];
  isOwner: boolean;
  completeness?: number;
  missingFields?: PlayerProfileMissingField[];
  membership?: PlayerMembership;
  viewerName?: string;
};

export function PlayerProfileView({
  player,
  leagues,
  statTypes,
  isOwner,
  completeness,
  missingFields = [],
  membership,
  viewerName,
}: PlayerProfileViewProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [editInitialStep, setEditInitialStep] = useState<1 | 2>(1);
  const [addHighlightOpen, setAddHighlightOpen] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const ownHighlights = useOwnHighlights(isOwner);
  const highlights =
    isOwner && ownHighlights.data
      ? ownHighlights.data
      : player.highlights ?? [];
  const stats = useMemo(
    () => aggregatePlayerStats(collectAllStats(leagues)),
    [leagues],
  );
  const gamesPlayed = useMemo(() => countAllGames(leagues), [leagues]);
  const activeSeason = leagues[0]?.seasons[0] ?? null;
  const primaryPosition = player.primaryPosition ?? player.position ?? null;
  const showCompleteness =
    isOwner &&
    !nudgeDismissed &&
    typeof completeness === "number" &&
    completeness < 80;

  if (player.visibility === "private") {
    return <PrivateProfileState />;
  }

  return (
    <View className="gap-5 pb-10">
      <View className="gap-4 rounded-[28px] bg-white/6 px-5 py-5">
        <View className="flex-row items-center gap-4">
          <PlayerAvatar player={player} size={88} />
          <View className="min-w-0 flex-1 gap-1">
            <Text
              className="text-2xl text-white"
              numberOfLines={2}
            >
              {player.name}
            </Text>
            <Text
              className="text-sm text-white/60"
              numberOfLines={2}
            >
              {[player.age != null ? `${player.age} yrs` : null, primaryPosition ? labelForPosition(primaryPosition) : null]
                .filter(Boolean)
                .join(" · ") || "Player profile"}
            </Text>
            {activeSeason?.team ? (
              <Text
                className="text-sm text-[#E6A817]"
                numberOfLines={1}
              >
                {activeSeason.team.name}
                {leagues[0] ? ` · ${leagues[0].name}` : ""}
              </Text>
            ) : (
              <Text
                className="text-sm text-white/45"
              >
                Not in a league yet
              </Text>
            )}
          </View>
        </View>

        {player.bio ? (
          <Text
            className="text-sm leading-6 text-white/75"
          >
            {player.bio}
          </Text>
        ) : isOwner ? (
          <Text
            className="text-sm leading-6 text-white/50"
          >
            Add a short bio so league admins and teammates know your game.
          </Text>
        ) : null}

        {isOwner ? (
          <View className="flex-row gap-2">
            <Button
              variant="accent"
              label="Edit profile"
              className="h-11 flex-1 px-4"
              onPress={() => {
                setEditInitialStep(1);
                setEditOpen(true);
              }}
            />
            <Button
              variant="secondary"
              label="Join league"
              className="h-11 flex-1 px-4"
              onPress={() => router.push("/join-league")}
            />
          </View>
        ) : null}
      </View>

      {showCompleteness ? (
        <CompletenessNudge
          completeness={completeness}
          missingFields={missingFields}
          onDismiss={() => setNudgeDismissed(true)}
          onPick={(field) => {
            if (field === "highlights") {
              setAddHighlightOpen(true);
              return;
            }
            setEditInitialStep(
              field === "bio" || field === "city" ? 2 : 1,
            );
            setEditOpen(true);
          }}
        />
      ) : null}

      {!membership?.inLeague && isOwner ? (
        <View className="flex-row items-center gap-3 rounded-[20px] border border-accent-400/25 bg-accent-500/10 px-4 py-4">
          <Ionicons name="people-outline" size={22} color="#E6A817" />
          <View className="min-w-0 flex-1">
            <Text className="text-white">
              Join a league
            </Text>
            <Text className="text-xs text-white/55">
              Your profile will show your club status once you join a roster.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/join-league")}
            className="rounded-full bg-accent-500 px-3 py-2"
          >
            <Text
              className="text-xs text-neutral-950"
            >
              Join
            </Text>
          </Pressable>
        </View>
      ) : null}

      <HighlightsSection
        highlights={highlights}
        isOwner={isOwner}
        playerId={player.id}
        loading={isOwner && ownHighlights.isLoading}
        onAdd={() => setAddHighlightOpen(true)}
      />

      <CareerStatsSection
        goals={stats.goals}
        assists={stats.assists}
        cards={stats.cards}
        gamesPlayed={gamesPlayed}
      />

      <AwardsSection awards={player.awards ?? []} />

      <DetailsSection player={player} />

      {isOwner ? (
        <>
          <PlayerProfileFormSheet
            visible={editOpen}
            mode="edit"
            player={player}
            viewerName={viewerName}
            initialStep={editInitialStep}
            onClose={() => setEditOpen(false)}
          />
          <HighlightFormSheet
            visible={addHighlightOpen}
            onClose={() => setAddHighlightOpen(false)}
            playerId={player.id}
          />
        </>
      ) : null}
    </View>
  );
}

export function PlayerProfileCreateState({
  viewerName,
  title = "Create player profile",
  description = "Build a permanent profile that follows you across leagues, with your stats, clubs, and highlights in one place.",
  ctaLabel = "Create profile",
  onCreated,
}: {
  viewerName?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  onCreated?: (player: ApiPlayer) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View className="gap-5 pb-10">
      <View className="items-center gap-4 rounded-[28px] bg-white/6 px-5 py-8">
        <View className="h-20 w-20 items-center justify-center rounded-[24px] bg-[#4A148C]">
          <Ionicons name="person-add-outline" size={34} color="#E6A817" />
        </View>
        <View className="gap-2">
          <Text
            className="text-center text-2xl text-white"
          >
            {title}
          </Text>
          <Text
            className="text-center text-sm leading-6 text-white/60"
          >
            {description}
          </Text>
        </View>
        <Button
          variant="accent"
          label={ctaLabel}
          className="w-full"
          onPress={() => setOpen(true)}
        />
      </View>
      <PlayerProfileFormSheet
        visible={open}
        mode="create"
        viewerName={viewerName}
        initialStep={1}
        onClose={() => setOpen(false)}
        onSaved={onCreated}
      />
    </View>
  );
}

function PlayerAvatar({ player, size }: { player: ApiPlayer; size: number }) {
  const initials = playerInitials(player.name);
  if (player.avatarUrl) {
    return (
      <Image
        source={{ uri: player.avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 3 }}
        contentFit="cover"
      />
    );
  }
  return (
    <View
      className="items-center justify-center border border-accent-300/40 bg-[#4A148C]"
      style={{ width: size, height: size, borderRadius: size / 3 }}
    >
      <Text
        className="text-2xl text-[#E6A817]"
      >
        {initials}
      </Text>
    </View>
  );
}

function CompletenessNudge({
  completeness,
  missingFields,
  onDismiss,
  onPick,
}: {
  completeness: number;
  missingFields: PlayerProfileMissingField[];
  onDismiss: () => void;
  onPick: (field: PlayerProfileMissingField) => void;
}) {
  return (
    <View className="gap-3 rounded-[20px] border border-white/10 bg-white/5 px-4 py-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-white">
            Profile {completeness}% complete
          </Text>
          <Text className="text-xs text-white/50">
            Add a little more so your player card feels finished.
          </Text>
        </View>
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Ionicons name="close" size={18} color="rgba(255,255,255,0.55)" />
        </Pressable>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-white/10">
        <View
          className="h-full rounded-full bg-accent-500"
          style={{ width: `${Math.max(0, Math.min(100, completeness))}%` }}
        />
      </View>
      <View className="flex-row flex-wrap gap-2">
        {missingFields.map((field) => (
          <Pressable
            key={field}
            onPress={() => onPick(field)}
            className="rounded-full bg-white/8 px-3 py-1.5"
          >
            <Text
              className="text-xs text-white"
            >
              {MISSING_COPY[field]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function HighlightsSection({
  highlights,
  isOwner,
  playerId,
  loading,
  onAdd,
}: {
  highlights: ApiPlayerHighlight[];
  isOwner: boolean;
  playerId: number;
  loading: boolean;
  onAdd: () => void;
}) {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const mutations = useHighlightMutations(playerId);
  const atCap = highlights.length >= 10;
  const deletePending = mutations.remove.isPending;

  return (
    <Section
      title="Highlights"
      action={
        isOwner ? (
          <Pressable
            onPress={onAdd}
            disabled={atCap}
            className={atCap ? "opacity-45" : ""}
          >
            <Text
              className="text-xs text-accent-300"
            >
              Add
            </Text>
          </Pressable>
        ) : undefined
      }
    >
      {loading ? (
        <View className="items-center rounded-[20px] bg-white/5 py-8">
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : highlights.length ? (
        <>
          {atCap && isOwner ? (
            <Text className="text-xs text-white/45">
              You have 10 highlights. Delete one before adding another.
            </Text>
          ) : null}
          <View className="flex-row flex-wrap">
            {highlights.map((highlight) => (
              <HighlightCard
                key={highlight.id}
                item={highlight}
                isOwner={isOwner}
                playing={playingId === highlight.id}
                onPlay={() =>
                  setPlayingId((current) =>
                    current === highlight.id ? null : highlight.id,
                  )
                }
                onDelete={() => {
                  if (deletePending) return;
                  Alert.alert(
                    "Delete highlight",
                    "Remove this highlight from your profile?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => void mutations.remove.mutateAsync(highlight.id),
                      },
                    ],
                  );
                }}
                deletePending={deletePending}
              />
            ))}
          </View>
        </>
      ) : (
        <View className="items-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-5 py-8">
          <Ionicons name="play-circle-outline" size={34} color="#E6A817" />
          <Text className="text-white">
            {isOwner ? "Add your first highlight" : "No highlights yet"}
          </Text>
          <Text
            className="text-center text-sm leading-6 text-white/55"
          >
            {isOwner
              ? "Paste a YouTube clip to make this profile feel alive."
              : "Highlights will appear here when this player adds clips."}
          </Text>
          {isOwner ? (
            <Button
              variant="accent"
              label="Add YouTube clip"
              className="h-11 px-4"
              onPress={onAdd}
            />
          ) : null}
        </View>
      )}
    </Section>
  );
}

function HighlightCard({
  item,
  isOwner,
  playing,
  onPlay,
  onDelete,
  deletePending,
}: {
  item: ApiPlayerHighlight;
  isOwner: boolean;
  playing: boolean;
  onPlay: () => void;
  onDelete: () => void;
  deletePending: boolean;
}) {
  const thumbnail =
    item.thumbnailUrl ?? `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`;
  return (
    <View className="w-1/2 p-1">
      <View className="overflow-hidden rounded-[18px] border border-white/10 bg-white/5">
        {playing ? (
          <YoutubePlayer height={116} play videoId={item.videoId} />
        ) : (
          <Pressable onPress={onPlay}>
            <Image
              source={{ uri: thumbnail }}
              style={{ width: "100%", aspectRatio: 16 / 9 }}
              contentFit="cover"
            />
            <View className="absolute inset-0 items-center justify-center bg-black/20">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-black/55">
                <Ionicons name="play" size={20} color="#FFFFFF" />
              </View>
            </View>
          </Pressable>
        )}
        <View className="gap-2 px-3 py-3">
          <Text
            className="text-xs text-white"
            numberOfLines={2}
          >
            {item.title?.trim() || "Untitled highlight"}
          </Text>
          {isOwner ? (
            <View className="flex-row justify-end">
              <IconButton
                icon="trash-outline"
                onPress={onDelete}
                danger
                disabled={deletePending}
              />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function CareerStatsSection({
  goals,
  assists,
  cards,
  gamesPlayed,
}: {
  goals: number;
  assists: number;
  cards: number;
  gamesPlayed: number;
}) {
  if (gamesPlayed === 0) {
    return (
      <Section title="Career stats">
        <View className="items-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-5 py-8">
          <Ionicons name="stats-chart-outline" size={30} color="rgba(255,255,255,0.55)" />
          <Text className="text-white">
            No games played yet
          </Text>
          <Text className="text-center text-sm text-white/50">
            Stats will appear after this player records match minutes.
          </Text>
        </View>
      </Section>
    );
  }

  return (
    <Section title="Career stats">
      <View className="flex-row flex-wrap gap-3">
        <StatCard icon="person-outline" label="Games" value={gamesPlayed} />
        <StatCard icon="football-outline" label="Goals" value={goals} />
        <StatCard icon="git-merge-outline" label="Assists" value={assists} />
        <StatCard icon="warning-outline" label="Cards" value={cards} />
      </View>
    </Section>
  );
}

function AwardsSection({ awards }: { awards: ApiPlayerAward[] }) {
  const router = useRouter();
  const motmAwards = awards.filter((award) => award.awardType === "motm");

  if (motmAwards.length === 0) {
    return null;
  }

  return (
    <Section title="Awards">
      <View className="gap-3 rounded-[22px] border border-accent-400/20 bg-accent-500/10 px-4 py-4">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-accent-500">
            <Ionicons name="star" size={21} color={colors.darkLabel} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-white">
              {motmAwards.length === 1
                ? "1 man of the match"
                : `${motmAwards.length} man of the match awards`}
            </Text>
            <Text className="pt-1 text-xs text-accent-100/70">
              Awarded from official Match Center selections.
            </Text>
          </View>
        </View>

        {motmAwards.slice(0, 4).map((award) => (
          <Pressable
            key={award.id}
            onPress={() => award.gameId && router.push(`/match/${award.gameId}`)}
            accessibilityRole="button"
            accessibilityLabel="Open match"
            className="flex-row items-center justify-between gap-3 rounded-2xl bg-black/15 px-3 py-3 active:opacity-90"
          >
            <View className="min-w-0 flex-1">
              <Text className="text-sm text-accent-100" numberOfLines={1}>
                {award.game?.homeTeam?.name ?? "Home"} vs{" "}
                {award.game?.awayTeam?.name ?? "Away"}
              </Text>
              <Text className="pt-1 text-xs text-accent-100/60">
                Man of the match
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.accent} />
          </Pressable>
        ))}
      </View>
    </Section>
  );
}

function DetailsSection({ player }: { player: ApiPlayer }) {
  const rows = [
    { label: "Preferred foot", value: player.preferredFoot },
    { label: "Height", value: formatHeight(player.heightCm) },
    {
      label: "Location",
      value: [player.city, player.state].filter(Boolean).join(", ") || null,
    },
    { label: "Nationality", value: player.nationality },
    { label: "Social", value: player.socialHandle },
  ];
  const hasDetails = rows.some((row) => row.value);
  return (
    <Section title="Details">
      {hasDetails ? (
        <View className="overflow-hidden rounded-[20px] border border-white/10 bg-white/5">
          {rows.map((row) => (
            <View
              key={row.label}
              className="flex-row items-center justify-between gap-3 border-b border-white/10 px-4 py-3"
            >
                <Text className="text-sm text-white/45">
                {row.label}
              </Text>
              <Text
                className="min-w-0 flex-1 text-right text-sm text-white"
                numberOfLines={1}
              >
                {row.value ?? "-"}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-sm text-white/50">
          Profile details will appear here as they are added.
        </Text>
      )}
    </Section>
  );
}

function PlayerProfileFormSheet({
  visible,
  mode,
  player,
  viewerName,
  initialStep,
  onClose,
  onSaved,
}: {
  visible: boolean;
  mode: "create" | "edit";
  player?: ApiPlayer;
  viewerName?: string;
  initialStep: 1 | 2;
  onClose: () => void;
  onSaved?: (player: ApiPlayer) => void | Promise<void>;
}) {
  const mutations = usePlayerProfileMutations();
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [name, setName] = useState(player?.name ?? viewerName ?? "");
  const [country, setCountry] = useState<CountryPickerOption | null>(
    player?.country ?? null,
  );
  const [bio, setBio] = useState(player?.bio ?? "");
  const [primaryPosition, setPrimaryPosition] = useState<PlayerPosition | null>(
    player?.primaryPosition ?? player?.position ?? null,
  );
  const [secondaryPosition, setSecondaryPosition] =
    useState<PlayerPosition | null>(player?.secondaryPosition ?? null);
  const [preferredFoot, setPreferredFoot] =
    useState<"left" | "right" | "both" | null>(player?.preferredFoot ?? null);
  const [heightCm, setHeightCm] = useState(
    player?.heightCm ? String(player.heightCm) : "",
  );
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null);
  const [city, setCity] = useState(player?.city ?? "");
  const [state, setState] = useState(player?.state ?? "");
  const [nationality, setNationality] = useState(player?.nationality ?? "");
  const [socialHandle, setSocialHandle] = useState(player?.socialHandle ?? "");
  const [photo, setPhoto] = useState<PickedImageFile | null>(null);
  const [pickingPhoto, setPickingPhoto] = useState(false);

  const isPending =
    mutations.create.isPending ||
    mutations.update.isPending ||
    mutations.photo.isPending;
  const maxDob = yearsAgo(5);
  const minDob = yearsAgo(70);

  useEffect(() => {
    if (!visible) return;
    setStep(initialStep);
    setName(player?.name ?? viewerName ?? "");
    setCountry(player?.country ?? null);
    setBio(player?.bio ?? "");
    setPrimaryPosition(player?.primaryPosition ?? player?.position ?? null);
    setSecondaryPosition(player?.secondaryPosition ?? null);
    setPreferredFoot(player?.preferredFoot ?? null);
    setHeightCm(player?.heightCm ? String(player.heightCm) : "");
    setDateOfBirth(null);
    setCity(player?.city ?? "");
    setState(player?.state ?? "");
    setNationality(player?.nationality ?? "");
    setSocialHandle(player?.socialHandle ?? "");
    setPhoto(null);
  }, [initialStep, player, viewerName, visible]);

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
    const parsedHeight = heightCm.trim() ? Number(heightCm.trim()) : null;
    if (parsedHeight != null && (!Number.isFinite(parsedHeight) || parsedHeight < 50 || parsedHeight > 250)) {
      showInfoToast("Check height", "Use a height between 50 and 250 cm.");
      return;
    }
    if (mode === "create" && (!name.trim() || !country)) {
      showInfoToast("Required fields", "Add your name and country.");
      return;
    }

    const payload = {
      name: name.trim() || undefined,
      countryId: country?.id,
      bio: bio.trim() || null,
      primaryPosition,
      secondaryPosition,
      preferredFoot,
      heightCm: parsedHeight,
      dateOfBirth,
      city: city.trim() || null,
      state: state.trim() || null,
      nationality: nationality.trim() || null,
      socialHandle: socialHandle.trim() || null,
    };

    try {
      let savedPlayer: ApiPlayer;
      if (mode === "create") {
        savedPlayer = await mutations.create.mutateAsync({
          ...payload,
          name: name.trim(),
          countryId: country!.id,
        });
      } else {
        savedPlayer = await mutations.update.mutateAsync(payload);
      }
      if (photo) {
        savedPlayer = await mutations.photo.mutateAsync(photo);
      }
      posthog?.capture(
        mode === "create" ? "player_profile_created" : "player_profile_updated",
        {
          has_photo: photo !== null,
          has_bio: Boolean(bio.trim()),
          has_primary_position: primaryPosition !== null,
          has_secondary_position: secondaryPosition !== null,
          has_preferred_foot: preferredFoot !== null,
        },
      );
      await onSaved?.(savedPlayer);
      onClose();
    } catch {
      /* toasted in hooks */
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={mode === "create" ? "Create player profile" : "Edit player profile"}
      subtitle={`Step ${step} of 2`}
    >
      <View className="gap-4">
        {step === 1 ? (
          <>
            <PhotoPicker
              currentUrl={player?.avatarUrl}
              photo={photo}
              picking={pickingPhoto}
              onPick={() => void handlePickPhoto()}
              onRemove={() => setPhoto(null)}
            />
            <AuthTextField
              label="Display name"
              value={name}
              onChangeText={setName}
              placeholder="Alex Morgan"
              autoCapitalize="words"
            />
            <CountryPicker
              value={country}
              onChange={setCountry}
              required={mode === "create"}
            />
            <PositionPicker
              label="Primary position"
              value={primaryPosition}
              onChange={setPrimaryPosition}
            />
            <PositionPicker
              label="Secondary position"
              value={secondaryPosition}
              onChange={setSecondaryPosition}
              allowClear
            />
            <FootPicker value={preferredFoot} onChange={setPreferredFoot} />
            <NativeDatePickerField
              label="Date of birth"
              value={dateOfBirth}
              onChange={setDateOfBirth}
              minimumDate={minDob}
              maximumDate={maxDob}
              helperText="Used to show your age on your profile."
            />
          </>
        ) : (
          <>
            <View className="gap-1">
              <AuthTextField
                label="Bio"
                value={bio}
                onChangeText={(text) => setBio(text.slice(0, 300))}
                placeholder="A few words about your game"
                multiline
              />
              <Text
                className="text-right text-xs text-slate-500"
              >
                {bio.length}/300
              </Text>
            </View>
            <View className="gap-1">
              <AuthTextField
                label="Height (cm)"
                value={heightCm}
                onChangeText={(text) => setHeightCm(text.replace(/[^\d]/g, ""))}
                keyboardType="number-pad"
                placeholder="175"
              />
              <Text className="text-xs leading-5 text-slate-500">
                {heightCm
                  ? formatHeight(Number(heightCm))
                  : "Optional. You can leave this blank."}
              </Text>
            </View>
            <AuthTextField
              label="City"
              value={city}
              onChangeText={setCity}
              placeholder="Lagos"
              autoCapitalize="words"
            />
            <AuthTextField
              label="State"
              value={state}
              onChangeText={setState}
              placeholder="Lagos"
              autoCapitalize="words"
            />
            <AuthTextField
              label="Nationality"
              value={nationality}
              onChangeText={setNationality}
              placeholder="Nigerian"
              autoCapitalize="words"
            />
            <AuthTextField
              label="Social handle"
              value={socialHandle}
              onChangeText={setSocialHandle}
              placeholder="@yourhandle"
              autoCapitalize="none"
            />
          </>
        )}

        <View className="flex-row gap-2">
          {step === 2 ? (
            <Button
              variant="secondary"
              label="Back"
              className="flex-1"
              onPress={() => setStep(1)}
            />
          ) : null}
          <Button
            variant={step === 1 ? "authPurple" : "accent"}
            label={step === 1 ? "Next" : mode === "create" ? "Create profile" : "Save profile"}
            className="flex-1"
            loading={isPending}
            disabled={isPending}
            onPress={() => {
              if (step === 1) {
                setStep(2);
                return;
              }
              void handleSave();
            }}
          />
        </View>
      </View>
    </BottomSheetModal>
  );
}

function formatHeight(heightCm?: number | null): string | null {
  if (!heightCm || !Number.isFinite(heightCm)) return null;
  const totalInches = Math.round(heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${heightCm} cm (${feet} ft ${inches} in)`;
}

function HighlightFormSheet({
  visible,
  onClose,
  playerId,
}: {
  visible: boolean;
  onClose: () => void;
  playerId: number;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const mutations = useHighlightMutations(playerId);

  const handleAdd = async () => {
    if (!url.trim()) {
      showInfoToast("YouTube URL required", "Paste a YouTube link.");
      return;
    }
    try {
      await mutations.create.mutateAsync({
        url: url.trim(),
        title: title.trim() || null,
      });
      setUrl("");
      setTitle("");
      onClose();
    } catch (error) {
      showInfoToast("Highlight rejected", messageFromThrown(error));
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Add highlight"
      subtitle="Paste a YouTube link. SportyKore will validate it."
    >
      <View className="gap-4">
        <AuthTextField
          label="YouTube URL"
          value={url}
          onChangeText={setUrl}
          placeholder="https://youtube.com/watch?v=..."
          autoCapitalize="none"
          keyboardType="url"
        />
        <View className="gap-1">
          <AuthTextField
            label="Title"
            value={title}
            onChangeText={(text) => setTitle(text.slice(0, 140))}
            placeholder="Optional"
          />
          <Text
            className="text-right text-xs text-slate-500"
          >
            {title.length}/140
          </Text>
        </View>
        <Button
          variant="authPurple"
          label="Add highlight"
          loading={mutations.create.isPending}
          disabled={mutations.create.isPending}
          onPress={() => void handleAdd()}
        />
      </View>
    </BottomSheetModal>
  );
}

function PhotoPicker({
  currentUrl,
  photo,
  picking,
  onPick,
  onRemove,
}: {
  currentUrl?: string | null;
  photo: PickedImageFile | null;
  picking: boolean;
  onPick: () => void;
  onRemove: () => void;
}) {
  const uri = photo?.uri ?? currentUrl;
  return (
    <View className="items-center gap-2">
      <Pressable
        onPress={onPick}
        className="h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border-2 border-dashed border-neutral-300 bg-neutral-50"
      >
        {picking ? (
          <ActivityIndicator color={colors.brand} />
        ) : uri ? (
          <Image
            source={{ uri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="items-center gap-1">
            <Ionicons name="camera-outline" size={26} color={colors.brand} />
            <Text className="text-xs text-slate-500">
              Add photo
            </Text>
          </View>
        )}
      </Pressable>
      {photo ? (
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text className="text-xs text-slate-500">
            Remove selected photo
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function PositionPicker({
  label,
  value,
  onChange,
  allowClear = false,
}: {
  label: string;
  value: PlayerPosition | null;
  onChange: (value: PlayerPosition | null) => void;
  allowClear?: boolean;
}) {
  return (
    <View className="gap-2">
      <Text
        className="text-[11px] uppercase tracking-wider text-slate-500"
      >
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {POSITIONS.map((position) => {
          const active = value === position;
          return (
            <Pressable
              key={position}
              onPress={() => onChange(position)}
              className={`rounded-xl border px-3 py-2 ${
                active ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-slate-50"
              }`}
            >
              <Text
                className={active ? "text-xs text-brand-700" : "text-xs text-slate-700"}
              >
                {labelForPosition(position)}
              </Text>
            </Pressable>
          );
        })}
        {allowClear ? (
          <Pressable
            onPress={() => onChange(null)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2"
          >
            <Text className="text-xs text-slate-500">
              None
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function FootPicker({
  value,
  onChange,
}: {
  value: "left" | "right" | "both" | null;
  onChange: (value: "left" | "right" | "both") => void;
}) {
  return (
    <View className="gap-2">
      <Text
        className="text-[11px] uppercase tracking-wider text-slate-500"
      >
        Preferred foot
      </Text>
      <View className="flex-row gap-2">
        {FOOT_OPTIONS.map((option) => {
          const active = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              className={`flex-1 rounded-xl border px-3 py-2 ${
                active ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-slate-50"
              }`}
            >
              <Text
                className={active ? "text-center text-sm text-brand-700" : "text-center text-sm text-slate-700"}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PrivateProfileState() {
  return (
    <View className="items-center gap-3 rounded-[28px] border border-white/10 bg-white/5 px-6 py-12">
      <Ionicons name="lock-closed-outline" size={34} color="rgba(255,255,255,0.65)" />
      <Text className="text-lg text-white">
        {"This profile isn't public"}
      </Text>
      <Text
        className="text-center text-sm leading-6 text-white/55"
      >
        This player has chosen to keep their profile private.
      </Text>
    </View>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: import("react").ReactNode;
  children: import("react").ReactNode;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text
          className="text-[12px] uppercase tracking-[2px] text-white/55"
        >
          {title}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
}) {
  return (
    <View className="min-w-[132px] flex-1 rounded-[20px] bg-white/6 px-4 py-4">
      <Ionicons name={icon} size={21} color="#E6A817" />
        <Text className="pt-3 text-2xl text-white">
        {value}
      </Text>
      <Text className="text-xs text-white/55">
        {label}
      </Text>
    </View>
  );
}

function IconButton({
  icon,
  onPress,
  danger = false,
  disabled = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`h-8 w-8 items-center justify-center rounded-full bg-white/8 ${
        disabled ? "opacity-45" : ""
      }`}
    >
      <Ionicons
        name={icon}
        size={15}
        color={danger ? "#FCA5A5" : "rgba(255,255,255,0.75)"}
      />
    </Pressable>
  );
}

function playerInitials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "SK"
  );
}

function yearsAgo(years: number): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
}
