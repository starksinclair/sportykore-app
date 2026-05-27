import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiLeague, ApiSeason } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { DIVISION_OPTIONS } from "@/league/league-create-constants";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

import { useCreateSeason, useUpdateLeague } from "../../hooks";
import { SeasonStatusEnum } from "../../types";

type Props = {
  leagueId: number;
  league: ApiLeague;
  seasons: ApiSeason[];
  activeSeasonId: number;
  onSeasonCreated: (seasonId: number) => void;
};

export function ManageSettingsTab({
  leagueId,
  league,
  seasons,
  activeSeasonId,
  onSeasonCreated,
}: Props) {
  const updateLeagueMutation = useUpdateLeague(leagueId, activeSeasonId);
  const createSeasonMutation = useCreateSeason(leagueId, activeSeasonId);

  const [name, setName] = useState(league.name);
  const [description, setDescription] = useState(league.description ?? "");
  const [divisionId, setDivisionId] = useState<(typeof DIVISION_OPTIONS)[number]["id"]>("open");

  const [seasonName, setSeasonName] = useState("");
  const [seasonStatus, setSeasonStatus] = useState<
    (typeof SeasonStatusEnum)[keyof typeof SeasonStatusEnum]
  >(SeasonStatusEnum.Inactive);

  useEffect(() => {
    setName(league.name);
    setDescription(league.description ?? "");
  }, [league.id, league.name, league.description]);

  const handleSaveLeague = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showInfoToast("Name required", "Enter a league name.");
      return;
    }
    try {
      await updateLeagueMutation.mutateAsync({
        name: trimmed,
        description: description.trim() || null,
        gender: divisionId === "open" ? null : divisionId,
      });
      showInfoToast("League updated", "Your changes were saved.");
    } catch (err) {
      showThrownAsToast(err, "Could not update league");
    }
  };

  const handleAddSeason = async () => {
    const trimmed = seasonName.trim();
    if (!trimmed) {
      showInfoToast("Season name required", "e.g. 2027 — Spring");
      return;
    }
    try {
      const created = await createSeasonMutation.mutateAsync({
        name: trimmed,
        status: seasonStatus,
      });
      setSeasonName("");
      onSeasonCreated(created.id);
      showInfoToast("Season created", `"${created.name}" is now available in the picker.`);
    } catch (err) {
      showThrownAsToast(err, "Could not create season");
    }
  };

  return (
    <View className="gap-8 pb-10">
      <View className="gap-4 rounded-[24px] border border-white/10 bg-white/5 px-4 py-5">
        <Text style={{ fontFamily: fonts.bodyBold }} className="text-lg text-white">
          Edit league
        </Text>
        <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
          Updates apply to the whole league, not just the selected season.
        </Text>

        <AuthTextField
          label="League name"
          value={name}
          onChangeText={setName}
          containerClassName="[&_input]:text-neutral-900"
        />
        <AuthTextField
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          containerClassName="[&_input]:text-neutral-900"
        />

        <View className="gap-2">
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className="text-xs uppercase tracking-wide text-white/45"
          >
            Division
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {DIVISION_OPTIONS.map((opt) => {
              const active = divisionId === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setDivisionId(opt.id)}
                  className={`rounded-xl border px-3 py-2 ${
                    active ? "border-brand-400 bg-brand-500/30" : "border-white/15 bg-white/5"
                  }`}
                >
                  <Text
                    style={{ fontFamily: fonts.bodySemibold }}
                    className={active ? "text-white" : "text-white/70"}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button
          variant="authPurple"
          label={updateLeagueMutation.isPending ? "Saving…" : "Save league"}
          loading={updateLeagueMutation.isPending}
          onPress={() => void handleSaveLeague()}
        />
      </View>

      <View className="gap-4 rounded-[24px] border border-white/10 bg-white/5 px-4 py-5">
        <Text style={{ fontFamily: fonts.bodyBold }} className="text-lg text-white">
          Add season
        </Text>
        <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
          Existing seasons cannot be renamed via the API. Create a new season when you start a
          new campaign.
        </Text>

        {seasons.length > 0 ? (
          <View className="gap-1 rounded-xl bg-white/5 px-3 py-3">
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-xs uppercase tracking-wide text-white/40"
            >
              Current seasons
            </Text>
            {seasons.map((s) => (
              <Text
                key={s.id}
                style={{ fontFamily: fonts.body }}
                className="text-sm text-white/75"
              >
                {s.name} · {s.status}
              </Text>
            ))}
          </View>
        ) : null}

        <AuthTextField
          label="Season name"
          value={seasonName}
          onChangeText={setSeasonName}
          placeholder="2027 — Spring"
          containerClassName="[&_input]:text-neutral-900"
        />

        <View className="gap-2">
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className="text-xs uppercase tracking-wide text-white/45"
          >
            Initial status
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {(
              [
                SeasonStatusEnum.Inactive,
                SeasonStatusEnum.Active,
                SeasonStatusEnum.Completed,
              ] as const
            ).map((status) => {
              const active = seasonStatus === status;
              return (
                <Pressable
                  key={status}
                  onPress={() => setSeasonStatus(status)}
                  className={`rounded-xl border px-3 py-2 capitalize ${
                    active ? "border-accent-400 bg-accent-500/20" : "border-white/15 bg-white/5"
                  }`}
                >
                  <Text
                    style={{ fontFamily: fonts.bodySemibold }}
                    className={active ? "text-accent-300" : "text-white/70"}
                  >
                    {status}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button
          variant="accent"
          label={createSeasonMutation.isPending ? "Creating…" : "Add season"}
          loading={createSeasonMutation.isPending}
          onPress={() => void handleAddSeason()}
        />
      </View>
    </View>
  );
}
