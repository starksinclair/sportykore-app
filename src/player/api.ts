import { apiRequest } from "@/api/http-client";

import type { PlayerDetail } from "./types";

export async function fetchPlayerDetail(playerId: number): Promise<PlayerDetail> {
  const res = await apiRequest<{ data: PlayerDetail }>(
    `/api/v1/players/${playerId}`,
  );
  return res.data;
}
