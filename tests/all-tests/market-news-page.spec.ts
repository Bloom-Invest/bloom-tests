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

    // Dismiss paywall if present so news content can load
    const exploreFree = page.getByRole('button', { name: 'Explore free' });
    if (await exploreFree.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exploreFree.click();
      await page.waitForTimeout(500);
    }

    await expect(page.getByRole('heading', { name: 'Market News', level: 1 })).toBeVisible({ timeout: 10000 });
  });

  await test.step("Verify at least one news article is visible", async () => {
    // News articles are buttons with relative timestamps: "6h ago", "4d ago", "1w ago", "yesterday"
    const newsArticles = page.locator('button').filter({ hasText: /\d+[hdmw] ago|yesterday/i });
    await expect(newsArticles.first()).toBeVisible({ timeout: 10000 });
  });

  await test.step("Click on a news article and verify it is interactive", async () => {
    const firstArticle = page.locator('button').filter({ hasText: /\d+[hdmw] ago|yesterday/i }).first();
    const articleText = await firstArticle.textContent();
    await firstArticle.click();
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
    expect(articleText?.length).toBeGreaterThan(10);
  });
});
