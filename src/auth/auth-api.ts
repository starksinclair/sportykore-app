import { apiRequest } from "@/api/http-client";

import {
  unwrapAuthPayload,
  type AuthPayload,
  type WrappedAuthSuccess,
} from "./auth-contract";

const PREFIX = "/api/v1/auth";

export type OtpSentResponse = {
  message: string;
};

export async function postRequestOtp(email: string): Promise<OtpSentResponse> {
  return apiRequest<OtpSentResponse>(`${PREFIX}/request-otp`, {
    method: "POST",
    jsonBody: { email: email.trim() },
    auth: false,
  });
}

export async function postVerifyOtp(params: {
  email: string;
  code: string;
  name?: string;
  recoveryEmail?: string;
}): Promise<AuthPayload> {
  const body = await apiRequest<WrappedAuthSuccess>(`${PREFIX}/verify-otp`, {
    method: "POST",
    jsonBody: {
      email: params.email.trim(),
      code: params.code.trim(),
      ...(params.name?.trim() ? { name: params.name.trim() } : {}),
      ...(params.recoveryEmail?.trim()
        ? { recoveryEmail: params.recoveryEmail.trim() }
        : {}),
    },
    auth: false,
  });
  return unwrapAuthPayload(body);
}

export async function postRecover(
  recoveryEmail: string,
): Promise<OtpSentResponse> {
  return apiRequest<OtpSentResponse>(`${PREFIX}/recover`, {
    method: "POST",
    jsonBody: { recoveryEmail: recoveryEmail.trim() },
    auth: false,
  });
}

export async function postLogout(): Promise<void> {
  await apiRequest<unknown>(`${PREFIX}/logout`, {
    method: "POST",
    auth: true,
    muteGlobalUnauthorized: true,
  });
}

export async function deleteAccount(): Promise<void> {
  await apiRequest<unknown>(`${PREFIX}/account`, {
    method: "DELETE",
    auth: true,
  });
}
