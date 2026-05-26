import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database, { type Database as SqliteDatabase } from 'better-sqlite3';
import { DB_PATH } from './env.js';

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db: SqliteDatabase = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function ensureSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS user_data (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      scenarios_json TEXT NOT NULL DEFAULT '{}',
      snapshots_json TEXT NOT NULL DEFAULT '{}',
      updated_at INTEGER NOT NULL
    );
  `);
}

// Runs at module load so prepared statements compiled in other modules can
// reference the schema safely.
ensureSchema();
