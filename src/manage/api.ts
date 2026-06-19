import type { ApiTeam } from "@/api/entities";
import { apiRequest } from "@/api/http-client";

import type { UpdateLeaguePlayerPayload } from "@/invite/types";

import type {
  CreateGamePayload,
  CreateSeasonPayload,
  CreateStatPayload,
  CreatedSeason,
  LeagueRosterRow,
  OwnedLeague,
  UpdateGamePayload,
  UpdateLeaguePayload,
} from "./types";

export async function fetchOwnedLeagues(): Promise<OwnedLeague[]> {
  const res = await apiRequest<{ data: OwnedLeague[] }>(
    "/api/v1/auth/users/leagues",
    { auth: true },
  );
  return res.data;
}

export async function fetchLeagueTeams(leagueId: number): Promise<ApiTeam[]> {
  const res = await apiRequest<{ data: ApiTeam[] }>(
    `/api/v1/auth/users/leagues/${leagueId}/teams`,
    { auth: true },
  );
  return res.data;
}

export async function fetchSeasonRoster(
  leagueId: number,
  seasonId: number,
): Promise<LeagueRosterRow[]> {
  const res = await apiRequest<{ data: LeagueRosterRow[] }>(
    `/api/v1/leagues/${leagueId}/seasons/${seasonId}/roster`,
    { auth: true },
  );
  return res.data;
}

export async function updateLeaguePlayer(
  leaguePlayerId: number,
  payload: UpdateLeaguePlayerPayload,
): Promise<void> {
  await apiRequest<{ message: string }>(
    `/api/v1/leagues/league-players/${leaguePlayerId}`,
    {
      method: "PUT",
      auth: true,
      jsonBody: payload,
    },
  );
}

export async function removeLeaguePlayer(leaguePlayerId: number): Promise<void> {
  await apiRequest<{ message: string }>(
    `/api/v1/leagues/league-players/${leaguePlayerId}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}

export async function createGame(payload: CreateGamePayload): Promise<void> {
  await apiRequest<{ message: string }>("/api/v1/leagues/games", {
    method: "POST",
    auth: true,
    jsonBody: payload,
  });
}

export async function updateGame(
  gameId: number,
  payload: UpdateGamePayload,
): Promise<void> {
  await apiRequest<{ message: string }>(`/api/v1/leagues/games/${gameId}`, {
    method: "PUT",
    auth: true,
    jsonBody: payload,
  });
}

export async function deleteGame(gameId: number): Promise<void> {
  await apiRequest<{ message: string }>(`/api/v1/leagues/games/${gameId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function createStat(payload: CreateStatPayload): Promise<void> {
  await apiRequest<{ message: string }>("/api/v1/leagues/stats", {
    method: "POST",
    auth: true,
    jsonBody: payload,
  });
}

export async function deleteStat(statId: number): Promise<void> {
  await apiRequest<{ message: string }>(`/api/v1/leagues/stats/${statId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function updateLeague(
  leagueId: number,
  payload: UpdateLeaguePayload,
): Promise<void> {
  await apiRequest<{ message: string }>(`/api/v1/leagues/${leagueId}`, {
    method: "PUT",
    auth: true,
    jsonBody: payload,
  });
}

export async function createSeason(
  leagueId: number,
  payload: Omit<CreateSeasonPayload, "leagueId">,
): Promise<CreatedSeason> {
  return apiRequest<CreatedSeason>(`/api/v1/leagues/${leagueId}/seasons`, {
    method: "POST",
    auth: true,
    jsonBody: { ...payload, leagueId },
  });
}

export async function startFirstHalf(gameId: number): Promise<void> {
  await apiRequest<{ message: string }>(
    `/api/v1/games/${gameId}/start-first-half`,
    { method: "POST", auth: true },
  );
}

export async function startHalfTime(gameId: number): Promise<void> {
  await apiRequest<{ message: string }>(`/api/v1/games/${gameId}/half-time`, {
    method: "POST",
    auth: true,
  });
}

export async function startSecondHalf(gameId: number): Promise<void> {
  await apiRequest<{ message: string }>(
    `/api/v1/games/${gameId}/start-second-half`,
    { method: "POST", auth: true },
  );
}

export async function startExtraTime(gameId: number): Promise<void> {
  await apiRequest<{ message: string }>(`/api/v1/games/${gameId}/extra-time`, {
    method: "POST",
    auth: true,
  });
}

export type FullTimePayload = {
  homeScore: number;
  awayScore: number;
};

export async function endGameFullTime(
  gameId: number,
  payload: FullTimePayload,
): Promise<void> {
  await apiRequest<{ message: string }>(`/api/v1/games/${gameId}/full-time`, {
    method: "POST",
    auth: true,
    jsonBody: payload,
  });
}

export async function pauseGame(gameId: number): Promise<void> {
  await apiRequest<{ message: string }>(`/api/v1/games/${gameId}/pause`, {
    method: "POST",
    auth: true,
  });
}

export async function resumeGame(gameId: number): Promise<void> {
  await apiRequest<{ message: string }>(`/api/v1/games/${gameId}/resume`, {
    method: "POST",
    auth: true,
  });
}

export type GameScoreAction = "increment" | "decrement";

export type GameScorePayload = {
  team: "home" | "away";
  action: GameScoreAction;
};

export type GameScoreResponse = {
  message: string;
  homeScore?: number;
  awayScore?: number;
  statId?: number;
};

export async function updateGameScore(
  gameId: number,
  payload: GameScorePayload,
): Promise<GameScoreResponse> {
  return apiRequest<GameScoreResponse>(`/api/v1/games/${gameId}/score`, {
    method: "POST",
    auth: true,
    jsonBody: payload,
  });
}

export type AccreditStatPayload = {
  playerId: number;
  assistPlayerId?: number | null;
  isOwnGoal: boolean;
  minute: number;
};

export async function accreditStat(
  gameId: number,
  statId: number,
  payload: AccreditStatPayload,
): Promise<void> {
  await apiRequest<{ message: string }>(
    `/api/v1/games/${gameId}/stats/${statId}/accredit`,
    {
      method: "PATCH",
      auth: true,
      jsonBody: payload,
    },
  );
}
