import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Error handling
 * Verify invalid symbol page shows error, bad routes handled gracefully.
 */
test("Invalid routes and symbols are handled gracefully", async ({ page }) => {
  await test.step("Invalid symbol shows error message", async () => {
    await page.goto('/symbol/ZZZZZ');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should show error or "problem fetching" message
    const errorMsg = page.locator('text=/problem fetching|not found|error|no data|try again/i').first();
    await expect(errorMsg).toBeVisible({ timeout: 10000 });

    // Should show the ticker attempted
    await expect(page.locator('text=/ZZZZZ/').first()).toBeVisible({ timeout: 5000 });
  });

  await test.step("App still navigable after error", async () => {
    // Bottom nav should still work
    const navLink = page.locator('a').filter({ hasText: /^Markets$/ });
    if (await navLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await navLink.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/markets/);
    }
  });

  await test.step("Non-existent route doesn't crash the app", async () => {
    await page.goto('/this-page-does-not-exist-at-all');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // App should either redirect or show some content (not a blank page)
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(5);
  });
});
