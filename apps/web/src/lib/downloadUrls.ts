/** Hosted installer URLs — set on Vercel after GitHub Release (or CDN) upload. */
export function getInstallerUrls() {
  return {
    windows: import.meta.env.VITE_Q_INSTALLER_WINDOWS?.trim() || "",
    mac: import.meta.env.VITE_Q_INSTALLER_MAC?.trim() || "",
  };
}
