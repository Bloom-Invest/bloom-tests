import { test, expect } from '@stablyai/playwright-test';

test("Verify Search and Collections", async ({ page }) => {
await test.step("Navigate to the search page.", async () => {
await page.goto(`/search`, { waitUntil: 'domcontentloaded' });});

await test.step("From the search page, open Low Cost ETFs, return, open Magnificent 7, verify the seven associated companies, and navigate to AAPL stock details.", async () => {
await page.waitForLoadState('domcontentloaded');
await page.getByRole('link', { name: /Low Cost ETFs/ }).describe('Low Cost ETFs collection card').click();
await page.getByRole('button', { name: /back/i }).describe('Back navigation button').click({"timeout":9000});
await page.getByRole('link', { name: /Magnificent 7/ }).describe('Magnificent 7 card with microchip icon').click();

// Wait for the collection to load
await page.waitForLoadState('domcontentloaded');

// Verify all 7 stocks are visible by ticker symbol
await expect(page.getByRole('link', { name: /GOOGL/ }).describe('GOOGL stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /MSFT/ }).describe('MSFT stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /META/ }).describe('META stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /AAPL/ }).describe('AAPL stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /NVDA/ }).describe('NVDA stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /AMZN/ }).describe('AMZN stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /TSLA/ }).describe('TSLA stock link')).toBeVisible();

// Navigate directly from the collection row; the Ideas page has no stock search input.
await page.getByRole('link', { name: /AAPL/ }).describe('AAPL stock link').click();
});

await test.step("Assert that AAPL price information and a sparkline chart for 1M is shown to the user.", async () => {
await expect(page).aiAssert(`Assert that AAPL price information and a sparkline chart for 1M is shown to the user`, { timeout: 60000 });});
});
