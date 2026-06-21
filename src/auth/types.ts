/** App-level session user (normalized from `/api/v1/auth/*`). */
export type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  hasOnboarded: boolean;
  hydrated: boolean;
  completeOtpVerification: (input: {
    email: string;
    code: string;
  }) => Promise<void>;
  recoverAccount: (recoveryEmail: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  deleteOnboardingCompleted: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};
