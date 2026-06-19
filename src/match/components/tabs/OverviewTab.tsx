import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { useGamePhaseLabel } from "@/hooks/useGamePhaseLabel";
import { formatPlayedAt } from "@/lib/datetime";
import {
  isActivePlayStatus,
  isLiveGameStatus,
} from "@/lib/general-utils";
import { MatchEventsTimeline } from "@/match/components/MatchEventsTimeline";
import type { MatchDetail } from "@/match/types";
import { fonts } from "@/theme/fonts";

type Props = {
  detail: MatchDetail;
};

export function MatchOverviewTab({ detail }: Props) {
  const router = useRouter();
  const isLive = isLiveGameStatus(detail.status);
  const phase = useGamePhaseLabel(detail);
  const showScore =
    isActivePlayStatus(detail.status) ||
    detail.status === "half_time" ||
    detail.status === "break" ||
    detail.status === "full_time" ||
    detail.status === "completed";

  return (
    <View className="gap-6">
      <View className="rounded-[28px] bg-white/6 px-5 py-6">
        {detail.league?.name ? (
          <Text
            style={{ fontFamily: fonts.body }}
            className="text-center text-xs uppercase tracking-[1.5px] text-white/55"
          >
            {detail.league.name}
          </Text>
        ) : null}
        <View className="flex-row items-center justify-between gap-4 pt-5">
          <TeamColumn
            name={detail.homeTeam?.name ?? "TBD"}
            onPress={
              detail.homeTeam
                ? () => router.push(`/team/${detail.homeTeam?.id}`)
                : undefined
            }
          />
          <View className="items-center">
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-[32px] text-white"
            >
              {showScore
                ? `${detail.homeScore ?? "0"} - ${detail.awayScore ?? "0"}`
                : "vs"}
            </Text>
            {phase ? (
              <Text
                style={{ fontFamily: fonts.body }}
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
            onPress={
              detail.awayTeam
                ? () => router.push(`/team/${detail.awayTeam?.id}`)
                : undefined
            }
          />
        </View>
      </View>

      <Section title="Match Facts">
        <View className="rounded-[24px] bg-white/6 px-4 py-5">
          <FactRow label="Kickoff" value={formatPlayedAt(detail.playedAt)} />
          <FactRow label="Venue" value={detail.venueName ?? "—"} />
          {/* <FactRow label="Status" value={detail.status} /> */}
        </View>
      </Section>

      <Section title="Events">
        <MatchEventsTimeline
          stats={detail.stats}
          homeTeamId={detail.homeTeam?.id}
          awayTeamId={detail.awayTeam?.id}
          onPlayerPress={(id) => router.push(`/player/${id}`)}
        />
      </Section>
    </View>
  );
}

function TeamColumn({
  name,
  onPress,
}: {
  name: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      className="max-w-[120px] flex-1 items-center"
    >
      <Text
        style={{ fontFamily: fonts.bodyBold }}
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
      <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
        {label}
      </Text>
      <Text style={{ fontFamily: fonts.bodyBold }} className="text-sm text-white">
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
        style={{ fontFamily: fonts.bodyBold }}
        className="text-[12px] uppercase tracking-[2px] text-white/55"
      >
        {title}
      </Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}
