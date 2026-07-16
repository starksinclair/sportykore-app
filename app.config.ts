import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Extends app.json with Google Maps keys from env.
 * Rebuild the native dev client after changing maps config or installing react-native-maps.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

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
  };
};
