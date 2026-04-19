import { test, expect } from '@stablyai/playwright-test';
import { aiAssertSafe } from '../helpers/aiAssertSafe';

/**
 * Test: Stock detail for different asset types
 * Verify ETF and individual stock pages render appropriate sections.
 */
test("Different asset types render correctly on symbol pages", async ({ page }) => {
  await test.step("Verify ETF page loads correctly with Bottom Line (QQQ)", async () => {
    await page.goto('/symbol/QQQ');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/QQQ/').first().describe('QQQ ticker')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Nasdaq 100 ETF/i').first().describe('ETF name')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/\\$[\\d,.]+/').first().describe('ETF price')).toBeVisible({ timeout: 5000 });

    // ETFs show specific metrics (fullPage to capture below-the-fold content)
    await aiAssertSafe(
      page,
      'The ETF detail page shows fund-specific metrics such as AUM (assets under management), expense ratio, return data, or risk metrics.',
      {
        timeout: 60000,
        fullPage: true,
        // Fallback: any of the ETF-specific metric labels render
        fallback: async () => {
          const metric = page.getByText(/AUM|Assets Under Management|Expense Ratio|Yield|Holdings|Top Holdings|Net Assets/i).first();
          return await metric.isVisible({ timeout: 5000 }).catch(() => false);
        },
      },
    );

    // Bottom Line section on ETF
    await expect(page.locator('text=/Bottom Line/i').first().describe('QQQ Bottom Line')).toBeVisible({ timeout: 10000 });
  });

  await test.step("Verify individual stock page with Bottom Line (AAPL)", async () => {
    await page.goto('/symbol/AAPL');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/AAPL/').first().describe('AAPL ticker')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Apple/i').first().describe('Company name')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/\\$[\\d,.]+/').first().describe('Stock price')).toBeVisible({ timeout: 5000 });

    // Individual stocks show company-specific metrics (fullPage to capture below-the-fold content)
    await aiAssertSafe(
      page,
      'The stock detail page shows company-specific financial metrics such as profit margins, revenue growth, cashflow, or earnings data.',
      {
        timeout: 60000,
        fullPage: true,
        // Fallback: any of the company-specific metric labels render
        fallback: async () => {
          const metric = page.getByText(/Profit|Margin|Revenue|Growth|Cashflow|Cash Flow|Earnings|EPS|P\/E/i).first();
          return await metric.isVisible({ timeout: 5000 }).catch(() => false);
        },
      },
    );

    // Bottom Line section on stock
    await expect(page.locator('text=/Bottom Line/i').first().describe('AAPL Bottom Line')).toBeVisible({ timeout: 10000 });
  });
});
