import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiStat } from "@/api/entities";
import { useTheme } from "@/color/use-theme";
import { EntityLogo } from "@/components/ui";
import { FootballPitch } from "@/lineup/components/FootballPitch";
import { BadgeCluster, PitchSlot } from "@/lineup/components/PitchSlot";
import type { Formation, TeamLineupGroup } from "@/lineup/types";
import {
  aggregatePlayerMatchBadges,
  slotCoordinates,
} from "@/lineup/utils";

type Props = {
  group: TeamLineupGroup;
  formation?: Formation | null;
  tone?: "light" | "dark";
  linkPlayers?: boolean;
  stats?: ApiStat[];
};

export function LineupPitchView({
  group,
  formation = group.formation,
  tone = "dark",
  linkPlayers = true,
  stats = [],
}: Props) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = tone === "dark";
  const activeFormation = formation ?? group.formation;
  const coaches = group.team.admins ?? [];

  const badgeByPlayer = useMemo(
    () => aggregatePlayerMatchBadges(stats),
    [stats],
  );

  const starterBySlot = new Map(
    group.starters
      .filter((s) => s.slotKey)
      .map((s) => [s.slotKey as string, s]),
  );

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-2">
        <EntityLogo
          logoUrl={group.team.logoUrl}
          variant="team"
          size="xs"
          tone={isDark ? "dark" : "light"}
        />
        <View className="flex-1">
          <Text
            style={{ color: theme.text }}
          >
            {group.team.name}
          </Text>
          {activeFormation ? (
            <Text
              className="text-xs"
              style={{ color: theme.textSubtle }}
            >
              {activeFormation.displayName || activeFormation.name}
            </Text>
          ) : null}
        </View>
      </View>

      {activeFormation ? (
        <FootballPitch>
          {activeFormation.slots.map((slot) => {
            const starter = starterBySlot.get(slot.key);
            const coord = slotCoordinates(slot, activeFormation.slots);
            const playerId = starter?.playerId;
            const badges =
              playerId != null ? badgeByPlayer.get(playerId) : undefined;
            return (
              <PitchSlot
                key={slot.key}
                label={slot.label}
                coordinate={coord}
                playerName={starter?.player?.name}
                jerseyNumber={starter?.jerseyNumber}
                avatarUrl={starter?.player?.avatarUrl}
                playerId={starter?.playerId}
                badges={badges}
                variant="avatar"
                readOnly
              />
            );
          })}
        </FootballPitch>
      ) : (
        <View
          className="items-center rounded-[20px] px-4 py-8"
          style={{ backgroundColor: theme.cardMuted }}
        >
          <Text
            className="text-sm"
            style={{ color: theme.textSubtle }}
          >
            Formation not set.
          </Text>
        </View>
      )}

      {coaches.length > 0 ? (
        <View className="gap-2">
          <Text
            className="text-xs uppercase"
            style={{ color: theme.textSubtle }}
          >
            {coaches.length === 1 ? "Coach" : "Coaches"}
          </Text>
          {coaches.slice(0, 1).map((admin) => {
            const label = admin.user?.fullName?.trim() || admin.user?.email || "Coach";
            return (
              <View
                key={admin.id}
                className="flex-row items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ backgroundColor: theme.cardMuted }}
              >
                <Text className="w-8" style={{ color: theme.accent }}>
                  C
                </Text>
                <View className="flex-1">
                  <Text
                    style={{ color: theme.text }}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                  {admin.user?.fullName && admin.user?.email ? (
                    <Text
                      className="text-xs"
                      style={{ color: theme.textSubtle }}
                      numberOfLines={1}
                    >
                      {admin.user.email}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {linkPlayers && group.substitutes.length > 0 ? (
        <View className="gap-2">
          <Text
            className="text-xs uppercase"
            style={{ color: theme.textSubtle }}
          >
            Substitutes
          </Text>
          {group.substitutes.map((sub) => (
            <Pressable
              key={sub.id}
              onPress={() => router.push(`/player/${sub.playerId}`)}
              className="flex-row items-center gap-3 rounded-xl px-3 py-2.5 active:opacity-80"
              style={{ backgroundColor: theme.cardMuted }}
            >
              <View className="relative">
                <EntityLogo
                  logoUrl={sub.player?.avatarUrl}
                  variant="player"
                  size="sm"
                  tone="brand"
                  accessibilityLabel={sub.player?.name}
                />
                <BadgeCluster badges={badgeByPlayer.get(sub.playerId)} />
              </View>
                <Text className="w-8" style={{ color: theme.accent }}>
                {sub.jerseyNumber != null ? `#${sub.jerseyNumber}` : "-"}
              </Text>
              <Text
                className="flex-1"
                style={{ color: theme.text }}
              >
                {sub.player?.name ?? "Unknown"}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
