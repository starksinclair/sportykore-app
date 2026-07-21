import { apiRequest } from "@/api/http-client";
import { ApiError } from "@/api/errors";
import type {
  ApiPlayer,
  ApiPlayerHighlight,
  PlayerPosition,
} from "@/api/entities";
import type { PickedImageFile } from "@/lib/picked-image";

import type { PlayerDetail } from "./types";

export type DoesUserHavePlayerProfileResult = {
  hasPlayerProfile: boolean;
  playerId: number;
};

export async function fetchDoesUserHavePlayerProfile(): Promise<DoesUserHavePlayerProfileResult> {
  return apiRequest<DoesUserHavePlayerProfileResult>(
    "/api/v1/players/does-user-have-player-profile",
    { auth: true },
  );
}

export async function fetchPlayerDetail(playerId: number): Promise<PlayerDetail> {
  const res = await apiRequest<{ data: PlayerDetail }>(
    `/api/v1/players/${playerId}`,
  );
  return res.data;
}

export type PlayerProfileMissingField =
  | "photo"
  | "bio"
  | "primaryPosition"
  | "preferredFoot"
  | "dateOfBirth"
  | "city"
  | "highlights";

export type PlayerMembership = {
  inLeague: boolean;
  inTeam: boolean;
};

export type OwnPlayerProfileData = {
  player: ApiPlayer;
  completeness: number;
  missingFields: PlayerProfileMissingField[];
  highlightsCount: number;
  membership: PlayerMembership;
};

export type OwnPlayerProfileResult =
  | { kind: "profile"; data: OwnPlayerProfileData }
  | { kind: "missing"; message: string };

export type PlayerProfilePayload = {
  name?: string;
  countryId?: number;
  bio?: string | null;
  primaryPosition?: PlayerPosition | null;
  secondaryPosition?: PlayerPosition | null;
  preferredFoot?: "left" | "right" | "both" | null;
  heightCm?: number | null;
  dateOfBirth?: string | null;
  city?: string | null;
  state?: string | null;
  nationality?: string | null;
  socialHandle?: string | null;
};

export type CreatePlayerProfilePayload = PlayerProfilePayload & {
  name: string;
  countryId: number;
};

export type CreateHighlightPayload = {
  url: string;
  title?: string | null;
};

export type UpdateHighlightPayload = {
  title?: string | null;
};

export async function fetchOwnPlayerProfile(): Promise<OwnPlayerProfileResult> {
  try {
    const res = await apiRequest<{ data: OwnPlayerProfileData }>(
      "/api/v1/me/player",
      { auth: true },
    );
    return { kind: "profile", data: res.data };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { kind: "missing", message: error.message };
    }
    throw error;
  }
}

export async function createPlayerProfile(
  payload: CreatePlayerProfilePayload,
): Promise<ApiPlayer> {
  const res = await apiRequest<{ data: { player: ApiPlayer } }>(
    "/api/v1/me/player",
    { method: "POST", auth: true, jsonBody: payload },
  );
  return res.data.player;
}

export async function updatePlayerProfile(
  payload: PlayerProfilePayload,
): Promise<ApiPlayer> {
  const res = await apiRequest<{ data: { player: ApiPlayer } }>(
    "/api/v1/me/player",
    { method: "PUT", auth: true, jsonBody: payload },
  );
  return res.data.player;
}

export async function uploadPlayerPhoto(file: PickedImageFile): Promise<ApiPlayer> {
  const form = new FormData();
  form.append("photo", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  const res = await apiRequest<{ data: { player: ApiPlayer } }>(
    "/api/v1/me/player/photo",
    { method: "POST", auth: true, jsonBody: form },
  );
  return res.data.player;
}

export async function fetchOwnHighlights(): Promise<ApiPlayerHighlight[]> {
  const res = await apiRequest<{ data: ApiPlayerHighlight[] }>(
    "/api/v1/me/player/highlights",
    { auth: true },
  );
  return res.data;
}

export async function createHighlight(
  payload: CreateHighlightPayload,
): Promise<ApiPlayerHighlight> {
  const res = await apiRequest<{ data: ApiPlayerHighlight }>(
    "/api/v1/me/player/highlights",
    { method: "POST", auth: true, jsonBody: payload },
  );
  return res.data;
}

export async function updateHighlight(
  highlightId: number,
  payload: UpdateHighlightPayload,
): Promise<ApiPlayerHighlight> {
  const res = await apiRequest<{ data: ApiPlayerHighlight }>(
    `/api/v1/me/player/highlights/${highlightId}`,
    { method: "PUT", auth: true, jsonBody: payload },
  );
  return res.data;
}

export async function deleteHighlight(highlightId: number): Promise<void> {
  await apiRequest<{ message: string }>(
    `/api/v1/me/player/highlights/${highlightId}`,
    { method: "DELETE", auth: true },
  );
}
