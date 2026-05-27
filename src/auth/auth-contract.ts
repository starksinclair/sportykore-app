/** Shapes documented in documentations/MOBILE_AUTH_ROUTES.md */

export type BackendAuthUser = {
  id: string;
  email: string;
  fullName: string | null;
};

export type BackendAuthToken = {
  type: string;
  value: string;
  expiresAt?: string | null;
  abilities?: unknown;
};

export type AuthPayload = {
  user: BackendAuthUser;
  token: BackendAuthToken;
};

export type WrappedAuthSuccess = {
  data: {
    auth: AuthPayload;
  };
};

export function unwrapAuthPayload(body: WrappedAuthSuccess): AuthPayload {
  const auth = body?.data?.auth;
  if (!auth?.user || !auth?.token?.value)
    throw new Error("Malformed auth payload from server.");
  return auth;
}
