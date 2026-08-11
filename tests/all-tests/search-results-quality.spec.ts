import { test, expect } from '@playwright/test';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

/**
 * Test: Search results quality
 * Search by ticker and company name, verify relevant results.
 *
 * NOTE: `/search` is a dead route — Bloom redirects it to /ideas/collections
 * (see frontend/src/index.tsx: `<Route path="/search" ... Redirect to="/ideas/collections" />`).
 * The live search input lives on the Ideas page (`/ideas`), rendered by
 * frontend/src/components/Search/index.tsx as a plain
 * `<input placeholder="Search stocks or crypto">`. No login required.
 */

const SEARCH_INPUT = 'Search stocks or crypto';

test("Search returns relevant results for ticker and company name queries", async ({ page }) => {
  await test.step("Navigate to the Ideas page (hosts the search bar)", async () => {
    await page.goto('/ideas', { waitUntil: 'domcontentloaded' });
    await dismissFeedbackModal(page);

    // Dismiss paywall if present
    const exploreFree = page.getByRole('button', { name: 'Explore free' }).describe('Explore free button');
    try {
      await exploreFree.waitFor({ state: 'visible', timeout: 3000 });
      await exploreFree.click();
      await dismissFeedbackModal(page);
    } catch {
      // Paywall not present
    }
  });

  await test.step("Search for a ticker symbol (MSFT)", async () => {
    const searchBox = page.getByPlaceholder(SEARCH_INPUT).describe('Search input');
    await searchBox.waitFor({ state: 'visible', timeout: 15000 });
    await searchBox.fill('MSFT');

    // toBeVisible() polls until the result appears, so no fixed wait needed.
    await expect(page.getByText(/MSFT|Microsoft/i).first().describe('MSFT result'))
      .toBeVisible({ timeout: 15000 });
  });

  await test.step("Clear and search by company name (Tesla)", async () => {
    const searchBox = page.getByPlaceholder(SEARCH_INPUT).describe('Search input');
    await searchBox.fill('');
    await searchBox.fill('Tesla');

    await expect(page.getByText(/TSLA|Tesla/i).first().describe('Tesla result'))
      .toBeVisible({ timeout: 15000 });
  });
});
