import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { ApiStanding } from "@/api/entities";
import { fonts } from "@/theme/fonts";

type Props = {
  standings: ApiStanding[];
  /** Optional team id to visually highlight in the table (used by team screen). */
  highlightTeamId?: number;
};

export function LeagueStandingsTab({ standings, highlightTeamId }: Props) {
  const router = useRouter();

  if (!standings.length) {
    return (
      <Text
        style={{ fontFamily: fonts.body }}
        className="text-sm text-white/55"
      >
        Standings not available yet.
      </Text>
    );
  }

  const sorted = [...standings].sort((a, b) => a.position - b.position);

  return (
    <View className="overflow-hidden rounded-[24px] bg-white/6">
      <View className="flex-row items-center gap-3 border-b border-white/10 px-4 py-3">
        <Text style={{ fontFamily: fonts.bodyBold }} className="w-6 text-white/55 text-[11px]">
          #
        </Text>
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="flex-1 text-white/55 text-[11px] uppercase tracking-[1.5px]"
        >
          Team
        </Text>
        <ColHeader>P</ColHeader>
        <ColHeader>W</ColHeader>
        <ColHeader>D</ColHeader>
        <ColHeader>L</ColHeader>
        <ColHeader>GD</ColHeader>
        <ColHeader>Pts</ColHeader>
      </View>
      {sorted.map((row, index) => {
        const isHighlighted =
          highlightTeamId != null && row.team?.id === highlightTeamId;
        return (
          <View
            key={row.id}
            className={[
              "flex-row items-center gap-3 px-4 py-3",
              isHighlighted ? "bg-[#E6A817]/10" : "",
              index !== sorted.length - 1 ? "border-b border-white/10" : "",
            ].join(" ")}
          >
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className={isHighlighted ? "w-6 text-[#E6A817]" : "w-6 text-white/70"}
            >
              {row.position}
            </Text>
            <Pressable
              disabled={!row.team}
              onPress={() => row.team && router.push(`/team/${row.team.id}`)}
              className="flex-1"
            >
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className={
                  isHighlighted
                    ? "text-[11px] text-[#E6A817]"
                    : "text-[11px] text-white"
                }
              >
                {row.team?.name ?? "—"}
              </Text>
            </Pressable>
            <Col>{row.played}</Col>
            <Col>{row.wins}</Col>
            <Col>{row.draws}</Col>
            <Col>{row.losses}</Col>
            <Col>{row.goalDifference}</Col>
            <ColAccent>{row.points}</ColAccent>
          </View>
        );
      })}
    </View>
  );
}

function ColHeader({ children }: { children: string }) {
  return (
    <Text
      style={{ fontFamily: fonts.bodyBold }}
      className="w-8 text-right text-[11px] uppercase tracking-[1.5px] text-white/55"
    >
      {children}
    </Text>
  );
}

function Col({ children }: { children: number }) {
  return (
    <Text
      style={{ fontFamily: fonts.bodySemibold }}
      className="w-8 text-right text-white/65"
    >
      {children}
    </Text>
  );
}

function ColAccent({ children }: { children: number }) {
  return (
    <Text
      style={{ fontFamily: fonts.bodyBold }}
      className="w-8 text-right text-[#E6A817]"
    >
      {children}
    </Text>
  );
}
