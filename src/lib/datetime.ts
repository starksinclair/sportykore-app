/** Calendar date for API query params (local Y-M-D, not a UTC instant). */
export function toCalendarDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Normalize API date values to `YYYY-MM-DD`.
 * Accepts bare calendar dates or ISO datetimes (`2026-01-01T00:00:00.000Z`).
 */
export function toCalendarDateString(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  return match?.[1] ?? "";
}

/**
 * Parse a calendar day from `YYYY-MM-DD` or an ISO datetime.
 * Uses the date portion only (local midnight) so UTC midnight ISO strings
 * do not shift the day in western timezones.
 */
export function parseCalendarDate(value: string): Date | null {
  const day = toCalendarDateString(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const dayNum = Number(match[3]);
  const date = new Date(year, month - 1, dayNum);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== dayNum
  ) {
    return null;
  }
  return date;
}

/**
 * Progress through a league duration as 0…1, or null if dates are invalid /
 * end is before start. Uses local calendar days only.
 */
export function leagueDurationProgress(
  startDate: string,
  endDate: string,
  today: Date = new Date(),
): number | null {
  const start = parseCalendarDate(startDate);
  const end = parseCalendarDate(endDate);
  if (!start || !end) return null;
  const startMs = start.getTime();
  const endMs = end.getTime();
  if (endMs < startMs) return null;

  const todayLocal = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();

  if (todayLocal <= startMs) return 0;
  if (todayLocal >= endMs) return 1;
  if (endMs === startMs) return 1;
  return (todayLocal - startMs) / (endMs - startMs);
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
