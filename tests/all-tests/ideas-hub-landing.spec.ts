import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Ideas hub landing page
 * Verify all sub-sections are accessible: trades, AI arena, collections.
 */
test("Ideas hub shows trades, AI portfolios, and collections", async ({ page }) => {
  await test.step("Navigate to the Ideas page", async () => {
    await page.goto('/ideas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  await test.step("Verify Latest Trades section is visible", async () => {
    const tradesSection = page.locator('text=/latest trades|see all trades/i').first();
    await expect(tradesSection).toBeVisible({ timeout: 10000 });
  });

  await test.step("Verify AI portfolio section is visible", async () => {
    // AI portfolios section shows GPT, Gemini, Opus performance
    const aiSection = page.locator('text=/GPT|Gemini|Opus|Copy trade/i').first();
    await expect(aiSection).toBeVisible({ timeout: 10000 });
  });

  await test.step("Verify Collections section is visible", async () => {
    const collectionsSection = page.locator('text=/collections|see all collections/i').first();
    await expect(collectionsSection).toBeVisible({ timeout: 10000 });

    // Should show specific collections
    const collectionNames = page.locator('text=/Low Cost ETFs|Magnificent 7|Bloom Portfolio|Bill Ackman/i').first();
    await expect(collectionNames).toBeVisible({ timeout: 5000 });
  });

  await test.step("Verify navigation to sub-pages works", async () => {
    // Click "See all collections"
    const seeAllCollections = page.locator('a, button, [role="button"]').filter({ hasText: /see all collections/i }).first();
    if (await seeAllCollections.isVisible({ timeout: 3000 }).catch(() => false)) {
      await seeAllCollections.click();
      await page.waitForTimeout(1000);
      // Should navigate to collections page
      await expect(page.locator('text=/Low Cost ETFs|Magnificent 7/i').first()).toBeVisible({ timeout: 10000 });
    }
  });
});
