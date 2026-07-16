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

import type { ApiStage, ApiTeam } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import {
  BracketView,
  KnockoutTieFormatControl,
  buildKnockoutConfig,
  byeCountForTeamCount,
  completedRoundReadyForNext,
  useCreateKnockoutStage,
  useGenerateNextRound,
  useSeedKnockoutStage,
  useStageBracket,
  type TieFormatSelection,
} from "@/knockout";
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

  return (
    <View className="gap-6 pb-8">
      <View className="flex-row items-center justify-between gap-3">
        <Text style={{ fontFamily: fonts.body }} className="flex-1 text-sm text-white/55">
          Seed brackets, advance rounds, or add a cup stage to this season.
        </Text>
        <Button
          variant="authPurple"
          label="Add cup"
          onPress={() => setCreateOpen(true)}
          className="h-11 px-4"
        />
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
          <Button
            variant="accent"
            label="Seed bracket"
            onPress={onOpenSeed}
            className="h-11 px-4"
            disabled={teams.length < 2}
          />
        ) : null}
        {readyRound && readyRound !== "final" ? (
          <Button
            variant="authPurple"
            label={
              nextRoundMutation.isPending ? "Generating…" : "Generate next round"
            }
            onPress={handleNextRound}
            loading={nextRoundMutation.isPending}
            className="h-11 px-4"
          />
        ) : null}
        {readyRound === "final" ? (
          <Button
            variant="authPurple"
            label="Mark stage complete"
            onPress={handleNextRound}
            loading={nextRoundMutation.isPending}
            className="h-11 px-4"
          />
        ) : null}
      </View>

      {bracketQuery.isLoading ? (
        <ActivityIndicator color="#E6A817" />
      ) : (
        <BracketView
          ties={ties}
          tone="dark"
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

  useEffect(() => {
    if (visible) setOrder([...teams]);
  }, [visible, teams]);

  const byeCount = byeCountForTeamCount(order.length);

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

  const handleSeed = async () => {
    if (order.length < 2) {
      showInfoToast("Need teams", "Add at least two teams before seeding.");
      return;
    }
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
      title="Seed bracket"
      subtitle="Top of the list = seed 1. Byes pad non–power-of-two draws."
      scrollEnabled
    >
      <View className="gap-3">
        <Text style={{ fontFamily: fonts.body }} className="text-sm text-slate-600">
          {order.length} teams
          {byeCount > 0 ? ` · ${byeCount} bye${byeCount === 1 ? "" : "s"}` : ""}
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
          label={seedMutation.isPending ? "Seeding…" : "Seed bracket"}
          loading={seedMutation.isPending}
          onPress={() => void handleSeed()}
        />
      </View>
    </BottomSheetModal>
  );
}
