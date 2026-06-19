import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/auth";

import { getPendingInviteToken } from "../storage";

/**
 * Resumes invite acceptance after cold start or post-login when the user
 * is no longer on a `/join/*` route.
 */
export function InviteResumeHandler() {
  const router = useRouter();
  const segments = useSegments();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const onJoinRoute = segments[0] === "join";
    if (onJoinRoute) return;

    getPendingInviteToken().then((token) => {
      if (token) router.replace(`/join/invite-handler`);
    });
  }, [user, segments, router]);

  return null;
}
