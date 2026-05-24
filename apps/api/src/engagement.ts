import { db } from "./db.js";

export function ensureEngagementTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS mix_likes (
      user_id TEXT NOT NULL,
      mix_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, mix_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (mix_id) REFERENCES mixes(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS saved_mixes (
      user_id TEXT NOT NULL,
      mix_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, mix_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (mix_id) REFERENCES mixes(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS mix_comments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mix_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (mix_id) REFERENCES mixes(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_comments_mix ON mix_comments(mix_id, created_at);
    CREATE TABLE IF NOT EXISTS follows (
      follower_id TEXT NOT NULL,
      following_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

export function mixEngagementStats(mixId: string, viewerId?: string) {
  const likeCount = (
    db.prepare(`SELECT COUNT(*) AS n FROM mix_likes WHERE mix_id = ?`).get(mixId) as {
      n: number;
    }
  ).n;
  const commentCount = (
    db.prepare(`SELECT COUNT(*) AS n FROM mix_comments WHERE mix_id = ?`).get(mixId) as {
      n: number;
    }
  ).n;
  let likedByMe = false;
  let savedByMe = false;
  if (viewerId) {
    likedByMe = Boolean(
      db
        .prepare(`SELECT 1 FROM mix_likes WHERE mix_id = ? AND user_id = ?`)
        .get(mixId, viewerId),
    );
    savedByMe = Boolean(
      db
        .prepare(`SELECT 1 FROM saved_mixes WHERE mix_id = ? AND user_id = ?`)
        .get(mixId, viewerId),
    );
  }
  return { likeCount, commentCount, likedByMe, savedByMe };
}
