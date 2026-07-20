import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type {
  ApiStanding,
  ApiStandingZone,
  ApiStage,
  StandingZoneType,
} from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
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

      <View className="flex-row flex-wrap gap-2">
        <Button
          variant={editMode ? "accent" : "secondary"}
          label={editMode ? "Editing…" : "Edit standings"}
          className="h-11 px-4"
          onPress={() => setEditMode((v) => !v)}
        />
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
                onPress={() => void overrides.remove.mutateAsync(o.id)}
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
          <Text style={{ fontFamily: fonts.body }} className="text-xs text-white/45">
            Reordering is only allowed among teams tied on points and games played.
            Zones are presentation-only — they do not change points or order.
          </Text>

          <View className="gap-2 rounded-[20px] border border-white/10 bg-white/5 px-4 py-4">
            <Text style={{ fontFamily: fonts.bodyBold }} className="text-white">
              Point deductions
            </Text>
            {(adjustmentsQuery.data ?? []).map((a) => (
              <View
                key={a.id}
                className="flex-row items-center justify-between gap-2 border-b border-white/10 py-2"
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
                  onPress={() => void adjustments.remove.mutateAsync(a.id)}
                />
              </View>
            ))}
            <Button
              variant="authPurple"
              label="Add deduction"
              onPress={() => {
                setTeamId(primaryRows[0]?.team?.id ?? null);
                setDelta("-3");
                setReason("");
                setAdjOpen(true);
              }}
            />
          </View>

          <View className="gap-2 rounded-[20px] border border-white/10 bg-white/5 px-4 py-4">
            <Text style={{ fontFamily: fonts.bodyBold }} className="text-white">
              Tied cohorts
            </Text>
            {[...cohorts.entries()].map(([key, rows]) => (
              <Pressable
                key={key}
                onPress={() => openReorder(rows)}
                className="rounded-xl border border-white/15 px-3 py-3"
              >
                <Text
                  style={{ fontFamily: fonts.bodySemibold }}
                  className="text-white"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {rows.length} teams on {key.replace(":", " pts · ")} played
                </Text>
                <Text style={{ fontFamily: fonts.body }} className="text-xs text-white/50">
                  Tap to reorder this cohort
                </Text>
              </Pressable>
            ))}
            {cohorts.size === 0 ? (
              <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
                No tied cohorts right now.
              </Text>
            ) : null}
            <Pressable
              onPress={() =>
                showInfoToast(
                  "Locked rows",
                  "Only teams with the same points and games played can be reordered together.",
                )
              }
            >
              <Text style={{ fontFamily: fonts.body }} className="text-xs text-white/40">
                {"Why can't I drag other rows?"}
              </Text>
            </Pressable>
          </View>

          <View className="gap-2 rounded-[20px] border border-white/10 bg-white/5 px-4 py-4">
            <Text style={{ fontFamily: fonts.bodyBold }} className="text-white">
              Zones
            </Text>
            {(zonesQuery.data ?? []).map((z) => (
              <View
                key={z.id}
                className="flex-row items-center justify-between gap-2 border-b border-white/10 py-2"
              >
                <Pressable
                  className="min-w-0 flex-1"
                  onPress={() => {
                    setEditingZone(z);
                    setZoneType(z.zoneType);
                    setFromPos(String(z.fromPosition));
                    setToPos(String(z.toPosition));
                    setZoneLabel(z.label ?? "");
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
                  </Text>
                </Pressable>
                <Button
                  variant="secondary"
                  label="Delete"
                  className="h-9 px-3"
                  onPress={() => void zones.remove.mutateAsync(z.id)}
                />
              </View>
            ))}
            <Button
              variant="secondary"
              label="Add zone"
              onPress={() => {
                setEditingZone(null);
                setZoneType("qualified");
                setFromPos("1");
                setToPos("2");
                setZoneLabel("");
                setZoneOpen(true);
              }}
            />
          </View>
        </View>
      ) : null}

      <BottomSheetModal
        visible={adjOpen}
        onClose={() => setAdjOpen(false)}
        title="Point adjustment"
        subtitle="Non-zero delta with a required reason. Multiple adjustments sum."
        variant="dark"
      >
        <View className="gap-3">
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
          <Button
            variant="authPurple"
            label="Save"
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
                });
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
        <View className="gap-3">
          {cohortOrder.map((id, index) => {
            const row = primaryRows.find((r) => r.team?.id === id);
            return (
              <View
                key={id}
                className="flex-row items-center justify-between gap-2"
              >
                <Text
                  style={{ fontFamily: fonts.body }}
                  className="min-w-0 flex-1 text-white"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {index + 1}. {row?.team?.name ?? id}
                </Text>
                <View className="flex-row gap-2">
                  <Button
                    variant="secondary"
                    label="↑"
                    className="h-9 w-12"
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
                  <Button
                    variant="secondary"
                    label="↓"
                    className="h-9 w-12"
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
          <AuthTextField
            label="Reason"
            labelClassName="text-white/60"
            value={reorderReason}
            onChangeText={setReorderReason}
          />
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
                    rank: i + 1,
                  })),
                })
                .then(() => {
                  setReorderOpen(false);
                  showInfoToast("Order saved", "Standings refreshed.");
                });
            }}
          />
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        visible={zoneOpen}
        onClose={() => setZoneOpen(false)}
        title={editingZone ? "Edit zone" : "Add zone"}
        subtitle="Zones only color the table — they never change points or ranking."
        variant="dark"
      >
        <View className="gap-3">
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
          <AuthTextField
            label="Label"
            labelClassName="text-white/60"
            value={zoneLabel}
            onChangeText={setZoneLabel}
            placeholder="Optional"
          />
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
              };
              const req = editingZone
                ? zones.update.mutateAsync({ id: editingZone.id, payload })
                : zones.create.mutateAsync(payload);
              void req.then(() => {
                setZoneOpen(false);
                showInfoToast("Zone saved", "Table colors updated.");
              });
            }}
          />
        </View>
      </BottomSheetModal>
    </View>
  );
}
