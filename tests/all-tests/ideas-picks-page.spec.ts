import { test, expect } from '@playwright/test';
import { aiAssert } from '../helpers/aiAssert';

/**
 * User Prompt:
 * Navigate to the Ideas Picks page (/ideas/picks), now the Arena tab. Verify the
 * AI models' recent trades load and at least one trade shows a stock ticker.
 */
test("Ideas Picks page displays trade ideas with stock tickers", async ({ page }) => {
  await test.step("Navigate to the Ideas Picks page and dismiss any overlays", async () => {
    await page.goto('/ideas/picks', { waitUntil: 'domcontentloaded' });

    // Handle subscription overlay if it appears
    const closeBtn = page.getByRole('button', { name: 'Close' });
    try {
      await closeBtn.waitFor({ state: 'visible', timeout: 5000 });
      await closeBtn.click();
    } catch {
      // No overlay
    }
  });

  await test.step("Verify the Recent trades list shows trades with stock tickers", async () => {
    // The Arena tab leads with model returns and a performance chart; the trades
    // sit below them, so scope the check to the Recent trades section.
    const recentTrades = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Recent trades' }) });
    const firstTrade = recentTrades.getByRole('button', { name: /^View .+ details$/ }).first();
    await expect(firstTrade).toBeVisible({ timeout: 30000 });
    await firstTrade.scrollIntoViewIfNeeded();

    await aiAssert(page,
      'A "Recent trades" list is visible where at least one row shows a stock ticker symbol with a BUY or SELL label. No error message is shown.',
      { timeout: 60000 }
    );
  });
});
