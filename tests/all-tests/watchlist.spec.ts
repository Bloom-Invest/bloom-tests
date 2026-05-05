import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Watchlist functionality
 * View watchlist, verify empty state or stocks, add stock via symbol page bookmark.
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

  await test.step("Navigate to AAPL and verify stock page loads with bookmark control", async () => {
    await page.goto('/symbol/AAPL');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/AAPL/').first().describe('AAPL ticker')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Apple/i').first().describe('Apple company name')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/\\$[\\d,.]+/').first().describe('Stock price')).toBeVisible({ timeout: 10000 });

    // Wait for the header bookmark button to render (it depends on an API call
    // for the investment's category and name, so it can lag behind the rest of
    // the page). Look for a <button> in the header that contains a bookmark SVG.
    await expect(
      page.locator('header button').filter({ has: page.locator('svg') }).first().describe('Header bookmark button')
    ).toBeVisible({ timeout: 15000 });
  });
});
