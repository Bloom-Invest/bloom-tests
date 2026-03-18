import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Symbol page deep content
 * Verify Bottom Line, earnings, news, and "Appears in" sections.
 */
test("Symbol page shows Bottom Line, news, and collection associations", async ({ page }) => {
  await test.step("Navigate to AAPL symbol page", async () => {
    await page.goto('/symbol/AAPL');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.getByRole('heading', { name: 'AAPL' })).toBeVisible({ timeout: 10000 });
  });

  await test.step("Verify price and company name are displayed", async () => {
    await expect(page.locator('text=/\\$[\\d,.]+/').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Apple/i').first()).toBeVisible({ timeout: 5000 });
  });

  await test.step("Verify Bottom Line section exists", async () => {
    const bottomLine = page.locator('text=/Bottom Line/i').first();
    await expect(bottomLine).toBeVisible({ timeout: 10000 });

    // Should show financial metrics with descriptors
    const metrics = page.locator('text=/profit|growth|price|activity|margin|revenue/i').first();
    await expect(metrics).toBeVisible({ timeout: 5000 });
  });

  await test.step("Verify Ask Bloom AI section exists", async () => {
    const askBloom = page.locator('text=/Ask Bloom AI|Explain business|Analyze market|Find catalysts|Check risks/i').first();
    await expect(askBloom).toBeVisible({ timeout: 10000 });
  });

  await test.step("Scroll down and verify additional sections", async () => {
    await page.evaluate(() => window.scrollBy(0, 3000));
    await page.waitForTimeout(1000);

    // Should show related content: peers, collections, or news
    const deepContent = page.locator('text=/Related|Appears in|Key Events|News on|Earnings/i').first();
    await expect(deepContent).toBeVisible({ timeout: 10000 });
  });
});
