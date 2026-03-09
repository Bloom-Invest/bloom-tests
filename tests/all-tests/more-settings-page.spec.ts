import { test, expect } from '@stablyai/playwright-test';

/**
 * User Prompt:
 * Navigate to the More/Settings page (/more). Verify the page loads and shows
 * settings options like account, notifications, subscription, or app preferences.
 * Assert key settings sections are visible.
 */
test("More/Settings page displays settings options and sections", async ({ page }) => {
  await test.step("Navigate to the More/Settings page and dismiss any overlays", async () => {
    await page.goto('/more');

    // Handle subscription overlay if it appears
    const closeBtn = page.getByRole('button', { name: 'Close' });
    if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeBtn.click();
    }
  });

  await test.step("Verify the Settings/More page loads", async () => {
    await page.waitForLoadState('networkidle');

    // The page should show settings-related content
    const settingsContent = page.locator('text=/settings|more|account|preferences/i').first();
    await expect(settingsContent).toBeVisible({ timeout: 10000 });
  });

  await test.step("Verify key settings sections are visible", async () => {
    // Settings pages typically show links or buttons for different sections
    // Common sections: Account, Notifications, Subscription, Help, About
    const settingsItems = page.getByRole('link').or(page.getByRole('button'));
    const count = await settingsItems.count();
    expect(count).toBeGreaterThan(0);

    // Look for common settings keywords
    const bodyText = await page.locator('body').textContent();
    const hasSettingsContent = /account|notification|subscription|help|about|support|privacy|terms/i.test(bodyText || '');
    expect(hasSettingsContent).toBeTruthy();
  });
});
