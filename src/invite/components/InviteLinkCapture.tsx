import { useLinkingURL } from "expo-linking";
import { useEffect, useRef } from "react";

import { persistInviteFromUrl } from "../invite-utils";

/**
 * Persists invite tokens from join-league deep links without navigating.
 */
export function InviteLinkCapture() {
  const url = useLinkingURL();
  const lastPersistedUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!url || url === lastPersistedUrl.current) return;

    void persistInviteFromUrl(url).then((persisted) => {
      if (persisted) {
        lastPersistedUrl.current = url;
      }
    });
  }, [url]);

  return null;
}
