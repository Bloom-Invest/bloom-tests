import { test, expect } from '@playwright/test';
import { aiAssert } from '../helpers/aiAssert';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

/**
 * Test: Stock detail chart interactions
 * Switch time periods, verify price/change updates.
 */
test("Stock chart allows switching time periods", async ({ page }) => {
  await test.step("Navigate to AAPL symbol page", async () => {
    await page.goto('/symbol/AAPL', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Handle subscription overlay if it appears
    const exploreBtn = page.getByRole('button', { name: 'Explore free' });
    try {
      await exploreBtn.waitFor({ state: 'visible', timeout: 3000 });
      await exploreBtn.click();
      if (!page.url().includes('/symbol/AAPL')) {
        const tapOverlay = page.getByText('Tap anywhere to continue');
        try {
          await tapOverlay.waitFor({ state: 'visible', timeout: 2000 });
          await tapOverlay.click();
        } catch {
          // No tutorial overlay
        }
        await page.goto('/symbol/AAPL', { waitUntil: 'domcontentloaded' });
      }
    } catch {
      // No subscription overlay
    }

    await dismissFeedbackModal(page);
    await expect(page.locator('text=/AAPL/').first()).toBeVisible({ timeout: 10000 });
  });

  await test.step("Verify chart time period buttons are visible", async () => {
    await dismissFeedbackModal(page);
    const timePeriods = ['1D', '1W', '1M', '3M', '1Y', '5Y'];
    for (const period of timePeriods) {
      const btn = page.locator('[role="radiogroup"] label, button, [role="button"]').filter({ hasText: new RegExp(`^${period}$`) }).first();
      await expect(btn).toBeVisible({ timeout: 5000 });
    }
  });

  await test.step("Switch time periods and verify chart updates", async () => {
    await dismissFeedbackModal(page);

    // Click 1Y
    await page.locator('[role="radiogroup"] label, button, [role="button"]').filter({ hasText: /^1Y$/ }).first().click();
    await page.waitForTimeout(1000);

    await dismissFeedbackModal(page);

    // Click 1D
    await page.locator('[role="radiogroup"] label, button, [role="button"]').filter({ hasText: /^1D$/ }).first().click();
    await page.waitForTimeout(1000);

    await dismissFeedbackModal(page);

    // Use aiAssert to verify chart is displaying data and price is still visible
    await aiAssert(page, 
      'The stock page shows a price chart for AAPL with a visible stock price in dollars and a percentage change indicator.',
      { timeout: 60000, fullPage: true }
    );
  });
});
