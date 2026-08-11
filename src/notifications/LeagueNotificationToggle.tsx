import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type GestureResponderEvent,
} from "react-native";

import { useAuth } from "@/auth";
import { colors } from "@/constants";
import {
  messageFromThrown,
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "@/lib/show-error-toast";
import {
  useLeagueNotificationPreference,
  useUpdateLeagueNotificationPreference,
} from "./hooks";
import { ensurePushTokenRegistered } from "./push-client";

type Props = {
  leagueId: number;
  initialEnabled?: boolean;
  variant?: "pill" | "icon";
};

export function LeagueNotificationToggle({
  leagueId,
  initialEnabled,
  variant = "pill",
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const preferenceQuery = useLeagueNotificationPreference(
    leagueId,
    Boolean(user),
    initialEnabled,
  );
  const updatePreference = useUpdateLeagueNotificationPreference(leagueId);
  const enabled = preferenceQuery.data?.enabled ?? false;
  const busy = preferenceQuery.isLoading || updatePreference.isPending;

  const handlePress = async (event?: GestureResponderEvent) => {
    event?.stopPropagation();

    if (!user) {
      showInfoToast(
        "Sign in for alerts",
        "Log in to choose which leagues can send you match alerts.",
      );
      router.push("/login");
      return;
    }

    try {
      const nextEnabled = !enabled;
      if (nextEnabled) {
        await ensurePushTokenRegistered();
      }
      await updatePreference.mutateAsync(nextEnabled);
      showSuccessToast(
        nextEnabled ? "League alerts on" : "League alerts off",
        nextEnabled
          ? "You will get kickoff and final score alerts for this league."
          : "You will no longer receive push alerts for this league.",
      );
    } catch (error) {
      showErrorToast("Could not update alerts", messageFromThrown(error));
    }
  };

  if (variant === "icon") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          enabled ? "Turn off league notifications" : "Turn on league notifications"
        }
        accessibilityState={{ busy, checked: enabled }}
        disabled={busy}
        hitSlop={10}
        onPress={handlePress}
        className={`h-9 w-9 items-center justify-center rounded-full border ${
          enabled
            ? "border-accent-400 bg-accent-500"
            : "border-neutral-200 bg-white"
        } ${busy ? "opacity-70" : ""}`}
      >
        {busy ? (
          <ActivityIndicator
            size="small"
            color={enabled ? "#000" : colors.brand}
          />
        ) : (
          <Ionicons
            name={enabled ? "notifications" : "notifications-outline"}
            size={18}
            color={enabled ? "#000" : colors.brand}
          />
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        enabled ? "Turn off league notifications" : "Turn on league notifications"
      }
      accessibilityState={{ busy, checked: enabled }}
      disabled={busy}
      onPress={handlePress}
      className={`min-h-10 flex-row items-center gap-2 rounded-full border px-3 ${
        enabled
          ? "border-accent-300 bg-accent-500"
          : "border-white/15 bg-white/10"
      } ${busy ? "opacity-70" : ""}`}
    >
      {busy ? (
        <ActivityIndicator size="small" color={enabled ? "#000" : colors.accent} />
      ) : (
        <Ionicons
          name={enabled ? "notifications" : "notifications-outline"}
          size={18}
          color={enabled ? "#000" : colors.accent}
        />
      )}
      <Text
        className={enabled ? "text-xs text-neutral-950" : "text-xs text-white"}
      >
        {enabled ? "Alerts on" : "Alerts"}
      </Text>
    </Pressable>
  );
}
