/** Calendar date for API query params (local Y-M-D, not a UTC instant). */
export function toCalendarDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** User's IANA timezone for match-day filtering. */
export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/** Display a UTC instant from the API in the user's locale (date + time). */
export function formatPlayedAt(playedAtIso: string): string {
  return new Date(playedAtIso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Time-only display for match rows. */
export function formatPlayedAtTime(playedAtIso: string): string {
  return new Date(playedAtIso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Short date label for match lists (e.g. "Fri, 23 May"). */
export function formatPlayedAtDate(playedAtIso: string): string {
  return new Date(playedAtIso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Compact date for narrow match rows (e.g. "23 May"). */
export function formatPlayedAtShortDate(playedAtIso: string): string {
  return new Date(playedAtIso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
  });
}
