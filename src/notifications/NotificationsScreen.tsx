import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/auth";
import { useTheme } from "@/color/use-theme";
import { DetailScreenShell } from "@/components/ui/detail-screen-shell";
import { ErrorState } from "@/components/ui/error-state";
import { colors } from "@/constants";
import { messageFromThrown } from "@/lib/show-error-toast";
import type { AppNotification } from "./api";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "./hooks";

export function NotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  const notificationsQuery = useNotifications(Boolean(user));
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();
  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  const handleNotificationPress = async (notification: AppNotification) => {
    if (!notification.readAt) {
      await markRead.mutateAsync(notification.id);
    }
  };

  if (!user) {
    return (
      <DetailScreenShell title="Notifications" tabletMaxWidth={760}>
        <View
          className="items-center gap-4 rounded-[22px] border px-5 py-8"
          style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
        >
          <View
            className="h-14 w-14 items-center justify-center rounded-[20px]"
            style={{ backgroundColor: theme.accentMuted }}
          >
            <Ionicons name="notifications-outline" size={26} color={theme.accent} />
          </View>
          <View className="gap-2">
            <Text className="text-center text-lg" style={{ color: theme.text }}>
              Sign in to see notifications
            </Text>
            <Text className="text-center text-sm leading-6" style={{ color: theme.textMuted }}>
              League owner alerts and other updates will appear here after you sign in.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/login")}
            accessibilityRole="button"
            className="h-12 flex-row items-center justify-center gap-2 rounded-full px-5"
            style={{ backgroundColor: theme.accent }}
          >
            <Ionicons name="log-in-outline" size={18} color={colors.darkLabel} />
            <Text className="text-sm" style={{ color: colors.darkLabel }}>
              Sign in
            </Text>
          </Pressable>
        </View>
      </DetailScreenShell>
    );
  }

  return (
    <DetailScreenShell
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
      tabletMaxWidth={760}
      rightAccessory={
        unreadCount > 0 ? (
          <Pressable
            onPress={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
            className="h-11 items-center justify-center rounded-full px-3 active:opacity-80"
            style={{ backgroundColor: theme.accent }}
          >
            <Text className="text-xs" style={{ color: colors.darkLabel }}>
              Read all
            </Text>
          </Pressable>
        ) : null
      }
    >
      {notificationsQuery.isLoading ? (
        <View className="items-center py-12">
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : notificationsQuery.isError ? (
        <ErrorState
          message={messageFromThrown(notificationsQuery.error)}
          onRetry={() => notificationsQuery.refetch()}
        />
      ) : notifications.length === 0 ? (
        <EmptyNotifications />
      ) : (
        <View className="gap-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              busy={markRead.isPending}
              onPress={() => void handleNotificationPress(notification)}
            />
          ))}
        </View>
      )}
    </DetailScreenShell>
  );
}

function EmptyNotifications() {
  const theme = useTheme();

  return (
    <View
      className="items-center gap-4 rounded-[22px] border px-5 py-10"
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
    >
      <View
        className="h-16 w-16 items-center justify-center rounded-[22px]"
        style={{ backgroundColor: theme.accentMuted }}
      >
        <Ionicons name="notifications-outline" size={30} color={theme.accent} />
      </View>
      <View className="gap-2">
        <Text className="text-center text-lg" style={{ color: theme.text }}>
          No notifications yet
        </Text>
        <Text className="text-center text-sm leading-6" style={{ color: theme.textMuted }}>
          When a player joins a league you manage, the update will appear here.
        </Text>
      </View>
    </View>
  );
}

function NotificationCard({
  notification,
  busy,
  onPress,
}: {
  notification: AppNotification;
  busy: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const unread = !notification.readAt;

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={notification.title}
      className="rounded-[18px] border px-4 py-4 active:opacity-80"
      style={{
        backgroundColor: unread ? theme.accentMuted : theme.card,
        borderColor: unread ? theme.accent : theme.cardBorder,
      }}
    >
      <View className="flex-row gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: unread ? theme.accent : theme.cardMuted }}
        >
          <Ionicons
            name="person-add-outline"
            size={20}
            color={unread ? colors.darkLabel : theme.accent}
          />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-start gap-2">
            <Text
              className="flex-1 text-base"
              style={{ color: theme.text }}
              numberOfLines={2}
            >
              {notification.title}
            </Text>
            {unread ? (
              <View className="mt-2 h-2 w-2 rounded-full" style={{ backgroundColor: theme.accent }} />
            ) : null}
          </View>
          <Text className="text-sm leading-5" style={{ color: theme.textMuted }}>
            {notification.body}
          </Text>
          <View className="flex-row items-center gap-1 pt-1">
            <Text className="text-xs" style={{ color: theme.textSubtle }}>
              {formatNotificationTime(notification.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function formatNotificationTime(value: string | null): string {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
