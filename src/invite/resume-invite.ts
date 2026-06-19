import type { Router } from "expo-router";

import { processInviteAccept } from "./process-invite";
import { getPendingInviteToken } from "./storage";
import type { ProcessInviteOutcome } from "./types";

let acceptInFlight: Promise<ProcessInviteOutcome> | null = null;
let acceptInFlightToken: string | null = null;

/** Dedupes parallel accept calls for the same token (join route + InviteResumeHandler). */
export function processInviteAcceptOnce(token: string): Promise<ProcessInviteOutcome> {
  const trimmed = token.trim();
  if (acceptInFlight && acceptInFlightToken === trimmed) {
    return acceptInFlight;
  }

  acceptInFlightToken = trimmed;
  acceptInFlight = processInviteAccept(trimmed).finally(() => {
    acceptInFlight = null;
    acceptInFlightToken = null;
  });

  return acceptInFlight;
}

export type InviteNavigateResult = "navigated" | "stayed";

export function navigateForInviteOutcome(
  outcome: ProcessInviteOutcome,
  token: string,
  router: Router,
): InviteNavigateResult {
  switch (outcome.kind) {
    case "requires_profile":
      router.replace("/join/create-profile");
      return "navigated";
    case "joined":
      router.replace(`/league/${outcome.leagueId}`);
      return "navigated";
    case "auth_required":
    case "wrong_account":
    case "invalid":
    case "already_joined":
    case "error":
      router.replace(`/join/${token.trim()}`);
      return "navigated";
  }
}

export function messageForInviteOutcome(
  outcome: ProcessInviteOutcome,
  isLoggedIn: boolean,
): string | null {
  switch (outcome.kind) {
    case "requires_profile":
    case "joined":
      return null;
    case "auth_required":
      return isLoggedIn
        ? "Couldn't verify your session. Tap Retry."
        : "Please sign in to accept this invite.";
    case "wrong_account":
    case "invalid":
    case "already_joined":
    case "error":
      return outcome.message;
  }
}

/** After signup/login: accept pending invite and navigate. Returns true if a token existed. */
export async function resumeInviteFlow(router: Router): Promise<boolean> {
  const token = await getPendingInviteToken();
  if (!token) return false;

  const outcome = await processInviteAcceptOnce(token);
  navigateForInviteOutcome(outcome, token, router);
  return true;
}
