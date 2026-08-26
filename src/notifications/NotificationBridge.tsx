import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/auth";
import { queryClient } from "@/lib/query-client";
import { transmit } from "@/lib/transmit";
import {
  applyNotificationTransmitPayload,
  notificationKeys,
  type NotificationTransmitPayload,
} from "./hooks";
import { ensureAndroidChannel } from "./push-client";

export function NotificationBridge() {
  const { user } = useAuth();

  useEffect(() => {
    void ensureAndroidChannel();

    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        const route = response.notification.request.content.data?.route;
        if (typeof route === "string" && route.startsWith("/")) {
          router.push(route as never);
        }
      },
    );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return undefined;

    const subscription = transmit.subscription(`users/${userId}/notifications`);
    const removeHandler = subscription.onMessage((message) => {
      const payload = parseNotificationTransmitMessage(message);
      if (!payload) return;
      applyNotificationTransmitPayload(payload);
    });

    let closed = false;
    void subscription.create().catch(() => {
      if (!closed) removeHandler();
    });

    return () => {
      closed = true;
      removeHandler();
      void subscription.delete().catch(() => undefined);
    };
  }, [user?.id]);

  return null;
}

function parseNotificationTransmitMessage(
  message: unknown,
): NotificationTransmitPayload | null {
  if (!message || typeof message !== "object") return null;
  const maybePayload = message as Partial<NotificationTransmitPayload>;
  if (
    maybePayload.type !== "notification_created" &&
    maybePayload.type !== "notification_read" &&
    maybePayload.type !== "notifications_read_all"
  ) {
    return null;
  }

  return {
    type: maybePayload.type,
    notificationId:
      typeof maybePayload.notificationId === "number"
        ? maybePayload.notificationId
        : undefined,
    unreadCount:
      typeof maybePayload.unreadCount === "number"
        ? maybePayload.unreadCount
        : undefined,
  };
}
