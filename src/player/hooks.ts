import { useQuery } from "@tanstack/react-query";
import { useNetworkStatus } from "hooks/useNetworkStatus";

import { fetchPlayerDetail } from "./api";

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
