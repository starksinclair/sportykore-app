import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import type {
  ApiStage,
  ApiStanding,
  ApiStandingZone,
  StandingZoneType,
} from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { colors } from "@/constants";
import {
  standingStages,
  tiedCohorts,
  useAdjustmentMutations,
  useAdjustments,
  useOverrideMutations,
  useStageStandings,
  useZoneMutations,
  useZones,
} from "@/groups";
import {
  GroupStandingsView,
  LeagueStandingsTab,
  showMarkerAlert,
} from "@/league/components/tabs/StandingsTab";
import { showInfoToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

type Props = {
  leagueId: number;
  seasonId: number;
  stages: ApiStage[];
};

const ZONE_TYPES: StandingZoneType[] = [
  "qualified",
  "promotion",
  "promotion_playoff",
  "playoff",
  "relegation_playoff",
  "relegation",
];

const EMPTY_STANDINGS: ApiStanding[] = [];

function ToolPanel({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <View className="gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
      <View className="flex-row items-start gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-2xl bg-white/10">
          <Ionicons name={icon} size={18} color="#E6A817" />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text style={{ fontFamily: fonts.bodyBold }} className="text-white">
            {title}
          </Text>
          <Text
            style={{ fontFamily: fonts.body }}
            className="text-xs leading-5 text-white/45"
          >
            {description}
          </Text>
        </View>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            accessibilityRole="button"
            className="h-9 items-center justify-center rounded-full bg-white px-3 active:bg-slate-100"
          >
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-xs text-neutral-950"
              numberOfLines={1}
            >
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View className="gap-2">{children}</View>
    </View>
  );
}

function EmptyToolState({ text }: { text: string }) {
  return (
    <View className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
      <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
        {text}
      </Text>
    </View>
  );
}

function SheetBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-2 rounded-[18px] border border-white/10 bg-white/[0.03] px-3 py-3">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-xs uppercase tracking-wide text-white/50"
      >
        {title}
      </Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}

function MoveButton({
  icon,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      className={`h-9 w-9 items-center justify-center rounded-xl border ${
        disabled
          ? "border-white/5 bg-white/5 opacity-40"
          : "border-white/15 bg-white/10 active:bg-white/15"
      }`}
    >
      <Ionicons name={icon} size={17} color="#FFFFFF" />
    </Pressable>
  );
}

