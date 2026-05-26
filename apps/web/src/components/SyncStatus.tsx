import { Cloud, CloudOff, LogOut, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useSyncStore } from '../state/sync-store.js';
import { SyncDialog } from './SyncDialog.js';

export function SyncStatus() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const user = useSyncStore((s) => s.user);
  const status = useSyncStore((s) => s.status);
  const logout = useSyncStore((s) => s.logout);

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg transition px-2 py-1 rounded hover:bg-bg-elev"
          title="Sign in to sync scenarios across devices"
        >
          <CloudOff className="h-3.5 w-3.5" />
          Sign in
        </button>
        <SyncDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      </>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1.5 text-xs text-good">
        {status === 'syncing' ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Cloud className="h-3.5 w-3.5" />
        )}
        <span className="truncate max-w-[180px]">{user.email}</span>
      </div>
      <button
        type="button"
        onClick={() => void logout()}
        title="Sign out"
        className="text-fg-muted hover:text-fg transition p-1 rounded hover:bg-bg-elev"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
