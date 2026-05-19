import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dataDir = process.env.Q_DATA_DIR || path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "q.db");
export const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    dj_token TEXT NOT NULL,
    created_at TEXT NOT NULL,
    library_synced_at TEXT
  );

  CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    bpm REAL,
    key TEXT,
    duration_sec INTEGER,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tracks_session ON tracks(session_id);
  CREATE INDEX IF NOT EXISTS idx_tracks_search ON tracks(session_id, title, artist);

  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    message TEXT,
    in_stock INTEGER NOT NULL DEFAULT 0,
    matched_track_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_requests_session ON requests(session_id, created_at);
`);

function ensureColumn(table: string, column: string, ddl: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(ddl);
  }
}

ensureColumn("sessions", "display_name", `ALTER TABLE sessions ADD COLUMN display_name TEXT`);
ensureColumn(
  "sessions",
  "max_pending_requests",
  `ALTER TABLE sessions ADD COLUMN max_pending_requests INTEGER NOT NULL DEFAULT 20`,
);
ensureColumn(
  "sessions",
  "max_requests_per_guest",
  `ALTER TABLE sessions ADD COLUMN max_requests_per_guest INTEGER NOT NULL DEFAULT 3`,
);
ensureColumn("requests", "guest_id", `ALTER TABLE requests ADD COLUMN guest_id TEXT`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_requests_guest ON requests(session_id, guest_id);
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS played_tracks (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    played_at INTEGER,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_played_session ON played_tracks(session_id);
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    handle TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    verified INTEGER NOT NULL DEFAULT 0,
    account_token TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle);

  CREATE TABLE IF NOT EXISTS mixes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    external_url TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 0,
    play_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_mixes_user ON mixes(user_id);
  CREATE INDEX IF NOT EXISTS idx_mixes_public ON mixes(is_public, created_at);
`);

ensureColumn("sessions", "dj_user_id", `ALTER TABLE sessions ADD COLUMN dj_user_id TEXT`);
ensureColumn("users", "supabase_id", `ALTER TABLE users ADD COLUMN supabase_id TEXT`);
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_supabase ON users(supabase_id) WHERE supabase_id IS NOT NULL`);
