import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNetworkStatus } from "hooks/useNetworkStatus";

import { fetchLeagueDetail } from "@/league/api";

import {
  createGame,
  createSeason,
  createStat,
  deleteGame,
  deleteStat,
  fetchLeagueTeams,
  fetchOwnedLeagues,
  fetchSeasonRoster,
  updateGame,
  updateLeague,
} from "./api";
import { manageKeys } from "./queryKeys";
import type {
  CreateGamePayload,
  CreateSeasonPayload,
  CreateStatPayload,
  UpdateGamePayload,
  UpdateLeaguePayload,
} from "./types";

export function useOwnedLeagues(enabled: boolean) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: manageKeys.leagues(),
    queryFn: fetchOwnedLeagues,
    enabled,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
  });
}

export function useManageLeagueDetail(
  leagueId: number,
  seasonId?: number | null,
) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: manageKeys.league(leagueId, seasonId ?? null),
    queryFn: () => fetchLeagueDetail(leagueId, seasonId ?? undefined),
    enabled: leagueId > 0,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
    placeholderData: (previousData) => previousData,
  });
}

export function useLeagueTeams(leagueId: number, enabled = true) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: manageKeys.teams(leagueId),
    queryFn: () => fetchLeagueTeams(leagueId),
    enabled: leagueId > 0 && enabled,
    staleTime: 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
  });
}

export function useSeasonRoster(
  leagueId: number,
  seasonId: number,
  enabled = true,
) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: manageKeys.roster(leagueId, seasonId),
    queryFn: () => fetchSeasonRoster(leagueId, seasonId),
    enabled: leagueId > 0 && seasonId > 0 && enabled,
    staleTime: 30 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
  });
}

function useInvalidateManageLeague(leagueId: number, seasonId: number) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: manageKeys.league(leagueId, seasonId),
    });
}

export function useCreateGame(leagueId: number, seasonId: number) {
  const invalidate = useInvalidateManageLeague(leagueId, seasonId);
  return useMutation({
    mutationFn: (payload: CreateGamePayload) => createGame(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateGame(leagueId: number, seasonId: number) {
  const invalidate = useInvalidateManageLeague(leagueId, seasonId);
  return useMutation({
    mutationFn: ({
      gameId,
      payload,
    }: {
      gameId: number;
      payload: UpdateGamePayload;
    }) => updateGame(gameId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteGame(leagueId: number, seasonId: number) {
  const invalidate = useInvalidateManageLeague(leagueId, seasonId);
  return useMutation({
    mutationFn: (gameId: number) => deleteGame(gameId),
    onSuccess: invalidate,
  });
}

export function useCreateStat(leagueId: number, seasonId: number) {
  const queryClient = useQueryClient();
  const invalidateLeague = useInvalidateManageLeague(leagueId, seasonId);
  return useMutation({
    mutationFn: (payload: CreateStatPayload) => createStat(payload),
    onSuccess: (_data, variables) => {
      invalidateLeague();
      queryClient.invalidateQueries({ queryKey: ["match", variables.gameId] });
    },
  });
}

export function useDeleteStat(leagueId: number, seasonId: number) {
  const queryClient = useQueryClient();
  const invalidateLeague = useInvalidateManageLeague(leagueId, seasonId);
  return useMutation({
    mutationFn: ({ statId, gameId }: { statId: number; gameId: number }) =>
      deleteStat(statId),
    onSuccess: (_data, variables) => {
      invalidateLeague();
      queryClient.invalidateQueries({ queryKey: ["match", variables.gameId] });
    },
  });
}

export function useUpdateLeague(leagueId: number, seasonId: number) {
  const invalidate = useInvalidateManageLeague(leagueId, seasonId);
  return useMutation({
    mutationFn: (payload: UpdateLeaguePayload) => updateLeague(leagueId, payload),
    onSuccess: invalidate,
  });
}

export function useCreateSeason(leagueId: number, _seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<CreateSeasonPayload, "leagueId">) =>
      createSeason(leagueId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["manage", "league", leagueId],
      });
    },
  });
}
