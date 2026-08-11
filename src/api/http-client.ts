import { API_BASE_URL } from "@/api/config";
import { ApiError, messageFromBackendBody, type ApiParsedErrorPayload } from "@/api/errors";
import { getToken } from "@/auth/storage";
import { notifyUnauthorized } from "@/auth/unauthorized-bus";

export type ApiAuthMode = boolean | "optional";

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  /**
   * Auth behaviour for the request. Default `false`.
   * - `true` - require a Bearer token; throw if none is stored
   * - `"optional"` - attach Bearer when a token exists; still call without one
   * - `false` - never attach Authorization
   */
  auth?: ApiAuthMode;
  /**
   * When a Bearer token was sent and the server responds 401, do not run
   * global session teardown (used for logout with an already-invalid token).
   */
  muteGlobalUnauthorized?: boolean;
  jsonBody?: unknown;
  /**
   * Attach a client-generated idempotency key for write requests. Pass `true`
   * to generate a UUID, or provide a stable key when retrying the same action.
   */
  idempotencyKey?: string | true;
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

function createClientIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Single HTTP entry-point for backend calls. Parses JSON safely, maps errors to `ApiError`,
 * and triggers global teardown on invalid sessions for authenticated routes.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    auth = false,
    muteGlobalUnauthorized = false,
    jsonBody,
    headers: baseHeaders,
    idempotencyKey,
    ...rest
  } = options;

  const headers = new Headers(baseHeaders ?? undefined);
  if (jsonBody !== undefined && !(jsonBody instanceof FormData)) {
    headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  }
  headers.set("Accept", "application/json");
  if (idempotencyKey) {
    headers.set(
      "Idempotency-Key",
      idempotencyKey === true ? createClientIdempotencyKey() : idempotencyKey,
    );
  }

  let tokenValue: string | null = null;
  if (auth === true || auth === "optional") {
    tokenValue = await getToken();
    if (auth === true && !tokenValue) {
      throw new ApiError("Not authenticated.", {
        status: 401,
        url: buildUrl(path),
        body: null,
      });
    }
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
      (res.status === 401
        ? "Your session could not be verified."
        : res.status === 403
          ? "You do not have permission to do that."
        : res.status >= 500
          ? `Server error (${res.status}).`
          : `Request failed (${res.status}).`);

    if (
      auth &&
      tokenValue &&
      res.status === 401 &&
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
