import { apiRequest } from "@/api/http-client";

export type LeagueNotificationPreference = {
  leagueId: number;
  enabled: boolean;
  kickoffEnabled: boolean;
  finalScoreEnabled: boolean;
};

export type AppNotification = {
  id: number;
  type: "league_player_joined";
  title: string;
  body: string;
  route: string | null;
  leagueId: number | null;
  playerId: number | null;
  teamId: number | null;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string | null;
};

export type NotificationsResponse = {
  notifications: AppNotification[];
  unreadCount: number;
};

export type RegisterPushTokenPayload = {
  provider: "expo";
  token: string;
  platform: "ios" | "android" | "web" | "unknown";
  deviceId?: string | null;
};

export async function registerPushToken(
  payload: RegisterPushTokenPayload,
): Promise<void> {
  await apiRequest("/api/v1/push/tokens", {
    method: "POST",
    auth: true,
    jsonBody: payload,
  });
}

export async function fetchLeagueNotificationPreference(
  leagueId: number,
): Promise<LeagueNotificationPreference> {
  const res = await apiRequest<{
    data: { preference: LeagueNotificationPreference };
  }>(`/api/v1/leagues/${leagueId}/notifications`, {
    auth: true,
  });

  return res.data.preference;
}

export async function fetchNotifications(limit = 50): Promise<NotificationsResponse> {
  const res = await apiRequest<{ data: NotificationsResponse }>(
    `/api/v1/notifications?limit=${limit}`,
    {
      auth: true,
    },
  );

  return res.data;
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const res = await apiRequest<{ data: { unreadCount: number } }>(
    "/api/v1/notifications/unread-count",
    {
      auth: true,
    },
  );

  return res.data.unreadCount;
}

export async function markNotificationRead(
  notificationId: number,
): Promise<{ notification: AppNotification; unreadCount: number }> {
  const res = await apiRequest<{
    data: { notification: AppNotification; unreadCount: number };
  }>(`/api/v1/notifications/${notificationId}/read`, {
    method: "PUT",
    auth: true,
  });

  return res.data;
}

export async function markAllNotificationsRead(): Promise<{ unreadCount: number }> {
  const res = await apiRequest<{ data: { unreadCount: number } }>(
    "/api/v1/notifications/read-all",
    {
      method: "PUT",
      auth: true,
    },
  );

  return res.data;
}

export async function updateLeagueNotificationPreference(
  leagueId: number,
  enabled: boolean,
): Promise<LeagueNotificationPreference> {
  const res = await apiRequest<{
    data: { preference: LeagueNotificationPreference };
  }>(`/api/v1/leagues/${leagueId}/notifications`, {
    method: "PUT",
    auth: true,
    jsonBody: { enabled },
  });

  return res.data.preference;
}
