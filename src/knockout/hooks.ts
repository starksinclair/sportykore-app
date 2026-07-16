import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { manageKeys } from "@/manage/queryKeys";
import { showThrownAsToast } from "@/lib/show-error-toast";

import {
  completePenaltyShootout,
  createKnockoutStage,
  fetchSeasonStages,
  fetchStageBracket,
  generateNextRound,
  seedKnockoutStage,
  enterPenaltyShootout,
  type CreateKnockoutStagePayload,
} from "./api";
import { knockoutKeys } from "./queryKeys";
import type { BracketRound } from "@/api/entities";

export function useSeasonStages(seasonId: number, enabled = true) {
  return useQuery({
    queryKey: knockoutKeys.seasonStages(seasonId),
    queryFn: () => fetchSeasonStages(seasonId),
    enabled: seasonId > 0 && enabled,
    staleTime: 30 * 1000,
  });
}

export function useStageBracket(stageId: number, enabled = true) {
  return useQuery({
    queryKey: knockoutKeys.bracket(stageId),
    queryFn: () => fetchStageBracket(stageId),
    enabled: stageId > 0 && enabled,
    staleTime: 15 * 1000,
  });
}

function invalidateKnockout(
  queryClient: ReturnType<typeof useQueryClient>,
  leagueId: number,
  seasonId: number,
  stageId?: number,
) {
  queryClient.invalidateQueries({ queryKey: knockoutKeys.seasonStages(seasonId) });
  if (stageId != null) {
    queryClient.invalidateQueries({ queryKey: knockoutKeys.bracket(stageId) });
  }
  queryClient.invalidateQueries({ queryKey: manageKeys.league(leagueId, seasonId) });
  queryClient.invalidateQueries({ queryKey: ["league-detail", leagueId] });
}

export function useCreateKnockoutStage(leagueId: number, seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateKnockoutStagePayload) =>
      createKnockoutStage(leagueId, payload),
    onSuccess: () => {
      invalidateKnockout(queryClient, leagueId, seasonId);
    },
    onError: (err) => showThrownAsToast(err, "Could not create knockout stage"),
  });
}

export function useSeedKnockoutStage(leagueId: number, seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      stageId,
      seededTeams,
    }: {
      stageId: number;
      seededTeams: number[];
    }) => seedKnockoutStage(stageId, seededTeams),
    onSuccess: (_data, vars) => {
      invalidateKnockout(queryClient, leagueId, seasonId, vars.stageId);
    },
    onError: (err) => showThrownAsToast(err, "Could not seed bracket"),
  });
}

export function useGenerateNextRound(leagueId: number, seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      stageId,
      completedRound,
    }: {
      stageId: number;
      completedRound: BracketRound;
    }) => generateNextRound(stageId, completedRound),
    onSuccess: (_data, vars) => {
      invalidateKnockout(queryClient, leagueId, seasonId, vars.stageId);
    },
    onError: (err) => showThrownAsToast(err, "Could not generate next round"),
  });
}

export function useEnterPenaltyShootout(gameId: number, leagueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => enterPenaltyShootout(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match", gameId] });
      queryClient.invalidateQueries({ queryKey: manageKeys.league(leagueId) });
    },
  });
}

export function useCompletePenaltyShootout(gameId: number, leagueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      homePenaltyScore,
      awayPenaltyScore,
    }: {
      homePenaltyScore: number;
      awayPenaltyScore: number;
    }) => completePenaltyShootout(gameId, homePenaltyScore, awayPenaltyScore),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match", gameId] });
      queryClient.invalidateQueries({ queryKey: manageKeys.league(leagueId) });
      queryClient.invalidateQueries({ queryKey: knockoutKeys.brackets() });
    },
  });
}
