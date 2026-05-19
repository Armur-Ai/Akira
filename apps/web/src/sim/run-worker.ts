import { simulate } from '@akira/core';
import type { RunConfig, RunResult, Scenario } from '@akira/schema';

interface RunRequest {
  scenario: Scenario;
  config: RunConfig;
}

export type WorkerInbound = RunRequest;
export type WorkerOutbound =
  | { type: 'result'; result: RunResult }
  | { type: 'error'; message: string };

interface WorkerCtx {
  addEventListener: (type: 'message', listener: (event: MessageEvent<RunRequest>) => void) => void;
  postMessage: (data: unknown) => void;
}

const ctx = self as unknown as WorkerCtx;

ctx.addEventListener('message', (event) => {
  try {
    const result = simulate(event.data.scenario, event.data.config);
    const msg: WorkerOutbound = { type: 'result', result };
    ctx.postMessage(msg);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const msg: WorkerOutbound = { type: 'error', message };
    ctx.postMessage(msg);
  }
});
