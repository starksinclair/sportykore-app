import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { ApiLeague, ApiSeason, SeasonStatus } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { TiebreakerPicker } from "@/league/components/TiebreakerPicker";
import { DIVISION_OPTIONS } from "@/league/league-create-constants";
import {
  DEFAULT_TIEBREAKER,
  type TiebreakerRule,
} from "@/league/tiebreaker-options";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

import { useCreateSeason, useUpdateLeague } from "../../hooks";
import { SeasonStatusEnum } from "../../types";
import { EditSeasonSheet } from "../seasons/EditSeasonSheet";
import { SeasonStatusPicker } from "../seasons/SeasonStatusPicker";

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
  const [tiebreakerId, setTiebreakerId] = useState<TiebreakerRule>(
    league.tiebreaker ?? DEFAULT_TIEBREAKER,
  );

  const [editingSeason, setEditingSeason] = useState<ApiSeason | null>(null);
  const [newSeasonName, setNewSeasonName] = useState("");
  const [newSeasonStatus, setNewSeasonStatus] = useState<SeasonStatus>(
    SeasonStatusEnum.Inactive,
  );

  useEffect(() => {
    setName(league.name);
    setDescription(league.description ?? "");
    setTiebreakerId(league.tiebreaker ?? DEFAULT_TIEBREAKER);
  }, [league.id, league.name, league.description, league.tiebreaker]);

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
        tiebreaker: tiebreakerId,
      });
      showInfoToast("League updated", "Your changes were saved.");
    } catch (err) {
      showThrownAsToast(err, "Could not update league");
    }
  };

  const handleAddSeason = async () => {
    const trimmed = newSeasonName.trim();
    if (!trimmed) {
      showInfoToast("Season name required", "e.g. 2027 — Spring");
      return;
    }
    try {
      const created = await createSeasonMutation.mutateAsync({
        name: trimmed,
        status: newSeasonStatus,
      });
      setNewSeasonName("");
      setNewSeasonStatus(SeasonStatusEnum.Inactive);
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

        <View className="gap-2">
          <Text style={{ fontFamily: fonts.body }} className="text-xs leading-5 text-white/45">
            Changing the tiebreaker re-sorts the active season table immediately.
          </Text>
          <TiebreakerPicker
            value={tiebreakerId}
            onChange={setTiebreakerId}
            variant="dark"
          />
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
          Seasons
        </Text>
        <Text style={{ fontFamily: fonts.body }} className="text-sm leading-6 text-white/55">
          Each season has its own fixtures, roster, and standings. Mark a season as{" "}
          <Text style={{ fontFamily: fonts.bodySemibold }} className="text-white/75">
            Active
          </Text>{" "}
          to run it now — any other active season in this league is marked{" "}
          <Text style={{ fontFamily: fonts.bodySemibold }} className="text-white/75">
            Completed
          </Text>{" "}
          automatically. Tap the edit icon to rename a season or change its status.
        </Text>

        {seasons.length > 0 ? (
          <View className="gap-1 rounded-xl bg-white/5 px-3 py-3">
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-xs uppercase tracking-wide text-white/40"
            >
              All seasons
            </Text>
            {seasons.map((season) => (
              <View key={season.id} className="flex-row items-center gap-2 py-1">
                <Text
                  style={{ fontFamily: fonts.body }}
                  numberOfLines={1}
                  className={`flex-1 text-sm ${
                    season.id === activeSeasonId ? "text-accent-300" : "text-white/75"
                  }`}
                >
                  {season.name} · {season.status}
                  {season.id === activeSeasonId ? " · selected" : ""}
                </Text>
                <Pressable
                  onPress={() => setEditingSeason(season)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${season.name}`}
                  className="h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 active:bg-white/15"
                >
                  <Ionicons name="create-outline" size={17} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View className="gap-4 rounded-[24px] border border-white/10 bg-white/5 px-4 py-5">
        <Text style={{ fontFamily: fonts.bodyBold }} className="text-lg text-white">
          Add season
        </Text>
        <Text style={{ fontFamily: fonts.body }} className="text-sm leading-6 text-white/55">
          Start a new campaign when you begin a fresh table. Use{" "}
          <Text style={{ fontFamily: fonts.bodySemibold }} className="text-white/75">
            Inactive
          </Text>{" "}
          for upcoming seasons, or{" "}
          <Text style={{ fontFamily: fonts.bodySemibold }} className="text-white/75">
            Active
          </Text>{" "}
          to switch straight into the new season.
        </Text>

        <AuthTextField
          label="Season name"
          value={newSeasonName}
          onChangeText={setNewSeasonName}
          placeholder="2027 — Spring"
          containerClassName="[&_input]:text-neutral-900"
        />

        <SeasonStatusPicker
          label="Initial status"
          value={newSeasonStatus}
          onChange={setNewSeasonStatus}
        />

        <Button
          variant="accent"
          label={createSeasonMutation.isPending ? "Creating…" : "Add season"}
          loading={createSeasonMutation.isPending}
          onPress={() => void handleAddSeason()}
        />
      </View>

      <EditSeasonSheet
        visible={editingSeason != null}
        onClose={() => setEditingSeason(null)}
        leagueId={leagueId}
        season={editingSeason}
        onUpdated={onSeasonCreated}
      />
    </View>
  );
}
