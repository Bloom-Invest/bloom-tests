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

    // The page should render — either with brokerage connections or empty state
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();

    // Look for brokerage-related content or settings content
    const hasContent = /brokerage|connect|linked|account|settings|broker/i.test(bodyText || '');
    expect(hasContent).toBeTruthy();
  });

  await test.step("Verify the page is functional and renders properly", async () => {
    await expect(page.locator('body')).toBeVisible();

    // No error messages should be visible
    const errorElement = page.locator('text=/error|something went wrong|crash/i').first();
    const hasError = await errorElement.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasError).toBeFalsy();
  });
});
