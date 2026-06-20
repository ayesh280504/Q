import { listSocialLinks, type DjSocialLinks } from "@q/shared";

export default function DjSocialBar({ links }: { links?: DjSocialLinks }) {
  const items = listSocialLinks(links);
  if (items.length === 0) return null;

  return (
    <div className="dj-social-bar">
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="dj-social-pill"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}
