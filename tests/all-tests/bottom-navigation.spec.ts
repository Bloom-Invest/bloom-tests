import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Bottom navigation routing
 * Tap each nav tab, verify correct page loads.
 */
test("Bottom navigation routes to correct pages", async ({ page }) => {
  await test.step("Navigate to app and dismiss paywall", async () => {
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');

    const exploreFree = page.getByRole('button', { name: 'Explore free' });
    if (await exploreFree.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exploreFree.click();
      await page.waitForTimeout(500);
    }
  });

  await test.step("Tap Ideas tab and verify navigation", async () => {
    await page.locator('a').filter({ hasText: /^Ideas$/ }).click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/ideas/);
    await expect(page.locator('text=/trades|collections|picks/i').first()).toBeVisible({ timeout: 10000 });
  });

  await test.step("Tap Markets tab and verify navigation", async () => {
    await page.locator('a').filter({ hasText: /^Markets$/ }).click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/markets/);
    await expect(page.locator('text=/Market Pulse|Top Movers|Markets/i').first()).toBeVisible({ timeout: 10000 });
  });

  await test.step("Tap Chat tab and verify navigation", async () => {
    await page.locator('a').filter({ hasText: /^Chat$/ }).click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/chat/);
    await expect(page.getByRole('textbox')).toBeVisible({ timeout: 10000 });
  });

  await test.step("Tap Settings tab and verify navigation", async () => {
    await page.locator('a').filter({ hasText: /^Settings$/ }).click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/more/);
  });

  await test.step("Tap Portfolio tab and verify navigation back", async () => {
    await page.locator('a').filter({ hasText: /^Portfolio$/ }).click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/portfolios/);
  });
});
