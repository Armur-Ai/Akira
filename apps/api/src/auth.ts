import type { Context } from 'hono';
import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { nanoid } from 'nanoid';
import { generateSessionToken, hashPassword, verifyPassword } from './crypto.js';
import { db } from './db.js';
import { COOKIE_SECURE } from './env.js';

const SESSION_COOKIE = 'akira_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: number;
}
interface SessionRow {
  token: string;
  user_id: string;
  expires_at: number;
}

const stmts = {
  userByEmail: db.prepare<[string], UserRow>('SELECT * FROM users WHERE email = ?'),
  userById: db.prepare<[string], UserRow>('SELECT * FROM users WHERE id = ?'),
  insertUser: db.prepare(
    'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
  ),
  initUserData: db.prepare('INSERT INTO user_data (user_id, updated_at) VALUES (?, ?)'),
  insertSession: db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)'),
  sessionByToken: db.prepare<[string], SessionRow>('SELECT * FROM sessions WHERE token = ?'),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token = ?'),
};

function setSessionCookie(c: Context, token: string) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: COOKIE_SECURE,
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    path: '/',
  });
}

async function issueSession(c: Context, userId: string) {
  const token = generateSessionToken();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  stmts.insertSession.run(token, userId, expiresAt);
  setSessionCookie(c, token);
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
}

export function requireUser(c: Context): AuthenticatedUser {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) throw new HTTPException(401, { message: 'not authenticated' });
  const session = stmts.sessionByToken.get(token);
  if (!session) throw new HTTPException(401, { message: 'session not found' });
  if (session.expires_at < Date.now()) {
    stmts.deleteSession.run(token);
    throw new HTTPException(401, { message: 'session expired' });
  }
  const user = stmts.userById.get(session.user_id);
  if (!user) throw new HTTPException(401, { message: 'user not found' });
  return { userId: user.id, email: user.email };
}

export const authRoutes = new Hono();

authRoutes.post('/signup', async (c) => {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid json body' }, 400);
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'valid email required' }, 400);
  }
  if (password.length < 8) {
    return c.json({ error: 'password must be at least 8 characters' }, 400);
  }
  if (stmts.userByEmail.get(email)) {
    return c.json({ error: 'email already in use' }, 409);
  }

  const id = nanoid(16);
  const hash = await hashPassword(password);
  stmts.insertUser.run(id, email, hash, Date.now());
  stmts.initUserData.run(id, Date.now());
  await issueSession(c, id);
  return c.json({ email });
});

authRoutes.post('/login', async (c) => {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid json body' }, 400);
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) return c.json({ error: 'email and password required' }, 400);

  const user = stmts.userByEmail.get(email);
  if (!user) return c.json({ error: 'invalid credentials' }, 401);
  if (!(await verifyPassword(password, user.password_hash))) {
    return c.json({ error: 'invalid credentials' }, 401);
  }
  await issueSession(c, user.id);
  return c.json({ email: user.email });
});

authRoutes.post('/logout', (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) stmts.deleteSession.run(token);
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
  return c.json({ ok: true });
});

authRoutes.get('/me', (c) => {
  const user = requireUser(c);
  return c.json({ email: user.email });
});
