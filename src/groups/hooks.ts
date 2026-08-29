import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { manageKeys } from "@/manage/queryKeys";
import { knockoutKeys } from "@/knockout/queryKeys";
import { showThrownAsToast } from "@/lib/show-error-toast";

import {
  assignGroupTeams,
  createAdjustment,
  createStandingOverride,
  createZone,
  deleteAdjustment,
  deleteStandingOverride,
  deleteZone,
  fetchAdjustments,
  fetchAuditLogs,
  fetchQualifiers,
  fetchStageStandings,
  fetchZones,
  generateGroupFixtures,
  generateKnockoutFromGroup,
  updateAdjustment,
  updateZone,
  type AssignGroupTeamsPayload,
  type CreateAdjustmentPayload,
  type CreateOverridePayload,
  type CreateZonePayload,
  type FetchQualifiersQuery,
  type GenerateKnockoutFromGroupPayload,
  type UpdateAdjustmentPayload,
  type UpdateZonePayload,
} from "./api";
import { groupsKeys } from "./queryKeys";

function invalidateStageStandings(
  queryClient: ReturnType<typeof useQueryClient>,
  leagueId: number,
  seasonId: number,
  stageId: number,
) {
  void queryClient.invalidateQueries({
    queryKey: groupsKeys.standings(stageId),
  });
  void queryClient.invalidateQueries({
    queryKey: groupsKeys.adjustments(stageId),
  });
  void queryClient.invalidateQueries({ queryKey: groupsKeys.zones(stageId) });
  void queryClient.invalidateQueries({
    queryKey: manageKeys.league(leagueId, seasonId),
  });
  void queryClient.invalidateQueries({
    queryKey: ["league-detail", leagueId],
  });
  void queryClient.invalidateQueries({
    queryKey: knockoutKeys.seasonStages(seasonId),
  });
}

export function useStageStandings(stageId: number, enabled = true) {
  return useQuery({
    queryKey: groupsKeys.standings(stageId),
    queryFn: () => fetchStageStandings(stageId),
    enabled: stageId > 0 && enabled,
    staleTime: 15 * 1000,
  });
}

export function useAssignGroupTeams(leagueId: number, seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      stageId,
      payload,
    }: {
      stageId: number;
      payload: AssignGroupTeamsPayload;
    }) => assignGroupTeams(stageId, payload),
    onSuccess: (_data, vars) => {
      invalidateStageStandings(queryClient, leagueId, seasonId, vars.stageId);
    },
    onError: (err) => showThrownAsToast(err, "Could not assign teams"),
  });
}

export function useGenerateGroupFixtures(leagueId: number, seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stageId: number) => generateGroupFixtures(stageId),
    onSuccess: (_data, stageId) => {
      invalidateStageStandings(queryClient, leagueId, seasonId, stageId);
    },
    onError: (err) => showThrownAsToast(err, "Could not generate fixtures"),
  });
}

export function useQualifiersPreview(
  stageId: number,
  query: FetchQualifiersQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: groupsKeys.qualifiers(stageId, query as Record<string, unknown>),
    queryFn: () => fetchQualifiers(stageId, { ...query, dryRun: true }),
    enabled: stageId > 0 && enabled,
    staleTime: 5 * 1000,
  });
}

export function useGenerateKnockoutFromGroup(
  leagueId: number,
  seasonId: number,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      stageId,
      payload,
    }: {
      stageId: number;
      payload: GenerateKnockoutFromGroupPayload;
    }) => generateKnockoutFromGroup(stageId, payload),
    onSuccess: (_data, vars) => {
      invalidateStageStandings(queryClient, leagueId, seasonId, vars.stageId);
      void queryClient.invalidateQueries({
        queryKey: knockoutKeys.brackets(),
      });
    },
    onError: (err) => showThrownAsToast(err, "Could not generate knockout"),
  });
}

export function useAdjustments(stageId: number, enabled = true) {
  return useQuery({
    queryKey: groupsKeys.adjustments(stageId),
    queryFn: () => fetchAdjustments(stageId),
    enabled: stageId > 0 && enabled,
  });
}

export function useAdjustmentMutations(
  leagueId: number,
  seasonId: number,
  stageId: number,
) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    invalidateStageStandings(queryClient, leagueId, seasonId, stageId);

  const create = useMutation({
    mutationFn: (payload: CreateAdjustmentPayload) =>
      createAdjustment(stageId, payload),
    onSuccess: invalidate,
    onError: (err) => showThrownAsToast(err, "Could not add adjustment"),
  });

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateAdjustmentPayload;
    }) => updateAdjustment(id, payload),
    onSuccess: invalidate,
    onError: (err) => showThrownAsToast(err, "Could not update adjustment"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteAdjustment(id),
    onSuccess: invalidate,
    onError: (err) => showThrownAsToast(err, "Could not remove adjustment"),
  });

  return { create, update, remove };
}

export function useOverrideMutations(
  leagueId: number,
  seasonId: number,
  stageId: number,
) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    invalidateStageStandings(queryClient, leagueId, seasonId, stageId);

  const create = useMutation({
    mutationFn: (payload: CreateOverridePayload) =>
      createStandingOverride(stageId, payload),
    onSuccess: invalidate,
    onError: (err) => showThrownAsToast(err, "Could not reorder standings"),
  });

  const remove = useMutation({
    mutationFn: (overrideId: number) =>
      deleteStandingOverride(stageId, overrideId),
    onSuccess: invalidate,
    onError: (err) => showThrownAsToast(err, "Could not clear override"),
  });

  return { create, remove };
}

export function useZones(stageId: number, enabled = true) {
  return useQuery({
    queryKey: groupsKeys.zones(stageId),
    queryFn: () => fetchZones(stageId),
    enabled: stageId > 0 && enabled,
  });
}

export function useZoneMutations(
  leagueId: number,
  seasonId: number,
  stageId: number,
) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    invalidateStageStandings(queryClient, leagueId, seasonId, stageId);

  const create = useMutation({
    mutationFn: (payload: CreateZonePayload) => createZone(stageId, payload),
    onSuccess: invalidate,
    onError: (err) => showThrownAsToast(err, "Could not create zone"),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateZonePayload }) =>
      updateZone(id, payload),
    onSuccess: invalidate,
    onError: (err) => showThrownAsToast(err, "Could not update zone"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteZone(id),
    onSuccess: invalidate,
    onError: (err) => showThrownAsToast(err, "Could not delete zone"),
  });

  return { create, update, remove };
}

export function useAuditLogs(leagueId: number, page = 1, enabled = true) {
  return useQuery({
    queryKey: groupsKeys.auditLogs(leagueId, page),
    queryFn: () => fetchAuditLogs(leagueId, page),
    enabled: leagueId > 0 && enabled,
  });
}
