import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Paywall → Explore free flow
 * Verify paywall appears, "Explore free" dismisses it, content is accessible.
 */
test("Paywall appears and Explore free grants access to content", async ({ page }) => {
  await test.step("Navigate to a page that shows the paywall", async () => {
    await page.goto('/markets');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  await test.step("Verify paywall overlay is displayed", async () => {
    // Paywall should show subscription options
    const paywallContent = page.locator('text=/Subscribe to Bloom|Unlock Bloom|Bloom Pro/i').first();
    const exploreFree = page.getByRole('button', { name: 'Explore free' });

    // At least one paywall indicator should be visible
    const hasPaywall = await paywallContent.isVisible({ timeout: 5000 }).catch(() => false) ||
                       await exploreFree.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasPaywall).toBeTruthy();
  });

  await test.step("Click Explore free to dismiss paywall", async () => {
    const exploreFree = page.getByRole('button', { name: 'Explore free' });
    if (await exploreFree.isVisible({ timeout: 3000 }).catch(() => false)) {
      await exploreFree.click();
      await page.waitForTimeout(500);
    }
  });

  await test.step("Verify content is accessible after dismissing paywall", async () => {
    // Markets page content should now be visible
    await expect(page).toHaveURL(/\/markets/);
    const marketContent = page.locator('text=/Market Pulse|Top Movers|Markets/i').first();
    await expect(marketContent).toBeVisible({ timeout: 10000 });
  });
});
