import { apiRequest } from "@/api/http-client";

import type { LeagueDetail } from "./types";

export async function fetchLeagueDetail(
  leagueId: number,
  seasonId?: number,
): Promise<LeagueDetail> {
  const query = new URLSearchParams();
  if (seasonId != null) query.set("seasonId", String(seasonId));

  const path = `/api/v1/leagues/${leagueId}${
    query.toString() ? `?${query}` : ""
  }`;
  const res = await apiRequest<{ data: LeagueDetail }>(path);
  return res.data;
}

export type CreateLeaguePayload = {
  name: string;
  seasonName: string;
  countryId: number;
  description?: string;
  gender?: string;
  teams?: { name: string }[];
};

export type CreateLeagueResult = {
  inviteUrl: string;
};

function readInviteUrl(body: unknown): string | null {
  if (typeof body === "string" && body.trim().length > 0) {
    return body.trim();
  }
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const candidates = [record.inviteUrl, record.inviteLink];

  if (record.data && typeof record.data === "object") {
    const data = record.data as Record<string, unknown>;
    candidates.push(data.inviteUrl, data.inviteLink);
  }

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

export async function createLeague(
  payload: CreateLeaguePayload,
): Promise<CreateLeagueResult> {
  const res = await apiRequest<unknown>("/api/v1/leagues", {
    method: "POST",
    auth: true,
    jsonBody: payload,
  });

  const inviteUrl = readInviteUrl(res);
  if (!inviteUrl) {
    throw new Error("Create league succeeded but no invite link was returned.");
  }

  return { inviteUrl };
}
