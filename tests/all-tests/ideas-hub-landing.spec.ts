import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Ideas hub landing page
 * Verify all sub-sections are accessible: trades, AI arena, collections.
 */
test("Ideas hub shows trades, AI portfolios, and collections", async ({ page }) => {
  await test.step("Navigate to the Ideas page", async () => {
    await page.goto('/ideas');
    await page.waitForLoadState('networkidle');
  });

  await test.step("Verify Latest Trades section is visible", async () => {
    const tradesSection = page.locator('text=/latest trades|see all trades/i').first().describe('Latest trades section');
    await expect(tradesSection).toBeVisible({ timeout: 10000 });
  });

  await test.step("Verify AI portfolio section is visible", async () => {
    const aiSection = page.locator('text=/GPT|Gemini|Opus|Copy trade/i').first().describe('AI portfolio section');
    await expect(aiSection).toBeVisible({ timeout: 10000 });
  });

  await test.step("Verify Collections section is visible", async () => {
    const collectionsSection = page.locator('text=/collections|see all collections/i').first().describe('Collections section');
    await expect(collectionsSection).toBeVisible({ timeout: 10000 });

    const collectionNames = page.locator('text=/Low Cost ETFs|Magnificent 7|Bloom Portfolio|Bill Ackman/i').first().describe('Collection name');
    await expect(collectionNames).toBeVisible({ timeout: 5000 });
  });

  await test.step("Verify navigation to collections sub-page works", async () => {
    const seeAllCollections = page.locator('a, button, [role="button"]').filter({ hasText: /see all collections/i }).first().describe('See all collections link');
    if (await seeAllCollections.isVisible({ timeout: 3000 }).catch(() => false)) {
      await seeAllCollections.click();
      await page.waitForTimeout(1000);
      await expect(page).aiAssert(
        'The page shows a list of investment collections or strategies with names like Low Cost ETFs, Magnificent 7, or similar.',
        { timeout: 60000 }
      );
    }
  });
});
