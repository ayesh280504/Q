function crowdPort(storedUrl: string): string {
  try {
    const u = new URL(storedUrl);
    return u.port || (u.protocol === "https:" ? "443" : "80");
  } catch {
    return "5173";
  }
}

/** Replace localhost in crowd URLs so QR scans work on phones (same Wi‑Fi). */
export function crowdUrlForPhone(
  storedUrl: string,
  sessionCode: string,
  lanIpv4?: string | null,
): string {
  const envLan = import.meta.env.VITE_Q_CROWD_LAN_URL?.replace(/\/$/, "");
  if (envLan) return `${envLan}/r/${sessionCode}`;

  if (lanIpv4) {
    const port = crowdPort(storedUrl);
    return `http://${lanIpv4}:${port}/r/${sessionCode}`;
  }

  try {
    const u = new URL(storedUrl);
    if (u.hostname !== "localhost" && u.hostname !== "127.0.0.1") return storedUrl;
  } catch {
    return storedUrl;
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
