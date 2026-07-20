import * as ImagePicker from "expo-image-picker";

import type { PickedImageFile } from "@/lib/picked-image";

const MAX_BYTES = 5 * 1024 * 1024;

function mimeFromUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "image/jpeg";
}

function fileNameFromUri(uri: string): string {
  const segment = uri.split("/").pop()?.split("?")[0];
  if (segment && /\.png$/i.test(segment)) return segment;
  return "logo.png";
}

/** Opens the photo library for a square competition logo. PNG only, max 5 MB. */
export async function pickCompetitionLogo(): Promise<PickedImageFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library access is required to add a competition logo.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  const mime = asset.mimeType ?? mimeFromUri(asset.uri);
  if (mime !== "image/png") {
    throw new Error("Use a PNG image only (max 5 MB).");
  }

  if (asset.fileSize != null && asset.fileSize > MAX_BYTES) {
    throw new Error("Logo must be 5 MB or smaller.");
  }

  return {
    uri: asset.uri,
    name: fileNameFromUri(asset.uri),
    type: "image/png",
  };
}
