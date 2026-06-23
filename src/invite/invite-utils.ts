import Constants from "expo-constants";

import { ApiError, messageFromBackendBody } from "@/api/errors";

import { acceptInvite } from "./api";
import type { PendingInviteContext } from "./storage";
import { clearPendingInviteToken, setPendingInviteToken } from "./storage";
import type { ProcessInviteOutcome } from "./types";

export type InviteUrlContext = {
  leagueName?: string;
  teamName?: string;
};

type CapturedInviteLink = {
  token: string;
  context: PendingInviteContext;
};

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

function resolveAppScheme(): string {
  const raw = Constants.expoConfig?.scheme;
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (Array.isArray(raw) && raw[0]) return raw[0];
  return "sportykore";
}

function readQueryParam(url: URL, key: string): string | undefined {
  const value = url.searchParams.get(key)?.trim();
  return value || undefined;
}

/** Extracts an invite token from a raw UUID or pasted share URL. */
export function parseInviteToken(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.includes("join-league")) {
    try {
      const normalized = trimmed.includes("://")
        ? trimmed
        : `sportykore://${trimmed.replace(/^\/+/, "")}`;
      const parsed = new URL(normalized);
      const route = parsed.hostname || parsed.pathname.replace(/^\/+/, "");
      if (route === "join-league") {
        const token = parsed.searchParams.get("token")?.trim();
        if (token) return token;
      }
    } catch {
      // Fall through to legacy parsing.
    }
  }

  const joinMarker = "/join/";
  const joinIndex = trimmed.indexOf(joinMarker);
  if (joinIndex >= 0) {
    const afterJoin = trimmed.slice(joinIndex + joinMarker.length);
    const token = afterJoin.split(/[?#]/)[0]?.trim();
    return token || null;
  }

  return trimmed;
}

/** Turns backend `/join/{token}` paths into shareable join-league deep links. */
export function buildInviteUrl(inviteLink: string, context?: InviteUrlContext): string {
  const token = parseInviteToken(inviteLink);
  if (!token) {
    throw new Error("Invite link is missing a token.");
  }

  const scheme = resolveAppScheme();
  const params = new URLSearchParams({ token });

  if (context?.leagueName?.trim()) {
    params.set("leagueName", context.leagueName.trim());
  }
  if (context?.teamName?.trim()) {
    params.set("teamName", context.teamName.trim());
  }

  return `${scheme}://join-league?${params.toString()}`;
}

function parseJoinLeagueInviteUrl(url: string): CapturedInviteLink | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const pathname = parsed.pathname.replace(/^\/+/, "");
  const route = parsed.hostname || pathname;
  if (route !== "join-league") return null;

  const token = readQueryParam(parsed, "token");
  if (!token) return null;

  return {
    token,
    context: {
      leagueName: readQueryParam(parsed, "leagueName"),
      teamName: readQueryParam(parsed, "teamName"),
    },
  };
}

/** Stores invite details from a join-league deep link. Never navigates. */
export async function persistInviteFromUrl(url: string): Promise<boolean> {
  const captured = parseJoinLeagueInviteUrl(url);
  if (!captured) return false;

  await setPendingInviteToken(captured.token, captured.context);
  return true;
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
