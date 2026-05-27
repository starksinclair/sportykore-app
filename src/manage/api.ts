import type { ApiTeam } from "@/api/entities";
import { apiRequest } from "@/api/http-client";

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
