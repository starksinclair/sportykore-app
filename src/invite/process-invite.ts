import { ApiError, messageFromBackendBody } from "@/api/errors";

import { acceptInvite } from "./api";
import { clearPendingInviteToken } from "./storage";
import type { ProcessInviteOutcome } from "./types";

function messageFromError(error: unknown): string {
  if (error instanceof ApiError) {
    return (
      messageFromBackendBody(error.body) ??
      error.message ??
      "Something went wrong."
    );
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export async function processInviteAccept(
  token: string,
): Promise<ProcessInviteOutcome> {
  try {
    const result = await acceptInvite(token);

    if (result.requiresProfile) {
      return { kind: "requires_profile" };
    }

    if (result.leagueId == null) {
      await clearPendingInviteToken();
      return {
        kind: "error",
        message: "Invite accepted but no league was returned.",
      };
    }

    await clearPendingInviteToken();
    return { kind: "joined", leagueId: result.leagueId };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        return { kind: "auth_required" };
      }
      if (error.status === 403) {
        return {
          kind: "wrong_account",
          message: "This invite is for another account.",
        };
      }
      if (error.status === 404) {
        await clearPendingInviteToken();
        return {
          kind: "invalid",
          message: "This invite has expired or is no longer valid.",
        };
      }
      if (error.status === 409) {
        await clearPendingInviteToken();
        return {
          kind: "already_joined",
          message: messageFromError(error),
        };
      }
    }

    return { kind: "error", message: messageFromError(error) };
  }
}
