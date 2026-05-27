import { apiRequest } from "@/api/http-client";
import { getUserTimeZone, toCalendarDateParam } from "@/lib/datetime";

import type {
  FetchLeaguesParams,
  LeagueResponse,
  ResolvedLeaguesParams,
} from "../types";

export function resolveLeaguesParams(
  params: FetchLeaguesParams = {},
): ResolvedLeaguesParams {
  return {
    gameDate: toCalendarDateParam(params.gameDate ?? new Date()),
    timeZone: params.timeZone ?? getUserTimeZone(),
    countryId: params.countryId ?? null,
    gameStatus: params.gameStatus ?? null,
  };
}

export async function fetchLeagues(
  params: FetchLeaguesParams = {},
): Promise<LeagueResponse> {
  const resolved = resolveLeaguesParams(params);
  const query = new URLSearchParams({
    gameDate: resolved.gameDate,
    timeZone: resolved.timeZone,
  });

  if (resolved.countryId) query.set("countryId", String(resolved.countryId));
  if (resolved.gameStatus) query.set("gameStatus", resolved.gameStatus);

  const res = await apiRequest<{ data: LeagueResponse }>(
    `/api/v1/leagues?${query}`,
  );
  return res.data;
}

export async function favoriteLeague(leagueId: number) {
  await apiRequest<void>(`/api/v1/leagues/${leagueId}/favorite`, {
    method: "POST",
    auth: true,
  });
}

export async function unfavoriteLeague(leagueId: number) {
  await apiRequest<void>(`/api/v1/leagues/${leagueId}/unfavorite`, {
    method: "DELETE",
    auth: true,
  });
}
