import { test, expect } from '@stablyai/playwright-test';
import { BASE_URL } from '../helpers/config.helper';

test("Verify Search and Collections", async ({ page, context, agent }) => {
await test.step("Navigate to the search page.", async () => {
await page.goto(`${BASE_URL}/search`);});

await test.step("From the search page, interact with the 'Low Cost ETFs' section and return, then select the 'Magnificent 7' card. Verify the visibility of all seven associated companies (Alphabet, Microsoft, Meta Platforms, Apple, NVIDIA, Amazon, and Tesla), bookmark Alphabet stock, and unbookmark Microsoft stock. Return to the search page, search for 'AAPL', and bookmark 'AAPL Apple' from the search results. Finally, navigate to the 'AAPL Apple' stock details and interact with the stock price graph.", async () => {
await page.waitForTimeout(3000);
await page.evaluate(({ deltaX, deltaY }) => {
  window.scrollBy(deltaX, deltaY);
}, { deltaX: 0, deltaY: 10 });
await agent.act(`Click on low cost ETFs card`, { page: page });
await page.getByRole('button').first().describe('Back navigation button').click({"timeout":9000});
await page.getByRole('link', { name: 'Magnificent' }).describe('Magnificent 7 card with microchip icon').click();
await expect(page.getByRole('link', { name: 'Alphabet' }).describe('Alphabet company name')).toBeVisible();
await expect(page.getByRole('link', { name: 'Microsoft' }).describe('Microsoft company name')).toBeVisible();
await expect(page.getByRole('link', { name: 'Meta' }).describe('Meta company name')).toBeVisible();
await expect(page.getByRole('link', { name: 'Apple' }).describe('Company name \'Apple\'')).toBeVisible();
await expect(page.getByRole('link', { name: 'NVIDIA' }).describe('NVIDIA company name in the list')).toBeVisible();
await expect(page.getByRole('link', { name: 'Amazon' }).describe('Company name "Amazon"')).toBeVisible();
await expect(page.getByRole('link', { name: 'Tesla' }).describe('Tesla text label')).toBeVisible();
await page.getByRole('row', { name: 'Alphabet' }).getByRole('button').describe('Empty bookmark icon for Alphabet stock').click();
await page.getByRole('row', { name: 'Microsoft' }).getByRole('button').describe('Red outlined bookmark icon for Microsoft').click();
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
