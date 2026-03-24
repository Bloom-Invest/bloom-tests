import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Onboarding → Skip → Dismiss promo → Access content
 * Verify that a fresh session can navigate through onboarding,
 * dismiss any promotional modals, and reach the main app content.
 */
test("Onboarding skip grants access to content", async ({ page }) => {
  await test.step("Navigate to app root", async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  await test.step("Skip onboarding", async () => {
    const skipBtn = page.locator('button, a, [role="button"]').filter({ hasText: /skip and explore/i }).first();
    await expect(skipBtn).toBeVisible({ timeout: 10000 });
    await skipBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  await test.step("Dismiss any promotional modals or overlays", async () => {
    // After skipping onboarding, a "Try Bloom Pro" or similar promo may appear.
    // Look for dismiss/close/skip/no thanks buttons and click if found.
    const dismissSelectors = [
      page.locator('button, a, [role="button"]').filter({ hasText: /no thanks|not now|maybe later|skip|close|dismiss|continue free|explore free/i }).first(),
      page.locator('[aria-label="Close"], [aria-label="Dismiss"]').first(),
      page.locator('button svg, button [data-icon="close"]').first(),
    ];

    for (const dismissBtn of dismissSelectors) {
      try {
        if (await dismissBtn.isVisible({ timeout: 3000 })) {
          await dismissBtn.click();
          await page.waitForTimeout(1000);
          break;
        }
      } catch {
        // Button not found, try next
      }
    }

    // Wait for any transition
    await page.waitForTimeout(1000);
  });

  await test.step("Verify main app content is accessible", async () => {
    await expect(page).aiAssert(
      'The app is showing main content such as market data, stock prices, portfolios, news, a navigation bar, or any core app screen. Promotional modals may still be visible but the main content should be accessible behind or after dismissing them.',
      { timeout: 60000, fullPage: true }
    );
  });
});
