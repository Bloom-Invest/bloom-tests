import { test, expect } from '@stablyai/playwright-test';

/**
 * User Prompt:
 * Navigate to the Market News page (/ideas/news). Verify the page loads and shows
 * news articles. Assert that at least one news headline is visible. Click on a news
 * article and verify the article content or detail expands.
 */
test("Market News page displays news articles and expands on click", async ({ page }) => {
  await test.step("Navigate to the Market News page", async () => {
    await page.goto('/ideas/news');
    await expect(page).toHaveURL(/\/ideas\/news/);
  });

  await test.step("Dismiss paywall overlay if present", async () => {
    // The paywall shows "Explore free" to dismiss without subscribing
    const exploreFree = page.getByRole('button', { name: 'Explore free' });
    if (await exploreFree.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exploreFree.click();
      await page.waitForTimeout(500);
    }
    // Confirm we didn't navigate away
    await expect(page).toHaveURL(/\/ideas\/news/);
  });

  await test.step("Verify the News page loads with the Market News heading", async () => {
    await expect(page.getByRole('heading', { name: 'Market News', level: 1 })).toBeVisible({ timeout: 10000 });
  });

  await test.step("Verify at least one news article is visible", async () => {
    // News articles are buttons containing a relative timestamp (e.g. "6h ago", "4d ago", "1w ago", "yesterday")
    const newsArticles = page.locator('button').filter({ hasText: /\d+[hdmw] ago|yesterday/i });
    await expect(newsArticles.first()).toBeVisible({ timeout: 10000 });
  });

  await test.step("Click on a news article and verify it opens", async () => {
    const firstArticle = page.locator('button').filter({ hasText: /\d+[hdmw] ago|yesterday/i }).first();
    await firstArticle.click();

    // Clicking a news article navigates to the chat page with article context
    await expect(page).toHaveURL(/\/chat/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });
});
