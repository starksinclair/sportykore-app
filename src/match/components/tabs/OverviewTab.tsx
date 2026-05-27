import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { formatPlayedAt } from "@/lib/datetime";
import { fonts } from "@/theme/fonts";
import type { MatchDetail } from "@/match/types";

type Props = {
  detail: MatchDetail;
};

export function MatchOverviewTab({ detail }: Props) {
  const router = useRouter();
  const isLive = detail.status === "live" || detail.status === "break";
  const phase = phaseLabel(detail.status, detail.currentMinute);
  const showScore =
    detail.status === "live" ||
    detail.status === "break" ||
    detail.status === "completed";

  const events = useMemo(
    () =>
      [...detail.stats].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0)),
    [detail.stats],
  );

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
                ? `${detail.homeScore ?? "-"} - ${detail.awayScore ?? "-"}`
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
          <FactRow label="Status" value={detail.status} />
        </View>
      </Section>

      <Section title="Events">
        {events.length ? (
          <View className="overflow-hidden rounded-[20px] bg-white/6">
            {events.map((stat, index) => (
              <Pressable
                key={stat.id}
                disabled={stat.player?.id == null}
                onPress={() =>
                  stat.player?.id != null &&
                  router.push(`/player/${stat.player.id}`)
                }
                className={[
                  "flex-row items-center gap-3 px-4 py-3",
                  index !== events.length - 1 ? "border-b border-white/10" : "",
                ].join(" ")}
              >
                <View className="w-10">
                  <Text
                    style={{ fontFamily: fonts.bodyBold }}
                    className="text-sm text-[#E6A817]"
                  >
                    {stat.minute != null
                      ? `${stat.minute}'${stat.isStoppageTime ? "+" : ""}`
                      : "—"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    style={{ fontFamily: fonts.bodyBold }}
                    className="text-white"
                  >
                    {stat.player?.name ?? "Unknown"}
                  </Text>
                  <Text
                    style={{ fontFamily: fonts.body }}
                    className="pt-0.5 text-xs text-white/55"
                  >
                    {stat.type?.displayName ?? stat.type?.name ?? "Event"}
                    {stat.team ? ` · ${stat.team.name}` : ""}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text
            style={{ fontFamily: fonts.body }}
            className="text-sm text-white/55"
          >
            No events recorded yet.
          </Text>
        )}
      </Section>
    </View>
  );
}

function phaseLabel(
  status: MatchDetail["status"],
  currentMinute: number,
): string {
  switch (status) {
    case "live":
      return `${currentMinute}'`;
    case "break":
      return "Half time";
    case "completed":
      return "Full time";
    case "postponed":
      return "Postponed";
    case "cancelled":
      return "Cancelled";
    default:
      return "";
  }
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
