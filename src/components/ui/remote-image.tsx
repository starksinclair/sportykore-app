import { Image, type ImageProps } from "expo-image";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

import { useImagePreview } from "./image-preview";

export type RemoteImageProps = Omit<ImageProps, "source"> & {
  uri: string;
  previewEnabled?: boolean;
  previewLabel?: string;
};

export function RemoteImage({
  uri,
  previewEnabled = false,
  previewLabel,
  cachePolicy = "memory-disk",
  contentFit = "cover",
  placeholderContentFit = "cover",
  transition = 150,
  allowDownscaling = true,
  style,
  className,
  accessibilityLabel,
  ...props
}: RemoteImageProps) {
  const { openImagePreview } = useImagePreview();
  const image = (
    <Image
      source={{ uri }}
      cachePolicy={cachePolicy}
      contentFit={contentFit}
      placeholderContentFit={placeholderContentFit}
      transition={transition}
      allowDownscaling={allowDownscaling}
      style={previewEnabled ? { width: "100%", height: "100%" } : style}
      className={previewEnabled ? undefined : className}
      accessibilityLabel={accessibilityLabel}
      {...props}
    />
  );

  if (!previewEnabled) {
    return image;
  }

  return (
    <Pressable
      onPress={() => openImagePreview(uri, previewLabel ?? accessibilityLabel)}
      accessibilityRole="imagebutton"
      accessibilityLabel={accessibilityLabel ?? previewLabel ?? "Open image preview"}
      className={["overflow-hidden active:opacity-85", className].filter(Boolean).join(" ")}
      style={style as StyleProp<ViewStyle>}
    >
      {image}
    </Pressable>
  );
}
