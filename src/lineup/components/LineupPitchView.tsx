import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiStat } from "@/api/entities";
import { EntityLogo } from "@/components/ui";
import { FootballPitch } from "@/lineup/components/FootballPitch";
import { BadgeCluster, PitchSlot } from "@/lineup/components/PitchSlot";
import type { Formation, TeamLineupGroup } from "@/lineup/types";
import {
  aggregatePlayerMatchBadges,
  slotCoordinates,
} from "@/lineup/utils";
import { fonts } from "@/theme/fonts";

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

  const mutedLabel = isDark ? "text-xs uppercase text-white/45" : "text-xs uppercase text-neutral-500";
  const rowBg = isDark ? "bg-white/6" : "bg-neutral-50";
  const nameColor = isDark ? "text-white" : "text-neutral-900";
  const accentColor = isDark ? "text-accent-300" : "text-brand-600";

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
            style={{ fontFamily: fonts.bodyBold }}
            className={isDark ? "text-white" : "text-neutral-900"}
          >
            {group.team.name}
          </Text>
          {activeFormation ? (
            <Text
              style={{ fontFamily: fonts.body }}
              className={isDark ? "text-xs text-white/45" : "text-xs text-neutral-500"}
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
          className={[
            "items-center rounded-[20px] px-4 py-8",
            isDark ? "bg-white/5" : "bg-neutral-100",
          ].join(" ")}
        >
          <Text
            style={{ fontFamily: fonts.body }}
            className={isDark ? "text-sm text-white/55" : "text-sm text-neutral-500"}
          >
            Formation not set.
          </Text>
        </View>
      )}

      {coaches.length > 0 ? (
        <View className="gap-2">
          <Text style={{ fontFamily: fonts.bodyBold }} className={mutedLabel}>
            {coaches.length === 1 ? "Coach" : "Coaches"}
          </Text>
          {coaches.slice(0, 1).map((admin) => {
            const label = admin.user?.fullName?.trim() || admin.user?.email || "Coach";
            return (
              <View
                key={admin.id}
                className={["flex-row items-center gap-3 rounded-xl px-3 py-2.5", rowBg].join(" ")}
              >
                <Text style={{ fontFamily: fonts.bodyBold }} className={["w-8", accentColor].join(" ")}>
                  C
                </Text>
                <View className="flex-1">
                  <Text
                    style={{ fontFamily: fonts.bodySemibold }}
                    className={nameColor}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                  {admin.user?.fullName && admin.user?.email ? (
                    <Text
                      style={{ fontFamily: fonts.body }}
                      className={isDark ? "text-xs text-white/45" : "text-xs text-neutral-500"}
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
          <Text style={{ fontFamily: fonts.bodyBold }} className={mutedLabel}>
            Substitutes
          </Text>
          {group.substitutes.map((sub) => (
            <Pressable
              key={sub.id}
              onPress={() => router.push(`/player/${sub.playerId}`)}
              className={[
                "flex-row items-center gap-3 rounded-xl px-3 py-2.5 active:opacity-80",
                rowBg,
              ].join(" ")}
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
              <Text style={{ fontFamily: fonts.bodyBold }} className={["w-8", accentColor].join(" ")}>
                {sub.jerseyNumber != null ? `#${sub.jerseyNumber}` : "—"}
              </Text>
              <Text
                style={{ fontFamily: fonts.bodySemibold }}
                className={["flex-1", nameColor].join(" ")}
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
