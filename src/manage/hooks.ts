import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNetworkStatus } from "hooks/useNetworkStatus";

import type {
  ApiGameDetail,
  ApiPlayer,
  ApiPlayerAward,
  ApiVenue,
} from "@/api/entities";
import { fetchLeagueDetail } from "@/league/api";

import {
  accreditStat,
  assignTeamAdmin,
  createGame,
  createSeason,
  createStat,
  createTeam,
  createVenue,
  deleteGame,
  deleteStat,
  deleteTeam,
  deleteVenue,
  fetchLeagueVenues,
  endGameFullTime,
  fetchLeagueTeams,
  fetchManagedHub,
  fetchOwnedLeagues,
  fetchSeasonRoster,
  removeLeaguePlayer,
  removeTeamAdmin,
  pauseGame,
  recordTrackingEvents,
  recordSubstitutions,
  resumeGame,
  setMotmAward,
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
  updateVenue,
} from "./api";
import type { AccreditStatPayload, CreateTeamPayload, GameScorePayload, UpdateTeamPayload } from "./api";
import {
  invalidateGameDetail,
  invalidateManageLeagueData,
} from "./invalidate-queries";
import { manageKeys } from "./queryKeys";
import type { UpdateLeaguePlayerPayload } from "@/invite/types";
import { showSuccessToast, showThrownAsToast } from "@/lib/show-error-toast";

import type {
  CreateGamePayload,
  CreateSeasonPayload,
  CreateStatPayload,
  CreateVenuePayload,
  LeagueRosterRow,
  ManagedTeam,
  RecordSubstitutionsPayload,
  RecordTrackingEventsPayload,
  UpdateGamePayload,
  UpdateLeaguePayload,
  UpdateSeasonPayload,
  UpdateVenuePayload,
} from "./types";

type QuerySnapshot<T> = {
  previous?: T;
};

function patchArrayItem<T extends { id: number }>(
  rows: T[] | undefined,
  id: number,
  patch: Partial<T>,
): T[] | undefined {
  if (!rows) return rows;
  return rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
}

function removeArrayItem<T extends { id: number }>(
  rows: T[] | undefined,
  id: number,
): T[] | undefined {
  if (!rows) return rows;
  return rows.filter((row) => row.id !== id);
}

function findPlayerInGame(
  game: ApiGameDetail | undefined,
  playerId: number,
): ApiPlayer | undefined {
  for (const group of game?.lineups ?? []) {
    for (const entry of [...group.starters, ...group.substitutes]) {
      if (entry.playerId === playerId) {
        return entry.player;
      }
    }
  }
  return undefined;
}

function withMotmAward(
  game: ApiGameDetail | undefined,
  award: ApiPlayerAward,
): ApiGameDetail | undefined {
  if (!game) return game;
  const otherAwards = (game.awards ?? []).filter(
    (row) => row.awardType !== "motm",
  );
  return { ...game, awards: [...otherAwards, award] };
}

export function useManagedHub(enabled: boolean) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: manageKeys.managed(),
    queryFn: fetchManagedHub,
    enabled,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
  });
}

/** @deprecated Prefer `useManagedHub`. */
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

export function useLeagueVenues(leagueId: number, enabled = true) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: manageKeys.venues(leagueId),
    queryFn: () => fetchLeagueVenues(leagueId),
    enabled: leagueId > 0 && enabled,
    staleTime: 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
  });
}

export function useCreateVenue(leagueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVenuePayload) => createVenue(leagueId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: manageKeys.venues(leagueId) });
    },
  });
}

export function useUpdateVenue(leagueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      venueId,
      payload,
    }: {
      venueId: number;
      payload: UpdateVenuePayload;
    }) => updateVenue(venueId, payload),
    onMutate: async ({ venueId, payload }): Promise<QuerySnapshot<ApiVenue[]>> => {
      const queryKey = manageKeys.venues(leagueId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ApiVenue[]>(queryKey);
      queryClient.setQueryData<ApiVenue[]>(queryKey, (old) =>
        patchArrayItem(old, venueId, payload),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(manageKeys.venues(leagueId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: manageKeys.venues(leagueId) });
    },
  });
}

export function useDeleteVenue(leagueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (venueId: number) => deleteVenue(venueId),
    onMutate: async (venueId): Promise<QuerySnapshot<ApiVenue[]>> => {
      const queryKey = manageKeys.venues(leagueId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ApiVenue[]>(queryKey);
      queryClient.setQueryData<ApiVenue[]>(queryKey, (old) =>
        removeArrayItem(old, venueId),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(manageKeys.venues(leagueId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: manageKeys.venues(leagueId) });
    },
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      payload,
    }: {
      teamId: number;
      payload: UpdateTeamPayload;
    }) => updateTeam(leagueId, teamId, payload),
    onMutate: async ({ teamId, payload }): Promise<QuerySnapshot<ManagedTeam[]>> => {
      const queryKey = manageKeys.teams(leagueId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ManagedTeam[]>(queryKey);
      queryClient.setQueryData<ManagedTeam[]>(queryKey, (old) =>
        old?.map((team) =>
          team.id === teamId
            ? {
                ...team,
                name: payload.name ?? team.name,
              }
            : team,
        ),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(manageKeys.teams(leagueId), context.previous);
      }
    },
    onSettled: invalidate,
  });
}

export function useDeleteTeam(leagueId: number, seasonId: number) {
  const invalidate = useInvalidateTeamsData(leagueId, seasonId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teamId: number) => deleteTeam(leagueId, teamId),
    onMutate: async (teamId): Promise<QuerySnapshot<ManagedTeam[]>> => {
      const queryKey = manageKeys.teams(leagueId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ManagedTeam[]>(queryKey);
      queryClient.setQueryData<ManagedTeam[]>(queryKey, (old) =>
        removeArrayItem(old, teamId),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(manageKeys.teams(leagueId), context.previous);
      }
    },
    onSettled: invalidate,
  });
}

