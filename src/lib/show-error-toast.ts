import Toast from "react-native-toast-message";

import { ApiError, isApiError, messageFromBackendBody } from "@/api/errors";

const DEFAULT_GENERIC = "Something went wrong. Please try again.";

export type ToastSeverity = "error" | "info";

export function showErrorToast(title: string, message?: string) {
  Toast.show({
    type: "error",
    text1: title,
    ...(message ? { text2: message } : {}),
    visibilityTime: 4500,
  });
}

export function showInfoToast(title: string, message?: string) {
  Toast.show({
    type: "info",
    text1: title,
    ...(message ? { text2: message } : {}),
    visibilityTime: 3800,
  });
}

export function showSuccessToast(title: string, message?: string) {
  Toast.show({
    type: "success",
    text1: title,
    ...(message ? { text2: message } : {}),
    visibilityTime: 3800,
  });
}

/** Maps thrown values (especially `ApiError`) to a readable toast */
export function showThrownAsToast(error: unknown, fallbackTitle?: string): void {
  if (typeof error === "string" && error.trim()) {
    showErrorToast(fallbackTitle ?? "Error", error);
    return;
  }

  if (isApiError(error)) {
    let detail = messageFromBackendBody(error.body);
    if (!detail && error.message) detail = error.message;
    showErrorToast(
      fallbackTitle ?? titleFromStatus(error.status, error.kind),
      detail ?? defaultDetailFor(error),
    );
    return;
  }

  if (error instanceof Error && error.message.trim()) {
    showErrorToast(fallbackTitle ?? "Error", error.message);
    return;
  }

  showErrorToast(fallbackTitle ?? "Error", DEFAULT_GENERIC);
}

function titleFromStatus(status: number, kind: ApiError["kind"]): string {
  if (kind === "network") return "Offline";
  if (kind === "parse") return "Invalid response";
  if (kind === "abort") return "Request cancelled";
  if (status === 409) return "Already exists";
  if (status === 401 || status === 403) return "Not allowed";
  if (status === 404) return "Not found";
  if (status >= 500) return "Server error";
  return "Could not complete request";
}

function defaultDetailFor(error: ApiError): string | undefined {
  if (error.kind === "network")
    return "Check your connection and that the API is running.";
  if (error.kind === "parse") return "The server sent data we couldn't read.";
  if (error.status === 429) return "Too many attempts. Wait a moment and try again.";
  return DEFAULT_GENERIC;
}
