import type { DjSocialLinks } from "@q/shared";
import { parseSocialLinks, serializeSocialLinks } from "./social.js";

/** Merge incoming social links onto existing — empty strings remove that key. */
export function mergeSocialLinksPayload(
  existingRaw: string | null | undefined,
  incoming?: DjSocialLinks,
): string | null {
  if (incoming === undefined) {
    return existingRaw?.trim() ? existingRaw : null;
  }
  const merged: DjSocialLinks = { ...(parseSocialLinks(existingRaw) ?? {}) };
  for (const [k, v] of Object.entries(incoming)) {
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (trimmed) {
      (merged as Record<string, string>)[k] = trimmed;
    } else {
      delete (merged as Record<string, string>)[k];
    }
  }
  return serializeSocialLinks(merged);
}

export function coalesceTipUrl(
  existing: string | null | undefined,
  incoming: string | undefined,
): string | null {
  if (incoming === undefined) return existing?.trim() ? existing.trim() : null;
  const trimmed = incoming.trim().slice(0, 512);
  return trimmed || null;
}
