import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { EntityLogo } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { useGamePhaseLabel } from "@/hooks/useGamePhaseLabel";
import { formatPlayedAt } from "@/lib/datetime";
import {
  isActivePlayStatus,
  isLiveGameStatus,
} from "@/lib/general-utils";
import { openDirections } from "@/lib/maps";
import { showThrownAsToast } from "@/lib/show-error-toast";
import { MatchEventsTimeline } from "@/match/components/MatchEventsTimeline";
import type { MatchDetail } from "@/match/types";

type Props = {
  detail: MatchDetail;
};

export function MatchOverviewTab({ detail }: Props) {
  const router = useRouter();
  const { isTablet } = useAdaptiveLayout();
  const isLive = isLiveGameStatus(detail.status);
  const phase = useGamePhaseLabel(detail);
  const showScore =
    isActivePlayStatus(detail.status) ||
    detail.status === "half_time" ||
    detail.status === "break" ||
    detail.status === "full_time" ||
    detail.status === "completed";

  const venueLabel = detail.venue?.name ?? detail.venueName ?? "-";
  const lat = detail.venue?.latitude;
  const lng = detail.venue?.longitude;
  const hasCoords =
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);
  const motm = detail.awards?.find((award) => award.awardType === "motm") ?? null;

  const handleDirections = async () => {
    if (!hasCoords || lat == null || lng == null) return;
    try {
      await openDirections(lat, lng);
    } catch (err) {
      showThrownAsToast(err, "Could not open maps");
    }
  };

  const scoreCard = (
    <View className="rounded-[28px] bg-white/6 px-5 py-6">
        <View className="flex-row items-center justify-between gap-4 ">
          <TeamColumn
            name={detail.homeTeam?.name ?? "TBD"}
            logoUrl={detail.homeTeam?.logoUrl}
            onPress={
              detail.homeTeam
                ? () => router.push(`/team/${detail.homeTeam?.id}`)
                : undefined
            }
          />
          <View className="items-center">
            <Text
              className="text-[32px] text-white"
            >
              {showScore
                ? `${detail.homeScore ?? "0"} - ${detail.awayScore ?? "0"}`
                : "vs"}
            </Text>
            {phase ? (
              <Text
                className={
                  isLive
                    ? "pt-2 text-sm text-[#ba0c2f]"
                    : "pt-2 text-sm text-[#E6A817]"
                }
              >
                {phase}
              </Text>
            ) : null}
          </View>
          <TeamColumn
            name={detail.awayTeam?.name ?? "TBD"}
            logoUrl={detail.awayTeam?.logoUrl}
            onPress={
              detail.awayTeam
                ? () => router.push(`/team/${detail.awayTeam?.id}`)
                : undefined
            }
          />
        </View>
      </View>
  );

  const factsSection = (
      <Section title="Match Facts">
        <View className="rounded-[24px] bg-white/6 px-4 py-5">
          <FactRow label="Kickoff" value={formatPlayedAt(detail.playedAt)} />
          <FactRow label="Venue" value={venueLabel} />
          {detail.venue?.address ? (
            <FactRow label="Address" value={detail.venue.address} />
          ) : null}
        </View>
      </Section>
  );

  const motmSection = motm?.player ? (
    <Section title="Man of the match">
      <Pressable
        onPress={() => motm.player?.id && router.push(`/player/${motm.player.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${motm.player.name} profile`}
        className="flex-row items-center gap-3 rounded-[24px] border border-accent-400/20 bg-accent-500/10 px-4 py-4 active:opacity-90"
      >
        <EntityLogo
          logoUrl={motm.player.avatarUrl}
          variant="player"
          size="md"
          tone="dark"
        />
        <View className="min-w-0 flex-1">
          <Text className="text-white" numberOfLines={1}>
            {motm.player.name}
          </Text>
          <Text className="pt-1 text-xs text-accent-100/70">
            Man of the match
          </Text>
        </View>
        <Ionicons name="star" size={20} color="#E6A817" />
      </Pressable>
    </Section>
  ) : null;

  const locationSection = hasCoords && lat != null && lng != null ? (
    <Section title="Location">
      <View className="overflow-hidden rounded-[24px] bg-white/6">
        <MapView
          style={{ width: "100%", height: 180 }}
          pointerEvents="none"
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          initialRegion={{
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          <Marker coordinate={{ latitude: lat, longitude: lng }} />
        </MapView>
        <View className="px-4 py-4">
          <Button
            variant="authPurple"
            label="Get directions"
            onPress={() => void handleDirections()}
          />
        </View>
      </View>
    </Section>
  ) : null;

  const eventsSection = (
      <Section title="Events">
        <MatchEventsTimeline
          stats={detail.stats}
          homeTeamId={detail.homeTeam?.id}
          awayTeamId={detail.awayTeam?.id}
          onPlayerPress={(id) => router.push(`/player/${id}`)}
        />
      </Section>
  );

  if (isTablet) {
    return (
      <View className="gap-6">
        {scoreCard}
        <View className="flex-row items-start gap-6">
          <View className="min-w-0 flex-1 gap-6">
            {factsSection}
            {motmSection}
            {locationSection}
          </View>
          <View className="min-w-0 flex-1">
            {eventsSection}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-6">
      {scoreCard}
      {factsSection}
      {motmSection}
      {locationSection}
      {eventsSection}
    </View>
  );
}

function TeamColumn({
  name,
  logoUrl,
  onPress,
}: {
  name: string;
  logoUrl?: string | null;
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      className="max-w-[120px] flex-1 items-center gap-2"
    >
      <EntityLogo logoUrl={logoUrl} variant="team" size="md" tone="dark" />
      <Text
        className="text-center text-white"
      >
        {name}
      </Text>
    </Pressable>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-sm text-white/55">
        {label}
      </Text>
      <Text
        className="ml-4 flex-1 text-right text-sm text-white"
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: import("react").ReactNode;
}) {
  return (
    <View className="gap-3">
      <Text
        className="text-[12px] uppercase tracking-[2px] text-white/55"
      >
        {title}
      </Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}
