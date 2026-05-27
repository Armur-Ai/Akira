import { expect, test } from '@playwright/test';

// Each test gets a fresh BrowserContext (and therefore fresh cookies).
// The API runs against an in-memory SQLite so accounts don't leak between
// tests, but emails are still randomised for belt-and-braces.

function uniqueEmail(): string {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@akira.test`;
}

test('signup connects the session and persists across reload', async ({ page }) => {
  const email = uniqueEmail();
  const password = 'correct-horse-battery-staple';

  await page.goto('/');

  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('button', { name: 'Create one' }).click();

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();

  // Sync status shows the email.
  await expect(page.getByText(email)).toBeVisible({ timeout: 10_000 });

  // Reload — bootstrap should pick up the session cookie.
  await page.reload();
  await expect(page.getByText(email)).toBeVisible({ timeout: 10_000 });
});

test('logout clears the connected indicator', async ({ page }) => {
  const email = uniqueEmail();
  const password = 'correct-horse-battery-staple';

  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('button', { name: 'Create one' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText(email)).toBeVisible({ timeout: 10_000 });

  await page.getByTitle('Sign out').click();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});
