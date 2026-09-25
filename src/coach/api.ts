import { ApiError } from "@/api/errors";
import { apiRequest } from "@/api/http-client";
import type {
  ApiCoachProfile,
  ApiPlayerSocialLink,
  CoachAvailability,
} from "@/api/entities";
import type { PickedImageFile } from "@/lib/picked-image";

export type CoachProfilePayload = {
  displayName?: string;
  photoUrl?: string | null;
  bio?: string | null;
  experience?: string | null;
  qualifications?: string | null;
  philosophy?: string | null;
  countryId?: number | null;
  city?: string | null;
  state?: string | null;
  availability?: CoachAvailability;
  visibility?: "public" | "private";
  socialLinks?: Pick<ApiPlayerSocialLink, "platform" | "url">[];
};

export type CreateCoachProfilePayload = CoachProfilePayload & {
  displayName: string;
};

export type OwnCoachProfileResult =
  | { kind: "profile"; coach: ApiCoachProfile }
  | { kind: "missing"; message: string };

export async function fetchCoachProfile(coachId: number): Promise<ApiCoachProfile> {
  const res = await apiRequest<{ data: { coach: ApiCoachProfile } }>(
    `/api/v1/coaches/${coachId}`,
  );
  return res.data.coach;
}

export async function fetchOwnCoachProfile(): Promise<OwnCoachProfileResult> {
  try {
    const res = await apiRequest<{ data: { coach: ApiCoachProfile } }>(
      "/api/v1/me/coach",
      { auth: true },
    );
    return { kind: "profile", coach: res.data.coach };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { kind: "missing", message: error.message };
    }
    throw error;
  }
}

export async function createCoachProfile(
  payload: CreateCoachProfilePayload,
): Promise<ApiCoachProfile> {
  const res = await apiRequest<{ data: { coach: ApiCoachProfile } }>(
    "/api/v1/me/coach",
    { method: "POST", auth: true, idempotencyKey: true, jsonBody: payload },
  );
  return res.data.coach;
}

export async function updateCoachProfile(
  payload: CoachProfilePayload,
): Promise<ApiCoachProfile> {
  const res = await apiRequest<{ data: { coach: ApiCoachProfile } }>(
    "/api/v1/me/coach",
    { method: "PUT", auth: true, idempotencyKey: true, jsonBody: payload },
  );
  return res.data.coach;
}

export async function uploadCoachPhoto(file: PickedImageFile): Promise<ApiCoachProfile> {
  const form = new FormData();
  form.append("photo", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  const res = await apiRequest<{ data: { coach: ApiCoachProfile } }>(
    "/api/v1/me/coach/photo",
    { method: "POST", auth: true, idempotencyKey: true, jsonBody: form },
  );
  return res.data.coach;
}
