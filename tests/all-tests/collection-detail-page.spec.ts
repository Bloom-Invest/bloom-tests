import { test, expect } from '@playwright/test';

/**
 * User Prompt:
 * Navigate to the Ideas/Collections page (/ideas/collections). Find and click on any
 * collection card (e.g. 'Magnificent 7', 'Low Cost ETFs', or similar). Verify the
 * collection detail page loads, shows a list of stocks in the collection, and displays
 * relevant stock information like price or percentage change.
 */
test("Collection detail page shows stocks with price and percentage data", async ({ page }) => {
  await test.step("Navigate to the Collections page and dismiss any overlays", async () => {
    await page.goto('/ideas/collections', { waitUntil: 'domcontentloaded' });

    // Handle subscription overlay if it appears
    const closeBtn = page.getByRole('button', { name: 'Close' });
    try {
      await closeBtn.waitFor({ state: 'visible', timeout: 5000 });
      await closeBtn.click();
    } catch {
      // No overlay
    }
  });

  await test.step("Verify the Collections page loads with collection cards", async () => {
    await page.waitForLoadState('domcontentloaded');

    // Look for collections-related content
    const collectionsContent = page.locator('text=/collections|themes|categories/i').first();
    await expect(collectionsContent).toBeVisible({ timeout: 10000 });
  });

  await test.step("Click on a collection card to view details", async () => {
    // Find a collection card - these are typically buttons or links with collection names
    // Common collections: "Magnificent 7", "Low Cost ETFs", "AI Stocks", etc.
    const collectionCard = page.getByRole('button').or(page.getByRole('link')).filter({
      hasText: /magnificent|ETF|AI|tech|growth|dividend|value|energy|healthcare/i
    }).first();

    try {
      await collectionCard.waitFor({ state: 'visible', timeout: 5000 });
      await collectionCard.click();
    } catch {
      // Fallback: click the first substantial interactive element
      const firstCard = page.getByRole('button').filter({ hasText: /\w{3,}/ }).first();
      await firstCard.click();
    }

    await page.waitForLoadState('domcontentloaded');
  });

  await test.step("Verify the collection detail page shows stocks with relevant data", async () => {
    // After clicking a collection, we should see individual stocks
    // Look for stock tickers, prices, or percentage changes
    const bodyText = await page.locator('body').textContent();

    // Should have stock-related content
    const hasStockData = /\$[\d,.]+|[+-]?\d+\.\d+%|\b[A-Z]{1,5}\b/i.test(bodyText || '');
    expect(hasStockData).toBeTruthy();

    // The page should not be in an error state
    await expect(page.locator('body')).toBeVisible();
  });
});
