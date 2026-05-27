/**
 * Network calls from the booth must never hang waiting on bad Wi‑Fi.
 * A hard timeout aborts the fetch so the UI thread and Serato stay smooth.
 */

export class FetchTimeoutError extends Error {
  constructor(ms: number) {
    super(`Request timed out after ${ms}ms`);
    this.name = "FetchTimeoutError";
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const timeoutMs = init?.timeoutMs ?? 8_000;
  const { timeoutMs: _omit, ...rest } = init ?? {};
  void _omit;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new FetchTimeoutError(timeoutMs);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
