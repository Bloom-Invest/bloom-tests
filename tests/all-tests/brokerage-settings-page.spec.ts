import { test, expect } from '@stablyai/playwright-test';

/**
 * User Prompt:
 * Navigate to the Brokerage Settings page (/settings/brokerage). Verify the page loads
 * and shows brokerage connection options or status. Assert the page renders without
 * errors — it's OK if it shows a 'connect your brokerage' empty state.
 */
test("Brokerage Settings page loads and shows connection options or empty state", async ({ page }) => {
  await test.step("Navigate to the Brokerage Settings page and dismiss any overlays", async () => {
    await page.goto('/settings/brokerage');

    // Handle subscription overlay if it appears
    const closeBtn = page.getByRole('button', { name: 'Close' });
    if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeBtn.click();
    }
  });

  await test.step("Verify the Brokerage Settings page loads without errors", async () => {
    await page.waitForLoadState('networkidle');

    // Use aiAssert to verify the page shows brokerage settings, connection options,
    // or an empty state prompting to connect a brokerage
    await expect(page).aiAssert(
      'A brokerage settings page, brokerage connection options, linked accounts, or an empty state prompting to connect a brokerage is visible. The page is not showing an error, crash, or blank white screen.',
      { timeout: 60000 }
    );
  });
});
