import { test, expect } from '@stablyai/playwright-test';

test("Verify Search and Collections", async ({ page, context, agent }) => {
await test.step("Navigate to the search page.", async () => {
await page.goto(`/search`);});

await test.step("From the search page, interact with the 'Low Cost ETFs' section and return, then select the 'Magnificent 7' card. Verify the Magnificent 7 stocks are listed, interact with bookmarks, return to search, search for 'AAPL', and navigate to the stock details.", async () => {
await page.waitForLoadState('networkidle');
await page.evaluate(({ deltaX, deltaY }) => {
  window.scrollBy(deltaX, deltaY);
}, { deltaX: 0, deltaY: 10 });
await agent.act(`Click on low cost ETFs card`, { page: page });
await page.getByRole('button').first().describe('Back navigation button').click({"timeout":9000});
await page.getByRole('link', { name: 'Magnificent' }).describe('Magnificent 7 card with microchip icon').click();

// Wait for the collection to load
await page.waitForLoadState('networkidle');

// Verify all 7 stocks are visible by ticker symbol
await expect(page.getByRole('link', { name: /GOOGL/ }).describe('GOOGL stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /MSFT/ }).describe('MSFT stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /META/ }).describe('META stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /AAPL/ }).describe('AAPL stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /NVDA/ }).describe('NVDA stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /AMZN/ }).describe('AMZN stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /TSLA/ }).describe('TSLA stock link')).toBeVisible();

// Interact with bookmarks
await page.getByRole('row', { name: /GOOGL/ }).getByRole('button').describe('Bookmark button for GOOGL stock').click();
await page.getByRole('row', { name: /MSFT/ }).getByRole('button').describe('Bookmark button for MSFT stock').click();

// Go back and search for AAPL
await page.getByRole('button').first().describe('Back button with left arrow icon').click({"timeout":9000});
await page.getByRole('link', { name: 'Ideas' }).describe('Ideas link').click();
await page.getByPlaceholder('Search stocks').describe('Search stocks input field').click();
await page.getByPlaceholder('Search stocks').describe('"Search stocks" input field with magnifying glass icon').fill(`aapl`);
await page.waitForLoadState('networkidle');

// Click on AAPL in the search results
await agent.act('Click on the AAPL Apple search result', { page: page });
});

await test.step("Assert that AAPL price information and a sparkline chart for 1M is shown to the user.", async () => {
await expect(page).aiAssert(`Assert that AAPL price information and a sparkline chart for 1M is shown to the user`, { timeout: 60000 });});
});
