import { useQuery } from "@tanstack/react-query";
import { useNetworkStatus } from "hooks/useNetworkStatus";

import { fetchMatchDetail } from "./api";

export type UseMatchDetailOptions = {
  /** Poll the endpoint at this interval (ms). Used by the TV scoreboard. */
  refetchInterval?:
    | number
    | false
    | ((data: Awaited<ReturnType<typeof fetchMatchDetail>> | undefined) => number | false);
  /** Override the default 5-minute staleTime when polling shorter intervals. */
  staleTime?: number;
};

export function useMatchDetail(
  gameId: number,
  options: UseMatchDetailOptions = {},
) {
  const { isOnline } = useNetworkStatus();
  const { refetchInterval, staleTime = 5 * 60 * 1000 } = options;
  const resolvedInterval =
    typeof refetchInterval === "function"
      ? (query: { state: { data?: Awaited<ReturnType<typeof fetchMatchDetail>> } }) =>
          refetchInterval(query.state.data)
      : refetchInterval;

  return useQuery({
    queryKey: ["match", gameId],
    queryFn: () => fetchMatchDetail(gameId),
    enabled: gameId > 0,
    staleTime,
    gcTime: 24 * 60 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
    placeholderData: (previousData) => previousData,
    refetchInterval: resolvedInterval,
  });
}
