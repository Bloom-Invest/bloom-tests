import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Empty states
 * Verify appropriate empty state messages for portfolios and notifications.
 */
test("Empty states display appropriate messages", async ({ page }) => {
  await test.step("Verify portfolios page shows empty state or content", async () => {
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');

    const exploreFree = page.getByRole('button', { name: 'Explore free' }).describe('Explore free button');
    if (await exploreFree.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exploreFree.click();
      await page.waitForTimeout(500);
    }

    // Use aiAssert — page may show watchlist or portfolios view depending on state
    await expect(page).aiAssert(
      'The page shows either a list of portfolios/watchlist stocks, or an empty state with an option to create a portfolio or add stocks.',
      { timeout: 60000 }
    );
  });

  await test.step("Verify notifications page handles empty state", async () => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    // Use aiAssert — notifications page may show items or an empty/info state
    await expect(page).aiAssert(
      'The notifications page loaded successfully and shows either notification items with timestamps, or an empty state message.',
      { timeout: 60000 }
    );
  });
});
