import { X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { useScenarioStore } from '../state/scenario-store.js';
import { useSyncStore } from '../state/sync-store.js';

interface Props {
  open: boolean;
  onClose: () => void;
}

const inputClass =
  'w-full rounded bg-bg-elev border border-border px-2.5 py-1.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/40';

export function SyncDialog({ open, onClose }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const serverUrl = useSyncStore((s) => s.serverUrl);
  const setServerUrl = useSyncStore((s) => s.setServerUrl);
  const error = useSyncStore((s) => s.error);
  const signup = useSyncStore((s) => s.signup);
  const login = useSyncStore((s) => s.login);
  const clearError = useSyncStore((s) => s.clearError);
  const localScenarioCount = useScenarioStore((s) => Object.keys(s.scenarios).length);

  useEffect(() => {
    if (!open) {
      setPassword('');
      clearError();
    }
  }, [open, clearError]);

  if (!open) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'login') {
        if (
          localScenarioCount > 0 &&
          !window.confirm(
            `Signing in will replace your ${localScenarioCount} local scenario(s) with whatever is on the server. Continue? (Use Export first if you want to keep a copy.)`,
          )
        ) {
          return;
        }
        await login(email, password);
      } else {
        await signup(email, password);
      }
      onClose();
    } catch {
      // Error is in the store.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="presentation"
    >
      <div className="bg-bg border border-border rounded-lg shadow-2xl w-96 max-w-[90vw]">
        <header className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>
          <button type="button" onClick={onClose} className="text-fg-muted hover:text-fg">
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <label
              htmlFor="sync-server-url"
              className="block text-xs uppercase tracking-wider text-fg-muted font-medium mb-1"
            >
              Server
            </label>
            <input
              id="sync-server-url"
              type="url"
              className={inputClass}
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://localhost:3001"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div>
            <label
              htmlFor="sync-email"
              className="block text-xs uppercase tracking-wider text-fg-muted font-medium mb-1"
            >
              Email
            </label>
            <input
              id="sync-email"
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label
              htmlFor="sync-password"
              className="block text-xs uppercase tracking-wider text-fg-muted font-medium mb-1"
            >
              Password
            </label>
            <input
              id="sync-password"
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={mode === 'signup' ? 8 : undefined}
              required
            />
            {mode === 'signup' && (
              <p className="mt-1 text-[11px] text-fg-muted">At least 8 characters.</p>
            )}
          </div>

          {error && (
            <div className="text-xs text-danger bg-danger/10 border border-danger/40 rounded p-2">
              {error}
            </div>
          )}

          {mode === 'login' && localScenarioCount > 0 && (
            <div className="text-[11px] text-warning bg-warning/10 border border-warning/40 rounded p-2">
              Heads up — signing in pulls server data over your {localScenarioCount} local
              scenario(s). Export first if you need a backup.
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-accent text-accent-fg px-3 py-2 rounded text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
          >
            {busy ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          <p className="text-center text-xs text-fg-muted pt-1">
            {mode === 'login' ? (
              <>
                No account yet?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-accent hover:underline"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have one?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-accent hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
