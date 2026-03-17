import { test, expect } from '@stablyai/playwright-test';
import { BASE_URL } from '../helpers/config.helper';

test("Stats page", async ({ page, context }) => {
await test.step("Navigate to the Apple (AAPL) stock statistics page.", async () => {
await page.goto(`${BASE_URL}/symbol/AAPL/stats`);});

await test.step("Verify that stats are loaded and plausible for AAPL.", async () => {
await expect(page).aiAssert(`Assert stats are loaded for AAPL and they look plausible`);});
});
