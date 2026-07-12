import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNetworkStatus } from "hooks/useNetworkStatus";

import { showThrownAsToast } from "@/lib/show-error-toast";

import {
  fetchFormations,
  fetchGameLineups,
  setGameLineup,
} from "./api";
import { lineupKeys } from "./queryKeys";
import type { SetLineupPayload } from "./types";

export function useFormations() {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: lineupKeys.formations(),
    queryFn: async () => (await fetchFormations()) ?? [],
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
  });
}

export function useGameLineups(gameId: number, enabled = true) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: lineupKeys.gameLineups(gameId),
    queryFn: async () => (await fetchGameLineups(gameId)) ?? [],
    enabled: enabled && gameId > 0,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
  });
}

export function useSetLineup(gameId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetLineupPayload) => setGameLineup(gameId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lineupKeys.gameLineups(gameId) });
      queryClient.invalidateQueries({ queryKey: ["match", gameId] });
    },
    onError: (error) => {
      showThrownAsToast(error, "Could not save lineup");
    },
  });
}
