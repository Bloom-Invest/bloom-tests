import { test, expect } from '@stablyai/playwright-test';

/**
 * User Prompt:
 * Navigate to the Ideas Picks page (/ideas/picks). Verify the page loads and shows
 * trade ideas, stock picks, or investment recommendations. Assert that at least one
 * pick or trade idea is visible with a stock ticker.
 */
test("Ideas Picks page displays trade ideas with stock tickers", async ({ page }) => {
  await test.step("Navigate to the Ideas Picks page and dismiss any overlays", async () => {
    await page.goto('/ideas/picks');

    // Handle subscription overlay if it appears
    const closeBtn = page.getByRole('button', { name: 'Close' });
    if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeBtn.click();
    }
  });

  await test.step("Verify the Ideas Picks page loads with content", async () => {
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // The page should show picks/trade ideas content
    // Look for heading or tab that indicates picks content
    const picksContent = page.locator('text=/picks|trade ideas|recommendations/i').first();
    await expect(picksContent).toBeVisible({ timeout: 10000 });
  });

  await test.step("Verify at least one stock pick is visible with a ticker symbol", async () => {
    // Stock tickers are typically 1-5 uppercase letters
    // Look for common stock ticker patterns in buttons or links
    const tickerPattern = page.locator('text=/\\b[A-Z]{1,5}\\b/').first();
    await expect(tickerPattern).toBeVisible({ timeout: 10000 });
  });
});
