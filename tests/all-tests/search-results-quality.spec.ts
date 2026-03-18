import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Search results quality
 * Search by ticker and company name, verify relevant results.
 */
test("Search returns relevant results for ticker and company name queries", async ({ page }) => {
  await test.step("Navigate to search page", async () => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Dismiss paywall if present
    const exploreFree = page.getByRole('button', { name: 'Explore free' });
    if (await exploreFree.isVisible({ timeout: 3000 }).catch(() => false)) {
      await exploreFree.click();
      await page.waitForTimeout(500);
    }
  });

  await test.step("Verify search page loads with collections", async () => {
    // Ideas/Search page should show collections
    const collections = page.locator('text=/Low Cost ETFs|Magnificent 7|Bloom Portfolio/i').first();
    await expect(collections).toBeVisible({ timeout: 10000 });
  });

  await test.step("Search for a ticker symbol", async () => {
    // Find and use search input
    const searchInput = page.locator('input[placeholder*="earch"], input[type="search"], input[type="text"]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('MSFT');
      await page.waitForTimeout(2000);

      // Should show Microsoft in results
      const result = page.locator('text=/Microsoft|MSFT/i').first();
      await expect(result).toBeVisible({ timeout: 10000 });
    }
  });

  await test.step("Clear and search by company name", async () => {
    const searchInput = page.locator('input[placeholder*="earch"], input[type="search"], input[type="text"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('');
      await searchInput.fill('Tesla');
      await page.waitForTimeout(2000);

      // Should show Tesla/TSLA in results
      const result = page.locator('text=/Tesla|TSLA/i').first();
      await expect(result).toBeVisible({ timeout: 10000 });
    }
  });
});
