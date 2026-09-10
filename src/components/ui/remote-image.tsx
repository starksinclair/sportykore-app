import { Image, type ImageProps } from "expo-image";

export type RemoteImageProps = Omit<ImageProps, "source"> & {
  uri: string;
};

export function RemoteImage({
  uri,
  cachePolicy = "memory-disk",
  contentFit = "cover",
  placeholderContentFit = "cover",
  transition = 150,
  allowDownscaling = true,
  ...props
}: RemoteImageProps) {
  return (
    <Image
      source={{ uri }}
      cachePolicy={cachePolicy}
      contentFit={contentFit}
      placeholderContentFit={placeholderContentFit}
      transition={transition}
      allowDownscaling={allowDownscaling}
      {...props}
    />
  );
}
