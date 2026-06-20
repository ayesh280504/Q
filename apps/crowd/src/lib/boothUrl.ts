/** Full crowd request URL for the current page (share / friend QR). */
export function crowdBoothUrl(code: string): string {
  const path = `/r/${encodeURIComponent(code.trim().toUpperCase())}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return path;
}
