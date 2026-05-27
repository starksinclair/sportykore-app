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
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signUp: (input: { email: string; password: string; name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  deleteOnboardingCompleted: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (input: { token: string; password: string }) => Promise<void>;
};
