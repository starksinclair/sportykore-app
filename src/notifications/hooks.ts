import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/query-client";
import {
  fetchLeagueNotificationPreference,
  updateLeagueNotificationPreference,
} from "./api";

export const notificationKeys = {
  leaguePreference: (leagueId: number) =>
    ["league-notification-preference", leagueId] as const,
};

export function useLeagueNotificationPreference(
  leagueId: number,
  enabled: boolean,
  initialEnabled?: boolean,
) {
  return useQuery({
    queryKey: notificationKeys.leaguePreference(leagueId),
    queryFn: () => fetchLeagueNotificationPreference(leagueId),
    enabled: enabled && leagueId > 0 && initialEnabled === undefined,
    initialData:
      initialEnabled === undefined
        ? undefined
        : {
            leagueId,
            enabled: initialEnabled,
            kickoffEnabled: true,
            finalScoreEnabled: true,
          },
    staleTime: 60 * 1000,
  });
}

export function useUpdateLeagueNotificationPreference(leagueId: number) {
  return useMutation({
    mutationFn: (enabled: boolean) =>
      updateLeagueNotificationPreference(leagueId, enabled),
    onSuccess: (preference) => {
      queryClient.setQueryData(
        notificationKeys.leaguePreference(leagueId),
        preference,
      );
    },
  });
}
