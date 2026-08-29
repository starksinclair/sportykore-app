import PostHog from "posthog-react-native";

const projectToken = process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim();
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim();

if (!projectToken && __DEV__) {
  console.error(
    "EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
  );
}

export const posthog = projectToken
  ? new PostHog(projectToken, {
      host,
      captureAppLifecycleEvents: true,
    })
  : null;
