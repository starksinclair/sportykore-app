import { Transmit } from "@adonisjs/transmit-client";
import RNEventSource from "react-native-sse";

import { API_BASE_URL } from "@/api/config";

function createClientUid(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const transmit = new Transmit({
  baseUrl: API_BASE_URL,
  uidGenerator: createClientUid,
  eventSourceFactory: (url, options) => {
    const source = new RNEventSource(url.toString(), {
      withCredentials: options.withCredentials,
    });
    return source as unknown as EventSource;
  },
  eventTargetFactory: () => null,
});
