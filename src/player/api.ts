import { apiRequest } from "@/api/http-client";

import type { PlayerDetail } from "./types";

export type DoesUserHavePlayerProfileResult = {
  hasPlayerProfile: boolean;
};

export async function fetchDoesUserHavePlayerProfile(): Promise<DoesUserHavePlayerProfileResult> {
  return apiRequest<DoesUserHavePlayerProfileResult>(
    "/api/v1/players/does-user-have-player-profile",
    { auth: true },
  );
}

export async function fetchPlayerDetail(playerId: number): Promise<PlayerDetail> {
  const res = await apiRequest<{ data: PlayerDetail }>(
    `/api/v1/players/${playerId}`,
  );
  return res.data;
}
