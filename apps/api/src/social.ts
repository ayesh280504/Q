import type { DjSocialLinks } from "@q/shared";

export function parseSocialLinks(raw: string | null | undefined): DjSocialLinks | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const o = JSON.parse(raw) as DjSocialLinks;
    const cleaned: DjSocialLinks = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "string" && v.trim()) {
        (cleaned as Record<string, string>)[k] = v.trim();
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  } catch {
    return undefined;
  }
}

export function serializeSocialLinks(links?: DjSocialLinks): string | null {
  if (!links) return null;
  const cleaned: DjSocialLinks = {};
  for (const [k, v] of Object.entries(links)) {
    if (typeof v === "string" && v.trim()) {
      (cleaned as Record<string, string>)[k] = v.trim();
    }
  }
  return Object.keys(cleaned).length > 0 ? JSON.stringify(cleaned) : null;
}
