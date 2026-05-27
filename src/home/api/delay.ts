/** Mimic a network round-trip so React Query loading states are visible. */
export function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Random delay within a range so refetches feel a little more lifelike. */
export function jitter(min = 120, max = 320): Promise<void> {
  const span = Math.max(0, max - min);
  return delay(min + Math.floor(Math.random() * span));
}
