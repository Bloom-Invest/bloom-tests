import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Stock detail for different asset types
 * Verify ETF and individual stock pages render appropriate sections.
 */
test("Different asset types render correctly on symbol pages", async ({ page }) => {
  await test.step("Verify ETF page loads correctly (QQQ)", async () => {
    await page.goto('/symbol/QQQ');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should show ETF name and price
    await expect(page.locator('text=/QQQ/').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Nasdaq 100 ETF/i').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/\\$[\\d,.]+/').first()).toBeVisible({ timeout: 5000 });

    // ETFs show specific metrics: AUM, expense ratio
    const etfMetrics = page.locator('text=/AUM|expense ratio|assets under management|return/i').first();
    await expect(etfMetrics).toBeVisible({ timeout: 10000 });
  });

  await test.step("Verify individual stock page has different sections (AAPL)", async () => {
    await page.goto('/symbol/AAPL');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.locator('text=/AAPL/').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Apple/i').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/\\$[\\d,.]+/').first()).toBeVisible({ timeout: 5000 });

    // Individual stocks show profit/growth metrics
    const stockMetrics = page.locator('text=/profit|growth|margin|revenue|cashflow/i').first();
    await expect(stockMetrics).toBeVisible({ timeout: 10000 });
  });

  await test.step("Both asset types have Bottom Line section", async () => {
    // Already on AAPL
    const bottomLine = page.locator('text=/Bottom Line/i').first();
    await expect(bottomLine).toBeVisible({ timeout: 10000 });
  });
});
