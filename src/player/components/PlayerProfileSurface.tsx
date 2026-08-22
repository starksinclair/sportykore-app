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
import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { colors } from "@/constants";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
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
import {
  formatSocialProfile,
  parseSocialProfile,
  SOCIAL_PLATFORM_OPTIONS,
  socialPlatformLabel,
  type SocialPlatform,
} from "../social-profile";
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
  const { isTablet } = useAdaptiveLayout();
  const theme = useTheme();
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
      <View
        className={isTablet ? "gap-5 rounded-[28px] border px-6 py-6" : "gap-4 rounded-[28px] border px-5 py-5"}
        style={{
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
        }}
      >
        <View className={isTablet ? "flex-row items-center gap-5" : "flex-row items-center gap-4"}>
          <PlayerAvatar player={player} size={isTablet ? 108 : 88} />
          <View className="min-w-0 flex-1 gap-1">
            <Text
              className={isTablet ? "text-3xl" : "text-2xl"}
              style={{ color: theme.text }}
              numberOfLines={2}
            >
              {player.name}
            </Text>
            <Text
              className="text-sm"
              style={{ color: theme.textMuted }}
              numberOfLines={2}
            >
              {[player.age != null ? `${player.age} yrs` : null, primaryPosition ? labelForPosition(primaryPosition) : null]
                .filter(Boolean)
                .join(" · ") || "Player profile"}
            </Text>
            {activeSeason?.team ? (
              <Text
                className="text-sm"
                style={{ color: theme.accent }}
                numberOfLines={1}
              >
                {activeSeason.team.name}
                {leagues[0] ? ` · ${leagues[0].name}` : ""}
              </Text>
            ) : (
              <Text
                className="text-sm"
                style={{ color: theme.textSubtle }}
              >
                Not in a league yet
              </Text>
            )}
          </View>
        </View>

        {player.bio ? (
          <Text
            className="text-sm leading-6"
            style={{ color: theme.textMuted }}
          >
            {player.bio}
          </Text>
        ) : isOwner ? (
          <Text
            className="text-sm leading-6"
            style={{ color: theme.textSubtle }}
          >
            Add a short bio so league admins and teammates know your game.
          </Text>
        ) : null}

        {isOwner ? (
          <View className={isTablet ? "max-w-[460px] flex-row gap-3" : "flex-row gap-2"}>
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
        <View
          className="flex-row items-center gap-3 rounded-[20px] border px-4 py-4"
          style={{
            backgroundColor: theme.accentMuted,
            borderColor: theme.accent,
          }}
        >
          <Ionicons name="people-outline" size={22} color={theme.accent} />
          <View className="min-w-0 flex-1">
            <Text style={{ color: theme.text }}>
              Join a league
            </Text>
            <Text className="text-xs" style={{ color: theme.textSubtle }}>
              Your profile will show your club status once you join a roster.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/join-league")}
            className="rounded-full bg-accent-500 px-3 py-2"
          >
            <Text
              className="text-xs"
              style={{ color: colors.darkLabel }}
            >
              Join
            </Text>
          </Pressable>
        </View>
      ) : null}

      {isTablet ? (
        <View className="flex-row items-start gap-5">
          <View className="gap-5" style={{ flex: 1.35 }}>
            <HighlightsSection
              highlights={highlights}
              isOwner={isOwner}
              playerId={player.id}
              loading={isOwner && ownHighlights.isLoading}
              onAdd={() => setAddHighlightOpen(true)}
            />
            <AwardsSection awards={player.awards ?? []} />
          </View>
          <View className="gap-5" style={{ flex: 1 }}>
            <CareerStatsSection
              goals={stats.goals}
              assists={stats.assists}
              cards={stats.cards}
              gamesPlayed={gamesPlayed}
            />
            <DetailsSection player={player} />
          </View>
        </View>
      ) : (
        <>
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
        </>
      )}

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
  const { isTablet } = useAdaptiveLayout();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View
      className="gap-5 pb-10"
      style={isTablet ? { alignItems: "center" } : undefined}
    >
      <View
        className="w-full items-center gap-4 rounded-[28px] border px-5 py-8"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          ...(isTablet ? { maxWidth: 620 } : null),
        }}
      >
        <View
          className="h-20 w-20 items-center justify-center rounded-[24px]"
          style={{ backgroundColor: theme.brand }}
        >
          <Ionicons name="person-add-outline" size={34} color={theme.accent} />
        </View>
        <View className="gap-2">
          <Text
            className="text-center text-2xl"
            style={{ color: theme.text }}
          >
            {title}
          </Text>
          <Text
            className="text-center text-sm leading-6"
            style={{ color: theme.textMuted }}
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
  const theme = useTheme();
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
      className="items-center justify-center border"
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        backgroundColor: theme.brand,
        borderColor: theme.accent,
      }}
    >
      <Text
        className="text-2xl"
        style={{ color: theme.accent }}
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
  const theme = useTheme();

  return (
    <View
      className="gap-3 rounded-[20px] border px-4 py-4"
      style={{
        backgroundColor: theme.card,
        borderColor: theme.cardBorder,
      }}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text style={{ color: theme.text }}>
            Profile {completeness}% complete
          </Text>
          <Text className="text-xs" style={{ color: theme.textSubtle }}>
            Add a little more so your player card feels finished.
          </Text>
        </View>
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Ionicons name="close" size={18} color={theme.textSubtle} />
        </Pressable>
      </View>
      <View
        className="h-2 overflow-hidden rounded-full"
        style={{ backgroundColor: theme.cardMuted }}
      >
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
            className="rounded-full px-3 py-1.5"
            style={{ backgroundColor: theme.accentMuted }}
          >
            <Text
              className="text-xs"
              style={{ color: theme.text }}
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
  const theme = useTheme();
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
              className="text-xs"
              style={{ color: theme.accent }}
            >
              Add
            </Text>
          </Pressable>
        ) : undefined
      }
    >
      {loading ? (
        <View
          className="items-center rounded-[20px] py-8"
          style={{ backgroundColor: theme.cardMuted }}
        >
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : highlights.length ? (
        <>
          {atCap && isOwner ? (
            <Text className="text-xs" style={{ color: theme.textSubtle }}>
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
        <View
          className="items-center gap-3 rounded-[22px] border px-5 py-8"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
        >
          <Ionicons name="play-circle-outline" size={34} color={theme.accent} />
          <Text style={{ color: theme.text }}>
            {isOwner ? "Add your first highlight" : "No highlights yet"}
          </Text>
          <Text
            className="text-center text-sm leading-6"
            style={{ color: theme.textSubtle }}
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
  const { isTablet } = useAdaptiveLayout();
  const theme = useTheme();
  const thumbnail =
    item.thumbnailUrl ?? `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`;
  return (
    <View
      className="p-1"
      style={{ width: isTablet ? "33.3333%" : "50%" }}
    >
      <View
        className="overflow-hidden rounded-[18px] border"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
        }}
      >
        {playing ? (
          <YoutubePlayer height={isTablet ? 132 : 116} play videoId={item.videoId} />
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
            className="text-xs"
            style={{ color: theme.text }}
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
  const theme = useTheme();

  if (gamesPlayed === 0) {
    return (
      <Section title="Career stats">
        <View
          className="items-center gap-3 rounded-[22px] border px-5 py-8"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
        >
          <Ionicons name="stats-chart-outline" size={30} color={theme.textSubtle} />
          <Text style={{ color: theme.text }}>
            No games played yet
          </Text>
          <Text className="text-center text-sm" style={{ color: theme.textSubtle }}>
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
  const theme = useTheme();
  const motmAwards = awards.filter((award) => award.awardType === "motm");

  if (motmAwards.length === 0) {
    return null;
  }

  return (
    <Section title="Awards">
      <View
        className="gap-3 rounded-[22px] border px-4 py-4"
        style={{
          backgroundColor: theme.accentMuted,
          borderColor: theme.accent,
        }}
      >
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-accent-500">
            <Ionicons name="star" size={21} color={colors.darkLabel} />
          </View>
          <View className="min-w-0 flex-1">
            <Text style={{ color: theme.text }}>
              {motmAwards.length === 1
                ? "1 man of the match"
                : `${motmAwards.length} man of the match awards`}
            </Text>
            <Text className="pt-1 text-xs" style={{ color: theme.textMuted }}>
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
            className="flex-row items-center justify-between gap-3 rounded-2xl px-3 py-3 active:opacity-90"
            style={{ backgroundColor: theme.card }}
          >
            <View className="min-w-0 flex-1">
              <Text className="text-sm" style={{ color: theme.text }} numberOfLines={1}>
                {award.game?.homeTeam?.name ?? "Home"} vs{" "}
                {award.game?.awayTeam?.name ?? "Away"}
              </Text>
              <Text className="pt-1 text-xs" style={{ color: theme.textSubtle }}>
                Man of the match
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={theme.accent} />
          </Pressable>
        ))}
      </View>
    </Section>
  );
}

function DetailsSection({ player }: { player: ApiPlayer }) {
  const theme = useTheme();
  const socialProfile = parseSocialProfile(player.socialHandle);
  const rows = [
    { label: "Preferred foot", value: player.preferredFoot },
    { label: "Height", value: formatHeight(player.heightCm) },
    {
      label: "Location",
      value: [player.city, player.state].filter(Boolean).join(", ") || null,
    },
    { label: "Nationality", value: player.nationality },
    {
      label: socialProfile.handle
        ? socialPlatformLabel(socialProfile.platform)
        : "Social",
      value: socialProfile.handle || null,
    },
  ];
  const hasDetails = rows.some((row) => row.value);
  return (
    <Section title="Details">
      {hasDetails ? (
        <View
          className="overflow-hidden rounded-[20px] border"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
        >
          {rows.map((row) => (
            <View
              key={row.label}
              className="flex-row items-center justify-between gap-3 border-b px-4 py-3"
              style={{ borderColor: theme.cardBorder }}
            >
                <Text className="text-sm" style={{ color: theme.textSubtle }}>
                {row.label}
              </Text>
              <Text
                className="min-w-0 flex-1 text-right text-sm"
                style={{ color: theme.text }}
                numberOfLines={1}
              >
                {row.value ?? "-"}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-sm" style={{ color: theme.textSubtle }}>
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
  const theme = useTheme();
  const { isDark } = useAppearance();
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
  const initialSocialProfile = parseSocialProfile(player?.socialHandle);
  const [socialPlatform, setSocialPlatform] = useState<SocialPlatform>(
    initialSocialProfile.platform,
  );
  const [socialHandle, setSocialHandle] = useState(initialSocialProfile.handle);
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
    const socialProfile = parseSocialProfile(player?.socialHandle);
    setSocialPlatform(socialProfile.platform);
    setSocialHandle(socialProfile.handle);
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
      socialHandle: formatSocialProfile(socialPlatform, socialHandle),
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
              variant={isDark ? "dark" : "light"}
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
                className="text-right text-xs"
                style={{ color: theme.textSubtle }}
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
              <Text className="text-xs leading-5" style={{ color: theme.textSubtle }}>
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
            <View className="gap-2">
              <Text
                className="text-xs uppercase tracking-wide"
                style={{ color: theme.textSubtle }}
              >
                Social platform
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {SOCIAL_PLATFORM_OPTIONS.map((option) => {
                  const selected = socialPlatform === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setSocialPlatform(option.value)}
                      className="rounded-full border px-3 py-2 active:opacity-80"
                      style={{
                        backgroundColor: selected ? theme.brandMuted : theme.card,
                        borderColor: selected ? theme.brand : theme.inputBorder,
                      }}
                    >
                      <Text
                        className="text-sm"
                        style={{ color: selected ? theme.brand : theme.text }}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <AuthTextField
              label={
                socialPlatform === "other"
                  ? "Social handle or profile URL"
                  : `${socialPlatformLabel(socialPlatform)} handle or profile URL`
              }
              value={socialHandle}
              onChangeText={setSocialHandle}
              placeholder="@yourhandle"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={120}
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
  const theme = useTheme();
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
            className="text-right text-xs"
            style={{ color: theme.textSubtle }}
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
  const theme = useTheme();
  return (
    <View className="items-center gap-2">
      <Pressable
        onPress={onPick}
        className="h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border-2 border-dashed"
        style={{
          backgroundColor: theme.cardMuted,
          borderColor: theme.inputBorder,
        }}
      >
        {picking ? (
          <ActivityIndicator color={theme.brand} />
        ) : uri ? (
          <Image
            source={{ uri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="items-center gap-1">
            <Ionicons name="camera-outline" size={26} color={theme.brand} />
            <Text className="text-xs" style={{ color: theme.textSubtle }}>
              Add photo
            </Text>
          </View>
        )}
      </Pressable>
      {photo ? (
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text className="text-xs" style={{ color: theme.textSubtle }}>
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
  const theme = useTheme();

  return (
    <View className="gap-2">
      <Text
        className="text-[11px] uppercase tracking-wider"
        style={{ color: theme.textSubtle }}
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
              className="rounded-xl border px-3 py-2"
              style={{
                backgroundColor: active ? theme.brandMuted : theme.cardMuted,
                borderColor: active ? theme.brand : theme.cardBorder,
              }}
            >
              <Text
                className="text-xs"
                style={{ color: active ? theme.brand : theme.textMuted }}
              >
                {labelForPosition(position)}
              </Text>
            </Pressable>
          );
        })}
        {allowClear ? (
          <Pressable
            onPress={() => onChange(null)}
            className="rounded-xl border px-3 py-2"
            style={{
              backgroundColor: theme.cardMuted,
              borderColor: theme.cardBorder,
            }}
          >
            <Text className="text-xs" style={{ color: theme.textSubtle }}>
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
  const theme = useTheme();

  return (
    <View className="gap-2">
      <Text
        className="text-[11px] uppercase tracking-wider"
        style={{ color: theme.textSubtle }}
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
              className="flex-1 rounded-xl border px-3 py-2"
              style={{
                backgroundColor: active ? theme.brandMuted : theme.cardMuted,
                borderColor: active ? theme.brand : theme.cardBorder,
              }}
            >
              <Text
                className="text-center text-sm"
                style={{ color: active ? theme.brand : theme.textMuted }}
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
  const theme = useTheme();

  return (
    <View
      className="items-center gap-3 rounded-[28px] border px-6 py-12"
      style={{
        backgroundColor: theme.card,
        borderColor: theme.cardBorder,
      }}
    >
      <Ionicons name="lock-closed-outline" size={34} color={theme.textSubtle} />
      <Text className="text-lg" style={{ color: theme.text }}>
        {"This profile isn't public"}
      </Text>
      <Text
        className="text-center text-sm leading-6"
        style={{ color: theme.textSubtle }}
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
  const theme = useTheme();

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text
          className="text-[12px] uppercase tracking-[2px]"
          style={{ color: theme.textSubtle }}
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
  const theme = useTheme();

  return (
    <View
      className="min-w-[132px] flex-1 rounded-[20px] border px-4 py-4"
      style={{
        backgroundColor: theme.card,
        borderColor: theme.cardBorder,
      }}
    >
      <Ionicons name={icon} size={21} color={theme.accent} />
        <Text className="pt-3 text-2xl" style={{ color: theme.text }}>
        {value}
      </Text>
      <Text className="text-xs" style={{ color: theme.textSubtle }}>
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
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`h-8 w-8 items-center justify-center rounded-full ${
        disabled ? "opacity-45" : ""
      }`}
      style={{ backgroundColor: danger ? theme.dangerMuted : theme.cardMuted }}
    >
      <Ionicons
        name={icon}
        size={15}
        color={danger ? theme.danger : theme.textMuted}
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
