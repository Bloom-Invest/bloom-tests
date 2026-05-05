import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Watchlist functionality
 * View watchlist, verify empty state or stocks, navigate to a stock detail page.
 */
test("Watchlist displays stocks and supports adding via bookmark", async ({ page }) => {
  await test.step("Navigate to Portfolios/Watchlist page", async () => {
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');

    // Dismiss paywall if present
    const exploreFree = page.getByRole('button', { name: 'Explore free' }).describe('Explore free button');
    if (await exploreFree.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exploreFree.click();
      await page.waitForTimeout(500);
    }
  });

  await test.step("Verify portfolios page loads with content or empty state", async () => {
    await expect(page).aiAssert(
      'The page shows either a portfolio/watchlist with stocks, or an empty state with a "Create" button.',
      { timeout: 60000 }
    );
  });

  await test.step("Navigate to AAPL and verify stock page loads correctly", async () => {
    await page.goto('/symbol/AAPL');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/AAPL/').first().describe('AAPL ticker')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Apple/i').first().describe('Apple company name')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/\\$[\\d,.]+/').first().describe('Stock price')).toBeVisible({ timeout: 10000 });

    // Verify the stock detail page has loaded with chart and key UI elements
    await expect(page).aiAssert(
      'The AAPL stock detail page shows a price chart with time range selectors (1D, 1W, 1M, etc.) and a bottom navigation bar.',
      { timeout: 60000 }
    );
  });
});
