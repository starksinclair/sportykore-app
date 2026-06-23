import * as ImagePicker from "expo-image-picker";

import type { PickedImageFile } from "@/lib/picked-image";

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
  return "image/jpeg";
}

function fileNameFromUri(uri: string, mime: string): string {
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const segment = uri.split("/").pop()?.split("?")[0];
  if (segment && /\.(jpe?g|png|webp)$/i.test(segment)) return segment;
  return `avatar.${ext}`;
}

/** Opens the photo library for a square profile crop. Returns null if cancelled. */
export async function pickProfileImage(): Promise<PickedImageFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library access is required to add a profile picture.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  const mime = asset.mimeType ?? mimeFromUri(asset.uri);
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error("Use a JPG, PNG, or WebP image (max 2 MB).");
  }

  return {
    uri: asset.uri,
    name: fileNameFromUri(asset.uri, mime),
    type: mime,
  };
}
