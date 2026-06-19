import { useMutation, useQuery } from "@tanstack/react-query";
import { useNetworkStatus } from "hooks/useNetworkStatus";

import { queryClient } from "@/lib/query-client";
import { showThrownAsToast } from "@/lib/show-error-toast";

import {
  favoriteLeague,
  fetchLeagues,
  resolveLeaguesParams,
  unfavoriteLeague,
} from "../api/leagues";
import type { FetchLeaguesParams, LeagueResponse, ResolvedLeaguesParams } from "../types";
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

function patchLeagueFavourited(
  data: LeagueResponse,
  leagueId: number,
  isFavourited: boolean,
): LeagueResponse {
  const patchCountries = (countries: LeagueResponse["matches"]) =>
    countries.map((country) => ({
      ...country,
      leagues: country.leagues.map((league) =>
        league.id === leagueId ? { ...league, isFavourited } : league,
      ),
    }));

  return {
    matches: patchCountries(data.matches),
    leagues: patchCountries(data.leagues),
  };
}

function setLeagueFavouritedInCache(
  resolved: ResolvedLeaguesParams,
  leagueId: number,
  isFavourited: boolean,
) {
  queryClient.setQueryData<LeagueResponse>(homeKeys.leagues(resolved), (old) =>
    old ? patchLeagueFavourited(old, leagueId, isFavourited) : old,
  );
}

function useFavouriteMutation(
  params: FetchLeaguesParams,
  mutationFn: (leagueId: number) => Promise<void>,
  isFavourited: boolean,
) {
  const resolved = resolveLeaguesParams(params);

  return useMutation({
    mutationFn,
    onMutate: async (leagueId) => {
      await queryClient.cancelQueries({ queryKey: homeKeys.leagues(resolved) });
      const previous = queryClient.getQueryData<LeagueResponse>(
        homeKeys.leagues(resolved),
      );
      setLeagueFavouritedInCache(resolved, leagueId, isFavourited);
      return { previous };
    },
    onError: (error, _leagueId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(homeKeys.leagues(resolved), context.previous);
      }
      showThrownAsToast(error, "Could not update favourite");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: homeKeys.leagues(resolved) });
    },
  });
}

export function useFavouriteLeague(params: FetchLeaguesParams) {
  return useFavouriteMutation(params, favoriteLeague, true);
}

export function useUnfavouriteLeague(params: FetchLeaguesParams) {
  return useFavouriteMutation(params, unfavoriteLeague, false);
}
