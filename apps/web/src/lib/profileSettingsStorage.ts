import type { DjSocialLinks } from "@q/shared";

export type ProfileSettingsDraft = {
  bio: string;
  social: DjSocialLinks;
  tipUrl: string;
  savedAt: string;
};

const key = (userId: string) => `q-profile-settings:${userId}`;

export function hasSocialLinks(links?: DjSocialLinks | null): boolean {
  if (!links) return false;
  return Object.values(links).some((v) => typeof v === "string" && v.trim().length > 0);
}

export function saveProfileSettingsDraft(userId: string, draft: ProfileSettingsDraft): void {
  try {
    localStorage.setItem(key(userId), JSON.stringify(draft));
  } catch {
    /* quota / private mode */
  }
}

export function loadProfileSettingsDraft(userId: string): ProfileSettingsDraft | null {
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return null;
    return JSON.parse(raw) as ProfileSettingsDraft;
  } catch {
    return null;
  }
}

/** Server row empty but we have a local draft from a prior save in this browser. */
export function shouldRestoreDraftFromLocal(
  profile: { bio?: string; socialLinks?: DjSocialLinks; tipUrl?: string },
  draft: ProfileSettingsDraft,
): boolean {
  const serverHasSocial = hasSocialLinks(profile.socialLinks);
  const serverHasTip = Boolean(profile.tipUrl?.trim());
  const draftHasSocial = hasSocialLinks(draft.social);
  const draftHasTip = Boolean(draft.tipUrl?.trim());
  if (!draftHasSocial && !draftHasTip && !draft.bio.trim()) return false;
  if (draftHasSocial && !serverHasSocial) return true;
  if (draftHasTip && !serverHasTip) return true;
  return false;
}
