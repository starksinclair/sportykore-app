import { API_BASE_URL } from "@/api/config";
import { ApiError, messageFromBackendBody, type ApiParsedErrorPayload } from "@/api/errors";
import { getToken } from "@/auth/storage";
import { notifyUnauthorized } from "@/auth/unauthorized-bus";

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  /** Attach `Authorization: Bearer <token>` when a token exists. Default `false`. */
  auth?: boolean;
  /**
   * When `auth` is true and the server responds 401/403, do not run global
   * session teardown (used for logout with an already-invalid token).
   */
  muteGlobalUnauthorized?: boolean;
  jsonBody?: unknown;
};

function buildUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}

async function readJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { rawText: text } as ApiParsedErrorPayload;
  }
}

/**
 * Single HTTP entry-point for backend calls. Parses JSON safely, maps errors to `ApiError`,
 * and triggers global teardown on invalid sessions for authenticated routes.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { auth = false, muteGlobalUnauthorized = false, jsonBody, headers: baseHeaders, ...rest } =
    options;

  const headers = new Headers(baseHeaders ?? undefined);
  if (jsonBody !== undefined && !(jsonBody instanceof FormData)) {
    headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  }
  headers.set("Accept", "application/json");

  let tokenValue: string | null = null;
  if (auth) {
    tokenValue = await getToken();
    if (tokenValue) {
      headers.set("Authorization", `Bearer ${tokenValue}`);
    }
  }

  let res: Response;
  try {
    const serializedBody =
      jsonBody !== undefined
        ? jsonBody instanceof FormData
          ? jsonBody
          : JSON.stringify(jsonBody)
        : undefined;

    res = await fetch(buildUrl(path), {
      ...rest,
      headers,
      body: serializedBody,
    });
  } catch (e: unknown) {
    const aborted = typeof e === "object" && e !== null && "name" in e && (e as { name?: string }).name === "AbortError";
    throw new ApiError(aborted ? "Request cancelled." : "Network request failed.", {
      status: 0,
      url: buildUrl(path),
      body: null,
      kind: aborted ? "abort" : "network",
    });
  }

  const parsed = await readJsonSafe(res);

  if (!res.ok) {
    const message =
      messageFromBackendBody(parsed as ApiParsedErrorPayload) ??
      (res.status === 401 || res.status === 403
        ? "Your session could not be verified."
        : res.status >= 500
          ? `Server error (${res.status}).`
          : `Request failed (${res.status}).`);

    if (
      auth &&
      tokenValue &&
      (res.status === 401 || res.status === 403) &&
      !muteGlobalUnauthorized
    ) {
      await notifyUnauthorized();
    }

    throw new ApiError(message, {
      status: res.status,
      url: res.url ?? buildUrl(path),
      body: parsed as ApiParsedErrorPayload,
    });
  }

  return parsed as T;
}
