import type { ReactNode } from 'react';

interface Props {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: Props) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wider text-fg-muted font-medium">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-fg-muted">{hint}</div>}
    </div>
  );
}
