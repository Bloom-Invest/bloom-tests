import { test, expect } from '@stablyai/playwright-test';

test("Settings/More page loads and displays app preferences", async ({ page }) => {
  await test.step("Navigate to the More/Settings page", async () => {
    await page.goto('/more');
    const closeBtn = page.getByRole('button', { name: 'Close' });
    if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeBtn.click();
    }
  });

  await test.step("Verify settings options are visible", async () => {
    await expect(page).aiAssert('The settings or more page is visible with app preferences like theme, language, text size, or notification options', { timeout: 60000 });
  });

  await test.step("Verify theme, language, or AI settings are present", async () => {
    // Check for at least one known settings row
    const themeRow = page.getByText(/theme/i).first();
    const languageRow = page.getByText(/language/i).first();
    const hasSettings = await themeRow.isVisible({ timeout: 5000 }).catch(() => false)
      || await languageRow.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasSettings).toBe(true);
  });
});
