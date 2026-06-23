import { useQuery } from "@tanstack/react-query";
import { useNetworkStatus } from "hooks/useNetworkStatus";

import { fetchDoesUserHavePlayerProfile, fetchPlayerDetail } from "./api";

export function useDoesUserHavePlayerProfile(enabled: boolean) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: ["player", "has-profile"],
    queryFn: () => fetchDoesUserHavePlayerProfile(),
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
  });
}

export function usePlayerDetail(playerId: number) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: ["player", playerId],
    queryFn: () => fetchPlayerDetail(playerId),
    enabled: playerId > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
    placeholderData: (previousData) => previousData,
  });
}
