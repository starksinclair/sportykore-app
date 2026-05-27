import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiPlayer, ApiStat, ApiTeam } from "@/api/entities";
import { groupPlayersByPosition, shortForPosition } from "@/lib/positions";
import { fonts } from "@/theme/fonts";

type Props = {
  homeTeam?: ApiTeam;
  awayTeam?: ApiTeam;
  stats: ApiStat[];
};

export function MatchLineupsTab({ homeTeam, awayTeam, stats }: Props) {
  const home = useMemo(
    () => (homeTeam ? buildLineup(stats, homeTeam.id) : []),
    [stats, homeTeam],
  );
  const away = useMemo(
    () => (awayTeam ? buildLineup(stats, awayTeam.id) : []),
    [stats, awayTeam],
  );

  if (!homeTeam && !awayTeam) {
    return (
      <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
        Teams not assigned to this match yet.
      </Text>
    );
  }

  if (!home.length && !away.length) {
    return (
      <View className="items-center gap-3 rounded-[24px] border border-white/10 bg-white/5 px-6 py-10">
        <Ionicons
          name="people-outline"
          size={32}
          color="rgba(255,255,255,0.6)"
        />
        <Text style={{ fontFamily: fonts.bodyBold }} className="text-lg text-white">
          Lineups not available yet
        </Text>
        <Text
          style={{ fontFamily: fonts.body }}
          className="text-center text-sm text-white/55"
        >
          Players who feature in this match&apos;s events will appear here as
          soon as any stat is recorded.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-6">
      <Text
        style={{ fontFamily: fonts.body }}
        className="text-xs text-white/45"
      >
        Lineups are derived from recorded match events until the backend
        provides an official team sheet.
      </Text>

      {homeTeam ? (
        <TeamLineup team={homeTeam} players={home} side="Home" />
      ) : null}
      {awayTeam ? (
        <TeamLineup team={awayTeam} players={away} side="Away" />
      ) : null}
    </View>
  );
}

function TeamLineup({
  team,
  players,
  side,
}: {
  team: ApiTeam;
  players: ApiPlayer[];
  side: "Home" | "Away";
}) {
  const router = useRouter();
  const groups = useMemo(() => groupPlayersByPosition(players), [players]);

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text style={{ fontFamily: fonts.bodyBold }} className="text-white">
          {team.name}
        </Text>
        <Text
          style={{ fontFamily: fonts.body }}
          className="text-[11px] uppercase tracking-[1.5px] text-white/45"
        >
          {side} · {players.length} player{players.length === 1 ? "" : "s"}
        </Text>
      </View>

      {groups.length ? (
        groups.map((group) => (
          <View key={group.position ?? "unassigned"} className="gap-2">
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-[11px] uppercase tracking-[1.5px] text-white/45"
            >
              {group.label}
            </Text>
            <View className="overflow-hidden rounded-[18px] bg-white/6">
              {group.players.map((player, index, arr) => (
                <Pressable
                  key={player.id}
                  onPress={() => router.push(`/player/${player.id}`)}
                  className={[
                    "flex-row items-center gap-3 px-4 py-3 active:bg-white/10",
                    index !== arr.length - 1 ? "border-b border-white/10" : "",
                  ].join(" ")}
                >
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-[#364156]">
                    <Text
                      style={{ fontFamily: fonts.bodyBold }}
                      className="text-[10px] text-white"
                    >
                      {shortForPosition(player.position)}
                    </Text>
                  </View>
                  <Text
                    style={{ fontFamily: fonts.bodyBold }}
                    className="flex-1 text-white"
                    numberOfLines={1}
                  >
                    {player.name}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                </Pressable>
              ))}
            </View>
          </View>
        ))
      ) : (
        <Text
          style={{ fontFamily: fonts.body }}
          className="text-sm text-white/55"
        >
          No participating players recorded.
        </Text>
      )}
    </View>
  );
}

function buildLineup(stats: ApiStat[], teamId: number): ApiPlayer[] {
  const seen = new Map<number, ApiPlayer>();
  for (const stat of stats) {
    if (stat.team?.id !== teamId) continue;
    if (stat.player) seen.set(stat.player.id, stat.player);
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}
