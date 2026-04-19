import { test, expect } from '@stablyai/playwright-test';
import { aiAssertSafe } from '../helpers/aiAssertSafe';

/**
 * Test: Error handling
 * Verify invalid symbol page shows error, bad routes handled gracefully.
 */
test("Invalid routes and symbols are handled gracefully", async ({ page }) => {
  await test.step("Invalid symbol shows error message", async () => {
    await page.goto('/symbol/ZZZZZ');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/ZZZZZ/').first().describe('Invalid ticker')).toBeVisible({ timeout: 10000 });

    await aiAssertSafe(
      page,
      'The page shows an error state for the invalid symbol ZZZZZ, such as "Problem fetching data", "Not found", "Try again", or similar error messaging.',
      {
        timeout: 60000,
        fullPage: true,
        // Fallback: any of the known error affordances on the invalid-symbol page
        fallback: async () => {
          const errorText = page.getByText(/Problem fetching data|Not found|Try again|Error/i).first();
          return await errorText.isVisible({ timeout: 5000 }).catch(() => false);
        },
      },
    );
  });

  await test.step("App still navigable after error", async () => {
    const navLink = page.locator('a').filter({ hasText: /^Markets$/ }).describe('Markets nav link');
    await expect(navLink).toBeVisible({ timeout: 10000 });
    await navLink.click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/markets/);
  });

  await test.step("Non-existent route does not crash the app", async () => {
    await page.goto('/this-page-does-not-exist-at-all');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // App should either redirect or show some content (not a blank/error page)
    await expect(page.locator('body')).toBeVisible();
    await aiAssertSafe(
      page,
      'The page either redirected to a valid page or shows a meaningful error/404 page. It is not blank or crashed.',
      {
        timeout: 60000,
        fullPage: true,
        // Fallback: bottom navigation present means the app shell rendered (didn't crash)
        fallback: async () => {
          const nav = page.locator('a').filter({ hasText: /^(Portfolio|Markets|Ideas|Chat|Settings)$/ }).first();
          return await nav.isVisible({ timeout: 5000 }).catch(() => false);
        },
      },
    );
  });
});
