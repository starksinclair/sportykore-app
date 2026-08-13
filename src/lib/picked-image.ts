export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_UPLOAD_LABEL = "10 MB";

export type PickedImageFile = {
  uri: string;
  name: string;
  type: string;
};
