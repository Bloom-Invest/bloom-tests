import { test, expect } from '@stablyai/playwright-test';

test("Portfolio compare page loads and shows comparison view", async ({ page, agent }) => {
  await test.step("Navigate to the Portfolios page and create a portfolio if needed", async () => {
    await page.goto('/portfolios');
    const closeBtn = page.getByRole('button', { name: 'Close' });
    if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeBtn.click();
    }
  });

  await test.step("Navigate to the portfolios compare page", async () => {
    await page.goto('/portfolios/compare');
  });

  await test.step("Verify the portfolio compare view renders", async () => {
    await expect(page).aiAssert('A portfolio comparison page, performance chart, or portfolio overview is visible on the page', { timeout: 60000 });
  });
});
