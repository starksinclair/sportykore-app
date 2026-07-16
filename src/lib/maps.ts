import { Linking, Platform } from "react-native";

export function directionsUrls(
  latitude: number,
  longitude: number,
): { geo: string; maps: string } {
  const geo = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
  const maps =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?daddr=${latitude},${longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  return { geo, maps };
}

/** Opens the platform maps app with turn-by-turn directions to the point. */
export async function openDirections(
  latitude: number,
  longitude: number,
): Promise<void> {
  const { geo, maps } = directionsUrls(latitude, longitude);
  if (Platform.OS === "android") {
    const canGeo = await Linking.canOpenURL(geo);
    if (canGeo) {
      await Linking.openURL(geo);
      return;
    }
  }
  await Linking.openURL(maps);
}
