import type { LibrarySource } from "@q/shared";

export const LIBRARY_PROFILES: Array<{
  id: LibrarySource;
  title: string;
  summary: string;
}> = [
  {
    id: "local",
    title: "Local files",
    summary: "USB / hard drive — crowd searches your synced library.",
  },
  {
    id: "spotify",
    title: "Spotify only",
    summary: "Streaming catalogue — no local import on laptop.",
  },
  {
    id: "both",
    title: "Local + Spotify",
    summary: "Sync library plus Spotify search for guests.",
  },
];