export function ManageStandingsTab({ leagueId, seasonId, stages }: Props) {
  const candidates = standingStages(stages);
  const [stageId, setStageId] = useState(candidates[0]?.id ?? 0);
  const stage = candidates.find((s) => s.id === stageId) ?? candidates[0] ?? null;

  const standingsQuery = useStageStandings(stage?.id ?? 0, Boolean(stage));
  const adjustmentsQuery = useAdjustments(stage?.id ?? 0, Boolean(stage));
  const zonesQuery = useZones(stage?.id ?? 0, Boolean(stage));

  const adjustments = useAdjustmentMutations(
    leagueId,
    seasonId,
    stage?.id ?? 0,
  );
  const overrides = useOverrideMutations(leagueId, seasonId, stage?.id ?? 0);
  const zones = useZoneMutations(leagueId, seasonId, stage?.id ?? 0);

  const [editMode, setEditMode] = useState(false);
  const [adjOpen, setAdjOpen] = useState(false);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [delta, setDelta] = useState("-3");
  const [reason, setReason] = useState("");
  const [teamId, setTeamId] = useState<number | null>(null);
  const [editingZone, setEditingZone] = useState<ApiStandingZone | null>(null);
  const [zoneType, setZoneType] = useState<StandingZoneType>("qualified");
  const [fromPos, setFromPos] = useState("1");
  const [toPos, setToPos] = useState("2");
  const [zoneLabel, setZoneLabel] = useState("");
  const [zoneStageGroupId, setZoneStageGroupId] = useState<number | null>(null);
  const [reorderReason, setReorderReason] = useState("");
  const [cohortOrder, setCohortOrder] = useState<number[]>([]);

  const tables = standingsQuery.data?.tables ?? [];
  const primaryRows = tables[0]?.rows ?? EMPTY_STANDINGS;
  const stale = tables.flatMap((t) => t.staleOverrides ?? []);

  const cohorts = useMemo(() => tiedCohorts(primaryRows), [primaryRows]);

  if (!stage) {
    return (
      <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
        No standings stage on this season.
      </Text>
    );
  }

  const openReorder = (rows: ApiStanding[]) => {
    setCohortOrder(rows.map((r) => r.team?.id).filter((id): id is number => id != null));
    setReorderReason("");
    setReorderOpen(true);
  };

  return (
    <View className="gap-5 pb-10">
      {candidates.length > 1 ? (
        <View className="flex-row flex-wrap gap-2">
          {candidates.map((s) => {
            const active = s.id === stage.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setStageId(s.id)}
                style={{ maxWidth: "100%" }}
                className={`rounded-xl border px-3 py-2 ${
                  active
                    ? "border-accent-400 bg-accent-500/20"
                    : "border-white/15 bg-white/5"
                }`}
              >
                <Text
                  style={{ fontFamily: fonts.bodySemibold }}
                  className={active ? "text-accent-200" : "text-white/70"}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {s.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-accent-500/15">
            <Ionicons name="options-outline" size={20} color="#E6A817" />
          </View>
          <View className="min-w-0 flex-1">
            <Text style={{ fontFamily: fonts.bodyBold }} className="text-white">
              Standing tools
            </Text>
            <Text
              style={{ fontFamily: fonts.body }}
              className="text-xs leading-5 text-white/50"
              numberOfLines={2}
            >
              Adjust points, resolve tied rows, and color table zones.
            </Text>
          </View>
          <Pressable
            onPress={() => setEditMode((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={editMode ? "Close standing tools" : "Edit standings"}
            className={`h-10 flex-row items-center gap-1.5 rounded-full px-3 ${
              editMode ? "bg-accent-500" : "bg-white/10"
            }`}
          >
            <Ionicons
              name={editMode ? "close" : "create-outline"}
              size={15}
              color={editMode ? "#171717" : "#FFFFFF"}
            />
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className={`text-xs ${editMode ? "text-neutral-950" : "text-white"}`}
              numberOfLines={1}
            >
              {editMode ? "Done" : "Edit"}
            </Text>
          </Pressable>
        </View>
      </View>

      {stale.length > 0 ? (
        <View className="gap-2 rounded-[20px] border border-orange-400/40 bg-orange-500/10 px-4 py-3">
          <Text style={{ fontFamily: fonts.bodyBold }} className="text-sm text-orange-200">
            Stale overrides
          </Text>
          <Text style={{ fontFamily: fonts.body }} className="text-xs text-white/60">
            These no longer match a live points/played tie. Clear them or leave as history.
          </Text>
          {stale.map((o) => (
            <View
              key={o.id}
              className="flex-row items-center justify-between gap-2 py-1"
            >
              <Text
                style={{ fontFamily: fonts.body }}
                className="min-w-0 flex-1 text-sm text-white/80"
                numberOfLines={2}
              >
                {o.team?.name ?? `Team ${o.teamId}`} · {o.reason}
              </Text>
              <Button
                variant="secondary"
                label="Clear"
                className="h-9 px-3"
                loading={overrides.remove.isPending}
                onPress={() => {
                  void overrides.remove.mutateAsync(o.id).catch(() => undefined);
                }}
              />
            </View>
          ))}
        </View>
      ) : null}

      {stage.stageType === "group" ? (
        <GroupStandingsView tables={tables} zones={zonesQuery.data ?? []} />
      ) : (
        <LeagueStandingsTab
          standings={primaryRows}
          zones={zonesQuery.data ?? []}
          onRowMarkerPress={showMarkerAlert}
        />
      )}

      {editMode ? (
        <View className="gap-4">
          <View className="flex-row items-start gap-2 rounded-2xl border border-accent-400/20 bg-accent-500/10 px-3 py-3">
            <Ionicons name="information-circle-outline" size={18} color="#E6A817" />
            <Text
              style={{ fontFamily: fonts.body }}
              className="min-w-0 flex-1 text-xs leading-5 text-white/60"
            >
              Reordering only works for teams tied on points and games played.
              Zones are visual only; they never change points or order.
            </Text>
          </View>

          <ToolPanel
            icon="remove-circle-outline"
            title="Point deductions"
            description="Apply approved point changes with a reason."
            actionLabel="Add"
            onAction={() => {
              setTeamId(primaryRows[0]?.team?.id ?? null);
              setDelta("-3");
              setReason("");
              setAdjOpen(true);
            }}
          >
            {(adjustmentsQuery.data ?? []).map((a) => (
              <View
                key={a.id}
                className="flex-row items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 py-3"
              >
                <View className="min-w-0 flex-1">
                  <Text
                    style={{ fontFamily: fonts.bodySemibold }}
                    className="text-white"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {a.team?.name ?? `Team ${a.teamId}`} · {a.pointsDelta > 0 ? "+" : ""}
                    {a.pointsDelta}
                  </Text>
                  <Text
                    style={{ fontFamily: fonts.body }}
                    className="text-xs text-white/50"
                    numberOfLines={2}
                  >
                    {a.reason}
                  </Text>
                </View>
                <Button
                  variant="secondary"
                  label="Remove"
                  className="h-9 px-3"
                  onPress={() => {
                    void adjustments.remove.mutateAsync(a.id).catch(() => undefined);
                  }}
                />
              </View>
            ))}
            {(adjustmentsQuery.data ?? []).length === 0 ? (
              <EmptyToolState text="No point deductions on this table." />
            ) : null}
          </ToolPanel>

          <ToolPanel
            icon="swap-vertical-outline"
            title="Tied cohorts"
            description="Only tied teams can be manually ordered."
          >
            {[...cohorts.entries()].map(([key, rows]) => (
              <Pressable
                key={key}
                onPress={() => openReorder(rows)}
                className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-3 active:bg-white/10"
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-9 w-9 items-center justify-center rounded-2xl bg-white/10">
                    <Text
                      style={{ fontFamily: fonts.bodyBold }}
                      className="text-xs text-accent-200"
                    >
                      {rows.length}
                    </Text>
                  </View>
                  <View className="min-w-0 flex-1 gap-1">
                    <Text
                      style={{ fontFamily: fonts.bodySemibold }}
                      className="text-sm text-white"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {key.replace(":", " pts · ")} played
                    </Text>
                    <Text
                      style={{ fontFamily: fonts.body }}
                      className="text-xs text-white/45"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {rows.map((row) => row.team?.name ?? `Team ${row.team?.id}`).join(", ")}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.45)" />
                </View>
              </Pressable>
            ))}
            {cohorts.size === 0 ? (
              <EmptyToolState text="No tied cohorts right now." />
            ) : null}
            <Pressable
              onPress={() =>
                showInfoToast(
                  "Locked rows",
                  "Only teams with the same points and games played can be reordered together.",
                )
              }
            >
              <Text style={{ fontFamily: fonts.bodyBold }} className="text-xs text-accent-200">
                {"Why can't I drag other rows?"}
              </Text>
            </Pressable>
          </ToolPanel>

          <ToolPanel
            icon="color-fill-outline"
            title="Zones"
            description="Show promotion, playoff, and relegation bands."
            actionLabel="Add"
            onAction={() => {
              setEditingZone(null);
              setZoneType("qualified");
              setFromPos("1");
              setToPos("2");
              setZoneLabel("");
              setZoneStageGroupId(null);
              setZoneOpen(true);
            }}
          >
            {(zonesQuery.data ?? []).map((z) => (
              <View
                key={z.id}
                className="flex-row items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 py-3"
              >
                <Pressable
                  className="min-w-0 flex-1"
                  onPress={() => {
                    setEditingZone(z);
                    setZoneType(z.zoneType);
                    setFromPos(String(z.fromPosition));
                    setToPos(String(z.toPosition));
                    setZoneLabel(z.label ?? "");
                    setZoneStageGroupId(z.stageGroupId ?? null);
                    setZoneOpen(true);
                  }}
                >
                  <Text
                    style={{ fontFamily: fonts.bodySemibold }}
                    className="text-white"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {z.label || z.zoneType} · {z.fromPosition}–{z.toPosition}
                    {stage.stageType === "group"
                      ? ` · ${zoneScopeLabel(z.stageGroupId ?? null, tables)}`
                      : ""}
                  </Text>
                  <Text
                    style={{ fontFamily: fonts.body }}
                    className="pt-1 text-xs text-white/45"
                    numberOfLines={1}
                  >
                    Positions {z.fromPosition}–{z.toPosition}
                  </Text>
                </Pressable>
                <Button
                  variant="secondary"
                  label="Delete"
                  className="h-9 px-3"
                  onPress={() => {
                    void zones.remove.mutateAsync(z.id).catch(() => undefined);
                  }}
                />
              </View>
            ))}
            {(zonesQuery.data ?? []).length === 0 ? (
              <EmptyToolState text="No zones have been added yet." />
            ) : null}
          </ToolPanel>
        </View>
      ) : null}

      <BottomSheetModal
        visible={adjOpen}
        onClose={() => setAdjOpen(false)}
        title="Point adjustment"
        subtitle="Non-zero delta with a required reason. Multiple adjustments sum."
        variant="dark"
      >
        <View className="gap-4">
          <SheetBlock title="Team">
            <View className="flex-row flex-wrap gap-2">
            {primaryRows.map((row) => {
              const id = row.team?.id;
              if (id == null) return null;
              const active = teamId === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setTeamId(id)}
                  style={{ maxWidth: "100%" }}
                  className={`rounded-xl border px-3 py-2 ${
                    active
                      ? "border-accent-400 bg-accent-500/20"
                      : "border-white/15 bg-white/5"
                  }`}
                >
                  <Text
                    style={{ fontFamily: fonts.bodySemibold }}
                    className="text-sm text-white"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                  {row.team?.name}
                </Text>
              </Pressable>
            );
          })}
            </View>
          </SheetBlock>
          <SheetBlock title="Adjustment">
          <AuthTextField
            label="Points delta"
            labelClassName="text-white/60"
            value={delta}
            onChangeText={setDelta}
            keyboardType="numbers-and-punctuation"
          />
          <AuthTextField
            label="Reason"
            labelClassName="text-white/60"
            value={reason}
            onChangeText={setReason}
          />
          </SheetBlock>
          <Button
            variant="authPurple"
            label="Save adjustment"
            loading={adjustments.create.isPending}
            onPress={() => {
              const n = Number(delta);
              if (!teamId || !Number.isFinite(n) || n === 0 || !reason.trim()) {
                showInfoToast(
                  "Invalid adjustment",
                  "Pick a team, non-zero delta, and reason.",
                );
                return;
              }
              void adjustments.create
                .mutateAsync({
                  teamId,
                  pointsDelta: n,
                  reason: reason.trim(),
                })
                .then(() => {
                  setAdjOpen(false);
                  showInfoToast("Saved", "Standings will refresh.");
                })
                .catch(() => undefined);
            }}
          />
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        visible={reorderOpen}
        onClose={() => setReorderOpen(false)}
        title="Reorder tied teams"
        subtitle="Send the full cohort as a contiguous 1…N order."
        variant="dark"
      >
        <View className="gap-4">
          <SheetBlock title="Order">
          {cohortOrder.map((id, index) => {
            const row = primaryRows.find((r) => r.team?.id === id);
            return (
              <View
                key={id}
                className="flex-row items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-accent-500/15">
                  <Text
                    style={{ fontFamily: fonts.bodyBold }}
                    className="text-xs text-accent-200"
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text
                  style={{ fontFamily: fonts.bodySemibold }}
                  className="min-w-0 flex-1 text-white"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {row?.team?.name ?? id}
                </Text>
                <View className="flex-row gap-2">
                  <MoveButton
                    icon="chevron-up"
                    disabled={index === 0}
                    onPress={() => {
                      if (index === 0) return;
                      setCohortOrder((prev) => {
                        const next = [...prev];
                        const tmp = next[index - 1]!;
                        next[index - 1] = next[index]!;
                        next[index] = tmp;
                        return next;
                      });
                    }}
                  />
                  <MoveButton
                    icon="chevron-down"
                    disabled={index === cohortOrder.length - 1}
                    onPress={() => {
                      if (index >= cohortOrder.length - 1) return;
                      setCohortOrder((prev) => {
                        const next = [...prev];
                        const tmp = next[index + 1]!;
                        next[index + 1] = next[index]!;
                        next[index] = tmp;
                        return next;
                      });
                    }}
                  />
                </View>
              </View>
            );
          })}
          </SheetBlock>
          <SheetBlock title="Reason">
          <AuthTextField
            label="Please explain the reason for the change"
            labelClassName="text-white/60 text-xs lowercase"
            value={reorderReason}
            cursorColor={colors.accent}
            onChangeText={setReorderReason}
          />
          </SheetBlock>
          <Button
            variant="authPurple"
            label="Apply order"
            loading={overrides.create.isPending}
            onPress={() => {
              if (!reorderReason.trim()) {
                showInfoToast("Reason required", "Explain the override.");
                return;
              }
              void overrides.create
                .mutateAsync({
                  reason: reorderReason.trim(),
                  ranks: cohortOrder.map((id, i) => ({
                    teamId: id,
                    manualRank: i + 1,
                  })),
                })
                .then(() => {
                  setReorderOpen(false);
                  showInfoToast("Order saved", "Standings refreshed.");
                })
                .catch(() => undefined);
            }}
          />
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        visible={zoneOpen}
        onClose={() => setZoneOpen(false)}
        title={editingZone ? "Edit zone" : "Add zone"}
        subtitle="Zones only color the table - they never change points or ranking."
        variant="dark"
      >
        <View className="gap-4">
          <SheetBlock title="Zone type">
            <View className="flex-row flex-wrap gap-2">
            {ZONE_TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setZoneType(t)}
                style={{ maxWidth: "100%" }}
                className={`rounded-xl border px-3 py-2 ${
                  zoneType === t
                    ? "border-accent-400 bg-accent-500/20"
                    : "border-white/15 bg-white/5"
                }`}
              >
                <Text
                  style={{ fontFamily: fonts.bodySemibold }}
                  className="text-xs text-white"
                  numberOfLines={1}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
            </View>
          </SheetBlock>
          {stage.stageType === "group" ? (
            <SheetBlock title="Apply to">
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => setZoneStageGroupId(null)}
                  style={{ maxWidth: "100%" }}
                  className={`rounded-xl border px-3 py-2 ${
                    zoneStageGroupId == null
                      ? "border-accent-400 bg-accent-500/20"
                      : "border-white/15 bg-white/5"
                  }`}
                >
                  <Text
                    style={{ fontFamily: fonts.bodySemibold }}
                    className="text-xs text-white"
                    numberOfLines={1}
                  >
                    All groups
                  </Text>
                </Pressable>
                {tables.map((table) => {
                  if (table.stageGroupId == null) return null;
                  const active = zoneStageGroupId === table.stageGroupId;
                  return (
                    <Pressable
                      key={table.stageGroupId}
                      onPress={() => setZoneStageGroupId(table.stageGroupId)}
                      style={{ maxWidth: "100%" }}
                      className={`rounded-xl border px-3 py-2 ${
                        active
                          ? "border-accent-400 bg-accent-500/20"
                          : "border-white/15 bg-white/5"
                      }`}
                    >
                      <Text
                        style={{ fontFamily: fonts.bodySemibold }}
                        className="text-xs text-white"
                        numberOfLines={1}
                      >
                        {table.stageGroupName ?? `Group ${table.stageGroupId}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </SheetBlock>
          ) : null}
          <SheetBlock title="Position range">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <AuthTextField
                label="From"
                labelClassName="text-white/60"
                value={fromPos}
                onChangeText={setFromPos}
                keyboardType="number-pad"
              />
            </View>
            <View className="flex-1">
              <AuthTextField
                label="To"
                labelClassName="text-white/60"
                value={toPos}
                onChangeText={setToPos}
                keyboardType="number-pad"
              />
            </View>
          </View>
          </SheetBlock>
          <SheetBlock title="Label">
          <AuthTextField
            label="Label"
            labelClassName="text-white/60"
            value={zoneLabel}
            onChangeText={setZoneLabel}
            placeholder="Optional"
          />
          </SheetBlock>
          <Button
            variant="authPurple"
            label="Save zone"
            loading={zones.create.isPending || zones.update.isPending}
            onPress={() => {
              const from = Number(fromPos);
              const to = Number(toPos);
              if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < from) {
                showInfoToast("Invalid range", "Use positions from ≤ to.");
                return;
              }
              const payload = {
                zoneType,
                positionStart: from,
                positionEnd: to,
                label: zoneLabel.trim() || null,
                stageGroupId:
                  stage.stageType === "group" ? zoneStageGroupId : null,
              };
              const req = editingZone
                ? zones.update.mutateAsync({ id: editingZone.id, payload })
                : zones.create.mutateAsync(payload);
              void req.then(() => {
                setZoneOpen(false);
                showInfoToast("Zone saved", "Table colors updated.");
              }).catch(() => undefined);
            }}
          />
        </View>
      </BottomSheetModal>
    </View>
  );
}

function zoneScopeLabel(
  stageGroupId: number | null,
  tables: { stageGroupId: number | null; stageGroupName: string | null }[],
): string {
  if (stageGroupId == null) return "All groups";
  return (
    tables.find((table) => table.stageGroupId === stageGroupId)?.stageGroupName ??
    `Group ${stageGroupId}`
  );
}
