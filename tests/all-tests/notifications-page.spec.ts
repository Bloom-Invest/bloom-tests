import { test, expect } from '@stablyai/playwright-test';
import { aiAssertSafe } from '../helpers/aiAssertSafe';

test("Notifications page loads and displays notification history or empty state", async ({ page }) => {
  await test.step("Navigate to the Notifications page", async () => {
    await page.goto('/notifications');
    const closeBtn = page.getByRole('button', { name: 'Close' });
    if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeBtn.click();
    }
    await page.waitForLoadState('domcontentloaded');
  });

  await test.step("Verify the page renders without errors", async () => {
    // Page should not show a crash or error
    await expect(page.locator('body')).toBeVisible();
    await aiAssertSafe(
      page,
      'A notifications page, notification history list, or empty state is visible. The page is not showing a crash or blank white screen.',
      {
        timeout: 60000,
        // Fallback: bottom navigation is visible (the app shell rendered)
        fallback: async () => {
          const nav = page.locator('a').filter({ hasText: /^(Portfolio|Markets|Ideas|Chat|Settings)$/ }).first();
          return await nav.isVisible({ timeout: 5000 }).catch(() => false);
        },
      },
    );
  });
});
