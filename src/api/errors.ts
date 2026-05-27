/** Network / Abort / unknown failures */
export type ApiFailureKind =
  | "network"
  | "parse"
  | "http"
  | "abort"
  | "unknown";

export type ApiParsedErrorPayload = Record<string, unknown> | unknown[] | null;

export class ApiError extends Error {
  readonly status: number;
  readonly url: string;
  readonly body: ApiParsedErrorPayload;
  readonly kind: ApiFailureKind;

  constructor(
    message: string,
    options: {
      status: number;
      url: string;
      body: ApiParsedErrorPayload;
      kind?: ApiFailureKind;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.url = options.url;
    this.body = options.body;
    this.kind = options.kind ?? "http";
  }
}

/** Best-effort message extraction for typical Adonis / Lucid error JSON. */
export function messageFromBackendBody(parsed: ApiParsedErrorPayload): string | null {
  if (parsed == null) return null;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    return null;

  const o = parsed as Record<string, unknown>;
  const top = readString(o.message);
  if (top) return top;

  const errList = o.errors;
  if (Array.isArray(errList) && errList.length > 0) {
    const first = errList[0];
    if (first && typeof first === "object") {
      const msg = readString((first as Record<string, unknown>).message);
      if (msg) return msg;
      const fld = readString((first as Record<string, unknown>).field);
      const rule = readString((first as Record<string, unknown>).rule);
      if (fld && rule) return `${fld}: ${rule}`;
    }
    if (typeof first === "string") return first;
  }

  return null;
}

function readString(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}
