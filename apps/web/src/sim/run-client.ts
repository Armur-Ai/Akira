import type { RunConfig, RunResult, Scenario } from '@akira/schema';
import type { WorkerOutbound } from './run-worker.js';
import RunWorker from './run-worker.ts?worker';

export interface RunHandle {
  promise: Promise<RunResult>;
  cancel: () => void;
}

export class SimulationCancelledError extends Error {
  constructor() {
    super('Simulation cancelled');
    this.name = 'SimulationCancelledError';
  }
}

export function runSimulation(scenario: Scenario, config: RunConfig): RunHandle {
  const worker = new RunWorker();
  let cancelled = false;

  const promise = new Promise<RunResult>((resolve, reject) => {
    worker.addEventListener('message', (event: MessageEvent<WorkerOutbound>) => {
      const data = event.data;
      worker.terminate();
      if (data.type === 'result') {
        resolve(data.result);
      } else {
        reject(new Error(data.message));
      }
    });
    worker.addEventListener('error', (event) => {
      worker.terminate();
      reject(new Error(event.message || 'Worker error'));
    });
    worker.postMessage({ scenario, config });
  });

  function cancel() {
    if (cancelled) return;
    cancelled = true;
    worker.terminate();
  }

  return {
    promise: promise.catch((err) => {
      if (cancelled) throw new SimulationCancelledError();
      throw err;
    }),
    cancel,
  };
}
