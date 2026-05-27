const SHORT_DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function dayOffset(from: Date, to: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay,
  );
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getDateMeta(baseDate: Date, offset: number) {
  const date = addDays(baseDate, offset);
  const shortDate = SHORT_DATE_FORMAT.format(date);

  if (offset === -1) return { date, displayLabel: "Yesterday", shortDate };
  if (offset === 0) return { date, displayLabel: "Today", shortDate };
  if (offset === 1) return { date, displayLabel: "Tomorrow", shortDate };
  return { date, displayLabel: shortDate, shortDate };
}

export function buildCalendarCells(month: Date) {
  const firstDay = startOfMonth(month);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(
    firstDay.getFullYear(),
    firstDay.getMonth() + 1,
    0,
  ).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(firstDay.getFullYear(), firstDay.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Calendar-only date helpers used by the mock API and the home screen controls. */

export function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Format a Date as a calendar-only ISO date string (`YYYY-MM-DD`) in local time. */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse an ISO calendar date back into a local-midnight Date. */
export function fromIsoDate(iso: string): Date {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Whole calendar days between two dates, ignoring time-of-day. */
export function diffDays(from: Date, to: Date): number {
    const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
    return Math.round(ms / (24 * 60 * 60 * 1000));
}

export function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return startOfDay(next);
}
