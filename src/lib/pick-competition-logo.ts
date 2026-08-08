import * as ImagePicker from "expo-image-picker";

import type { PickedImageFile } from "@/lib/picked-image";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

function mimeFromUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "image/jpeg";
}

function fileNameFromUri(uri: string, mime: string): string {
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const segment = uri.split("/").pop()?.split("?")[0];
  if (segment && /\.(jpe?g|png|webp)$/i.test(segment)) return segment;
  return `logo.${ext}`;
}

/** Opens the photo library for a square competition logo. JPG, PNG, or WebP, max 5 MB. */
export async function pickCompetitionLogo(): Promise<PickedImageFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library access is required to add a competition logo.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  const mime = asset.mimeType ?? mimeFromUri(asset.uri);
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error("Use a JPG, PNG, or WebP image (max 5 MB).");
  }

  if (asset.fileSize != null && asset.fileSize > MAX_BYTES) {
    throw new Error("Logo must be 5 MB or smaller.");
  }

  return {
    uri: asset.uri,
    name: fileNameFromUri(asset.uri, mime),
    type: mime,
  };
}
