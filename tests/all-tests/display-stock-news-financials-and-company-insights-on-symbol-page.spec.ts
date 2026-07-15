import { test, expect } from '@playwright/test';
import { grokAssert } from '../helpers/grokAssert';

test("Display stock news, financials, and company insights on symbol page", async ({ page, context }) => {
await test.step("Navigate to the Apple (AAPL) symbol page.", async () => {
await page.goto(`/symbol/AAPL`, { waitUntil: 'domcontentloaded' });
// Wait for the SPA to render the AAPL page content
await expect(page.getByRole('heading', { name: 'AAPL' }).describe('AAPL heading')).toBeVisible({ timeout: 60000 });});

await test.step("Verify the stock price chart and bottom line are visible. Then, scroll down to confirm related stocks are visible, and after scrolling up slightly, assert that clickable cards are visible for collections that AAPL is a part of.", async () => {
await grokAssert(page, `The AAPL symbol page is loaded showing the stock price and a chart with time period selectors (1D, 1W, 1M, etc.)`, { timeout: 60000, fullPage: true });
await page.evaluate(({ deltaX, deltaY }) => {
  window.scrollBy(deltaX, deltaY);
}, { deltaX: 0, deltaY: 9000 });
await page.waitForTimeout(2000);
await grokAssert(page, `Related stocks are on the page and visible`, { timeout: 60000, fullPage: true });
await page.evaluate(({ deltaX, deltaY }) => {
  window.scrollBy(deltaX, deltaY);
}, { deltaX: 0, deltaY: -600 });
await page.waitForTimeout(2000);
await grokAssert(page, `Clickable cards are visible for collections that AAPL is a part of.`, { timeout: 60000, fullPage: true });});
});
