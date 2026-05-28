import { test, expect } from '@stablyai/playwright-test';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

/**
 * Test: Welcome → Skip to explore → Handle result/offer pages → Access content
 * Verify that a fresh session can skip onboarding from the welcome screen,
 * dismiss any promotional modals, and reach the main app content.
 */
test("Onboarding skip grants access to content", async ({ page }) => {
  await test.step("Navigate to app root", async () => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
  });

  await test.step("Click 'Skip to explore' on welcome screen", async () => {
    // The welcome page has "Get started" (primary) and "Skip to explore" (skip link)
    const skipBtn = page.locator('button, a, [role="button"]').filter({ hasText: /skip to explore/i }).first();
    await expect(skipBtn).toBeVisible({ timeout: 15000 });
    await skipBtn.click();
    await page.waitForTimeout(2000);
  });

  await test.step("Handle post-skip screens", async () => {
    // After "Skip to explore", the user may land on one-time-offer or result page.
    // Try to dismiss various screens in sequence.

    // Try "Explore free" / "Explore free version" buttons (paywall/OTO screens)
    const dismissButtons = [
      page.locator('button, a, [role="button"]').filter({ hasText: /explore free version/i }).first(),
      page.locator('button, a, [role="button"]').filter({ hasText: /^explore free$/i }).first(),
    ];

    for (const btn of dismissButtons) {
      try {
        await btn.waitFor({ state: 'visible', timeout: 5000 });
        await btn.click();
        await page.waitForTimeout(1500);
      } catch {
        // Not found, try next
      }
    }

    // Handle "You're all set!" result page with "Open Bloom" button
    const openBloomBtn = page.getByRole('button', { name: /Open Bloom/i });
    try {
      await openBloomBtn.waitFor({ state: 'visible', timeout: 5000 });
      await openBloomBtn.click();
      await page.waitForTimeout(1500);
    } catch {
      // Not on result page
    }

    // Handle "Tap anywhere to continue" overlay
    try {
      const tapOverlay = page.getByText('Tap anywhere to continue');
      await tapOverlay.waitFor({ state: 'visible', timeout: 3000 });
      await tapOverlay.click();
      await page.waitForTimeout(1000);
    } catch {
      // No overlay
    }
  });

  await test.step("Dismiss feedback modal if shown", async () => {
    await dismissFeedbackModal(page);
  });

  await test.step("Verify main app content is accessible", async () => {
    // After skipping, should land on main app with navigation bar
    await expect(page.getByRole('link', { name: 'Chat' })).toBeVisible({ timeout: 15000 });
  });
});
