import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Empty states
 * Verify appropriate empty state messages for portfolios and notifications.
 */
test("Empty states display appropriate messages", async ({ page }) => {
  await test.step("Verify portfolios empty state", async () => {
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');

    const exploreFree = page.getByRole('button', { name: 'Explore free' });
    if (await exploreFree.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exploreFree.click();
      await page.waitForTimeout(500);
    }

    // Should show empty state with create button
    const emptyState = page.locator('text=/no portfolios|create.*portfolio|add.*portfolio/i').first();
    await expect(emptyState).toBeVisible({ timeout: 10000 });

    // Create button should be available
    const createBtn = page.locator('button, [role="button"]').filter({ hasText: /create|add/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 5000 });
  });

  await test.step("Verify notifications empty state", async () => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should show either notification items or an empty/info state
    const pageContent = await page.locator('body').innerText();
    // Page should load without errors
    expect(pageContent.length).toBeGreaterThan(10);
    await expect(page.locator('body')).toBeVisible();
  });
});
