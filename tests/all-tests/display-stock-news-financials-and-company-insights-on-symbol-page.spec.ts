import { test, expect } from '@stablyai/playwright-test';
import { BASE_URL } from '../helpers/config.helper';

test("Display stock news, financials, and company insights on symbol page", async ({ page, context }) => {
await test.step("Navigate to the Apple (AAPL) symbol page.", async () => {
await page.goto(`${BASE_URL}/symbol/AAPL`, { waitUntil: 'domcontentloaded' });});

await test.step("Verify the stock news graph and bottom line are visible. Then, scroll down to confirm related stocks are visible, and after scrolling up slightly, assert that clickable cards are visible for collections that AAPL is a part of.", async () => {
await expect(page).aiAssert(`Assert stock news graph and bottom line are visible`, { timeout: 60000 });
await page.evaluate(({ deltaX, deltaY }) => {
  window.scrollBy(deltaX, deltaY);
}, { deltaX: 0, deltaY: 9000 });
await expect(page).aiAssert(`Related stocks are on the page and visible`, { timeout: 60000 });
await page.evaluate(({ deltaX, deltaY }) => {
  window.scrollBy(deltaX, deltaY);
}, { deltaX: 0, deltaY: -600 });
await expect(page).aiAssert(`Clickable cards are visible for collections that AAPL is a part of.`, { timeout: 60000 });});
});
