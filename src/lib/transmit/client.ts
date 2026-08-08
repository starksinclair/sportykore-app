import { Transmit } from "@adonisjs/transmit-client";
import RNEventSource from "react-native-sse";

import { API_BASE_URL } from "@/api/config";

function createClientUid(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type SseMessageEvent = {
  type?: string;
  data?: string | null;
  url?: string;
  lastEventId?: string | null;
};

/**
 * Extract one or more complete JSON object strings from an SSE data payload.
 * RN SSE + chunked Transmit streams sometimes concatenate frames as `{...}{...}`.
 */
export function extractJsonObjects(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  try {
    JSON.parse(trimmed);
    return [trimmed];
  } catch {
    // fall through — may be concatenated or partial
  }

  const objects: string[] = [];
  let depth = 0;
  let inString = false;
  let escape = false;
  let start = -1;

  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i]!;

    if (start === -1) {
      if (ch === "{") {
        start = i;
        depth = 1;
        inString = false;
        escape = false;
      }
      continue;
    }

    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") {
      depth += 1;
      continue;
    }
    if (ch === "}") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        const candidate = trimmed.slice(start, i + 1);
        try {
          JSON.parse(candidate);
          objects.push(candidate);
        } catch {
          // skip invalid slice
        }
        start = -1;
      }
    }
  }

  return objects;
}

function createSafeTransmitEventSource(
  url: string,
  options: { withCredentials?: boolean },
): EventSource {
  const source = new RNEventSource(url, {
    withCredentials: options.withCredentials,
  });

  const originalAddEventListener = source.addEventListener.bind(
    source,
  ) as (type: string, listener: (event: SseMessageEvent) => void) => void;

  (source as { addEventListener: typeof originalAddEventListener }).addEventListener =
    (type, listener) => {
      if (type !== "message") {
        originalAddEventListener(type, listener);
        return;
      }

      originalAddEventListener("message", (event) => {
        const raw = typeof event?.data === "string" ? event.data : "";
        if (!raw.trim()) return;

        const frames = extractJsonObjects(raw);
        if (frames.length === 0) {
          if (__DEV__) {
            console.warn(
              "[transmit] Ignoring non-JSON SSE frame:",
              raw.slice(0, 200),
            );
          }
          return;
        }

        for (const data of frames) {
          try {
            listener({ ...event, data });
          } catch (err) {
            if (__DEV__) {
              console.warn("[transmit] Message handler error:", err);
            }
          }
        }
      });
    };

  return source as unknown as EventSource;
}

export const transmit = new Transmit({
  baseUrl: API_BASE_URL,
  uidGenerator: createClientUid,
  eventSourceFactory: (url, options) =>
    createSafeTransmitEventSource(url.toString(), {
      withCredentials: options.withCredentials,
    }),
  eventTargetFactory: () => null,
});
