import { apiRequest } from "@/api/http-client";

import {
  unwrapAuthPayload,
  type AuthPayload,
  type WrappedAuthSuccess,
} from "./auth-contract";

const PREFIX = "/api/v1/auth";

export async function postLogin(
  email: string,
  password: string,
): Promise<AuthPayload> {
  const body = await apiRequest<WrappedAuthSuccess>(`${PREFIX}/login`, {
    method: "POST",
    jsonBody: { email: email.trim(), password },
    auth: false,
  });
  return unwrapAuthPayload(body);
}

export async function postSignup(params: {
  email: string;
  password: string;
  /** Maps to API `fullName` (nullable) */
  fullName: string | null;
}): Promise<AuthPayload> {
  const body = await apiRequest<WrappedAuthSuccess>(`${PREFIX}/signup`, {
    method: "POST",
    jsonBody: {
      email: params.email.trim(),
      password: params.password,
      fullName: params.fullName?.trim?.() ?? null,
    },
    auth: false,
  });
  return unwrapAuthPayload(body);
}

export async function postLogout(): Promise<void> {
  await apiRequest<unknown>(`${PREFIX}/logout`, {
    method: "POST",
    auth: true,
    muteGlobalUnauthorized: true,
  });
}

export async function postForgotPassword(email: string): Promise<void> {
  await apiRequest<unknown>(`${PREFIX}/forgot-password`, {
    method: "POST",
    jsonBody: { email: email.trim() },
    auth: false,
  });
}

export async function postResetPassword(
  token: string,
  password: string,
): Promise<void> {
  await apiRequest<unknown>(`${PREFIX}/reset-password`, {
    method: "POST",
    jsonBody: { token: token.trim(), password },
    auth: false,
  });
}
