import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './auth.js';
import './db.js';
import { PORT, WEB_ORIGIN } from './env.js';
import { syncRoutes } from './sync.js';

const app = new Hono();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: WEB_ORIGIN,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  }),
);

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/auth', authRoutes);
app.route('/sync', syncRoutes);

app.onError((err, c) => {
  // Hono HTTPException already formats itself.
  if ('getResponse' in err && typeof (err as { getResponse: unknown }).getResponse === 'function') {
    return (err as { getResponse: () => Response }).getResponse();
  }
  console.error('unhandled error:', err);
  return c.json({ error: 'internal server error' }, 500);
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Akira API listening on http://localhost:${info.port}`);
});
