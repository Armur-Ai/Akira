import { randomBytes } from 'node:crypto';

export const PORT = Number(process.env.PORT ?? 3001);
export const DB_PATH = process.env.AKIRA_DB ?? './data/akira.db';
export const WEB_ORIGIN = process.env.AKIRA_WEB_ORIGIN ?? 'http://localhost:5173';
export const COOKIE_SECURE = (process.env.AKIRA_COOKIE_SECURE ?? '').toLowerCase() === 'true';

// In production, set AKIRA_SESSION_SECRET to a stable random string. Otherwise
// sessions invalidate on every server restart, which is fine for development.
export const SESSION_SECRET = process.env.AKIRA_SESSION_SECRET ?? randomBytes(32).toString('hex');
