import { test, expect } from '@stablyai/playwright-test';

/**
 * Test: Search results quality
 * Search by ticker and company name, verify relevant results.
 */
test("Search returns relevant results for ticker and company name queries", async ({ page, agent }) => {
  await test.step("Navigate to search page", async () => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Dismiss paywall if present
    const exploreFree = page.getByRole('button', { name: 'Explore free' }).describe('Explore free button');
    if (await exploreFree.isVisible({ timeout: 3000 }).catch(() => false)) {
      await exploreFree.click();
      await page.waitForTimeout(500);
    }
  });

  await test.step("Verify search page loads with collections", async () => {
    await expect(page).aiAssert(
      'The page shows investment collections or categories like ETFs, Magnificent 7, or similar stock groupings.',
      { timeout: 60000 }
    );
  });

  await test.step("Search for a ticker symbol (MSFT)", async () => {
    // Use agent.act to find and interact with the search input (may be non-standard)
    await agent.act('Find the search input field and type "MSFT"', { page });
    await page.waitForTimeout(2000);

    // Verify Microsoft appears in results
    await expect(page).aiAssert(
      'Search results show Microsoft or MSFT as a match.',
      { timeout: 60000 }
    );
  });

  await test.step("Clear and search by company name (Tesla)", async () => {
    await agent.act('Clear the search input field and type "Tesla"', { page });
    await page.waitForTimeout(2000);

    // Verify Tesla appears in results
    await expect(page).aiAssert(
      'Search results show Tesla or TSLA as a match.',
      { timeout: 60000 }
    );
  });
});
