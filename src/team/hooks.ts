import { useQuery } from "@tanstack/react-query";
import { useNetworkStatus } from "hooks/useNetworkStatus";

import { fetchTeamDetail } from "./api";

export function useTeamDetail(teamId: number) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: ["team", teamId],
    queryFn: () => fetchTeamDetail(teamId),
    enabled: teamId > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
    placeholderData: (previousData) => previousData,
  });
}
