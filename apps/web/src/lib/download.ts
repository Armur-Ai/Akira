import type { Scenario } from '@akira/schema';

export function downloadScenario(scenario: Scenario): void {
  const blob = new Blob([JSON.stringify(scenario, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${scenario.id}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
