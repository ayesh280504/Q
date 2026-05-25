function crowdPort(storedUrl: string): string {
  try {
    const u = new URL(storedUrl);
    return u.port || (u.protocol === "https:" ? "443" : "80");
  } catch {
    return "5173";
  }
}

/**
 * Returns the URL to encode in the booth QR.
 *
 * - If the stored URL points at a public hostname (anything that's not
 *   localhost / 127.0.0.1), use it as-is. Production crowd URLs like
 *   https://q-crowd.vercel.app already work from anyone's phone, including
 *   over cellular data, so we MUST NOT rewrite the hostname.
 * - If the stored URL is localhost (dev mode), prefer the explicit
 *   VITE_Q_CROWD_LAN_URL env var; otherwise auto-substitute the detected
 *   LAN IP so phones on the same Wi-Fi can scan the QR.
 */
export function crowdUrlForPhone(
  storedUrl: string,
  sessionCode: string,
  lanIpv4?: string | null,
): string {
  let isLocalhost = false;
  try {
    const u = new URL(storedUrl);
    isLocalhost = u.hostname === "localhost" || u.hostname === "127.0.0.1";
  } catch {
    return storedUrl;
  }

  if (!isLocalhost) return storedUrl;

  const envLan = import.meta.env.VITE_Q_CROWD_LAN_URL?.replace(/\/$/, "");
  if (envLan) return `${envLan}/r/${sessionCode}`;

  if (lanIpv4) {
    const port = crowdPort(storedUrl);
    return `http://${lanIpv4}:${port}/r/${sessionCode}`;
  }

  return storedUrl;
}

export function phoneCrowdUrlIsLocalhost(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return h === "localhost" || h === "127.0.0.1";
  } catch {
    return true;
  }
}

export function crowdUrlNeedsLanHint(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return h === "localhost" || h === "127.0.0.1";
  } catch {
    return false;
  }
}
