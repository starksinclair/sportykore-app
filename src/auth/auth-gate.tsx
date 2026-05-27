import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

import { useAuth } from "./use-auth";

/**
 * Options for {@link AuthGate.requireAuth}. `action` is a verb phrase used to
 * build human-friendly copy ("Log in to {action}"), so prefer phrasing like
 * `favourite this league` or `create a league`.
 */
export type RequireAuthOptions = {
  action: string;
  /** Optional override of the dialog body copy. */
  message?: string;
  /** Optional override of the dialog title (default: `Log in to {action}`). */
  title?: string;
  /** Called when the user dismisses the dialog without signing in. */
  onCancel?: () => void;
};

export type AuthGate = {
  isAuthenticated: boolean;
  /**
   * Runs `callback` immediately if the user is signed in and returns `true`.
   * Otherwise, opens the global login prompt and returns `false`. The caller
   * is responsible for bailing out of any further work when the return is
   * `false`.
   */
  requireAuth: (opts: RequireAuthOptions, callback?: () => void) => boolean;
};

type PendingPrompt = RequireAuthOptions & { id: number };

const AuthGateContext = createContext<AuthGate | null>(null);

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingPrompt | null>(null);
  const nextId = useRef(0);

  const isAuthenticated = user != null;

  const close = useCallback(() => setPending(null), []);

  const handleCancel = useCallback(() => {
    pending?.onCancel?.();
    close();
  }, [pending, close]);

  const handleLogin = useCallback(() => {
    close();
    router.push("/login");
  }, [close]);

  // Auto-dismiss the dialog if the user signs in mid-flight (e.g. from a deep
  // link), so returning to the previous screen doesn't leave a stale prompt.
  useEffect(() => {
    if (isAuthenticated && pending) close();
  }, [isAuthenticated, pending, close]);

  const requireAuth = useCallback<AuthGate["requireAuth"]>(
    (opts, callback) => {
      if (user) {
        callback?.();
        return true;
      }
      nextId.current += 1;
      setPending({ ...opts, id: nextId.current });
      return false;
    },
    [user],
  );

  const value = useMemo<AuthGate>(
    () => ({ isAuthenticated, requireAuth }),
    [isAuthenticated, requireAuth],
  );

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      <AuthGateDialog
        prompt={pending}
        onCancel={handleCancel}
        onLogin={handleLogin}
      />
    </AuthGateContext.Provider>
  );
}

export function useAuthGate(): AuthGate {
  const ctx = useContext(AuthGateContext);
  if (!ctx) {
    throw new Error("useAuthGate must be used inside <AuthGateProvider>.");
  }
  return ctx;
}

type DialogProps = {
  prompt: PendingPrompt | null;
  onCancel: () => void;
  onLogin: () => void;
};

function AuthGateDialog({ prompt, onCancel, onLogin }: DialogProps) {
  const visible = prompt != null;
  const title = prompt?.title ?? (prompt ? `Log in to ${prompt.action}` : "");
  const message =
    prompt?.message ??
    (prompt
      ? `You need an account to ${prompt.action}. Sign in or create one to continue.`
      : "");

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Dismiss login prompt"
        className="flex-1 items-center justify-center bg-black/55 px-6"
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="w-full max-w-[360px] rounded-[24px] bg-white px-5 pb-5 pt-6"
        >
          <View className="items-center pb-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: `${colors.brand}1A` }}
            >
              <Ionicons name="lock-closed" size={22} color={colors.brand} />
            </View>
          </View>
          <Text
            style={{ fontFamily: fonts.bodyBold, color: colors.darkLabel }}
            className="text-center text-[18px]"
          >
            {title}
          </Text>
          <Text
            style={{ fontFamily: fonts.body }}
            className="pt-2 text-center text-[14px] leading-5 text-neutral-500"
          >
            {message}
          </Text>

          <View className="flex-row gap-3 pt-6">
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              className="flex-1 items-center justify-center rounded-2xl border border-neutral-200 bg-white py-3 active:bg-neutral-50"
            >
              <Text
                style={{ fontFamily: fonts.bodyBold, color: colors.darkLabel }}
                className="text-[14px]"
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={onLogin}
              accessibilityRole="button"
              accessibilityLabel="Log in"
              className="flex-1 items-center justify-center rounded-2xl py-3 active:opacity-90"
              style={{ backgroundColor: colors.brand }}
            >
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-[14px] text-white"
              >
                Log in
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