function useInvalidateTeamAdmins(leagueId: number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: manageKeys.teams(leagueId) });
  };
}

export function useAssignTeamAdmin(leagueId: number) {
  const invalidate = useInvalidateTeamAdmins(leagueId);
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) =>
      assignTeamAdmin(leagueId, teamId, userId),
    onSuccess: () => {
      invalidate();
      showSuccessToast(
        "Team manager assigned",
        "They can set this team's lineups.",
      );
    },
    onError: (error) => {
      showThrownAsToast(error, "Could not assign team manager");
    },
  });
}

export function useRemoveTeamAdmin(leagueId: number) {
  const invalidate = useInvalidateTeamAdmins(leagueId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) =>
      removeTeamAdmin(leagueId, teamId, userId),
    onMutate: async ({ teamId, userId }): Promise<QuerySnapshot<ManagedTeam[]>> => {
      const queryKey = manageKeys.teams(leagueId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ManagedTeam[]>(queryKey);
      queryClient.setQueryData<ManagedTeam[]>(queryKey, (old) =>
        old?.map((team) =>
          team.id === teamId
            ? {
                ...team,
                admins: (team.admins ?? []).filter(
                  (admin) => admin.userId !== userId,
                ),
              }
            : team,
        ),
      );
      return { previous };
    },
    onSuccess: () => {
      showSuccessToast("Team manager removed");
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(manageKeys.teams(leagueId), context.previous);
      }
      showThrownAsToast(error, "Could not remove team manager");
    },
    onSettled: invalidate,
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
    onMutate: async ({
      leaguePlayerId,
      payload,
    }): Promise<QuerySnapshot<LeagueRosterRow[]>> => {
      const queryKey = manageKeys.roster(leagueId, seasonId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<LeagueRosterRow[]>(queryKey);
      queryClient.setQueryData<LeagueRosterRow[]>(queryKey, (old) =>
        old?.map((row) =>
          row.id === leaguePlayerId
            ? {
                ...row,
                jerseyNumber:
                  payload.jerseyNumber !== undefined
                    ? payload.jerseyNumber
                    : row.jerseyNumber,
                position:
                  payload.position !== undefined ? payload.position : row.position,
                isCaptain:
                  payload.isCaptain !== undefined
                    ? payload.isCaptain
                    : row.isCaptain,
                status: payload.status !== undefined ? payload.status : row.status,
              }
            : row,
        ),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          manageKeys.roster(leagueId, seasonId),
          context.previous,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: manageKeys.roster(leagueId, seasonId),
      });
    },
  });
}

export function useRemoveLeaguePlayer(leagueId: number, seasonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leaguePlayerId: number) => removeLeaguePlayer(leaguePlayerId),
    onMutate: async (
      leaguePlayerId,
    ): Promise<QuerySnapshot<LeagueRosterRow[]>> => {
      const queryKey = manageKeys.roster(leagueId, seasonId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<LeagueRosterRow[]>(queryKey);
      queryClient.setQueryData<LeagueRosterRow[]>(queryKey, (old) =>
        removeArrayItem(old, leaguePlayerId),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          manageKeys.roster(leagueId, seasonId),
          context.previous,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
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

export function useRecordSubstitutions(
  leagueId: number,
  _seasonId: number,
  gameId: number,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordSubstitutionsPayload) =>
      recordSubstitutions(payload),
    onSuccess: () => {
      invalidateGameDetail(queryClient, gameId, leagueId);
      queryClient.invalidateQueries({
        queryKey: ["lineup", "game", gameId],
      });
      showSuccessToast(
        "Substitution recorded",
        "The swap has been added to the match events.",
      );
    },
    onError: (error) => {
      showThrownAsToast(error, "Could not record substitution");
    },
  });
}

export function useRecordTrackingEvents(
  gameId: number,
  leagueId: number,
  _seasonId: number,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordTrackingEventsPayload) =>
      recordTrackingEvents(gameId, payload),
    onSuccess: () => {
      invalidateGameDetail(queryClient, gameId, leagueId);
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
      queryClient.invalidateQueries({ queryKey: manageKeys.managed() });
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
      queryClient.invalidateQueries({ queryKey: manageKeys.managed() });
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
  _leagueId: number,
  _seasonId: number,
) {
  return useMutation({
    mutationFn: (payload: GameScorePayload) => updateGameScore(gameId, payload),
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

export function useSetMotmAward(
  gameId: number,
  leagueId: number,
  _seasonId: number,
) {
  const invalidate = useInvalidateGameQueries(gameId, leagueId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playerId: number) => setMotmAward(gameId, playerId),
    onMutate: async (playerId): Promise<QuerySnapshot<ApiGameDetail>> => {
      const queryKey = ["match", gameId] as const;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ApiGameDetail>(queryKey);
      const player = findPlayerInGame(previous, playerId);
      const optimisticAward: ApiPlayerAward = {
        id: -Date.now(),
        gameId,
        playerId,
        awardType: "motm",
        player,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<ApiGameDetail>(queryKey, (old) =>
        withMotmAward(old, optimisticAward),
      );
      return { previous };
    },
    onSuccess: (award) => {
      queryClient.setQueryData<ApiGameDetail>(["match", gameId], (old) =>
        withMotmAward(old, award),
      );
      showSuccessToast("Man of the match saved");
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["match", gameId], context.previous);
      }
      showThrownAsToast(error, "Could not save man of the match");
    },
    onSettled: invalidate,
  });
}
