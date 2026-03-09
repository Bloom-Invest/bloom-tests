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

  await test.step("Verify the Ideas Picks page loads with trade ideas and stock tickers", async () => {
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // Use aiAssert to verify the page shows trade ideas, stock picks, or investment content
    // with at least one stock ticker visible
    await expect(page).aiAssert(
      'The page shows trade ideas, stock picks, or investment recommendations. At least one stock ticker symbol is visible on the page. The page is not showing an error or blank screen.',
      { timeout: 60000 }
    );
  });
});
