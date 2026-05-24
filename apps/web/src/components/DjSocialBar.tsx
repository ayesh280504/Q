import type { DjSocialLinks } from "@q/shared";

const PLATFORMS: Array<{
  key: keyof DjSocialLinks;
  label: string;
  toUrl: (v: string) => string;
}> = [
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

export default function DjSocialBar({ links }: { links?: DjSocialLinks }) {
  if (!links) return null;
  const items = PLATFORMS.filter((p) => links[p.key]?.trim());
  if (items.length === 0) return null;

  return (
    <div className="dj-social-bar">
      {items.map((p) => {
        const raw = links[p.key]!.trim();
        return (
          <a
            key={String(p.key)}
            href={p.toUrl(raw)}
            target="_blank"
            rel="noopener noreferrer"
            className="dj-social-pill"
          >
            {p.label}
          </a>
        );
      })}
    </div>
  );
}
