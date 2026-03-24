import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Stock detail chart interactions
 * Switch time periods, verify price/change updates.
 */
test("Stock chart allows switching time periods", async ({ page }) => {
  await test.step("Navigate to AAPL symbol page", async () => {
    await page.goto('/symbol/AAPL');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/AAPL/').first().describe('AAPL ticker')).toBeVisible({ timeout: 10000 });
  });

  await test.step("Verify chart time period buttons are visible", async () => {
    const timePeriods = ['1D', '1W', '1M', '3M', '1Y', '5Y'];
    for (const period of timePeriods) {
      const btn = page.locator('[role="radiogroup"] label, button, [role="button"]').filter({ hasText: new RegExp(`^${period}$`) }).first().describe(`${period} time period button`);
      await expect(btn).toBeVisible({ timeout: 5000 });
    }
  });

  await test.step("Switch time periods and verify chart updates", async () => {
    // Click 1Y
    await page.locator('[role="radiogroup"] label, button, [role="button"]').filter({ hasText: /^1Y$/ }).first().describe('1Y button').click();
    await page.waitForTimeout(1000);

    // Click 1D
    await page.locator('[role="radiogroup"] label, button, [role="button"]').filter({ hasText: /^1D$/ }).first().describe('1D button').click();
    await page.waitForTimeout(1000);

    // Use aiAssert to verify chart is displaying data and price is still visible
    await expect(page).aiAssert(
      'The stock page shows a price chart for AAPL with a visible stock price in dollars and a percentage change indicator.',
      { timeout: 60000, fullPage: true }
    );
  });
});
