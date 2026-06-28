import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNetworkStatus } from "hooks/useNetworkStatus";

import { fetchLeagueDetail } from "@/league/api";

import {
  accreditStat,
  createGame,
  createSeason,
  createStat,
  createTeam,
  deleteGame,
  deleteStat,
  deleteTeam,
  endGameFullTime,
  fetchLeagueTeams,
  fetchOwnedLeagues,
  fetchSeasonRoster,
  removeLeaguePlayer,
  pauseGame,
  resumeGame,
  startExtraTime,
  startFirstHalf,
  startHalfTime,
  startSecondHalf,
  updateGame,
  updateGameScore,
  updateLeague,
  updateLeaguePlayer,
  updateSeason,
  updateTeam,
} from "./api";
import type { AccreditStatPayload, CreateTeamPayload, GameScorePayload, UpdateTeamPayload } from "./api";
import {
  invalidateGameDetail,
  invalidateManageLeagueData,
} from "./invalidate-queries";
import { manageKeys } from "./queryKeys";
import type { UpdateLeaguePlayerPayload } from "@/invite/types";

import type {
  CreateGamePayload,
  CreateSeasonPayload,
  CreateStatPayload,
  UpdateGamePayload,
  UpdateLeaguePayload,
  UpdateSeasonPayload,
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

function useInvalidateTeamsData(leagueId: number, seasonId: number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: manageKeys.teams(leagueId) });
    queryClient.invalidateQueries({
      queryKey: manageKeys.roster(leagueId, seasonId),
    });
    invalidateManageLeagueData(queryClient, leagueId);
  };
}

export function useCreateTeam(leagueId: number, seasonId: number) {
  const invalidate = useInvalidateTeamsData(leagueId, seasonId);
  return useMutation({
    mutationFn: (payload: CreateTeamPayload) => createTeam(leagueId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateTeam(leagueId: number, seasonId: number) {
  const invalidate = useInvalidateTeamsData(leagueId, seasonId);
  return useMutation({
    mutationFn: ({
      teamId,
      payload,
    }: {
      teamId: number;
      payload: UpdateTeamPayload;
    }) => updateTeam(leagueId, teamId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteTeam(leagueId: number, seasonId: number) {
  const invalidate = useInvalidateTeamsData(leagueId, seasonId);
  return useMutation({
    mutationFn: (teamId: number) => deleteTeam(leagueId, teamId),
    onSuccess: invalidate,
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

export function useUpdateLeaguePlayer(leagueId: number, seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      leaguePlayerId,
      payload,
    }: {
      leaguePlayerId: number;
      payload: UpdateLeaguePlayerPayload;
    }) => updateLeaguePlayer(leaguePlayerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: manageKeys.roster(leagueId, seasonId),
      });
    },
  });
}

export function useRemoveLeaguePlayer(leagueId: number, seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leaguePlayerId: number) => removeLeaguePlayer(leaguePlayerId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: manageKeys.roster(leagueId, seasonId),
      });
    },
  });
}

export function useCreateGame(leagueId: number, _seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGamePayload) => createGame(payload),
    onSuccess: () => {
      invalidateManageLeagueData(queryClient, leagueId);
    },
  });
}

export function useUpdateGame(leagueId: number, _seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      gameId,
      payload,
    }: {
      gameId: number;
      payload: UpdateGamePayload;
    }) => updateGame(gameId, payload),
    onSuccess: (_data, variables) => {
      invalidateManageLeagueData(queryClient, leagueId);
      queryClient.invalidateQueries({ queryKey: ["match", variables.gameId] });
    },
  });
}

export function useDeleteGame(leagueId: number, _seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gameId: number) => deleteGame(gameId),
    onSuccess: (_data, gameId) => {
      invalidateManageLeagueData(queryClient, leagueId);
      queryClient.invalidateQueries({ queryKey: ["match", gameId] });
    },
  });
}

export function useCreateStat(leagueId: number, _seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStatPayload) => createStat(payload),
    onSuccess: (_data, variables) => {
      invalidateGameDetail(queryClient, variables.gameId, leagueId);
    },
  });
}

