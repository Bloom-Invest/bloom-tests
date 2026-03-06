import { test, expect } from '@playwright/test';

/**
 * Seed test — verifies the Bloom app loads.
 * Real tests will be generated via `stably create` or migrated from Classic.
 */
test('Bloom app loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Bloom/i);
});
