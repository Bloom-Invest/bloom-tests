import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Bottom navigation routing
 * Tap each nav tab, verify correct page loads.
 */
test("Bottom navigation routes to correct pages", async ({ page }) => {
  await test.step("Navigate to app and dismiss paywall", async () => {
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');

    const exploreFree = page.getByRole('button', { name: 'Explore free' }).describe('Explore free button');
    if (await exploreFree.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exploreFree.click();
      await page.waitForTimeout(500);
    }
  });

  await test.step("Tap Ideas tab and verify navigation", async () => {
    await page.locator('a').filter({ hasText: /^Ideas$/ }).describe('Ideas nav tab').click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/ideas/);
  });

  await test.step("Tap Markets tab and verify navigation", async () => {
    await page.locator('a').filter({ hasText: /^Markets$/ }).describe('Markets nav tab').click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/markets/);
  });

  await test.step("Tap Chat tab and verify navigation", async () => {
    await page.locator('a').filter({ hasText: /^Chat$/ }).describe('Chat nav tab').click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/chat/);
    await expect(page.getByRole('textbox').describe('Chat input')).toBeVisible({ timeout: 10000 });
  });

  await test.step("Tap Settings/More tab and verify navigation", async () => {
    await page.locator('a').filter({ hasText: /^(Settings|More)$/ }).describe('Settings/More nav tab').click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/more/);
  });

  await test.step("Tap Portfolio tab and verify navigation back", async () => {
    await page.locator('a').filter({ hasText: /^Portfolio$/ }).describe('Portfolio nav tab').click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/portfolios/);
  });
});
