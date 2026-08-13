import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import type {
  ApiStanding,
  ApiStandingZone,
  StandingZoneType,
} from "@/api/entities";
import { useTheme } from "@/color/use-theme";
import { EntityLogo } from "@/components/ui";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";

const ZONE_COLORS: Record<StandingZoneType, string> = {
  qualified: "#22C55E",
  promotion: "#22C55E",
  promotion_playoff: "#84CC16",
  playoff: "#E6A817",
  relegation_playoff: "#F97316",
  relegation: "#EF4444",
};

const ZONE_DEFAULT_LABELS: Record<StandingZoneType, string> = {
  qualified: "Advances to knockout",
  promotion: "Promotion",
  promotion_playoff: "Promotion playoff",
  playoff: "Playoff",
  relegation_playoff: "Relegation playoff",
  relegation: "Relegation",
};

const ZONE_ICONS: Record<StandingZoneType, keyof typeof Ionicons.glyphMap> = {
  qualified: "checkmark-circle",
  promotion: "arrow-up-circle",
  promotion_playoff: "trending-up",
  playoff: "trophy",
  relegation_playoff: "alert-circle",
  relegation: "arrow-down-circle",
};

type Props = {
  standings: ApiStanding[];
  highlightTeamId?: number;
  zones?: ApiStandingZone[];
  stageGroupId?: number | null;
  /** Smaller padding / title for stacked all-groups overview. */
  compact?: boolean;
  title?: string;
  useTablePositionForZones?: boolean;
  onRowMarkerPress?: (row: ApiStanding) => void;
};

