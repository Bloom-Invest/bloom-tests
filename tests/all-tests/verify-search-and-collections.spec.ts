import { test, expect } from '@playwright/test';
import { grokAssert } from '../helpers/grokAssert';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

/**
 * BLOOM PITFALLS (search & collections):
 *
 * 1. BACK BUTTON: The Bloom Header back button renders as <Button> with only an SVG arrow
 *    icon inside — no text, no aria-label. getByRole('button', { name: /back/i }) will
 *    never match. Use page.goBack() (Playwright browser back) instead.
 *
 * 2. FEEDBACK MODAL: Can appear on any page navigation and overlays the entire viewport.
 *    Always call dismissFeedbackModal() after navigating to a new page and before assertions.
 *
 * 3. COLLECTION STOCK LINKS: Stocks in collection tables render as <Link> elements with the
 *    ticker symbol in the accessible name. Use getByRole('link', { name: /AAPL/ }) — not
 *    company names, which may be empty (the API returns name: "" for some stocks).
 *
 * 4. ALGOLIA SEARCH FLAKINESS: Avoid depending on live search results in headless runs.
 *    Prefer navigating directly from collection rows (getByRole('link', { name: /TICKER/ }))
 *    instead of using the search input to find stocks.
 */
test("Verify Search and Collections", async ({ page }) => {
await test.step("Navigate to the search page.", async () => {
await page.goto(`/search`, { waitUntil: 'domcontentloaded' });
await dismissFeedbackModal(page);
});

await test.step("From the search page, open Low Cost ETFs, return, open Magnificent 7, verify the seven associated companies, and navigate to AAPL stock details.", async () => {
await page.waitForLoadState('domcontentloaded');
await page.getByRole('link', { name: /Low Cost ETFs/ }).describe('Low Cost ETFs collection card').click();
// Use browser back navigation — the back button has no accessible name (just an SVG icon)
await page.goBack();
await dismissFeedbackModal(page);
await page.getByRole('link', { name: /Magnificent 7/ }).describe('Magnificent 7 card with microchip icon').click();

// Wait for the collection to load
await page.waitForLoadState('domcontentloaded');
await dismissFeedbackModal(page);

// Verify all 7 stocks are visible by ticker symbol
await expect(page.getByRole('link', { name: /GOOGL/ }).describe('GOOGL stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /MSFT/ }).describe('MSFT stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /META/ }).describe('META stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /AAPL/ }).describe('AAPL stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /NVDA/ }).describe('NVDA stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /AMZN/ }).describe('AMZN stock link')).toBeVisible();
await expect(page.getByRole('link', { name: /TSLA/ }).describe('TSLA stock link')).toBeVisible();

// Navigate directly from the collection row
await page.getByRole('link', { name: /AAPL/ }).describe('AAPL stock link').click();
});

await test.step("Assert that AAPL price information and a sparkline chart for 1M is shown to the user.", async () => {
await dismissFeedbackModal(page);
await grokAssert(page, `Assert that AAPL price information and a sparkline chart for 1M is shown to the user`, { timeout: 60000 });});
});
