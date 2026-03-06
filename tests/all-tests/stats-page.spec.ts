import { test, expect } from '@stablyai/playwright-test';

test("Stats page", async ({ page, context }) => {
await test.step("Navigate to the Apple (AAPL) stock statistics page.", async () => {
await page.goto(`/symbol/AAPL/stats`);});

await test.step("Verify that stats are loaded and plausible for AAPL.", async () => {
await expect(page).aiAssert(`Assert stats are loaded for AAPL and they look plausible`);});
});
