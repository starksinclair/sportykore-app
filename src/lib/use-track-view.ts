import { useEffect, useRef } from "react";

import { posthog } from "@/lib/posthog";

type TrackProperties = Record<string, string | number | boolean | null | undefined>;

/**
 * Capture a PostHog view event once per `distinctKey` while the screen is mounted.
 * Pass `null`/`undefined` until entity data is ready so we don't fire empty visits.
 */
export function useTrackView(
  event: string,
  distinctKey: string | number | null | undefined,
  properties?: TrackProperties,
) {
  const lastKey = useRef<string | null>(null);
  const propertiesRef = useRef(properties);
  propertiesRef.current = properties;

  useEffect(() => {
    if (distinctKey == null || distinctKey === "") return;
    if (typeof distinctKey === "number" && !Number.isFinite(distinctKey)) return;

    const key = `${event}:${distinctKey}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    posthog?.capture(event, propertiesRef.current as never);
  }, [event, distinctKey]);
}
