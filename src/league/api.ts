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
  message: string;
};

function readCreateLeagueMessage(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "League created successfully.";
  }

  const record = body as Record<string, unknown>;
  const message = record.message;
  if (typeof message === "string" && message.trim().length > 0) {
    return message.trim();
  }

  return "League created successfully.";
}

export async function createLeague(
  payload: CreateLeaguePayload,
): Promise<CreateLeagueResult> {
  const res = await apiRequest<unknown>("/api/v1/leagues", {
    method: "POST",
    auth: true,
    jsonBody: payload,
  });

  return { message: readCreateLeagueMessage(res) };
}
