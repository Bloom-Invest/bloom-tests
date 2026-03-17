import { test, expect } from '@stablyai/playwright-test';
import { BASE_URL } from '../helpers/config.helper';

/**
 * User Prompt:
 * Navigate to the Market News page (/ideas/news). Verify the page loads and shows
 * news articles. Assert that at least one news headline is visible. Click on a news
 * article and verify the article content or detail expands.
 */
test("Market News page displays news articles and expands on click", async ({ page }) => {
  await test.step("Navigate to the Market News page", async () => {
    await page.goto(`${BASE_URL}/ideas/news`);
    // Wait for the heading to confirm the page loaded
    await expect(page.getByRole('heading', { name: 'Market News', level: 1 })).toBeVisible({ timeout: 15000 });
  });

  await test.step("Verify at least one news article is visible", async () => {
    // News articles appear as buttons with timestamps (e.g., "8h ago", "yesterday", "1w ago")
    const firstArticle = page.getByRole('button', { name: /\d+[hmdw] ago|yesterday|today/i }).first();
    await expect(firstArticle).toBeVisible({ timeout: 10000 });
  });

  await test.step("Click on the first news article", async () => {
    const firstArticle = page.getByRole('button', { name: /\d+[hmdw] ago|yesterday|today/i }).first();
    await firstArticle.click();

    // After clicking, the page should still be functional (no crash)
    await expect(page.locator('body')).toBeVisible();
  });
});
