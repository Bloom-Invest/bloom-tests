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
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Market News', level: 1 })).toBeVisible({ timeout: 10000 });
  });

  await test.step("Verify at least one news article is visible", async () => {
    // News articles are div[role="button"] elements containing a timestamp span
    const newsArticles = page.locator('div[role="button"]').filter({ hasText: /\d+[hdmw] ago|yesterday/i });
    await expect(newsArticles.first()).toBeVisible({ timeout: 10000 });
  });

  await test.step("Click on a news article and verify it opens", async () => {
    const firstArticle = page.locator('div[role="button"]').filter({ hasText: /\d+[hdmw] ago|yesterday/i }).first();
    const articleText = await firstArticle.textContent();
    expect(articleText?.length).toBeGreaterThan(10);
    await firstArticle.click();
    // Clicking a news article navigates to chat with article context
    await expect(page).toHaveURL(/\/chat/, { timeout: 10000 });
  });
});
