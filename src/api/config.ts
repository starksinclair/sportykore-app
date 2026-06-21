/**
 * Prefer `EXPO_PUBLIC_API_URL` (e.g. http://YOUR_LAN_IP:3333 from a physical device).
 * Android emulator reaches host machine via `adb reverse tcp:3333 tcp:3333` if using 127.0.0.1.
 */
export const API_BASE_URL =
  typeof process.env.EXPO_PUBLIC_API_URL === "string" &&
  process.env.EXPO_PUBLIC_API_URL.length > 0
    ? process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "")
    : "http://10.0.0.180:3333";
