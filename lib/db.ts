import { createClient, type Client } from "@libsql/client";

let _db: Client | null = null;

export function getDB(): Client {
  if (!_db) {
    _db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _db;
}

export async function initDB() {
  const db = getDB();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      quadrant TEXT NOT NULL DEFAULT 'urgent-important',
      deadline TEXT,
      context TEXT,
      calendar_event_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
