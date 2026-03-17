import { test, expect } from '@stablyai/playwright-test';
import { BASE_URL } from './helpers/config.helper';

/**
 * Seed test — verifies the Bloom app loads.
 * Real tests will be generated via `stably create` or migrated from Classic.
 */
test('Bloom app loads', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page).toHaveTitle(/Bloom/i);
});
