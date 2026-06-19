import type { QueryClient } from "@tanstack/react-query";

import { homeKeys } from "@/home/hooks";

/**
 * Invalidates all cached league-detail queries for a manage league.
 * Uses a prefix so both `seasonId: null` (default season) and explicit ids refetch.
 */
export function invalidateManageLeagueData(
  queryClient: QueryClient,
  leagueId: number,
) {
  queryClient.invalidateQueries({
    queryKey: ["manage", "league", leagueId],
  });
  queryClient.invalidateQueries({
    queryKey: ["league", leagueId],
  });
  queryClient.invalidateQueries({ queryKey: homeKeys.all });
}

/** Refetch match detail plus league lists that embed game/score data. */
export function invalidateGameDetail(
  queryClient: QueryClient,
  gameId: number,
  leagueId: number,
) {
  queryClient.invalidateQueries({ queryKey: ["match", gameId] });
  invalidateManageLeagueData(queryClient, leagueId);
}
