import type { DjSocialLinks } from "./index.js";

export type SocialPlatformKey = keyof DjSocialLinks;

export type SocialPlatformDef = {
  key: SocialPlatformKey;
  label: string;
  toUrl: (raw: string) => string;
};

/** Normalize @handle or partial URL → full link for each platform. */
export const SOCIAL_PLATFORMS: SocialPlatformDef[] = [
  {
    key: "instagram",
    label: "Instagram",
    toUrl: (v) =>
      v.startsWith("http") ? v : `https://instagram.com/${v.replace(/^@/, "")}`,
  },
  {
    key: "twitter",
    label: "X",
    toUrl: (v) => (v.startsWith("http") ? v : `https://x.com/${v.replace(/^@/, "")}`),
  },
  {
    key: "soundcloud",
    label: "SoundCloud",
    toUrl: (v) =>
      v.startsWith("http") ? v : `https://soundcloud.com/${v.replace(/^@/, "")}`,
  },
  {
    key: "spotify",
    label: "Spotify",
    toUrl: (v) => {
      if (v.startsWith("http")) return v;
      const slug = v.replace(/^@/, "");
      if (slug.includes("spotify.com")) return `https://${slug.replace(/^https?:\/\//, "")}`;
      return `https://open.spotify.com/user/${slug}`;
    },
  },
  {
    key: "tiktok",
    label: "TikTok",
    toUrl: (v) => (v.startsWith("http") ? v : `https://tiktok.com/@${v.replace(/^@/, "")}`),
  },
  {
    key: "website",
    label: "Website",
    toUrl: (v) => (v.startsWith("http") ? v : `https://${v}`),
  },
];

export function listSocialLinks(links?: DjSocialLinks): Array<{
  key: SocialPlatformKey;
  label: string;
  href: string;
  raw: string;
}> {
  if (!links) return [];
  return SOCIAL_PLATFORMS.flatMap((p) => {
    const raw = links[p.key]?.trim();
    if (!raw) return [];
    return [{ key: p.key, label: p.label, href: p.toUrl(raw), raw }];
  });
}
