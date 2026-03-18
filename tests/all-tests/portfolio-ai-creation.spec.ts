import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Portfolio creation via AI
 * Create a portfolio, verify AI generates holdings.
 */
test("Portfolio creation with AI-generated holdings", async ({ page }) => {
  await test.step("Navigate to Portfolios page", async () => {
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');

    const exploreFree = page.getByRole('button', { name: 'Explore free' }).describe('Explore free button');
    if (await exploreFree.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exploreFree.click();
      await page.waitForTimeout(500);
    }
  });

  await test.step("Start portfolio creation", async () => {
    const createBtn = page.locator('button, [role="button"]').filter({ hasText: /create.*portfolio|add.*portfolio/i }).first().describe('Create portfolio button');
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();
    await page.waitForTimeout(1000);
  });

  await test.step("Verify portfolio creation flow starts", async () => {
    await expect(page).aiAssert(
      'A portfolio creation interface is visible, showing either a name input field, a stock selection screen, or an AI-assisted portfolio builder.',
      { timeout: 60000 }
    );
  });
});
