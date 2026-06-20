/** Default production hosts — override with VITE_* / Q_* env vars per deploy. */
export const Q_PROD_URLS = {
  api: "https://q-api-hp4b.onrender.com",
  web: "https://q-web-liart.vercel.app",
  crowd: "https://q-crowd.vercel.app",
} as const;

export function isPrivateLanHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /^192\.168\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
  );
}

export function isLocalDevUrl(url: string): boolean {
  return url.includes("localhost") || url.includes("127.0.0.1");
}
