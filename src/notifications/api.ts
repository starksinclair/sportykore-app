import { apiRequest } from "@/api/http-client";

export type LeagueNotificationPreference = {
  leagueId: number;
  enabled: boolean;
  kickoffEnabled: boolean;
  finalScoreEnabled: boolean;
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
