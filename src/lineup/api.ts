import { apiRequest } from "@/api/http-client";

import type { Formation, SetLineupPayload, TeamLineupGroup } from "./types";

export async function fetchFormations(): Promise<Formation[]> {
  const res = await apiRequest<{ data?: Formation[] }>("/api/v1/formations");
  return res.data ?? [];
}

export async function fetchFormation(id: number): Promise<Formation> {
  const res = await apiRequest<{ data: Formation }>(`/api/v1/formations/${id}`);
  return res.data;
}

export async function fetchGameLineups(gameId: number): Promise<TeamLineupGroup[]> {
  const res = await apiRequest<{ data?: TeamLineupGroup[] } | TeamLineupGroup[]>(
    `/api/v1/games/${gameId}/lineups`,
  );
  if (Array.isArray(res)) return res;
  return res.data ?? [];
}

export async function setGameLineup(
  gameId: number,
  payload: SetLineupPayload,
): Promise<void> {
  await apiRequest<{ message: string }>(`/api/v1/games/${gameId}/lineups`, {
    method: "PUT",
    auth: true,
    idempotencyKey: true,
    jsonBody: payload,
  });
}
