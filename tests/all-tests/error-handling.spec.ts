import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Error handling
 * Verify invalid symbol page shows error, bad routes handled gracefully.
 */
test("Invalid routes and symbols are handled gracefully", async ({ page }) => {
  await test.step("Invalid symbol shows error message", async () => {
    await page.goto('/symbol/ZZZZZ');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/ZZZZZ/').first().describe('Invalid ticker')).toBeVisible({ timeout: 10000 });

    await expect(page).aiAssert(
      'The page shows an error state for the invalid symbol ZZZZZ, such as "Problem fetching data", "Not found", "Try again", or similar error messaging.',
      { timeout: 60000 }
    );
  });

  await test.step("App still navigable after error", async () => {
    const navLink = page.locator('a').filter({ hasText: /^Markets$/ }).describe('Markets nav link');
    if (await navLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await navLink.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/markets/);
    }
  });

  await test.step("Non-existent route does not crash the app", async () => {
    await page.goto('/this-page-does-not-exist-at-all');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // App should either redirect or show some content (not a blank/error page)
    await expect(page.locator('body')).toBeVisible();
    await expect(page).aiAssert(
      'The page either redirected to a valid page or shows a meaningful error/404 page. It is not blank or crashed.',
      { timeout: 60000 }
    );
  });
});
