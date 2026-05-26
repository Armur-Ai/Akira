import { create } from 'zustand';
import { useScenarioStore } from './scenario-store.js';
import { useSnapshotsStore } from './snapshots-store.js';

const SERVER_URL_KEY = 'akira:server-url';
const DEFAULT_SERVER_URL = 'http://localhost:3001';

export type SyncStatus = 'idle' | 'connecting' | 'connected' | 'syncing' | 'error';

interface SyncStore {
  serverUrl: string;
  user: { email: string } | null;
  status: SyncStatus;
  error: string | null;
  lastSyncAt: number | null;

  setServerUrl: (url: string) => void;
  bootstrap: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  push: () => Promise<void>;
  pull: () => Promise<void>;
  clearError: () => void;
}

function readInitialUrl(): string {
  try {
    return localStorage.getItem(SERVER_URL_KEY) ?? DEFAULT_SERVER_URL;
  } catch {
    return DEFAULT_SERVER_URL;
  }
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: unknown };
    if (typeof data.error === 'string') return data.error;
  } catch {
    // ignore
  }
  return fallback;
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  serverUrl: readInitialUrl(),
  user: null,
  status: 'idle',
  error: null,
  lastSyncAt: null,

  setServerUrl(url) {
    const trimmed = url.trim().replace(/\/$/, '');
    try {
      localStorage.setItem(SERVER_URL_KEY, trimmed);
    } catch {
      // ignore (private browsing, quota, etc.)
    }
    set({ serverUrl: trimmed });
  },

  clearError() {
    set({ error: null });
  },

  // Best-effort: if the cookie still validates, mark the session connected
  // without touching local data. Explicit login/signup is what touches data.
  async bootstrap() {
    const { serverUrl } = get();
    set({ status: 'connecting', error: null });
    try {
      const res = await fetch(`${serverUrl}/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const user = (await res.json()) as { email: string };
        set({ user, status: 'connected' });
      } else {
        set({ status: 'idle' });
      }
    } catch {
      // Server offline isn't an error condition for the user; they can still
      // work locally.
      set({ status: 'idle' });
    }
  },

  async signup(email, password) {
    const { serverUrl } = get();
    set({ status: 'connecting', error: null });
    try {
      const res = await fetch(`${serverUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const msg = await readErrorMessage(res, `Signup failed (${res.status})`);
        throw new Error(msg);
      }
      const user = (await res.json()) as { email: string };
      set({ user, status: 'connected' });
      // Brand-new account: push local data so the user can continue with the
      // graphs they've already drawn.
      await get().push();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ status: 'error', error: message });
      throw err;
    }
  },

  async login(email, password) {
    const { serverUrl } = get();
    set({ status: 'connecting', error: null });
    try {
      const res = await fetch(`${serverUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const msg = await readErrorMessage(res, `Login failed (${res.status})`);
        throw new Error(msg);
      }
      const user = (await res.json()) as { email: string };
      set({ user, status: 'connected' });
      // Pull replaces local. The dialog warns before submit.
      await get().pull();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ status: 'error', error: message });
      throw err;
    }
  },

  async logout() {
    const { serverUrl } = get();
    try {
      await fetch(`${serverUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Even if the network call fails we drop client-side state.
    }
    set({ user: null, status: 'idle', error: null, lastSyncAt: null });
  },

  async push() {
    const { serverUrl, user } = get();
    if (!user) return;
    set({ status: 'syncing' });
    try {
      const scenarios = useScenarioStore.getState().scenarios;
      const snapshots = useSnapshotsStore.getState().snapshots;
      const res = await fetch(`${serverUrl}/sync`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ scenarios, snapshots }),
      });
      if (!res.ok) {
        const msg = await readErrorMessage(res, `Sync push failed (${res.status})`);
        throw new Error(msg);
      }
      set({ status: 'connected', lastSyncAt: Date.now() });
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  },

  async pull() {
    const { serverUrl, user } = get();
    if (!user) return;
    set({ status: 'syncing' });
    try {
      const res = await fetch(`${serverUrl}/sync`, { credentials: 'include' });
      if (!res.ok) {
        const msg = await readErrorMessage(res, `Sync pull failed (${res.status})`);
        throw new Error(msg);
      }
      const data = (await res.json()) as {
        scenarios?: Record<string, unknown>;
        snapshots?: Record<string, unknown>;
      };
      // The shapes are validated piecewise where they're consumed; replacing
      // the store maps is sufficient because the editor revalidates anything
      // it reads (and persistence/db.ts is forgiving on load).
      if (data.scenarios) {
        useScenarioStore.setState({
          scenarios: data.scenarios as ReturnType<typeof useScenarioStore.getState>['scenarios'],
        });
      }
      if (data.snapshots) {
        useSnapshotsStore.setState({
          snapshots: data.snapshots as ReturnType<typeof useSnapshotsStore.getState>['snapshots'],
        });
      }
      set({ status: 'connected', lastSyncAt: Date.now() });
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  },
}));
