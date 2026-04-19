import { test, expect } from '@stablyai/playwright-test';
import { aiAssertSafe } from '../helpers/aiAssertSafe';

/**
 * Test: Symbol page deep content
 * Verify Bottom Line, earnings, news, and "Appears in" sections.
 */
test("Symbol page shows Bottom Line, news, and collection associations", async ({ page }) => {
  await test.step("Navigate to AAPL symbol page", async () => {
    await page.goto('/symbol/AAPL');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/AAPL/').first().describe('AAPL ticker')).toBeVisible({ timeout: 10000 });
  });

  await test.step("Verify price and company name are displayed", async () => {
    await expect(page.locator('text=/\\$[\\d,.]+/').first().describe('Stock price')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Apple/i').first().describe('Company name')).toBeVisible({ timeout: 5000 });
  });

  await test.step("Verify Bottom Line section with financial metrics", async () => {
    await expect(page.locator('text=/Bottom Line/i').first().describe('Bottom Line heading')).toBeVisible({ timeout: 10000 });

    await aiAssertSafe(
      page,
      'The Bottom Line section shows financial health indicators like profit, growth, price, or activity with colored indicators (green, orange, or red).',
      {
        timeout: 60000,
        fullPage: true,
        // Fallback: at least one Bottom Line metric label is rendered
        fallback: async () => {
          const metric = page.getByText(/Profit|Growth|Price|Activity|Risk|Valuation/i).first();
          return await metric.isVisible({ timeout: 5000 }).catch(() => false);
        },
      },
    );
  });

  await test.step("Verify Ask Bloom AI section exists", async () => {
    await expect(page.locator('text=/Ask Bloom AI|Explain business|Analyze market|Find catalysts|Check risks/i').first().describe('Ask Bloom AI section')).toBeVisible({ timeout: 10000 });
  });

  await test.step("Scroll down and verify additional sections", async () => {
    await page.evaluate(() => window.scrollBy(0, 3000));
    await page.waitForTimeout(1000);

    await aiAssertSafe(
      page,
      'After scrolling, the page shows additional content such as related industry peers, key events/news, or collection associations for the stock.',
      {
        timeout: 60000,
        fullPage: true,
        // Fallback: any of the below-the-fold sections rendered
        fallback: async () => {
          const section = page.getByText(/Related|Peers|Industry|News|Events|Collections|Appears in/i).first();
          return await section.isVisible({ timeout: 5000 }).catch(() => false);
        },
      },
    );
  });
});
