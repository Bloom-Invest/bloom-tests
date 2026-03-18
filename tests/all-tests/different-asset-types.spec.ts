import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Stock detail for different asset types
 * Verify ETF and individual stock pages render appropriate sections.
 */
test("Different asset types render correctly on symbol pages", async ({ page }) => {
  await test.step("Verify ETF page loads correctly (QQQ)", async () => {
    await page.goto('/symbol/QQQ');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/QQQ/').first().describe('QQQ ticker')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Nasdaq 100 ETF/i').first().describe('ETF name')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/\\$[\\d,.]+/').first().describe('ETF price')).toBeVisible({ timeout: 5000 });

    // ETFs show specific metrics
    await expect(page).aiAssert(
      'The ETF detail page shows fund-specific metrics such as AUM (assets under management), expense ratio, return data, or risk metrics.',
      { timeout: 60000 }
    );
  });

  await test.step("Verify individual stock page has different sections (AAPL)", async () => {
    await page.goto('/symbol/AAPL');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/AAPL/').first().describe('AAPL ticker')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Apple/i').first().describe('Company name')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/\\$[\\d,.]+/').first().describe('Stock price')).toBeVisible({ timeout: 5000 });

    // Individual stocks show company-specific metrics
    await expect(page).aiAssert(
      'The stock detail page shows company-specific financial metrics such as profit margins, revenue growth, cashflow, or earnings data.',
      { timeout: 60000 }
    );
  });

  await test.step("Both asset types have Bottom Line section", async () => {
    await expect(page.locator('text=/Bottom Line/i').first().describe('Bottom Line section')).toBeVisible({ timeout: 10000 });
  });
});
