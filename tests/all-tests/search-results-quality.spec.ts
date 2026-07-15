import { test, expect } from '@playwright/test';
import { grokAssert } from '../helpers/grokAssert';

/**
 * Test: Search results quality
 * Search by ticker and company name, verify relevant results.
 */
test("Search returns relevant results for ticker and company name queries", async ({ page }) => {
  await test.step("Navigate to search page", async () => {
    await page.goto('/search', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Dismiss paywall if present
    const exploreFree = page.getByRole('button', { name: 'Explore free' }).describe('Explore free button');
    try {
      await exploreFree.waitFor({ state: 'visible', timeout: 3000 });
      await exploreFree.click();
      await page.waitForTimeout(500);
    } catch {
      // Paywall not present
    }
  });

  await test.step("Verify search page loads with collections", async () => {
    await grokAssert(page, 
      'The page shows investment collections or categories like ETFs, Magnificent 7, or similar stock groupings.',
      { timeout: 60000 }
    );
  });

  await test.step("Search for a ticker symbol (MSFT)", async () => {
    // Bloom's search input has no stable role; match by placeholder/type with a fallback.
    const searchBox = page
      .locator('input[placeholder*="Search" i], input[type="search"], input[type="text"], textarea')
      .first()
      .describe('Search input');
    await searchBox.waitFor({ state: 'visible', timeout: 15000 });
    await searchBox.fill('MSFT');

    // Verify Microsoft appears in results (deterministic).
    // expect().toBeVisible() polls until the element appears, so no fixed wait needed.
    await expect(page.getByText(/MSFT|Microsoft/i).first().describe('MSFT result'))
      .toBeVisible({ timeout: 15000 });
  });

  await test.step("Clear and search by company name (Tesla)", async () => {
    const box = page
      .locator('input[placeholder*="Search" i], input[type="search"], input[type="text"], textarea')
      .first()
      .describe('Search input');
    await box.fill('');
    await box.fill('Tesla');

    // Verify Tesla appears in results (deterministic).
    // expect().toBeVisible() polls until the element appears, so no fixed wait needed.
    await expect(page.getByText(/TSLA|Tesla/i).first().describe('Tesla result'))
      .toBeVisible({ timeout: 15000 });
  });
});
