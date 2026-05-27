import { useMutation, useQuery } from "@tanstack/react-query";
import { useNetworkStatus } from "hooks/useNetworkStatus";

import { queryClient } from "@/lib/query-client";
import {
  favoriteLeague,
  fetchLeagues,
  resolveLeaguesParams,
  unfavoriteLeague,
} from "../api/leagues";
import type { FetchLeaguesParams } from "../types";
import { homeKeys } from "./queryKeys";

export function useLeaguesByCountry(params: FetchLeaguesParams = {}) {
  const { isOnline } = useNetworkStatus();
  const resolved = resolveLeaguesParams(params);
  return useQuery({
    queryKey: homeKeys.leagues(resolved),
    queryFn: () => fetchLeagues(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
    placeholderData: (previousData) => previousData,
  });
}

export function useFavouriteLeague(params: FetchLeaguesParams) {
  const resolved = resolveLeaguesParams(params);
  return useMutation({
    mutationFn: (leagueId: number) => favoriteLeague(leagueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeKeys.leagues(resolved) });
    },
  });
}

export function useUnfavouriteLeague(params: FetchLeaguesParams) {
  const resolved = resolveLeaguesParams(params);
  return useMutation({
    mutationFn: (leagueId: number) => unfavoriteLeague(leagueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeKeys.leagues(resolved) });
    },
  });
}
