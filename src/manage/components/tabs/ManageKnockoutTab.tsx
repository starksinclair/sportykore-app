import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";

import type { ApiStage, ApiTeam, KnockoutStageConfig } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import {
  BracketView,
  KnockoutTieFormatControl,
  buildKnockoutConfig,
  buildSeedPreviewTies,
  byeCountForTeamCount,
  byeExplanation,
  completedRoundReadyForNext,
  useCreateKnockoutStage,
  useGenerateNextRound,
  useSeedKnockoutStage,
  useStageBracket,
  type TieFormatSelection,
} from "@/knockout";
import { colors } from "@/constants";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

type Props = {
  leagueId: number;
  seasonId: number;
  stages: ApiStage[];
  teams: ApiTeam[];
};

export function ManageKnockoutTab({
  leagueId,
  seasonId,
  stages,
  teams,
}: Props) {
  const knockouts = useMemo(
    () =>
      stages
        .filter((s) => s.stageType === "knockout")
        .sort((a, b) => a.sequence - b.sequence),
    [stages],
  );

  const [selectedStageId, setSelectedStageId] = useState<number | null>(
    knockouts[0]?.id ?? null,
  );
  const selected =
    knockouts.find((s) => s.id === selectedStageId) ?? knockouts[0] ?? null;

  const [createOpen, setCreateOpen] = useState(false);
  const [seedOpen, setSeedOpen] = useState(false);
  const hasKnockoutStage = knockouts.length > 0;

  return (
    <View className="gap-6 pb-8">
      <View className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-accent-500/15">
            <Ionicons name="trophy-outline" size={22} color={colors.accent} />
          </View>
          <View className="min-w-0 flex-1">
            <Text style={{ fontFamily: fonts.bodyBold }} className="text-white">
              Knockout cup
            </Text>
            <Text
              style={{ fontFamily: fonts.body }}
              className="text-xs leading-5 text-white/50"
              numberOfLines={2}
            >
              {hasKnockoutStage
                ? "Seed the bracket and advance rounds for this cup."
                : "Add a cup stage, then seed teams in draw order."}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              if (hasKnockoutStage) {
                showInfoToast(
                  "Stage already exists",
                  "Knockout competitions can only have one stage.",
                );
                return;
              }
              setCreateOpen(true);
            }}
            disabled={hasKnockoutStage}
            accessibilityRole="button"
            accessibilityLabel="Add cup"
            className={`h-10 flex-row items-center gap-1.5 rounded-full px-3 ${
              hasKnockoutStage
                ? "bg-white/10 opacity-50"
                : "bg-accent-500 active:opacity-90"
            }`}
          >
            <Ionicons
              name="add"
              size={16}
              color={hasKnockoutStage ? colors.white : colors.darkLabel}
            />
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className={`text-xs ${
                hasKnockoutStage ? "text-white" : "text-neutral-950"
              }`}
              numberOfLines={1}
            >
              Add
            </Text>
          </Pressable>
        </View>
      </View>

      {knockouts.length === 0 ? (
        <View className="rounded-[22px] border border-dashed border-white/15 bg-white/5 px-5 py-8">
          <Text style={{ fontFamily: fonts.bodyBold }} className="text-base text-white">
            No knockout stage
          </Text>
          <Text
            style={{ fontFamily: fonts.body }}
            className="pt-2 text-sm leading-6 text-white/55"
          >
            Add a cup stage, then seed teams in draw order to build the bracket.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          <View className="flex-row flex-wrap gap-2">
            {knockouts.map((stage) => {
              const active = stage.id === selected?.id;
              return (
                <Pressable
                  key={stage.id}
                  onPress={() => setSelectedStageId(stage.id)}
                  className={`rounded-xl border px-3 py-2 ${
                    active
                      ? "border-accent-400 bg-accent-500/20"
                      : "border-white/15 bg-white/5"
                  }`}
                >
                  <Text
                    style={{ fontFamily: fonts.bodySemibold }}
                    className={active ? "text-accent-200" : "text-white/70"}
                  >
                    {stage.name} · {stage.status}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selected ? (
            <KnockoutStagePanel
              leagueId={leagueId}
              seasonId={seasonId}
              stage={selected}
              teams={teams}
              onOpenSeed={() => setSeedOpen(true)}
            />
          ) : null}
        </View>
      )}

      <CreateKnockoutStageSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        leagueId={leagueId}
        seasonId={seasonId}
        onCreated={(id) => {
          setSelectedStageId(id);
          setCreateOpen(false);
        }}
      />

      {selected ? (
        <SeedKnockoutSheet
          visible={seedOpen}
          onClose={() => setSeedOpen(false)}
          leagueId={leagueId}
          seasonId={seasonId}
          stage={selected}
          teams={teams}
        />
      ) : null}
    </View>
  );
}

function KnockoutStagePanel({
  leagueId,
  seasonId,
  stage,
  teams,
  onOpenSeed,
}: {
  leagueId: number;
  seasonId: number;
  stage: ApiStage;
  teams: ApiTeam[];
  onOpenSeed: () => void;
}) {
  const router = useRouter();
  const bracketQuery = useStageBracket(stage.id, true);
  const nextRoundMutation = useGenerateNextRound(leagueId, seasonId);
  const ties = bracketQuery.data?.ties ?? [];
  const readyRound = completedRoundReadyForNext(ties);
  const needsSeed = stage.status === "upcoming" && ties.length === 0;

  const handleNextRound = () => {
    if (!readyRound) return;
    Alert.alert(
      "Generate next round",
      `Confirm pairings from ${readyRound}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate",
          onPress: async () => {
            try {
              await nextRoundMutation.mutateAsync({
                stageId: stage.id,
                completedRound: readyRound,
              });
              showInfoToast("Round generated", "The next round is ready.");
            } catch (err) {
              showThrownAsToast(err, "Could not generate next round");
            }
          },
        },
      ],
    );
  };

  return (
    <View className="gap-4 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
      <View className="flex-row flex-wrap gap-2">
        {needsSeed ? (
          <KnockoutActionButton
            icon="git-branch-outline"
            label="Seed bracket"
            tone="gold"
            onPress={onOpenSeed}
            disabled={teams.length < 2}
          />
        ) : null}
        {readyRound && readyRound !== "final" ? (
          <KnockoutActionButton
            icon="play-forward-outline"
            label={
              nextRoundMutation.isPending ? "Generating…" : "Generate next round"
            }
            tone="gold"
            onPress={handleNextRound}
            loading={nextRoundMutation.isPending}
          />
        ) : null}
        {readyRound === "final" ? (
          <KnockoutActionButton
            icon="checkmark-done-outline"
            label="Mark stage complete"
            tone="gold"
            onPress={handleNextRound}
            loading={nextRoundMutation.isPending}
          />
        ) : null}
      </View>

      {bracketQuery.isLoading ? (
        <ActivityIndicator color="#E6A817" />
      ) : (
        <BracketView
          ties={ties}
          tone="dark"
          hasThirdPlace={Boolean(
            (stage.config as KnockoutStageConfig | undefined)?.format
              ?.has_third_place,
          )}
          onTiePress={(tie) => {
            const openGame = (tie.games ?? []).find(
              (g) =>
                g.status !== "full_time" &&
                g.status !== "completed" &&
                g.status !== "cancelled",
            );
            const anyGame = openGame ?? tie.games?.[0];
            if (anyGame) {
              router.push(`/manage/${leagueId}/game/${anyGame.id}`);
            }
          }}
        />
      )}
    </View>
  );
}

function KnockoutActionButton({
  icon,
  label,
  tone,
  loading,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: "gold" | "subtle";
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const inactive = disabled || loading;
  const gold = tone === "gold";

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      style={{ flexGrow: 1, minWidth: 148 }}
      className={`h-10 flex-row items-center justify-center gap-1.5 rounded-full border px-3 ${
        gold
          ? "border-accent-400 bg-accent-500 active:opacity-90"
          : "border-white/15 bg-white/10 active:bg-white/15"
      } ${inactive ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator
          color={gold ? colors.darkLabel : colors.white}
          size="small"
        />
      ) : (
        <>
          <Ionicons
            name={icon}
            size={15}
            color={gold ? colors.darkLabel : colors.white}
          />
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className={`min-w-0 text-center text-xs ${
              gold ? "text-neutral-950" : "text-white"
            }`}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

function CreateKnockoutStageSheet({
  visible,
  onClose,
  leagueId,
  seasonId,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  leagueId: number;
  seasonId: number;
  onCreated: (stageId: number) => void;
}) {
  const createMutation = useCreateKnockoutStage(leagueId, seasonId);
  const [name, setName] = useState("Cup");
  const [tieFormat, setTieFormat] = useState<TieFormatSelection>({
    kind: "single",
  });
  const [hasThirdPlace, setHasThirdPlace] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showInfoToast("Name required", "Enter a stage name.");
      return;
    }
    try {
      const result = await createMutation.mutateAsync({
        seasonId,
        name: trimmed,
        config: buildKnockoutConfig(tieFormat, hasThirdPlace),
      });
      showInfoToast("Cup stage added", "Seed teams to build the bracket.");
      onCreated(result.id);
      setName("Cup");
      setTieFormat({ kind: "single" });
      setHasThirdPlace(false);
    } catch {
      /* toasted in hook */
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Add knockout stage"
      subtitle="Cup / playoff bracket for this season"
    >
      <View className="gap-4">
        <AuthTextField
          label="Stage name"
          value={name}
          onChangeText={setName}
          placeholder="Cup"
        />
        <KnockoutTieFormatControl
          value={tieFormat}
          onChange={setTieFormat}
          hasThirdPlace={hasThirdPlace}
          onHasThirdPlaceChange={setHasThirdPlace}
          tone="light"
        />
        <Button
          variant="authPurple"
          label={createMutation.isPending ? "Creating…" : "Create stage"}
          loading={createMutation.isPending}
          onPress={() => void handleCreate()}
        />
      </View>
    </BottomSheetModal>
  );
}

function SeedKnockoutSheet({
  visible,
  onClose,
  leagueId,
  seasonId,
  stage,
  teams,
}: {
  visible: boolean;
  onClose: () => void;
  leagueId: number;
  seasonId: number;
  stage: ApiStage;
  teams: ApiTeam[];
}) {
  const seedMutation = useSeedKnockoutStage(leagueId, seasonId);
  const [order, setOrder] = useState<ApiTeam[]>(() => [...teams]);
  const [step, setStep] = useState<"order" | "preview">("order");

  useEffect(() => {
    if (visible) {
      setOrder([...teams]);
      setStep("order");
    }
  }, [visible, teams]);

  const byeCount = byeCountForTeamCount(order.length);
  const previewTies = useMemo(
    () => buildSeedPreviewTies(order, stage.config),
    [order, stage.config],
  );
  const hasThirdPlace = Boolean(
    (stage.config as KnockoutStageConfig | undefined)?.format?.has_third_place,
  );

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= order.length) return;
    setOrder((rows) => {
      const copy = [...rows];
      const tmp = copy[index]!;
      copy[index] = copy[next]!;
      copy[next] = tmp;
      return copy;
    });
  };

  const handlePreview = () => {
    if (order.length < 2) {
      showInfoToast("Need teams", "Add at least two teams before seeding.");
      return;
    }
    setStep("preview");
  };

  const handleGenerate = async () => {
    try {
      await seedMutation.mutateAsync({
        stageId: stage.id,
        seededTeams: order.map((t) => t.id),
      });
      showInfoToast("Bracket seeded", "Ties and fixtures are ready.");
      onClose();
    } catch {
      /* toasted */
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={step === "order" ? "Seed bracket" : "Preview bracket"}
      subtitle={
        step === "order"
          ? "Top of the list is seed 1. Teams pair in list order - 1 v 2, 3 v 4 - and byes go to the top seeds."
          : "Check the matchups before you lock them in."
      }
      scrollEnabled
    >
      {step === "order" ? (
        <View className="gap-3">
          <Text style={{ fontFamily: fonts.body }} className="text-sm text-slate-600">
            {order.length} teams
            {byeCount > 0
              ? byeCount === 1
                ? " · top seed skips round one"
                : ` · top ${byeCount} seeds skip round one`
              : ""}
          </Text>
          {order.map((team, index) => (
            <View
              key={team.id}
              className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="w-8 text-sm text-brand-700"
              >
                {index + 1}
              </Text>
              <Text
                style={{ fontFamily: fonts.bodySemibold }}
                className="flex-1 text-sm text-slate-900"
                numberOfLines={1}
              >
                {team.name}
              </Text>
              <Pressable onPress={() => move(index, -1)} hitSlop={8} className="p-1">
                <Ionicons name="chevron-up" size={18} color="#64748b" />
              </Pressable>
              <Pressable onPress={() => move(index, 1)} hitSlop={8} className="p-1">
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </Pressable>
            </View>
          ))}
          <Button
            variant="authPurple"
            label="Preview bracket"
            onPress={handlePreview}
          />
        </View>
      ) : (
        <View className="gap-4">
          <View style={{ marginHorizontal: -20 }}>
            <BracketView
              ties={previewTies}
              tone="dark"
              hasThirdPlace={hasThirdPlace}
            />
          </View>
          {byeExplanation(order.length) ? (
            <Text
              style={{ fontFamily: fonts.body }}
              className="text-sm leading-6 text-slate-600"
            >
              {byeExplanation(order.length)}
            </Text>
          ) : null}
          <View className="flex-row items-start gap-2 rounded-xl border border-accent-200 bg-accent-50 px-3 py-3">
            <Ionicons name="warning" size={18} color="#B88312" />
            <Text
              style={{ fontFamily: fonts.body }}
              className="flex-1 text-sm leading-5 text-slate-700"
            >
              Generating the bracket locks the seeding. You can&apos;t reorder
              or re-seed teams once ties and fixtures are created.
            </Text>
          </View>
          <View className="flex-row gap-3">
            <Button
              variant="secondary"
              label="Back"
              onPress={() => setStep("order")}
              className="flex-1"
            />
            <Button
              variant="authPurple"
              label={seedMutation.isPending ? "Generating…" : "Generate bracket"}
              loading={seedMutation.isPending}
              onPress={() => void handleGenerate()}
              className="flex-1"
            />
          </View>
        </View>
      )}
    </BottomSheetModal>
  );
}
