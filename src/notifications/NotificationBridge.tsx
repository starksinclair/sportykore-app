import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

import { ensureAndroidChannel } from "./push-client";

export function NotificationBridge() {
  useEffect(() => {
    void ensureAndroidChannel();

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const route = response.notification.request.content.data?.route;
        if (typeof route === "string" && route.startsWith("/")) {
          router.push(route as never);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
