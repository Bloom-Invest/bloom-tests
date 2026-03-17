import { test, expect } from '@stablyai/playwright-test';
import { BASE_URL } from '../helpers/config.helper';

/**
 * User Prompt:
 * Navigate to the Ideas/Collections page (/ideas/collections). Find and click on any
 * collection card (e.g. 'Magnificent 7', 'Low Cost ETFs', or similar). Verify the
 * collection detail page loads, shows a list of stocks in the collection, and displays
 * relevant stock information like price or percentage change.
 */
test("Collection detail page shows stocks with price and percentage data", async ({ page }) => {
  await test.step("Navigate to the Collections page and dismiss any overlays", async () => {
    await page.goto(`${BASE_URL}/ideas/collections`);

    // Handle subscription overlay if it appears
    const closeBtn = page.getByRole('button', { name: 'Close' });
    if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeBtn.click();
    }
  });

  await test.step("Verify the Collections page loads with collection cards", async () => {
    // Look for collection cards by finding clickable elements with collection names
    const collectionCards = page.getByRole('button').or(page.getByRole('link')).filter({
      hasText: /magnificent|ETF|AI|tech|growth|dividend|value|energy|healthcare/i
    }).first();
    await expect(collectionCards).toBeVisible({ timeout: 10000 });
  });

  await test.step("Click on a collection card to view details", async () => {
    // Find a collection card - these are typically buttons or links with collection names
    // Common collections: "Magnificent 7", "Low Cost ETFs", "AI Stocks", etc.
    const collectionCard = page.getByRole('button').or(page.getByRole('link')).filter({
      hasText: /magnificent|ETF|AI|tech|growth|dividend|value|energy|healthcare/i
    }).first();

    if (await collectionCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await collectionCard.click();
    } else {
      // Fallback: click the first substantial interactive element
      const firstCard = page.getByRole('button').filter({ hasText: /\w{3,}/ }).first();
      await firstCard.click();
    }

  });

  await test.step("Verify the collection detail page shows stocks with relevant data", async () => {
    // After clicking a collection, verify stocks with price/percentage data are shown
    await expect(page).aiAssert(
      'The page shows a list of stocks or ETFs in a collection, with names and percentage change data visible.',
      { timeout: 60000 }
    );
  });
});
