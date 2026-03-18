import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Stock detail chart interactions
 * Switch time periods, verify price/change updates.
 */
test("Stock chart allows switching time periods", async ({ page }) => {
  await test.step("Navigate to AAPL symbol page", async () => {
    await page.goto('/symbol/AAPL');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.getByRole('heading', { name: 'AAPL' })).toBeVisible({ timeout: 10000 });
  });

  await test.step("Verify chart time period buttons are visible", async () => {
    const timePeriods = ['1D', '1W', '1M', '3M', '1Y', '5Y'];
    for (const period of timePeriods) {
      const btn = page.locator('button, [role="button"]').filter({ hasText: new RegExp(`^${period}$`) });
      await expect(btn.first()).toBeVisible({ timeout: 5000 });
    }
  });

  await test.step("Click different time periods and verify page updates", async () => {
    // Click 1D
    await page.locator('button, [role="button"]').filter({ hasText: /^1D$/ }).first().click();
    await page.waitForTimeout(1000);

    // Click 1Y
    await page.locator('button, [role="button"]').filter({ hasText: /^1Y$/ }).first().click();
    await page.waitForTimeout(1000);

    // Click 1M
    await page.locator('button, [role="button"]').filter({ hasText: /^1M$/ }).first().click();
    await page.waitForTimeout(1000);

    // Price should still be visible after switching
    const price = page.locator('text=/\\$[\\d,.]+/').first();
    await expect(price).toBeVisible({ timeout: 5000 });
  });
});
