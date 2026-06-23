import { apiRequest } from "@/api/http-client";
import type { PickedImageFile } from "@/lib/picked-image";

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

export type CreateLeagueTeamPayload = {
  name: string;
  logo?: PickedImageFile;
};

export type CreateLeaguePayload = {
  name: string;
  seasonName: string;
  countryId: number;
  description?: string;
  gender?: string;
  logo?: PickedImageFile;
  teams?: CreateLeagueTeamPayload[];
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

function appendImageFile(form: FormData, key: string, file: PickedImageFile) {
  form.append(key, {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);
}

function needsMultipart(payload: CreateLeaguePayload): boolean {
  if (payload.logo) return true;
  return payload.teams?.some((team) => team.logo) ?? false;
}

function buildCreateLeagueFormData(payload: CreateLeaguePayload): FormData {
  const form = new FormData();
  form.append("name", payload.name);
  form.append("seasonName", payload.seasonName);
  form.append("countryId", String(payload.countryId));

  if (payload.description) {
    form.append("description", payload.description);
  }
  if (payload.gender) {
    form.append("gender", payload.gender);
  }
  if (payload.logo) {
    appendImageFile(form, "logo", payload.logo);
  }

  payload.teams?.forEach((team, index) => {
    form.append(`teams.${index}.name`, team.name);
    if (team.logo) {
      appendImageFile(form, `teams.${index}.logo`, team.logo);
    }
  });

  return form;
}

export async function createLeague(
  payload: CreateLeaguePayload,
): Promise<CreateLeagueResult> {
  const res = await apiRequest<unknown>("/api/v1/leagues", {
    method: "POST",
    auth: true,
    jsonBody: needsMultipart(payload) ? buildCreateLeagueFormData(payload) : payload,
  });

  return { message: readCreateLeagueMessage(res) };
}
