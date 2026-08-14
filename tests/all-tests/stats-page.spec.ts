import { test, expect } from '@playwright/test';
import { aiAssert } from '../helpers/aiAssert';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

test("Stats page", async ({ page, context }) => {
  await test.step("Navigate to the Apple (AAPL) stock statistics page.", async () => {
    await page.goto('/symbol/AAPL/stats', { waitUntil: 'domcontentloaded' });

    // Handle subscription overlay if it appears
    const exploreBtn = page.getByRole('button', { name: 'Explore free' });
    try {
      await exploreBtn.waitFor({ state: 'visible', timeout: 3000 });
      await exploreBtn.click();
      if (!page.url().includes('/symbol/AAPL/stats')) {
        const tapOverlay = page.getByText('Tap anywhere to continue');
        try {
          await tapOverlay.waitFor({ state: 'visible', timeout: 2000 });
          await tapOverlay.click();
        } catch {
          // No tutorial overlay
        }
        await page.goto('/symbol/AAPL/stats', { waitUntil: 'domcontentloaded' });
      }
    } catch {
      // No subscription overlay
    }

    await dismissFeedbackModal(page);
  });

  await test.step("Verify that stats are loaded and plausible for AAPL.", async () => {
    await dismissFeedbackModal(page);
    await aiAssert(page, 'Assert stats are loaded for AAPL and they look plausible', { timeout: 60000, fullPage: true });
  });
});
