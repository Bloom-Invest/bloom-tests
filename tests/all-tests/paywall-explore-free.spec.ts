import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Paywall → Explore free flow
 * Verify paywall appears, "Explore free" dismisses it, content is accessible.
 */
test("Paywall appears and Explore free grants access to content", async ({ page }) => {
  await test.step("Navigate to a page that shows the paywall", async () => {
    await page.goto('/markets');
    await page.waitForLoadState('networkidle');
  });

  await test.step("Verify paywall overlay is displayed", async () => {
    await expect(page).aiAssert(
      'A subscription paywall or overlay is visible, showing options like "Subscribe to Bloom", "Unlock Bloom Pro", pricing, or an "Explore free" button.',
      { timeout: 60000 }
    );
  });

  await test.step("Click Explore free to dismiss paywall", async () => {
    const exploreFree = page.getByRole('button', { name: 'Explore free' }).describe('Explore free button');
    await expect(exploreFree).toBeVisible({ timeout: 10000 });
    await exploreFree.click();
    await page.waitForTimeout(500);
  });

  await test.step("Verify content is accessible after dismissing paywall", async () => {
    await expect(page).toHaveURL(/\/markets/);
    await expect(page).aiAssert(
      'The Markets page is visible with market data like Market Pulse, Top Movers, indices, or stock prices. No paywall overlay is blocking the content.',
      { timeout: 60000 }
    );
  });
});
