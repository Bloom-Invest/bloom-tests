import { test, expect } from '@stablyai/playwright-test';
import { BASE_URL } from '../helpers/config.helper';

/**
 * User Prompt:
 * Navigate to the More/Settings page (/more). Verify the page loads and shows
 * settings options like account, notifications, subscription, or app preferences.
 * Assert key settings sections are visible.
 */
test("More/Settings page displays settings options and sections", async ({ page }) => {
  await test.step("Navigate to the More/Settings page and dismiss any overlays", async () => {
    await page.goto(`${BASE_URL}/more`);

    // Handle subscription overlay if it appears
    const closeBtn = page.getByRole('button', { name: 'Close' });
    if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeBtn.click();
    }
  });

  await test.step("Verify the Settings/More page loads", async () => {
    // The page should show a Settings heading
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible({ timeout: 10000 });
  });

  await test.step("Verify key settings sections are visible", async () => {
    // Settings pages typically show links or buttons for different sections
    // Common sections: Account, Notifications, Subscription, Help, About
    const settingsItems = page.getByRole('link').or(page.getByRole('button'));
    const count = await settingsItems.count();
    expect(count).toBeGreaterThan(0);

    // Verify at least some common settings-related links/buttons are present
    const settingsKeywords = [/account/i, /notification/i, /subscription/i, /help/i, /about/i, /support/i, /privacy/i, /terms/i];
    let found = 0;
    for (const keyword of settingsKeywords) {
      const match = page.getByRole('link', { name: keyword }).or(page.getByRole('button', { name: keyword }));
      if (await match.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        found++;
      }
    }
    // At least one settings-related element should be present
    if (found === 0) {
      // Fall back to aiAssert if no specific elements matched
      await expect(page).aiAssert(
        'The page displays settings options such as account, notifications, subscription, help, about, support, privacy, or terms.',
        { timeout: 60000 }
      );
    }
  });
});