export function useDeleteStat(leagueId: number, _seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ statId, gameId }: { statId: number; gameId: number }) =>
      deleteStat(statId),
    onSuccess: (_data, variables) => {
      invalidateGameDetail(queryClient, variables.gameId, leagueId);
    },
  });
}

export function useUpdateLeague(leagueId: number, _seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateLeaguePayload) =>
      updateLeague(leagueId, payload),
    onSuccess: () => {
      invalidateManageLeagueData(queryClient, leagueId);
    },
  });
}

export function useCreateSeason(leagueId: number, _seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<CreateSeasonPayload, "leagueId">) =>
      createSeason(leagueId, payload),
    onSuccess: () => {
      invalidateManageLeagueData(queryClient, leagueId);
      queryClient.invalidateQueries({ queryKey: manageKeys.leagues() });
    },
  });
}

export function useUpdateSeason(leagueId: number, seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateSeasonPayload) =>
      updateSeason(leagueId, seasonId, payload),
    onSuccess: () => {
      invalidateManageLeagueData(queryClient, leagueId);
      queryClient.invalidateQueries({ queryKey: manageKeys.leagues() });
    },
  });
}

function useInvalidateGameQueries(gameId: number, leagueId: number) {
  const queryClient = useQueryClient();
  return () => {
    invalidateGameDetail(queryClient, gameId, leagueId);
  };
}

export function useGameTimeActions(
  gameId: number,
  leagueId: number,
  _seasonId: number,
) {
  const invalidate = useInvalidateGameQueries(gameId, leagueId);

  const startFirstHalfMutation = useMutation({
    mutationFn: () => startFirstHalf(gameId),
    onSuccess: invalidate,
  });

  const startHalfTimeMutation = useMutation({
    mutationFn: () => startHalfTime(gameId),
    onSuccess: invalidate,
  });

  const startSecondHalfMutation = useMutation({
    mutationFn: () => startSecondHalf(gameId),
    onSuccess: invalidate,
  });

  const startExtraTimeMutation = useMutation({
    mutationFn: () => startExtraTime(gameId),
    onSuccess: invalidate,
  });

  const endFullTimeMutation = useMutation({
    mutationFn: (payload: { homeScore: number; awayScore: number }) =>
      endGameFullTime(gameId, payload),
    onSuccess: invalidate,
  });

  const pauseMutation = useMutation({
    mutationFn: () => pauseGame(gameId),
    onSuccess: invalidate,
  });

  const resumeMutation = useMutation({
    mutationFn: () => resumeGame(gameId),
    onSuccess: invalidate,
  });

  const isPending =
    startFirstHalfMutation.isPending ||
    startHalfTimeMutation.isPending ||
    startSecondHalfMutation.isPending ||
    startExtraTimeMutation.isPending ||
    endFullTimeMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending;

  return {
    startFirstHalf: startFirstHalfMutation,
    startHalfTime: startHalfTimeMutation,
    startSecondHalf: startSecondHalfMutation,
    startExtraTime: startExtraTimeMutation,
    endFullTime: endFullTimeMutation,
    pause: pauseMutation,
    resume: resumeMutation,
    isPending,
  };
}

export function useUpdateGameScore(
  gameId: number,
  leagueId: number,
  _seasonId: number,
) {
  const invalidate = useInvalidateGameQueries(gameId, leagueId);
  return useMutation({
    mutationFn: (payload: GameScorePayload) => updateGameScore(gameId, payload),
    onSuccess: invalidate,
  });
}

export function useAccreditStat(
  gameId: number,
  leagueId: number,
  _seasonId: number,
) {
  const invalidate = useInvalidateGameQueries(gameId, leagueId);
  return useMutation({
    mutationFn: ({
      statId,
      payload,
    }: {
      statId: number;
      payload: AccreditStatPayload;
    }) => accreditStat(gameId, statId, payload),
    onSuccess: invalidate,
  });
}
