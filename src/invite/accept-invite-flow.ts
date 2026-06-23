import { processInviteAccept } from "./invite-utils";
import { setPendingInviteToken } from "./storage";

export type AcceptInviteFlowResult =
  | { kind: "requires_profile" }
  | { kind: "joined" }
  | { kind: "error"; message: string; status?: number };

export async function runAcceptInviteFlow(
  token: string,
): Promise<AcceptInviteFlowResult> {
  const outcome = await processInviteAccept(token);
  switch (outcome.kind) {
    case "requires_profile":
      await setPendingInviteToken(token);
      return { kind: "requires_profile" };
    case "joined":
      return { kind: "joined" };
    case "auth_required":
      return {
        kind: "error",
        message: "Your session could not be verified. Sign in and try again.",
        status: 401,
      };
    case "wrong_account":
      return {
        kind: "error",
        message: outcome.message,
        status: 403,
      };
    case "invalid":
      return {
        kind: "error",
        message: outcome.message,
        status: 404,
      };
    case "already_joined":
      return {
        kind: "error",
        message: outcome.message,
        status: 409,
      };
    case "error":
      return {
        kind: "error",
        message: outcome.message,
      };
  }
}
