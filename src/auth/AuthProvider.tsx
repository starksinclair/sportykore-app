import { router } from "expo-router";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { queryClient } from "@/lib/query-client";
import { showErrorToast } from "@/lib/show-error-toast";

import { fetchLeagues, resolveLeaguesParams } from "@/home/api/leagues";
import { homeKeys } from "@/home/hooks";
import { startOfDay } from "@/home/utils";
import { postLogout, postRecover, postVerifyOtp } from "./auth-api";
import { AuthContext } from "./auth-context";
import type { BackendAuthUser } from "./auth-contract";
import {
  clearSessionCredentials,
  getOnboarded,
  getPersistedProfile,
  getToken,
  setOnboarded,
  setPersistedProfile,
  setToken,
  type PersistedUserProfile,
} from "./storage";
import type { AuthContextValue, AuthUser } from "./types";
import { setUnauthorizedHandler } from "./unauthorized-bus";

function mapPersisted(profile: PersistedUserProfile): AuthUser {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name ?? undefined,
  };
}

function mapBackendUser(backend: BackendAuthUser): AuthUser {
  const name = backend.fullName?.trim() || undefined;
  return {
    id: String(backend.id),
    email: backend.email.trim(),
    name,
  };
}

function toPersistedProfile(user: AuthUser): PersistedUserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
  };
}

async function persistSessionFromPayload(user: BackendAuthUser, rawTokenValue: string) {
  await setToken(rawTokenValue);
  const mapped = mapBackendUser(user);
  await setPersistedProfile(toPersistedProfile(mapped));
  return mapped;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const today = useMemo(() => startOfDay(new Date()), []);


  useLayoutEffect(() => {
    const handler = async () => {
      await clearSessionCredentials();

      await queryClient.prefetchQuery({
        queryKey: homeKeys.leagues(
          resolveLeaguesParams({ gameDate: today }),
        ),
        queryFn: () => fetchLeagues({ gameDate: today }),
      });
      setUser(null);
      showErrorToast("Session expired", "Please sign in again.");
      router.replace("/login");
    };
    setUnauthorizedHandler(handler);
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [today]);

  useLayoutEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [token, profile, onboarded] = await Promise.all([
          getToken(),
          getPersistedProfile(),
          getOnboarded(),
        ]);
        if (cancelled) return;
        const profileOk = Boolean(profile?.email?.trim() && profile?.id);
        if (token && profileOk && profile) {
          setUser(mapPersisted(profile));
        } else if (token || profileOk) {
          await clearSessionCredentials();
        }
        setHasOnboarded(onboarded);
      } catch {
        if (!cancelled) await clearSessionCredentials();
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const completeOtpVerification = useCallback<
    AuthContextValue["completeOtpVerification"]
  >(async ({ email, code }) => {
    const payload = await postVerifyOtp({ email, code });
    const mapped = await persistSessionFromPayload(payload.user, payload.token.value);
    setUser(mapped);
  }, []);

  const recoverAccount = useCallback<AuthContextValue["recoverAccount"]>(
    async (recoveryEmail) => {
      await postRecover(recoveryEmail);
    },
    [],
  );

  const signOut = useCallback<AuthContextValue["signOut"]>(async () => {
    try {
      
      await postLogout();
    } catch {
      /* token may already be invalid */
    }
    await clearSessionCredentials();
    queryClient.clear();
    setUser(null);
  }, []);

  const deleteAccount = useCallback<AuthContextValue["deleteAccount"]>(async () => {
    try {
      await deleteAccount();
    } catch {
      /* token may already be invalid */
    }
    await clearSessionCredentials();
    queryClient.clear();
    setUser(null);
  }, []);

  const completeOnboarding = useCallback<AuthContextValue["completeOnboarding"]>(async () => {
    await setOnboarded(true);
    setHasOnboarded(true);
    router.replace("/login");
  }, []);

  const deleteOnboardingCompleted = useCallback<
    AuthContextValue["deleteOnboardingCompleted"]
  >(async () => {
    await setOnboarded(false);
    setHasOnboarded(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      hasOnboarded,
      hydrated,
      completeOtpVerification,
      recoverAccount,
      signOut,
      completeOnboarding,
      deleteOnboardingCompleted,
      deleteAccount,
    }),
    [
      user,
      hasOnboarded,
      hydrated,
      completeOtpVerification,
      recoverAccount,
      signOut,
      completeOnboarding,
      deleteOnboardingCompleted,
      deleteAccount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
