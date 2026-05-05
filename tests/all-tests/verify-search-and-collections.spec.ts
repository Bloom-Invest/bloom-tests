import { test, expect } from '@stablyai/playwright-test';

test("Verify Search and Collections", async ({ page, context, agent }) => {
await test.step("Navigate to the search page.", async () => {
await page.goto(`/search`);});

await test.step("From the search page, interact with the 'Low Cost ETFs' section and return, then select the 'Magnificent 7' card. Verify the visibility of all seven associated companies, bookmark Alphabet stock, and unbookmark Microsoft stock. Return to the search page, search for 'AAPL', and bookmark 'AAPL Apple' from the search results. Finally, navigate to the 'AAPL Apple' stock details and interact with the stock price graph.", async () => {
await page.waitForTimeout(3000);
await page.evaluate(({ deltaX, deltaY }) => {
  window.scrollBy(deltaX, deltaY);
}, { deltaX: 0, deltaY: 10 });
await agent.act(`Click on low cost ETFs card`, { page: page });
await page.getByRole('button').first().describe('Back navigation button').click({"timeout":9000});
await page.getByRole('link', { name: 'Magnificent' }).describe('Magnificent 7 card with microchip icon').click();

// Wait for the collection to load, then verify all 7 companies are visible
// Use text matching instead of role='link' since the rendering may vary
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);
await expect(page.locator('text=/Alphabet/i').first().describe('Alphabet company name')).toBeVisible({ timeout: 15000 });
await expect(page.locator('text=/Microsoft/i').first().describe('Microsoft company name')).toBeVisible({ timeout: 15000 });
await expect(page.locator('text=/Meta/i').first().describe('Meta company name')).toBeVisible({ timeout: 15000 });
await expect(page.locator('text=/Apple/i').first().describe('Apple company name')).toBeVisible({ timeout: 15000 });
await expect(page.locator('text=/NVIDIA/i').first().describe('NVIDIA company name')).toBeVisible({ timeout: 15000 });
await expect(page.locator('text=/Amazon/i').first().describe('Amazon company name')).toBeVisible({ timeout: 15000 });
await expect(page.locator('text=/Tesla/i').first().describe('Tesla company name')).toBeVisible({ timeout: 15000 });

// Bookmark Alphabet and unbookmark Microsoft using row-level buttons
await page.getByRole('row', { name: /Alphabet/i }).getByRole('button').describe('Bookmark icon for Alphabet stock').click();
await page.getByRole('row', { name: /Microsoft/i }).getByRole('button').describe('Bookmark icon for Microsoft').click();
await page.getByRole('button').first().describe('Back button with left arrow icon').click({"timeout":9000});
await page.getByRole('link', { name: 'Ideas' }).describe('Ideas link').click();
await page.getByPlaceholder('Search stocks').describe('Search stocks input field').click();
await page.getByPlaceholder('Search stocks').describe('"Search stocks" input field with magnifying glass icon').fill(`aapl`);
await page.locator('li').filter({ hasText: 'AAPLApple' }).getByRole('button').describe('Bookmark icon for AAPL Apple stock').click();
await page.getByRole('link', { name: 'AAPL Apple' }).describe('First search result link for \'AAPL Apple\'').click();
await page.locator('svg').first().describe('Interactive stock price line graph').click();});

await test.step("Assert that AAPL price information and a sparkline chart for 1M is shown to the user.", async () => {
await expect(page).aiAssert(`Assert that AAPL price information and a sparkline chart for 1M is shown to the user`);});
});
