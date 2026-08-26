import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/query-client";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  fetchLeagueNotificationPreference,
  updateLeagueNotificationPreference,
  type AppNotification,
  type NotificationsResponse,
} from "./api";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
  leaguePreference: (leagueId: number) =>
    ["league-notification-preference", leagueId] as const,
};

export type NotificationTransmitPayload = {
  type:
    | "notification_created"
    | "notification_read"
    | "notifications_read_all";
  notificationId?: number;
  unreadCount?: number;
};

function patchNotificationRead(
  notification: AppNotification,
  readAt: string | null,
): AppNotification {
  return notification.readAt ? notification : { ...notification, readAt };
}

function updateUnreadCount(unreadCount: number) {
  queryClient.setQueryData(notificationKeys.unreadCount(), unreadCount);
  queryClient.setQueryData<NotificationsResponse | undefined>(
    notificationKeys.list(),
    (old) => (old ? { ...old, unreadCount } : old),
  );
}

export function applyNotificationTransmitPayload(
  payload: NotificationTransmitPayload,
) {
  if (typeof payload.unreadCount === "number") {
    updateUnreadCount(payload.unreadCount);
  } else if (payload.type === "notification_created") {
    queryClient.setQueryData<number | undefined>(
      notificationKeys.unreadCount(),
      (old) => (old ?? 0) + 1,
    );
    queryClient.setQueryData<NotificationsResponse | undefined>(
      notificationKeys.list(),
      (old) => (old ? { ...old, unreadCount: old.unreadCount + 1 } : old),
    );
  }

  void queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
}

export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => fetchNotifications(),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useUnreadNotificationCount(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: fetchUnreadNotificationCount,
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: ({ notification, unreadCount }) => {
      queryClient.setQueryData<NotificationsResponse | undefined>(
        notificationKeys.list(),
        (old) =>
          old
            ? {
                ...old,
                unreadCount,
                notifications: old.notifications.map((row) =>
                  row.id === notification.id ? notification : row,
                ),
              }
            : old,
      );
      queryClient.setQueryData(notificationKeys.unreadCount(), unreadCount);
    },
  });
}

export function useMarkAllNotificationsRead() {
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previousList =
        queryClient.getQueryData<NotificationsResponse>(notificationKeys.list());
      const previousCount =
        queryClient.getQueryData<number>(notificationKeys.unreadCount());
      const readAt = new Date().toISOString();

      queryClient.setQueryData<NotificationsResponse | undefined>(
        notificationKeys.list(),
        (old) =>
          old
            ? {
                unreadCount: 0,
                notifications: old.notifications.map((notification) =>
                  patchNotificationRead(notification, readAt),
                ),
              }
            : old,
      );
      queryClient.setQueryData(notificationKeys.unreadCount(), 0);

      return { previousList, previousCount };
    },
    onError: (_err, _payload, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(notificationKeys.list(), context.previousList);
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousCount);
      }
    },
    onSuccess: ({ unreadCount }) => updateUnreadCount(unreadCount),
  });
}

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
