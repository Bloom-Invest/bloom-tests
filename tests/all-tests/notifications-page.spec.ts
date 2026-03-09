import { test, expect } from '@stablyai/playwright-test';

/**
 * User Prompt:
 * Navigate to the Notifications page (/notifications). Verify the page loads and
 * shows notification history or an empty state message if no notifications exist.
 * Assert the page renders without errors.
 */
test("Notifications page loads and displays notification history or empty state", async ({ page }) => {
  await test.step("Navigate to the Notifications page and dismiss any overlays", async () => {
    await page.goto('/notifications');

    // Handle subscription overlay if it appears
    const closeBtn = page.getByRole('button', { name: 'Close' });
    if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeBtn.click();
    }
  });

  await test.step("Verify the Notifications page loads without errors", async () => {
    await page.waitForLoadState('networkidle');

    // The page should render — either with notifications or empty state
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();

    // Look for notification-related content or empty state
    const hasContent = /notification|alert|no notification|empty|nothing here|all caught up/i.test(bodyText || '');
    expect(hasContent).toBeTruthy();
  });

  await test.step("Verify the page is functional and renders UI elements", async () => {
    // The page should have some interactive elements or content
    await expect(page.locator('body')).toBeVisible();

    // No error messages should be visible
    const errorElement = page.locator('text=/error|something went wrong|crash/i').first();
    const hasError = await errorElement.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasError).toBeFalsy();
  });
});
