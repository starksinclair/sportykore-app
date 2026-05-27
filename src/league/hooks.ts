import { useMutation, useQuery } from "@tanstack/react-query";
import { useNetworkStatus } from "hooks/useNetworkStatus";

import { queryClient } from "@/lib/query-client";
import { manageKeys } from "@/manage/queryKeys";
import { createLeague, fetchLeagueDetail } from "./api";

export const leagueKeys = {
  league: (leagueId: number, seasonId?: number | null) =>
    ["league", leagueId, seasonId ?? null] as const,
};

export function useLeagueDetail(leagueId: number, seasonId?: number | null) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: leagueKeys.league(leagueId, seasonId ?? null),
    queryFn: () => fetchLeagueDetail(leagueId, seasonId ?? undefined),
    enabled: leagueId > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateLeague() {
  return useMutation({
    mutationFn: createLeague,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: manageKeys.leagues() });
    },
  });
}
