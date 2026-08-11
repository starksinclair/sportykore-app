import type { ConfigContext, ExpoConfig } from "expo/config";

type ExpoPlugin = NonNullable<ExpoConfig["plugins"]>[number];

function pluginName(plugin: ExpoPlugin): string {
  return Array.isArray(plugin) ? String(plugin[0]) : String(plugin);
}

function hasPlugin(plugins: ExpoPlugin[], names: string[]): boolean {
  return plugins.some((plugin) => names.includes(pluginName(plugin)));
}

/**
 * Extends app.json with Google Maps keys from env.
 * Rebuild the native dev client after changing maps config or installing react-native-maps.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const sentryOrg = process.env.SENTRY_ORG?.trim();
  const sentryProject = process.env.SENTRY_PROJECT?.trim();
  const plugins = [...(config.plugins ?? [])];

  if (!hasPlugin(plugins, ["expo-notifications"])) {
    plugins.push([
      "expo-notifications",
      {
        color: "#E6A817",
        defaultChannel: "league-alerts",
      },
    ]);
  }

  if (!hasPlugin(plugins, ["@sentry/react-native", "@sentry/react-native/expo"])) {
    plugins.push([
      "@sentry/react-native",
      {
        url: "https://sentry.io/",
        ...(sentryOrg ? { organization: sentryOrg } : {}),
        ...(sentryProject ? { project: sentryProject } : {}),
      },
    ]);
  }

  return {
    ...config,
    name: config.name ?? "SportyKore",
    slug: config.slug ?? "SportyKore",
    ios: {
      ...config.ios,
      config: {
        ...config.ios?.config,
        googleMapsApiKey,
      },
    },
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    plugins,
  };
};
