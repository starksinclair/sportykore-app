import { apiRequest } from "@/api/http-client";

import type { MatchDetail } from "./types";

export async function fetchMatchDetail(gameId: number): Promise<MatchDetail> {
  const res = await apiRequest<{ data: MatchDetail }>(`/api/v1/games/${gameId}`);
  return res.data;
}