export function LeagueStandingsTab({
  standings,
  highlightTeamId,
  zones,
  stageGroupId = null,
  compact = false,
  title,
  useTablePositionForZones = false,
  onRowMarkerPress,
}: Props) {
  const router = useRouter();
  const theme = useTheme();
  const { isTablet } = useAdaptiveLayout();
  const spacious = isTablet && !compact;
  const displayStandings = zones?.length
    ? applyZonesToStandings(
        standings,
        zones,
        stageGroupId,
        useTablePositionForZones,
      )
    : standings;

  if (!displayStandings.length) {
    return (
      <Text className="text-sm" style={{ color: theme.textSubtle }}>
        Standings not available yet.
      </Text>
    );
  }

  const zoneLegend = uniqueZones(displayStandings);

  return (
    <View className="gap-3">
      {title ? (
        <Text className="text-sm" style={{ color: theme.text }}>
          {title}
        </Text>
      ) : null}

      <View
        className="overflow-hidden rounded-[24px] border"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        <View
          className={`flex-row items-center border-b px-2 ${
            spacious ? "gap-2 py-3.5" : compact ? "gap-1 py-2" : "gap-1 py-3"
          }`}
          style={{ borderColor: theme.cardBorder }}
        >
          <Text
            className={`${spacious ? "w-10" : "w-8"} text-[10px]`}
            style={{ color: theme.textSubtle }}
          >
            #
          </Text>
          <Text
            className="min-w-0 flex-1 text-[10px] uppercase tracking-[1.5px]"
            style={{ color: theme.textSubtle }}
            numberOfLines={1}
          >
            Team
          </Text>
          <ColHeader spacious={spacious}>P</ColHeader>
          <ColHeader spacious={spacious}>W</ColHeader>
          <ColHeader spacious={spacious}>D</ColHeader>
          <ColHeader spacious={spacious}>L</ColHeader>
          <ColHeader spacious={spacious}>GD</ColHeader>
          <ColHeader spacious={spacious}>Pts</ColHeader>
        </View>

        {displayStandings.map((row, index) => {
          const displayPosition = useTablePositionForZones ? index + 1 : row.position;
          const isHighlighted =
            highlightTeamId != null && row.team?.id === highlightTeamId;
          const zoneColor = row.zone?.type
            ? ZONE_COLORS[row.zone.type]
            : "transparent";
          const rowBackgroundColor = isHighlighted
            ? theme.accentMuted
            : row.zone?.type
              ? `${zoneColor}14`
              : undefined;
          const zoneIcon = row.zone?.type ? ZONE_ICONS[row.zone.type] : null;
          const hasMarker =
            Boolean(row.pointsAdjustment) || Boolean(row.manuallyAdjusted);

          return (
            <View
              key={row.id || `${row.team?.id ?? "t"}-${row.position}`}
              className={[
                "flex-row items-center px-2",
                spacious ? "gap-2 py-3.5" : compact ? "gap-1 py-2" : "gap-1 py-3",
              ].join(" ")}
              style={{
                backgroundColor: rowBackgroundColor,
                borderLeftWidth: 3,
                borderLeftColor: zoneColor,
                borderBottomWidth: index !== displayStandings.length - 1 ? 1 : 0,
                borderBottomColor: theme.cardBorder,
              }}
            >
              <View className={`${spacious ? "w-10" : "w-8"} flex-row items-center gap-1`}>
                <Text
                  className="min-w-3 text-[12px]"
                  style={{ color: isHighlighted ? theme.accent : theme.textMuted }}
                  numberOfLines={1}
                >
                  {displayPosition}
                </Text>
                {zoneIcon ? (
                  <Ionicons name={zoneIcon} size={11} color={zoneColor} />
                ) : null}
              </View>
              <Pressable
                disabled={!row.team}
                onPress={() => row.team && router.push(`/team/${row.team.id}`)}
                className="min-w-0 flex-1 flex-row items-center gap-1"
                style={{ minWidth: 0 }}
              >
                {row.team ? (
                  <EntityLogo
                    logoUrl={row.team.logoUrl}
                    variant="team"
                    size="xs"
                    tone="dark"
                  />
                ) : null}
                <Text
                  className={spacious ? "min-w-0 flex-1 text-sm" : "min-w-0 flex-1 text-[10px]"}
                  style={{
                    minWidth: 0,
                    color: isHighlighted ? theme.accent : theme.text,
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                >
                  {row.team?.name ?? "-"}
                </Text>
                {hasMarker ? (
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      if (onRowMarkerPress) {
                        onRowMarkerPress(row);
                        return;
                      }
                      showMarkerAlert(row);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Standing adjustment details"
                  >
                    <Text
                      className="text-sm"
                      style={{ color: theme.accent }}
                    >
                      *
                    </Text>
                  </Pressable>
                ) : null}
              </Pressable>
              <Col spacious={spacious}>{row.played}</Col>
              <Col spacious={spacious}>{row.wins}</Col>
              <Col spacious={spacious}>{row.draws}</Col>
              <Col spacious={spacious}>{row.losses}</Col>
              <Col spacious={spacious}>{row.goalDifference}</Col>
              <ColAccent spacious={spacious}>{row.points}</ColAccent>
            </View>
          );
        })}
      </View>

      {zoneLegend.length > 0 ? (
        <View className="flex-row flex-wrap gap-2 px-1">
          {zoneLegend.map((z) => (
            <View
              key={z.type}
              className="flex-row items-center gap-1.5 rounded-full border px-2 py-1"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              }}
            >
              <Ionicons
                name={ZONE_ICONS[z.type]}
                size={12}
                color={ZONE_COLORS[z.type]}
              />
              <Text
                className="text-[10px]"
                style={{ color: theme.textMuted }}
                numberOfLines={1}
              >
                {z.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function showMarkerAlert(row: ApiStanding) {
  const parts: string[] = [];
  if (row.pointsAdjustment) {
    const delta =
      row.pointsAdjustment > 0
        ? `+${row.pointsAdjustment}`
        : String(row.pointsAdjustment);
    parts.push(`Points adjustment: ${delta}`);
    if (row.adjustmentReasons?.length) {
      parts.push(...row.adjustmentReasons.map((r) => `• ${r}`));
    }
  }
  if (row.manuallyAdjusted) {
    parts.push(
      row.overrideReason
        ? `Manual order: ${row.overrideReason}`
        : "Position set by manual override",
    );
  }
  Alert.alert(
    row.team?.name ?? "Standing note",
    parts.join("\n") || "Adjusted standing",
  );
}

function uniqueZones(
  rows: ApiStanding[],
): { type: StandingZoneType; label: string }[] {
  const seen = new Map<StandingZoneType, string>();
  for (const row of rows) {
    if (!row.zone?.type || seen.has(row.zone.type)) continue;
    seen.set(
      row.zone.type,
      row.zone.label?.trim() || ZONE_DEFAULT_LABELS[row.zone.type],
    );
  }
  return [...seen.entries()].map(([type, label]) => ({ type, label }));
}

function applyZonesToStandings(
  rows: ApiStanding[],
  zones: ApiStandingZone[],
  stageGroupId: number | null,
  useTablePosition: boolean,
): ApiStanding[] {
  return rows.map((row, index) => {
    if (row.zone) return row;
    const position = useTablePosition ? index + 1 : row.position;
    const zone = findZoneForPosition(zones, position, stageGroupId);
    if (!zone) return row;
    return {
      ...row,
      zone: {
        type: zone.zoneType,
        label: zone.label,
      },
    };
  });
}

function findZoneForPosition(
  zones: ApiStandingZone[],
  position: number,
  stageGroupId: number | null,
): ApiStandingZone | null {
  const matching = zones.filter(
    (zone) =>
      position >= zone.fromPosition &&
      position <= zone.toPosition &&
      (zone.stageGroupId == null || zone.stageGroupId === stageGroupId),
  );
  return (
    matching.find((zone) => zone.stageGroupId === stageGroupId) ??
    matching.find((zone) => zone.stageGroupId == null) ??
    null
  );
}

function ColHeader({ children, spacious = false }: { children: string; spacious?: boolean }) {
  const theme = useTheme();

  return (
    <Text
      className={`${spacious ? "w-9" : "w-6"} text-right text-[10px] uppercase tracking-[1.2px]`}
      style={{ color: theme.textSubtle }}
      numberOfLines={1}
    >
      {children}
    </Text>
  );
}

function Col({ children, spacious = false }: { children: number; spacious?: boolean }) {
  const theme = useTheme();

  return (
    <Text
      className={`${spacious ? "w-9 text-sm" : "w-6 text-xs"} text-right`}
      style={{ color: theme.textMuted }}
      numberOfLines={1}
    >
      {children}
    </Text>
  );
}

function ColAccent({ children, spacious = false }: { children: number; spacious?: boolean }) {
  const theme = useTheme();

  return (
    <Text
      className={`${spacious ? "w-9 text-sm" : "w-6 text-xs"} text-right`}
      style={{ color: theme.accent }}
      numberOfLines={1}
    >
      {children}
    </Text>
  );
}

/** Group chips + stage standings tables for public/manage group views. */
export function GroupStandingsView({
  tables,
  highlightTeamId,
  zones,
  allGroups = false,
}: {
  tables: {
    stageGroupId: number | null;
    stageGroupName: string | null;
    sequence: number | null;
    rows: ApiStanding[];
  }[];
  highlightTeamId?: number;
  zones?: ApiStandingZone[];
  allGroups?: boolean;
}) {
  const theme = useTheme();
  const { isTablet } = useAdaptiveLayout();
  const ordered = [...tables].sort(
    (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0),
  );
  const [selectedId, setSelectedId] = useState<number | "all" | null>(
    ordered[0]?.stageGroupId ?? null,
  );

  if (!ordered.length) {
    return (
      <Text className="text-sm" style={{ color: theme.textSubtle }}>
        Standings not available yet.
      </Text>
    );
  }

  if (ordered.length === 1 && ordered[0]!.stageGroupId == null) {
    return (
      <LeagueStandingsTab
        standings={ordered[0]!.rows}
        highlightTeamId={highlightTeamId}
        zones={zones}
        stageGroupId={ordered[0]!.stageGroupId}
        useTablePositionForZones
      />
    );
  }

  const showAll = allGroups || selectedId === "all";
  const selected = ordered.find((t) => t.stageGroupId === selectedId) ?? ordered[0];

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap gap-2">
        {ordered.map((table) => {
          const id = table.stageGroupId;
          const active = !showAll && id === selected?.stageGroupId;
          return (
            <Pressable
              key={id ?? "rr"}
              onPress={() => setSelectedId(id)}
              className="rounded-xl border px-3 py-2 active:opacity-85"
              style={{
                backgroundColor: active ? theme.accentMuted : theme.card,
                borderColor: active ? theme.accent : theme.cardBorder,
              }}
            >
              <Text
                style={{ color: active ? theme.accent : theme.textMuted }}
              >
                {table.stageGroupName ?? "Table"}
              </Text>
            </Pressable>
          );
        })}
        {ordered.length > 1 ? (
          <Pressable
            onPress={() => setSelectedId("all")}
            className="rounded-xl border px-3 py-2 active:opacity-85"
            style={{
              backgroundColor: showAll ? theme.accentMuted : theme.card,
              borderColor: showAll ? theme.accent : theme.cardBorder,
            }}
          >
            <Text
              style={{ color: showAll ? theme.accent : theme.textMuted }}
            >
              All groups
            </Text>
          </Pressable>
        ) : null}
      </View>

      {showAll ? (
        <View className={isTablet ? "flex-row flex-wrap gap-5" : "gap-5"}>
          {ordered.map((table) => (
            <View
              key={table.stageGroupId ?? "rr"}
              style={isTablet ? { width: "48%" } : undefined}
            >
              <LeagueStandingsTab
                title={table.stageGroupName ?? "Table"}
                standings={table.rows}
                highlightTeamId={highlightTeamId}
                zones={zones}
                stageGroupId={table.stageGroupId}
                useTablePositionForZones
                compact
              />
            </View>
          ))}
        </View>
      ) : selected ? (
        <LeagueStandingsTab
          standings={selected.rows}
          highlightTeamId={highlightTeamId}
          zones={zones}
          stageGroupId={selected.stageGroupId}
          useTablePositionForZones
        />
      ) : null}
    </View>
  );
}
