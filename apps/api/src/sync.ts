import { Hono } from 'hono';
import { requireUser } from './auth.js';
import { db } from './db.js';

interface UserDataRow {
  user_id: string;
  scenarios_json: string;
  snapshots_json: string;
  updated_at: number;
}

const stmts = {
  get: db.prepare<[string], UserDataRow>('SELECT * FROM user_data WHERE user_id = ?'),
  upsert: db.prepare(
    `INSERT INTO user_data (user_id, scenarios_json, snapshots_json, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       scenarios_json = excluded.scenarios_json,
       snapshots_json = excluded.snapshots_json,
       updated_at = excluded.updated_at`,
  ),
};

export const syncRoutes = new Hono();

syncRoutes.get('/', (c) => {
  const user = requireUser(c);
  const row = stmts.get.get(user.userId);
  return c.json({
    scenarios: row ? (JSON.parse(row.scenarios_json) as Record<string, unknown>) : {},
    snapshots: row ? (JSON.parse(row.snapshots_json) as Record<string, unknown>) : {},
    updatedAt: row?.updated_at ?? 0,
  });
});

syncRoutes.put('/', async (c) => {
  const user = requireUser(c);
  let body: { scenarios?: unknown; snapshots?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid json body' }, 400);
  }
  const scenarios = isRecord(body.scenarios) ? body.scenarios : {};
  const snapshots = isRecord(body.snapshots) ? body.snapshots : {};
  const now = Date.now();
  stmts.upsert.run(user.userId, JSON.stringify(scenarios), JSON.stringify(snapshots), now);
  return c.json({ ok: true, updatedAt: now });
});

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
