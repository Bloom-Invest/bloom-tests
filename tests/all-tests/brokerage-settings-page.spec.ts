import { test, expect } from '@stablyai/playwright-test';

test("Brokerage settings page loads and shows connection options", async ({ page }) => {
  await test.step("Navigate to the Brokerage Settings page", async () => {
    await page.goto('/settings/brokerage');
    const closeBtn = page.getByRole('button', { name: 'Close' });
    if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeBtn.click();
    }
  });

  await test.step("Verify the page renders brokerage connection options or status", async () => {
    await expect(page).aiAssert('A brokerage settings, connect brokerage, or brokerage account page is visible — may show a connect button, brokerage list, or connected account status', { timeout: 60000 });
  });
});
