import { expect, test } from '@playwright/test';

// Hermetic per-test storage: each test gets a fresh browser context, so
// IndexedDB-backed scenarios from prior runs don't bleed in.

test('landing → load RAG example → run → see top attack paths', async ({ page }) => {
  await page.goto('/');

  // Landing page basics.
  await expect(page.getByRole('heading', { name: 'Akira', exact: true })).toBeVisible();
  await expect(page.getByText('Attack-path simulator for the post-AI world.')).toBeVisible();

  // Pick the RAG example.
  await page.getByRole('button', { name: /RAG indirect prompt injection/i }).click();

  // Canvas renders with the example's nodes.
  await expect(page.locator('.react-flow')).toBeVisible();
  await expect(page.getByText('Poisoned document', { exact: false })).toBeVisible();
  await expect(page.getByText('Customer PII', { exact: false })).toBeVisible();

  // Open the run popover and trigger a deterministic run.
  await page.getByRole('banner').getByRole('button', { name: 'Run' }).click();
  await page.getByRole('button', { name: 'Run now' }).click();

  // The Run tab is auto-activated and the top paths section renders.
  await expect(page.getByText(/Top paths · \d+/)).toBeVisible({ timeout: 10_000 });

  // The expected entry → objective path is among the cards.
  await expect(
    page.getByText('Poisoned document → Customer PII', { exact: true }).first(),
  ).toBeVisible();

  // Chokepoints surface for a multi-step path.
  await expect(page.getByText('Chokepoints')).toBeVisible();
});

test('controls weaken a previously reachable path', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /RAG indirect prompt injection/i }).click();

  // Baseline run.
  await page.getByRole('banner').getByRole('button', { name: 'Run' }).click();
  await page.getByRole('button', { name: 'Run now' }).click();
  await expect(page.getByText(/Top paths · \d+/)).toBeVisible({ timeout: 10_000 });

  const baselineProb = await page.locator('text=/p \\d+\\.\\d+%/').first().innerText();

  // Add a strong prompt-injection control from the templates.
  await page.getByRole('button', { name: 'Controls' }).click();
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByRole('button', { name: /Prompt-injection filter/ }).click();

  // Hit the multiplier all the way down for a clearer signal.
  const slider = page.locator('input[type="range"]').first();
  await slider.fill('0.05');

  // Re-run and compare.
  await page.getByRole('banner').getByRole('button', { name: 'Run' }).click();
  await page.getByRole('button', { name: 'Run now' }).click();
  await expect(page.getByText(/Top paths · \d+/)).toBeVisible({ timeout: 10_000 });

  const controlledProb = await page.locator('text=/p \\d+\\.\\d+%/').first().innerText();

  // Parse "p 12.3%" → 12.3.
  const parse = (s: string) => Number.parseFloat(s.replace(/[^\d.]/g, ''));
  expect(parse(controlledProb)).toBeLessThan(parse(baselineProb));
});
