type UnauthorizedHandler = () => void | Promise<void>;

/**
 * Wired from `AuthProvider` so shared `fetch` avoids importing React context directly.
 */
let handler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(next: UnauthorizedHandler | null): void {
  handler = next;
}

export async function notifyUnauthorized(): Promise<void> {
  await handler?.();
}
