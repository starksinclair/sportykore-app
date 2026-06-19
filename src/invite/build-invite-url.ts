import Constants from "expo-constants";
import type { Router } from "expo-router";

import { getPendingInviteToken } from "@/invite/storage";

export type InviteUrlContext = {
  leagueName?: string;
  teamName?: string;
};

/**
 * Turns backend `inviteLink` paths like `/join/{token}` into a shareable app URL.
 * Uses the Expo scheme from app.json (e.g. `sportykore://join/{token}`).
 *
 * Avoids `Linking.createURL('/join/...')` which can produce a triple slash
 * (`sportykore:///join/...`).
 */
export function buildInviteUrl(inviteLink: string, context?: InviteUrlContext): string {
  const path = inviteLink.replace(/^\/+/, "");
  const scheme = resolveAppScheme();
  const base = `${scheme}://${path}`;

  const params = new URLSearchParams();
  if (context?.leagueName?.trim()) {
    params.set("leagueName", context.leagueName.trim());
  }
  if (context?.teamName?.trim()) {
    params.set("teamName", context.teamName.trim());
  }

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

function resolveAppScheme(): string {
  const raw = Constants.expoConfig?.scheme;
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (Array.isArray(raw) && raw[0]) return raw[0];
  return "sportykore";
}

export async function resumeInviteFlow(router: Router) {
  const token = await getPendingInviteToken();
  if (token) {
    router.replace("/join/invite-handler");
  } else return;
}
